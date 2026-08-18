<?php

namespace Tests\Feature;

use App\Models\SubscriptionProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IapApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_iap_products(): void
    {
        SubscriptionProduct::create([
            'product_id' => 'com.caltrack.monthly_pro',
            'name' => 'CalTrack Monthly Pro',
            'type' => 'auto_renewable',
            'duration' => '1_month',
            'price_usd' => 4.99,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/iap/products');
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['products' => [['product_id', 'name', 'price_usd']]]);
    }

    public function test_can_verify_purchase_and_grant_entitlement(): void
    {
        $user = User::factory()->create();

        // Construct mock JWS token
        $header = base64_encode(json_encode(['alg' => 'ES256']));
        $payload = base64_encode(json_encode([
            'transactionId' => '100000099999',
            'originalTransactionId' => '100000099999',
            'productId' => 'com.caltrack.monthly_pro',
            'purchaseDate' => now()->getTimestampMs(),
            'expiresDate' => now()->addMonth()->getTimestampMs(),
            'environment' => 'Sandbox',
        ]));
        $mockJws = "{$header}.{$payload}.mock_sig";

        $response = $this->actingAs($user)->postJson('/api/iap/verify', [
            'transaction_jws' => $mockJws,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('is_premium', true);

        $statusResponse = $this->actingAs($user)->getJson('/api/iap/status');
        $statusResponse->assertStatus(200)
            ->assertJsonPath('is_premium', true);
    }
}
