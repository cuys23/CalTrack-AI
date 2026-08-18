<?php

namespace App\Services;

use App\Models\User;

class GoalCalculator
{
    protected TdeeService $tdeeService;

    public function __construct(TdeeService $tdeeService)
    {
        $this->tdeeService = $tdeeService;
    }

    /**
     * Calculate Daily Calories and Macro Targets based on Goal Type.
     * Goal Types:
     * - 'lose_weight': Deficit of 400 kcal (safe ~0.4kg/week loss), High protein (2.0g/kg)
     * - 'maintain': TDEE balance, Moderate protein (1.6g/kg)
     * - 'gain_muscle': Surplus of 300 kcal, High protein (2.0g/kg)
     */
    public function calculate(User $user, ?string $goalType = null): array
    {
        $metrics = $this->tdeeService->calculateForUser($user);
        $tdee = $metrics['tdee'];
        $weight = $metrics['weight_kg'];
        $goalType = $goalType ?? 'maintain';

        $targetCalories = $tdee;
        $proteinG = 150;
        $fatG = 65;
        $carbsG = 200;

        switch ($goalType) {
            case 'lose_weight':
                // Safe 20% deficit, minimum 1200 kcal
                $targetCalories = (int) max(1200, round($tdee - 400));
                // High protein for muscle retention (2.0g per kg)
                $proteinG = (int) round($weight * 2.0);
                // 25% of calories from fat
                $fatG = (int) round(($targetCalories * 0.25) / 9);
                // Remaining calories from carbohydrates
                $remainingCalories = max(0, $targetCalories - ($proteinG * 4) - ($fatG * 9));
                $carbsG = (int) round($remainingCalories / 4);
                break;

            case 'gain_muscle':
                // Clean surplus (+300 kcal)
                $targetCalories = (int) round($tdee + 300);
                // Protein 2.0g per kg
                $proteinG = (int) round($weight * 2.0);
                // 25% fat
                $fatG = (int) round(($targetCalories * 0.25) / 9);
                // Remaining carbs
                $remainingCalories = max(0, $targetCalories - ($proteinG * 4) - ($fatG * 9));
                $carbsG = (int) round($remainingCalories / 4);
                break;

            case 'maintain':
            default:
                $goalType = 'maintain';
                $targetCalories = $tdee;
                // Protein 1.6g per kg
                $proteinG = (int) round($weight * 1.6);
                // 28% fat
                $fatG = (int) round(($targetCalories * 0.28) / 9);
                $remainingCalories = max(0, $targetCalories - ($proteinG * 4) - ($fatG * 9));
                $carbsG = (int) round($remainingCalories / 4);
                break;
        }

        // Daily water target: ~35ml per kg of body weight
        $waterTargetMl = (int) round($weight * 35);
        $waterTargetMl = max(1800, min(4000, $waterTargetMl));

        return [
            'target_calories' => $targetCalories,
            'protein_g' => $proteinG,
            'carbs_g' => $carbsG,
            'fat_g' => $fatG,
            'goal_type' => $goalType,
            'water_target_ml' => $waterTargetMl,
            'tdee' => $tdee,
            'bmr' => $metrics['bmr'],
        ];
    }
}
