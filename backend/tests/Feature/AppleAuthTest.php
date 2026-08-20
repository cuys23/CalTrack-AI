<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\FakeIdentityProvider;
use Tests\TestCase;

class AppleAuthTest extends TestCase
{
    use RefreshDatabase;

    private FakeIdentityProvider $apple;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.apple.client_ids' => ['com.vin.calorielq']]);
        $this->apple = new FakeIdentityProvider('appleid.apple.com/auth/keys');
    }

    public function test_valid_identity_token_creates_user_from_sub_claim(): void
    {
        $response = $this->postJson('/api/auth/apple', [
            'identity_token' => $this->apple->token($this->claims()),
            'name' => 'Nguyễn Văn A',
        ]);

        $response->assertStatus(200)->assertJsonStructure(['success', 'token', 'user']);
        $this->assertDatabaseHas('users', [
            'apple_user_id' => '001234.abcdef.5678',
            'email' => 'a@privaterelay.appleid.com',
        ]);
    }

    public function test_identity_token_signed_by_someone_else_is_rejected(): void
    {
        $this->postJson('/api/auth/apple', ['identity_token' => $this->apple->forgedToken($this->claims())])
            ->assertStatus(401);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_token_issued_for_another_app_is_rejected(): void
    {
        $this->postJson('/api/auth/apple', [
            'identity_token' => $this->apple->token($this->claims(['aud' => 'com.someone-else.app'])),
        ])->assertStatus(401);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_expired_token_is_rejected(): void
    {
        $this->postJson('/api/auth/apple', [
            'identity_token' => $this->apple->token($this->claims(['exp' => now()->subHour()->timestamp])),
        ])->assertStatus(401);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_raw_apple_user_id_is_no_longer_accepted(): void
    {
        $victim = User::factory()->create(['apple_user_id' => '001234.abcdef.5678']);

        $this->postJson('/api/auth/apple', ['apple_user_id' => $victim->apple_user_id])
            ->assertStatus(422);
    }

    public function test_returning_user_is_matched_by_sub_not_by_email(): void
    {
        $existing = User::factory()->create([
            'apple_user_id' => '001234.abcdef.5678',
            'email' => 'old-address@example.com',
        ]);

        $this->postJson('/api/auth/apple', ['identity_token' => $this->apple->token($this->claims())])
            ->assertStatus(200)
            ->assertJsonPath('user.id', $existing->id);

        $this->assertDatabaseCount('users', 1);
    }

    private function claims(array $overrides = []): array
    {
        return array_merge([
            'iss' => 'https://appleid.apple.com',
            'aud' => 'com.vin.calorielq',
            'sub' => '001234.abcdef.5678',
            'email' => 'a@privaterelay.appleid.com',
            'email_verified' => 'true',
            'iat' => now()->timestamp,
            'exp' => now()->addHour()->timestamp,
        ], $overrides);
    }
}
