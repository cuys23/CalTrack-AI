<?php

namespace Tests\Feature;

use App\Models\SubscriptionProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\SignsAppleJws;
use Tests\TestCase;

class IapApiTest extends TestCase
{
    use RefreshDatabase;
    use SignsAppleJws;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootAppleJwsChain();
    }

    protected function tearDown(): void
    {
        $this->tearDownAppleJwsChain();
        parent::tearDown();
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

    /**
     * Positive proof: a transaction signed by a leaf that chains to the pinned
     * root is accepted and grants entitlement.
     */
    public function test_verifies_properly_signed_transaction_and_grants_entitlement(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/iap/verify', [
            'transaction_jws' => $this->signAppleJws($this->transactionPayload()),
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('is_premium', true);

        $this->actingAs($user)->getJson('/api/iap/status')
            ->assertStatus(200)
            ->assertJsonPath('is_premium', true);
    }

    /**
     * Negative proof for the original defect: a payload whose signature segment
     * is an arbitrary string granted Premium indefinitely, for free. This is the
     * exact token the previous version of this test asserted would succeed.
     */
    public function test_rejects_forged_signature(): void
    {
        $user = User::factory()->create();

        $header = base64_encode(json_encode(['alg' => 'ES256']));
        $payload = base64_encode(json_encode($this->transactionPayload()));

        $response = $this->actingAs($user)->postJson('/api/iap/verify', [
            'transaction_jws' => "{$header}.{$payload}.mock_sig",
        ]);

        $response->assertStatus(400)->assertJsonPath('success', false);

        $this->actingAs($user)->getJson('/api/iap/status')
            ->assertStatus(200)
            ->assertJsonPath('is_premium', false);
    }

    /**
     * A chain that is internally consistent but rooted somewhere else must be
     * refused, or pinning would achieve nothing.
     */
    public function test_rejects_chain_rooted_outside_the_pinned_root(): void
    {
        $user = User::factory()->create();
        $jws = $this->signAppleJws($this->transactionPayload());

        // Re-pin to an unrelated root; the presented chain no longer matches.
        $this->bootAppleJwsChain();

        $this->actingAs($user)->postJson('/api/iap/verify', ['transaction_jws' => $jws])
            ->assertStatus(400)
            ->assertJsonPath('success', false);
    }

    /**
     * A caller must not be able to downgrade to an algorithm they can forge.
     */
    public function test_rejects_non_es256_algorithm(): void
    {
        $user = User::factory()->create();

        $header = base64_encode(json_encode(['alg' => 'none']));
        $payload = base64_encode(json_encode($this->transactionPayload()));

        $this->actingAs($user)->postJson('/api/iap/verify', [
            'transaction_jws' => "{$header}.{$payload}.",
        ])->assertStatus(400)->assertJsonPath('success', false);
    }

    /**
     * A payload edited after signing must fail even though the chain is genuine.
     */
    public function test_rejects_tampered_payload(): void
    {
        $user = User::factory()->create();

        $jws = $this->signAppleJws($this->transactionPayload());
        [$header, , $signature] = explode('.', $jws);

        $swapped = rtrim(strtr(base64_encode(json_encode(
            $this->transactionPayload(['productId' => 'com.vin.calorielq.lifetime_pro'])
        )), '+/', '-_'), '=');

        $this->actingAs($user)->postJson('/api/iap/verify', [
            'transaction_jws' => "{$header}.{$swapped}.{$signature}",
        ])->assertStatus(400)->assertJsonPath('success', false);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function transactionPayload(array $overrides = []): array
    {
        return array_merge([
            'transactionId' => '100000099999',
            'originalTransactionId' => '100000099999',
            'productId' => 'com.vin.calorielq.monthly_pro',
            'purchaseDate' => now()->getTimestampMs(),
            'expiresDate' => now()->addMonth()->getTimestampMs(),
            'environment' => 'Sandbox',
        ], $overrides);
    }
}
