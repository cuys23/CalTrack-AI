<?php

namespace App\Http\Controllers;

use App\Services\GoalCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function getProfile(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()->load('dailyGoal', 'activeSubscription'),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'gender' => 'sometimes|string|in:male,female,other',
            'birthday' => 'sometimes|date',
            'height_cm' => 'sometimes|numeric|min:50|max:250',
            'current_weight_kg' => 'sometimes|numeric|min:20|max:300',
            'target_weight_kg' => 'sometimes|numeric|min:20|max:300',
            'activity_level' => 'sometimes|string|in:sedentary,light,moderate,active,very_active',
            'avatar_url' => 'sometimes|nullable|string',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hồ sơ thành công!',
            'user' => $user->fresh()->load('dailyGoal'),
        ]);
    }
}
