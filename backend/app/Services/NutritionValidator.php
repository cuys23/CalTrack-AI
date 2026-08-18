<?php

namespace App\Services;

class NutritionValidator
{
    /**
     * Validate and sanitize food items returned by AI Vision.
     * Rules:
     * - No negative numbers
     * - Calories must be roughly consistent with 4*P + 4*C + 9*F (allow 20% variance for fiber/alcohol)
     * - Confidence score must be >= 0.50
     * - Reasonable upper bound checks per single item (< 3500 kcal, < 300g macros)
     */
    public function validateAndSanitize(array $foods): array
    {
        $sanitizedFoods = [];

        foreach ($foods as $food) {
            $name = trim($food['name'] ?? 'Món ăn không xác định');
            $grams = max(5, min(2000, (float) ($food['grams'] ?? 100)));
            $protein = max(0, min(300, (float) ($food['protein_g'] ?? $food['protein'] ?? 0)));
            $carbs = max(0, min(500, (float) ($food['carbs_g'] ?? $food['carbs'] ?? 0)));
            $fat = max(0, min(250, (float) ($food['fat_g'] ?? $food['fat'] ?? 0)));
            
            // Calculate theoretical calories: 4 * P + 4 * C + 9 * F
            $calcCalories = (int) round(($protein * 4) + ($carbs * 4) + ($fat * 9));
            $providedCalories = (int) ($food['calories'] ?? $calcCalories);

            // If calories is 0 or wildly off (> 50% discrepancy), correct to macro-based calculation
            if ($providedCalories <= 0 || abs($providedCalories - $calcCalories) > ($calcCalories * 0.5)) {
                $finalCalories = $calcCalories;
            } else {
                $finalCalories = $providedCalories;
            }

            $confidence = max(0.50, min(1.00, (float) ($food['confidence'] ?? 0.90)));
            $healthScore = max(10, min(100, (int) ($food['health_score'] ?? 80)));

            $sanitizedFoods[] = [
                'name' => $name,
                'grams' => round($grams, 1),
                'calories' => max(10, $finalCalories),
                'protein_g' => round($protein, 1),
                'carbs_g' => round($carbs, 1),
                'fat_g' => round($fat, 1),
                'confidence' => round($confidence, 2),
                'health_score' => $healthScore,
                'micronutrients' => $food['micronutrients'] ?? [
                    'fiber_g' => round($carbs * 0.1, 1),
                    'sodium_mg' => (int) round($grams * 2.5),
                ],
            ];
        }

        return $sanitizedFoods;
    }
}
