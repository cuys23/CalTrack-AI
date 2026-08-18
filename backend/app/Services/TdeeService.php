<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;

class TdeeService
{
    /**
     * Activity multipliers based on standard Harris-Benedict / Mifflin-St Jeor formulas.
     */
    const ACTIVITY_MULTIPLIERS = [
        'sedentary'   => 1.2,    // Ít vận động (làm việc văn phòng)
        'light'       => 1.375,  // Vận động nhẹ (tập 1-3 ngày/tuần)
        'moderate'    => 1.55,   // Vận động vừa (tập 3-5 ngày/tuần)
        'active'      => 1.725,  // Năng động (tập 6-7 ngày/tuần)
        'very_active' => 1.9,    // Rất năng động (vận động viên, lao động nặng)
    ];

    /**
     * Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation.
     * Male: BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age + 5
     * Female: BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age - 161
     */
    public function calculateBmr(float $weightKg, float $heightCm, int $age, string $gender = 'male'): int
    {
        $genderAdjustment = (strtolower($gender) === 'female') ? -161 : 5;
        $bmr = (10 * $weightKg) + (6.25 * $heightCm) - (5 * $age) + $genderAdjustment;

        return (int) round(max(800, $bmr));
    }

    /**
     * Calculate Total Daily Energy Expenditure (TDEE).
     */
    public function calculateTdee(int $bmr, string $activityLevel = 'sedentary'): int
    {
        $multiplier = self::ACTIVITY_MULTIPLIERS[strtolower($activityLevel)] ?? 1.2;
        return (int) round($bmr * $multiplier);
    }

    /**
     * Calculate TDEE directly from a User instance.
     */
    public function calculateForUser(User $user): array
    {
        $weight = (float) ($user->current_weight_kg ?? 65);
        $height = (float) ($user->height_cm ?? 170);
        $age = $user->birthday ? Carbon::parse($user->birthday)->age : 25;
        $gender = $user->gender ?? 'male';
        $activity = $user->activity_level ?? 'sedentary';

        $bmr = $this->calculateBmr($weight, $height, $age, $gender);
        $tdee = $this->calculateTdee($bmr, $activity);

        return [
            'bmr' => $bmr,
            'tdee' => $tdee,
            'weight_kg' => $weight,
            'height_cm' => $height,
            'age' => $age,
            'activity_level' => $activity,
        ];
    }
}
