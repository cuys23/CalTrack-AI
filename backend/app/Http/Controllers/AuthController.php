<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\IdentityTokenVerifier;
use App\Services\GoalCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected GoalCalculator $goalCalculator;

    public function __construct(GoalCalculator $goalCalculator)
    {
        $this->goalCalculator = $goalCalculator;
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

        if (!$user || !Hash::check($request->password, $user->password)) {
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
     * The Apple user identifier is read from the verified `sub` claim of the
     * identityToken, never from the request body.
     */
    public function appleLogin(Request $request, IdentityTokenVerifier $verifier): JsonResponse
    {
        $validated = $request->validate([
            'identity_token' => 'required|string',
            // Apple only exposes the full name on the very first authorization.
            'name' => 'nullable|string|max:255',
        ]);

        try {
            $identity = $verifier->apple($validated['identity_token']);
        } catch (\RuntimeException $e) {
            return $this->rejectIdentity('Apple', $e);
        }

        return $this->signInWithIdentity(
            column: 'apple_user_id',
            identity: $identity,
            // Apple users can hide their address; they still need one locally.
            fallbackEmail: $identity['sub'] . '@privaterelay.appleid.com',
            name: $validated['name'] ?? $identity['name'] ?? 'Apple User',
        );
    }

    /**
     * Sign in or register with Google Sign-In.
     *
     * The Google user identifier and email are read from the verified id_token,
     * never from the request body.
     */
    public function googleLogin(Request $request, IdentityTokenVerifier $verifier): JsonResponse
    {
        $validated = $request->validate([
            'id_token' => 'required|string',
        ]);

        try {
            $identity = $verifier->google($validated['id_token']);
        } catch (\RuntimeException $e) {
            return $this->rejectIdentity('Google', $e);
        }

        if (!$identity['email']) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản Google này không cung cấp email.',
            ], 422);
        }

        return $this->signInWithIdentity(
            column: 'google_user_id',
            identity: $identity,
            fallbackEmail: $identity['email'],
            name: $identity['name'] ?? 'Google User',
            avatarUrl: $identity['picture'] ?? null,
        );
    }

    private function rejectIdentity(string $provider, \RuntimeException $e): JsonResponse
    {
        Log::warning("Rejected {$provider} identity token", ['reason' => $e->getMessage()]);

        return response()->json([
            'success' => false,
            'message' => "Không xác thực được tài khoản {$provider}.",
        ], 401);
    }

    /**
     * Find or create the local account behind an already-verified social identity.
     *
     * @param array{sub: string, email: ?string, email_verified: bool} $identity
     */
    private function signInWithIdentity(
        string $column,
        array $identity,
        string $fallbackEmail,
        string $name,
        ?string $avatarUrl = null,
    ): JsonResponse {
        $user = User::where($column, $identity['sub'])->first();

        // Only link an existing local account when the provider vouches for the
        // address, otherwise an unverified email is a free account takeover.
        if (!$user && $identity['email'] && $identity['email_verified']) {
            $user = User::where('email', $identity['email'])->first();
        }

        $email = $identity['email'] ?? $fallbackEmail;

        // We got here without a link, so the address belongs to someone else and
        // the provider would not vouch for it. Refuse rather than hijack.
        if (!$user && User::where('email', $email)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Email này đã thuộc về một tài khoản khác. Hãy đăng nhập bằng phương thức bạn đã dùng trước đó.',
            ], 409);
        }

        if (!$user) {
            $user = User::create([
                'email' => $email,
                'name' => $name,
                'password' => Hash::make(uniqid($column . '_', true)),
                $column => $identity['sub'],
                'avatar_url' => $avatarUrl,
                'current_weight_kg' => 65,
                'height_cm' => 170,
                'activity_level' => 'sedentary',
            ]);
        } elseif ($user->{$column} !== $identity['sub']) {
            $user->{$column} = $identity['sub'];
            $user->save();
        }

        if (!$user->dailyGoal) {
            $user->dailyGoal()->create($this->goalCalculator->calculate($user, 'maintain'));
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
