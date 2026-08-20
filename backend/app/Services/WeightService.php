<?php

namespace App\Services;

use App\Models\User;

class WeightService
{
    /**
     * Get user's weight history and progression metrics.
     */
    public function getHistory(User $user, int $limit = 30): array
    {
        $logs = $user->weightLogs()
            ->orderBy('logged_date', 'desc')
            ->limit($limit)
            ->get();

        $currentWeight = $user->current_weight_kg ?? ($logs->first()?->weight_kg ?? 65.0);
        $targetWeight = $user->target_weight_kg ?? 60.0;
        $startWeight = $logs->last()?->weight_kg ?? $currentWeight;

        $weightChange = round($currentWeight - $startWeight, 2);
        $remainingToGoal = round($currentWeight - $targetWeight, 2);

        return [
            'current_weight_kg' => (float) $currentWeight,
            'target_weight_kg' => (float) $targetWeight,
            'start_weight_kg' => (float) $startWeight,
            'weight_change_kg' => $weightChange,
            'remaining_to_goal_kg' => $remainingToGoal,
            'logs' => $logs,
        ];
    }
}
