<?php

namespace Tests\Feature;

use App\Models\DailyGoal;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MealAndDashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_quick_add_meal_and_view_dashboard(): void
    {
        $user = User::factory()->create();
        DailyGoal::create([
            'user_id' => $user->id,
            'target_calories' => 2000,
            'protein_g' => 150,
            'carbs_g' => 200,
            'fat_g' => 65,
            'water_target_ml' => 2000,
        ]);

        $today = Carbon::today()->format('Y-m-d');

        // 1. Quick add breakfast
        $addResponse = $this->actingAs($user)->postJson('/api/meal/quick-add', [
            'meal_type' => 'breakfast',
            'name' => 'Phở Bò Tái',
            'grams' => 450,
            'calories' => 520,
            'protein_g' => 32,
            'carbs_g' => 68,
            'fat_g' => 14,
            'logged_date' => $today,
        ]);

        $addResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('meal.total_calories', 520);

        // 2. Fetch dashboard today
        $dashResponse = $this->actingAs($user)->getJson('/api/dashboard?date='.$today);
        $dashResponse->assertStatus(200)
            ->assertJsonPath('data.summary.consumed_calories', 520)
            ->assertJsonPath('data.summary.remaining_calories', 1480);
    }
}
