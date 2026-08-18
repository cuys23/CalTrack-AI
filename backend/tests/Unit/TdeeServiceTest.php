<?php

namespace Tests\Unit;

use App\Services\TdeeService;
use PHPUnit\Framework\TestCase;

class TdeeServiceTest extends TestCase
{
    protected TdeeService $tdeeService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tdeeService = new TdeeService();
    }

    public function test_calculates_bmr_correctly_for_male(): void
    {
        // 70kg, 175cm, 25 years old male
        // 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674
        $bmr = $this->tdeeService->calculateBmr(70, 175, 25, 'male');
        $this->assertEquals(1674, $bmr);
    }

    public function test_calculates_bmr_correctly_for_female(): void
    {
        // 55kg, 160cm, 25 years old female
        // 10*55 + 6.25*160 - 5*25 - 161 = 550 + 1000 - 125 - 161 = 1264
        $bmr = $this->tdeeService->calculateBmr(55, 160, 25, 'female');
        $this->assertEquals(1264, $bmr);
    }

    public function test_calculates_tdee_based_on_activity_levels(): void
    {
        $bmr = 1600;
        
        $this->assertEquals(1920, $this->tdeeService->calculateTdee($bmr, 'sedentary'));  // 1600 * 1.2
        $this->assertEquals(2200, $this->tdeeService->calculateTdee($bmr, 'light'));      // 1600 * 1.375
        $this->assertEquals(2480, $this->tdeeService->calculateTdee($bmr, 'moderate'));   // 1600 * 1.55
        $this->assertEquals(2760, $this->tdeeService->calculateTdee($bmr, 'active'));     // 1600 * 1.725
    }
}
