<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\GoalCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
     * Sign in or register with Apple ID token.
     */
    public function appleLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'apple_user_id' => 'required|string',
            'email' => 'nullable|email',
            'name' => 'nullable|string',
        ]);

        $user = User::where('apple_user_id', $validated['apple_user_id'])->first();

        if (!$user) {
            $email = $validated['email'] ?? ($validated['apple_user_id'] . '@appleid.apple.com');
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $validated['name'] ?? 'Apple User',
                    'password' => Hash::make(uniqid('apple_', true)),
                    'apple_user_id' => $validated['apple_user_id'],
                    'current_weight_kg' => 65,
                    'height_cm' => 170,
                    'activity_level' => 'sedentary',
                ]
            );

            if (!$user->dailyGoal) {
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
