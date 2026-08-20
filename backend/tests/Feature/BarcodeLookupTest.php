<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Barcode scanning previously ignored the scanned code entirely and returned the
 * first entry of a hardcoded table, so every scan produced the same food. See
 * decision 0004.
 *
 * Responses are faked so the suite does not depend on a third party being
 * reachable; the shapes below are what Open Food Facts actually returns.
 */
class BarcodeLookupTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = 'world.openfoodfacts.org/*';

    private function offProduct(array $overrides = []): array
    {
        return [
            'status' => 1,
            'product' => array_merge([
                'code' => '8934563138165',
                'product_name' => 'Hao Hao Mi Tom Chua Cay',
                'brands' => 'Acecook, Hao Hao',
                'serving_quantity' => 75,
                'nutriscore_grade' => 'd',
                'image_url' => 'https://images.openfoodfacts.org/example.jpg',
                'nutriments' => [
                    'energy-kcal_100g' => 454.545454545455,
                    'proteins_100g' => 9.1,
                    'carbohydrates_100g' => 60.6,
                    'fat_100g' => 19.7,
                    'fiber_100g' => 3.0,
                    'sugars_100g' => 4.5,
                    'sodium_100g' => 1.6,
                ],
            ], $overrides),
        ];
    }

    /** Positive proof: a real product resolves to its own nutrition figures. */
    public function test_returns_nutrition_for_a_known_barcode(): void
    {
        Http::fake([self::ENDPOINT => Http::response($this->offProduct())]);

        $this->actingAs(User::factory()->create())
            ->getJson('/api/food/barcode/8934563138165')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('food.barcode', '8934563138165')
            ->assertJsonPath('food.calories', 455)
            ->assertJsonPath('food.protein_g', 9.1)
            ->assertJsonPath('food.serving_grams', 75)
            ->assertJsonPath('food.brand', 'Acecook');
    }

    /**
     * The defect this feature had: the scanned code made no difference. Two
     * different barcodes must now produce two different foods.
     */
    public function test_different_barcodes_return_different_products(): void
    {
        Http::fake([
            '*8934563138165*' => Http::response($this->offProduct()),
            '*3017620422003*' => Http::response($this->offProduct([
                'code' => '3017620422003',
                'product_name' => 'Nutella',
                'brands' => 'Ferrero',
                'nutriscore_grade' => 'e',
                'nutriments' => [
                    'energy-kcal_100g' => 539,
                    'proteins_100g' => 6.3,
                    'carbohydrates_100g' => 57.5,
                    'fat_100g' => 30.9,
                ],
            ])),
        ]);

        $user = User::factory()->create();

        $first = $this->actingAs($user)->getJson('/api/food/barcode/8934563138165');
        $second = $this->actingAs($user)->getJson('/api/food/barcode/3017620422003');

        $this->assertNotSame(
            $first->json('food.name'),
            $second->json('food.name'),
            'The scanned barcode must determine the result.'
        );
        $this->assertSame(539, $second->json('food.calories'));
    }

    public function test_unknown_barcode_reports_not_found(): void
    {
        Http::fake([self::ENDPOINT => Http::response(['status' => 0, 'status_verbose' => 'product not found'])]);

        $this->actingAs(User::factory()->create())
            ->getJson('/api/food/barcode/0000000000000')
            ->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    /**
     * A product no one has filled in yet must not be reported as zero-calorie
     * food.
     */
    public function test_entry_without_energy_is_treated_as_not_found(): void
    {
        Http::fake([self::ENDPOINT => Http::response($this->offProduct(['nutriments' => []]))]);

        $this->actingAs(User::factory()->create())
            ->getJson('/api/food/barcode/8934563138165')
            ->assertStatus(404);
    }

    /**
     * Open Food Facts is community-edited and does contain impossible values.
     * They must be corrected rather than shown to the user.
     */
    public function test_absurd_community_values_are_sanitised(): void
    {
        Http::fake([self::ENDPOINT => Http::response($this->offProduct([
            'nutriments' => [
                'energy-kcal_100g' => 99999,
                'proteins_100g' => -5,
                'carbohydrates_100g' => 60.6,
                'fat_100g' => 19.7,
            ],
        ]))]);

        $response = $this->actingAs(User::factory()->create())
            ->getJson('/api/food/barcode/8934563138165')
            ->assertStatus(200);

        $this->assertLessThan(3500, $response->json('food.calories'));
        $this->assertGreaterThanOrEqual(0, $response->json('food.protein_g'));
    }

    /** A lookup service that is down must not become an invented product. */
    public function test_upstream_failure_reports_not_found(): void
    {
        Http::fake([self::ENDPOINT => Http::response('', 503)]);

        $this->actingAs(User::factory()->create())
            ->getJson('/api/food/barcode/8934563138165')
            ->assertStatus(404);
    }

    public function test_endpoint_requires_authentication(): void
    {
        Http::fake([self::ENDPOINT => Http::response($this->offProduct())]);

        $this->getJson('/api/food/barcode/8934563138165')->assertStatus(401);
    }

    /** A malformed code never reaches the upstream service. */
    public function test_non_numeric_barcode_is_rejected_by_routing(): void
    {
        Http::fake();

        $this->actingAs(User::factory()->create())
            ->getJson('/api/food/barcode/not-a-barcode')
            ->assertStatus(404);

        Http::assertNothingSent();
    }
}
