<?php

namespace Tests\Feature;

use App\Models\SubscriptionProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\AppleTestChain;
use Tests\TestCase;

class IapApiTest extends TestCase
{
    use RefreshDatabase;

    private AppleTestChain $apple;

    protected function setUp(): void
    {
        parent::setUp();

        $this->apple = new AppleTestChain();

        config([
            'services.apple.root_ca_path' => $this->apple->rootPath,
            'services.apple.bundle_id' => 'com.vin.calorielq',
        ]);
    }

    public function test_can_list_iap_products(): void
    {
        SubscriptionProduct::create([
            'product_id' => 'com.vin.calorielq.monthly_pro',
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

        $response = $this->actingAs($user)->postJson('/api/iap/verify', [
            'transaction_jws' => $this->apple->sign($this->transaction()),
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('is_premium', true);

        $statusResponse = $this->actingAs($user)->getJson('/api/iap/status');
        $statusResponse->assertStatus(200)
            ->assertJsonPath('is_premium', true);
    }

    public function test_unsigned_transaction_grants_nothing(): void
    {
        $user = User::factory()->create();

        // What the old client used to send: a payload anyone can type out.
        $forged = implode('.', [
            base64_encode(json_encode(['alg' => 'ES256'])),
            base64_encode(json_encode($this->transaction())),
            'mock_sig',
        ]);

        $this->actingAs($user)->postJson('/api/iap/verify', ['transaction_jws' => $forged])
            ->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertFalse($user->fresh()->isPremium());
    }

    public function test_transaction_signed_by_a_foreign_key_grants_nothing(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/iap/verify', [
            'transaction_jws' => $this->apple->signWithForeignKey($this->transaction()),
        ])->assertStatus(400);

        $this->assertFalse($user->fresh()->isPremium());
    }

    public function test_transaction_from_an_unpinned_root_grants_nothing(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/iap/verify', [
            'transaction_jws' => $this->apple->signWithForeignChain($this->transaction()),
        ])->assertStatus(400);

        $this->assertFalse($user->fresh()->isPremium());
    }

    public function test_transaction_for_another_bundle_grants_nothing(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/iap/verify', [
            'transaction_jws' => $this->apple->sign($this->transaction(['bundleId' => 'com.someone-else.app'])),
        ])->assertStatus(400);

        $this->assertFalse($user->fresh()->isPremium());
    }

    public function test_a_transaction_cannot_be_reused_on_a_second_account(): void
    {
        $buyer = User::factory()->create();
        $freeloader = User::factory()->create();
        $jws = $this->apple->sign($this->transaction());

        $this->actingAs($buyer)->postJson('/api/iap/verify', ['transaction_jws' => $jws])
            ->assertStatus(200);

        $this->actingAs($freeloader)->postJson('/api/iap/verify', ['transaction_jws' => $jws])
            ->assertStatus(400);

        $this->assertTrue($buyer->fresh()->isPremium());
        $this->assertFalse($freeloader->fresh()->isPremium());
    }

    private function transaction(array $overrides = []): array
    {
        return array_merge([
            'transactionId' => '100000099999',
            'originalTransactionId' => '100000099999',
            'bundleId' => 'com.vin.calorielq',
            'productId' => 'com.vin.calorielq.monthly_pro',
            'type' => 'Auto-Renewable Subscription',
            'purchaseDate' => now()->getTimestampMs(),
            'expiresDate' => now()->addMonth()->getTimestampMs(),
            'environment' => 'Sandbox',
        ], $overrides);
    }
}
