<?php

namespace App\Http\Controllers;

use App\Services\GoalCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoalController extends Controller
{
    protected GoalCalculator $goalCalculator;

    public function __construct(GoalCalculator $goalCalculator)
    {
        $this->goalCalculator = $goalCalculator;
    }

    public function getGoals(Request $request): JsonResponse
    {
        $user = $request->user();
        $goal = $user->dailyGoal;

        if (!$goal) {
            $goalData = $this->goalCalculator->calculate($user, 'maintain');
            $goal = $user->dailyGoal()->create($goalData);
        }

        return response()->json([
            'success' => true,
            'goal' => $goal,
        ]);
    }

    public function updateGoals(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'target_calories' => 'sometimes|integer|min:800|max:8000',
            'protein_g' => 'sometimes|integer|min:10|max:500',
            'carbs_g' => 'sometimes|integer|min:10|max:800',
            'fat_g' => 'sometimes|integer|min:10|max:400',
            'goal_type' => 'sometimes|string|in:lose_weight,maintain,gain_muscle',
            'water_target_ml' => 'sometimes|integer|min:500|max:10000',
        ]);

        $goal = $user->dailyGoal()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật mục tiêu dinh dưỡng thành công!',
            'goal' => $goal,
        ]);
    }

    public function recalculate(Request $request): JsonResponse
    {
        $user = $request->user();
        $goalType = $request->input('goal_type', $user->dailyGoal?->goal_type ?? 'maintain');

        $goalData = $this->goalCalculator->calculate($user, $goalType);
        
        $goal = $user->dailyGoal()->updateOrCreate(
            ['user_id' => $user->id],
            $goalData
        );

        return response()->json([
            'success' => true,
            'message' => 'Đã tính toán lại mục tiêu theo thể trạng của bạn!',
            'goal' => $goal,
        ]);
    }
}
