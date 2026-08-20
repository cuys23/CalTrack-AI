<?php

namespace Tests\Feature;

use App\Models\MealLog;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * AI scanning costs money at the vision provider on every call. The paywall
 * previously existed only in the interface: `check.premium` was registered but
 * attached to no route, so any authenticated account could scan without paying.
 */
class PremiumGateTest extends TestCase
{
    use RefreshDatabase;

    private function subscribe(User $user): void
    {
        Subscription::create([
            'user_id' => $user->id,
            'original_transaction_id' => 'orig-'.$user->id,
            'product_id' => 'com.vin.calorielq.monthly_pro',
            'status' => 'active',
            'starts_at' => now()->subDay(),
            'expires_at' => now()->addMonth(),
            'auto_renew_status' => true,
            'environment' => 'Sandbox',
        ]);
    }

    /**
     * Positive proof: an entitled account passes the gate. Without this, a gate
     * that rejected everyone would look identical to a correct one.
     */
    public function test_subscriber_passes_the_premium_gate(): void
    {
        $user = User::factory()->create();
        $this->subscribe($user);

        $response = $this->actingAs($user)->postJson('/api/meal/analyze', [
            'image_base64' => 'data:image/jpeg;base64,'.base64_encode('not-a-real-photo'),
            'meal_type' => 'breakfast',
        ]);

        // Whatever the analysis pipeline does with this payload, the gate is not
        // what stopped it.
        $this->assertNotSame(403, $response->status());
    }

    public function test_free_account_is_refused_ai_analysis(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/meal/analyze', [
            'image_base64' => 'data:image/jpeg;base64,'.base64_encode('not-a-real-photo'),
            'meal_type' => 'breakfast',
        ])
            ->assertStatus(403)
            ->assertJsonPath('is_premium', false);
    }

    public function test_expired_subscription_is_refused(): void
    {
        $user = User::factory()->create();

        Subscription::create([
            'user_id' => $user->id,
            'original_transaction_id' => 'orig-expired',
            'product_id' => 'com.vin.calorielq.monthly_pro',
            'status' => 'expired',
            'starts_at' => now()->subMonths(2),
            'expires_at' => now()->subDay(),
            'auto_renew_status' => false,
            'environment' => 'Sandbox',
        ]);

        $this->actingAs($user)->postJson('/api/meal/analyze', [
            'image_base64' => 'data:image/jpeg;base64,'.base64_encode('not-a-real-photo'),
            'meal_type' => 'breakfast',
        ])->assertStatus(403);
    }

    /**
     * Manual logging stays free; the gate covers the paid capability only.
     */
    public function test_free_account_can_still_log_a_meal_manually(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/meal/quick-add', [
            'name' => 'Phở bò',
            'calories' => 450,
            'protein_g' => 25,
            'carbs_g' => 55,
            'fat_g' => 12,
            'meal_type' => 'breakfast',
        ]);

        $this->assertNotSame(403, $response->status());
    }

    /**
     * Per-minute throttling bounds burst rate but not the daily bill. Without a
     * ceiling, one subscription — or one stolen token — could run paid vision
     * calls continuously.
     */
    public function test_daily_scan_quota_is_enforced(): void
    {
        config()->set('services.ai_vision.daily_scan_limit', 2);

        $user = User::factory()->create();
        $this->subscribe($user);

        for ($i = 0; $i < 2; $i++) {
            MealLog::create([
                'user_id' => $user->id,
                'meal_type' => 'breakfast',
                'logged_date' => now()->toDateString(),
                'image_url' => "https://example.test/{$i}.jpg",
                'status' => 'completed',
            ]);
        }

        $this->actingAs($user)->postJson('/api/meal/analyze', [
            'image_base64' => 'data:image/jpeg;base64,'.base64_encode('not-a-real-photo'),
            'meal_type' => 'breakfast',
        ])
            ->assertStatus(429)
            ->assertJsonPath('quota_limit', 2);
    }

    /** Below the ceiling, a subscriber is not obstructed. */
    public function test_subscriber_under_the_quota_is_allowed(): void
    {
        config()->set('services.ai_vision.daily_scan_limit', 2);

        $user = User::factory()->create();
        $this->subscribe($user);

        $response = $this->actingAs($user)->postJson('/api/meal/analyze', [
            'image_base64' => 'data:image/jpeg;base64,'.base64_encode('not-a-real-photo'),
            'meal_type' => 'breakfast',
        ]);

        $this->assertNotSame(429, $response->status());
    }
}
