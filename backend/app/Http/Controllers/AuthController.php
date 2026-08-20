<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\GoalCalculator;
use App\Services\OidcTokenVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    protected GoalCalculator $goalCalculator;

    protected OidcTokenVerifier $tokenVerifier;

    public function __construct(GoalCalculator $goalCalculator, OidcTokenVerifier $tokenVerifier)
    {
        $this->goalCalculator = $goalCalculator;
        $this->tokenVerifier = $tokenVerifier;
    }

    /**
     * Register a new user and automatically calculate initial TDEE / Daily Goal.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'gender' => 'nullable|string|in:male,female,other',
            'birthday' => 'nullable|date',
            'height_cm' => 'nullable|numeric|min:50|max:250',
            'current_weight_kg' => 'nullable|numeric|min:20|max:300',
            'target_weight_kg' => 'nullable|numeric|min:20|max:300',
            'activity_level' => 'nullable|string|in:sedentary,light,moderate,active,very_active',
            'goal_type' => 'nullable|string|in:lose_weight,maintain,gain_muscle',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'gender' => $validated['gender'] ?? 'male',
            'birthday' => $validated['birthday'] ?? '1998-01-01',
            'height_cm' => $validated['height_cm'] ?? 170,
            'current_weight_kg' => $validated['current_weight_kg'] ?? 65,
            'target_weight_kg' => $validated['target_weight_kg'] ?? 60,
            'activity_level' => $validated['activity_level'] ?? 'sedentary',
        ]);

        // Auto-generate calculated Daily Goal
        $goalData = $this->goalCalculator->calculate($user, $validated['goal_type'] ?? 'maintain');
        $user->dailyGoal()->create($goalData);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký tài khoản thành công!',
            'token' => $token,
            'user' => $user->load('dailyGoal'),
            'is_premium' => $user->isPremium(),
        ], 201);
    }

    /**
     * Login existing user.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Thông tin đăng nhập không chính xác.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công!',
            'token' => $token,
            'user' => $user->load('dailyGoal'),
            'is_premium' => $user->isPremium(),
        ]);
    }

    /**
     * Sign in or register with Sign in with Apple.
     *
     * The client sends the identity token Apple issued on the device. Identity
     * is taken from the token's verified claims, never from separate request
     * fields: a caller controls its own request body, so trusting a `sub` or
     * `email` sent alongside the token would leave the account open to anyone
     * who knows the victim's identifier.
     */
    public function appleLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identity_token' => 'required|string',
            'name' => 'nullable|string|max:255',
        ]);

        try {
            $claims = $this->tokenVerifier->verify(
                $validated['identity_token'],
                (string) config('services.apple.jwks_url'),
                [(string) config('services.apple.issuer')],
                (array) config('services.apple.audiences'),
            );
        } catch (Throwable $e) {
            return $this->rejectIdentityToken('Apple', $e);
        }

        $appleUserId = $claims['sub'];

        // Apple returns `email` only on the first authorization for an app, so a
        // returning user is matched by subject alone.
        $user = User::where('apple_user_id', $appleUserId)->first();

        if (! $user) {
            // Apple's private relay addresses are stable per app, so this
            // synthesized address stays unique when the real one is withheld.
            $email = $claims['email'] ?? ($appleUserId.'@appleid.apple.com');

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $validated['name'] ?? 'Apple User',
                    'password' => Hash::make(uniqid('apple_', true)),
                    'apple_user_id' => $appleUserId,
                    'current_weight_kg' => 65,
                    'height_cm' => 170,
                    'activity_level' => 'sedentary',
                ]
            );

            // firstOrCreate returns an existing row when the address already
            // belongs to a password account. Linking the Apple subject to it is
            // safe here and only here, because Apple asserted this address.
            if (! $user->apple_user_id) {
                $user->forceFill(['apple_user_id' => $appleUserId])->save();
            }

            if (! $user->dailyGoal) {
                $goalData = $this->goalCalculator->calculate($user, 'maintain');
                $user->dailyGoal()->create($goalData);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $user->load('dailyGoal'),
            'is_premium' => $user->isPremium(),
        ]);
    }

    /**
     * Sign in or register with Google Sign-In.
     *
     * As with Apple, identity comes from the verified token. Accounts are keyed
     * on the Google subject rather than the email address, so a Google account
     * that merely shares an address with an existing password account cannot
     * take it over.
     */
    public function googleLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_token' => 'required|string',
        ]);

        try {
            $claims = $this->tokenVerifier->verify(
                $validated['id_token'],
                (string) config('services.google.jwks_url'),
                (array) config('services.google.issuers'),
                (array) config('services.google.audiences'),
            );
        } catch (Throwable $e) {
            return $this->rejectIdentityToken('Google', $e);
        }

        $googleUserId = $claims['sub'];
        $user = User::where('google_user_id', $googleUserId)->first();

        if (! $user) {
            $email = $claims['email'] ?? null;

            if (! is_string($email) || $email === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Tài khoản Google không cung cấp địa chỉ email.',
                ], 422);
            }

            // Google marks whether it has verified the address. An unverified
            // address proves nothing about who owns it, so it must not be used
            // to attach to an existing account.
            $emailVerified = filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOL);
            $existing = User::where('email', $email)->first();

            if ($existing && ! $emailVerified) {
                return response()->json([
                    'success' => false,
                    'message' => 'Google chưa xác minh địa chỉ email này.',
                ], 422);
            }

            if ($existing) {
                $user = $existing;
                $user->forceFill(['google_user_id' => $googleUserId])->save();
            } else {
                $user = User::create([
                    'email' => $email,
                    'name' => $claims['name'] ?? 'Google User',
                    'password' => Hash::make(uniqid('google_', true)),
                    'avatar_url' => $claims['picture'] ?? null,
                    'google_user_id' => $googleUserId,
                    'current_weight_kg' => 65,
                    'height_cm' => 170,
                    'activity_level' => 'sedentary',
                ]);
            }

            if (! $user->dailyGoal) {
                $goalData = $this->goalCalculator->calculate($user, 'maintain');
                $user->dailyGoal()->create($goalData);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập Google thành công!',
            'token' => $token,
            'user' => $user->load('dailyGoal'),
            'is_premium' => $user->isPremium(),
        ]);
    }

    /**
     * Refuse a sign-in whose identity token did not verify.
     *
     * The reason is logged rather than returned: telling a caller which check
     * failed helps forge a token that passes the next one.
     */
    private function rejectIdentityToken(string $provider, Throwable $e): JsonResponse
    {
        Log::warning("{$provider} sign-in rejected", [
            'reason' => $e->getMessage(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Phiên đăng nhập không hợp lệ. Vui lòng thử lại.',
        ], 401);
    }

    /**
     * Get current authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('dailyGoal', 'activeSubscription');

        return response()->json([
            'success' => true,
            'user' => $user,
            'is_premium' => $user->isPremium(),
        ]);
    }

    /**
     * Logout and revoke current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã đăng xuất thành công.',
        ]);
    }

    /**
     * Delete user account and associated data (Apple Guideline 5.1.1 compliant).
     */
    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke all tokens
        $user->tokens()->delete();

        // Perform soft delete / permanent cleanup
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tài khoản và toàn bộ dữ liệu của bạn đã được xóa thành công khỏi hệ thống.',
        ]);
    }
}
