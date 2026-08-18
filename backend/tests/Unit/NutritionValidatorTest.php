<?php

namespace Tests\Unit;

use App\Services\NutritionValidator;
use PHPUnit\Framework\TestCase;

class NutritionValidatorTest extends TestCase
{
    protected NutritionValidator $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = new NutritionValidator();
    }

    public function test_sanitizes_negative_and_missing_values(): void
    {
        $input = [
            [
                'name' => 'Ức gà',
                'grams' => -50, // Should become min 5
                'protein_g' => 30,
                'carbs_g' => 0,
                'fat_g' => 2,
                'calories' => 0, // Should be calculated as 30*4 + 2*9 = 138
                'confidence' => 0.3, // Should become min 0.5
            ]
        ];

        $output = $this->validator->validateAndSanitize($input);

        $this->assertCount(1, $output);
        $this->assertEquals(5.0, $output[0]['grams']);
        $this->assertEquals(30.0, $output[0]['protein_g']);
        $this->assertEquals(138, $output[0]['calories']);
        $this->assertEquals(0.50, $output[0]['confidence']);
    }

    public function test_keeps_accurate_calories_when_provided(): void
    {
        $input = [
            [
                'name' => 'Cơm trắng',
                'grams' => 150,
                'protein_g' => 4,
                'carbs_g' => 45,
                'fat_g' => 0.5,
                'calories' => 200,
                'confidence' => 0.95,
            ]
        ];

        $output = $this->validator->validateAndSanitize($input);

        $this->assertCount(1, $output);
        $this->assertEquals(200, $output[0]['calories']);
    }
}
