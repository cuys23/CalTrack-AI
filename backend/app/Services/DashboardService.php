<?php

namespace App\Services;

use App\Models\MealLog;
use App\Models\User;
use Carbon\Carbon;

class DashboardService
{
    /**
     * Get Today's complete nutritional overview for dashboard.
     */
    public function todaySummary(User $user, ?string $date = null): array
    {
        $targetDate = $date ? Carbon::parse($date) : Carbon::today();
        $dateStr = $targetDate->format('Y-m-d');

        // Fetch User Daily Goal or calculate default
        $goal = $user->dailyGoal;
        $targetCalories = $goal ? $goal->target_calories : 2000;
        $targetProtein = $goal ? $goal->protein_g : 150;
        $targetCarbs = $goal ? $goal->carbs_g : 200;
        $targetFat = $goal ? $goal->fat_g : 65;
        $targetWater = $goal ? $goal->water_target_ml : 2000;

        // Fetch all meals for this date
        $meals = $user->mealLogs()
            ->with('foods')
            ->whereDate('logged_date', $dateStr)
            ->where('status', 'completed')
            ->orderBy('created_at', 'asc')
            ->get();

        $consumedCalories = (int) $meals->sum('total_calories');
        $consumedProtein = (float) $meals->sum('total_protein_g');
        $consumedCarbs = (float) $meals->sum('total_carbs_g');
        $consumedFat = (float) $meals->sum('total_fat_g');
        $remainingCalories = max(0, $targetCalories - $consumedCalories);

        // Group by meal types
        $mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        $mealsByType = [];
        foreach ($mealTypes as $type) {
            $filtered = $meals->where('meal_type', $type)->values();
            $mealsByType[$type] = [
                'type' => $type,
                'total_calories' => (int) $filtered->sum('total_calories'),
                'total_protein_g' => (float) $filtered->sum('total_protein_g'),
                'total_carbs_g' => (float) $filtered->sum('total_carbs_g'),
                'total_fat_g' => (float) $filtered->sum('total_fat_g'),
                'items_count' => $filtered->count(),
                'meals' => $filtered,
            ];
        }

        // Calculate Average Health Score
        $avgHealthScore = $meals->count() > 0 ? (int) round($meals->avg('health_score')) : 85;

        return [
            'date' => $dateStr,
            'summary' => [
                'target_calories' => $targetCalories,
                'consumed_calories' => $consumedCalories,
                'remaining_calories' => $remainingCalories,
                'calorie_percentage' => $targetCalories > 0 ? min(100, (int) round(($consumedCalories / $targetCalories) * 100)) : 0,
                'protein' => [
                    'consumed_g' => round($consumedProtein, 1),
                    'target_g' => $targetProtein,
                    'percentage' => $targetProtein > 0 ? min(100, (int) round(($consumedProtein / $targetProtein) * 100)) : 0,
                ],
                'carbs' => [
                    'consumed_g' => round($consumedCarbs, 1),
                    'target_g' => $targetCarbs,
                    'percentage' => $targetCarbs > 0 ? min(100, (int) round(($consumedCarbs / $targetCarbs) * 100)) : 0,
                ],
                'fat' => [
                    'consumed_g' => round($consumedFat, 1),
                    'target_g' => $targetFat,
                    'percentage' => $targetFat > 0 ? min(100, (int) round(($consumedFat / $targetFat) * 100)) : 0,
                ],
                'health_score' => $avgHealthScore,
                'water_target_ml' => $targetWater,
                'water_consumed_ml' => 1250, // default placeholder tracked via client
            ],
            'streak' => $this->currentStreak($user),
            'meals_by_type' => $mealsByType,
            'all_meals' => $meals,
        ];
    }

    /**
     * Get Weekly calorie and macro analytics (7 days).
     */
    public function weeklyAverage(User $user, ?string $startDate = null): array
    {
        $start = $startDate ? Carbon::parse($startDate)->startOfWeek() : Carbon::now()->startOfWeek();
        $days = [];
        $totalCalories = 0;
        $totalProtein = 0;

        for ($i = 0; $i < 7; $i++) {
            $current = (clone $start)->addDays($i);
            $dateStr = $current->format('Y-m-d');
            
            $dayCalories = (int) $user->mealLogs()
                ->whereDate('logged_date', $dateStr)
                ->where('status', 'completed')
                ->sum('total_calories');

            $dayProtein = (float) $user->mealLogs()
                ->whereDate('logged_date', $dateStr)
                ->where('status', 'completed')
                ->sum('total_protein_g');

            $totalCalories += $dayCalories;
            $totalProtein += $dayProtein;

            $days[] = [
                'date' => $dateStr,
                'day_name' => $current->format('D'),
                'calories' => $dayCalories,
                'protein_g' => round($dayProtein, 1),
            ];
        }

        $avgCalories = (int) round($totalCalories / 7);
        $avgProtein = (float) round($totalProtein / 7, 1);

        return [
            'week_start' => $start->format('Y-m-d'),
            'week_end' => (clone $start)->addDays(6)->format('Y-m-d'),
            'average_calories' => $avgCalories,
            'average_protein_g' => $avgProtein,
            'days' => $days,
        ];
    }

    /**
     * Calculate continuous streak of logging days.
     */
    public function currentStreak(User $user): int
    {
        $streak = 0;
        $checkDate = Carbon::today();

        // Check if logged today or yesterday to continue streak
        $hasToday = $user->mealLogs()->whereDate('logged_date', $checkDate->format('Y-m-d'))->where('status', 'completed')->exists();
        if (!$hasToday) {
            $checkDate->subDay();
        }

        while (true) {
            $exists = $user->mealLogs()
                ->whereDate('logged_date', $checkDate->format('Y-m-d'))
                ->where('status', 'completed')
                ->exists();

            if ($exists) {
                $streak++;
                $checkDate->subDay();
            } else {
                break;
            }

            if ($streak > 365) break; // upper bound safety
        }

        return max(1, $streak);
    }
}
