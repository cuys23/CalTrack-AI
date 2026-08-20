<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\FakeIdentityProvider;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    private const WEB_CLIENT_ID = '1234567890-abcdef.apps.googleusercontent.com';

    private FakeIdentityProvider $google;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.google.client_ids' => [self::WEB_CLIENT_ID]]);
        $this->google = new FakeIdentityProvider('googleapis.com/oauth2/v3/certs');
    }

    public function test_valid_id_token_creates_user_from_sub_claim(): void
    {
        $response = $this->postJson('/api/auth/google', [
            'id_token' => $this->google->token($this->claims()),
        ]);

        $response->assertStatus(200)->assertJsonStructure(['success', 'token', 'user']);
        $this->assertDatabaseHas('users', [
            'google_user_id' => '110000000000000000001',
            'email' => 'nguyenvana@gmail.com',
            'name' => 'Nguyễn Văn A',
        ]);
    }

    public function test_id_token_signed_by_someone_else_is_rejected(): void
    {
        $this->postJson('/api/auth/google', ['id_token' => $this->google->forgedToken($this->claims())])
            ->assertStatus(401);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_token_issued_for_another_client_is_rejected(): void
    {
        $this->postJson('/api/auth/google', [
            'id_token' => $this->google->token($this->claims(['aud' => 'someone-else.apps.googleusercontent.com'])),
        ])->assertStatus(401);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_expired_token_is_rejected(): void
    {
        $this->postJson('/api/auth/google', [
            'id_token' => $this->google->token($this->claims(['exp' => now()->subHour()->timestamp])),
        ])->assertStatus(401);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_raw_email_can_no_longer_claim_an_account(): void
    {
        $victim = User::factory()->create(['email' => 'victim@gmail.com']);

        $this->postJson('/api/auth/google', [
            'google_user_id' => 'whatever',
            'email' => $victim->email,
        ])->assertStatus(422);
    }

    public function test_unverified_email_does_not_hijack_an_existing_account(): void
    {
        $victim = User::factory()->create(['email' => 'victim@gmail.com']);

        $this->postJson('/api/auth/google', [
            'id_token' => $this->google->token($this->claims([
                'email' => 'victim@gmail.com',
                'email_verified' => false,
            ])),
        ])->assertStatus(409);

        $this->assertDatabaseCount('users', 1);
        $this->assertNull($victim->fresh()->google_user_id);
    }

    public function test_returning_user_is_matched_by_sub(): void
    {
        $existing = User::factory()->create([
            'google_user_id' => '110000000000000000001',
            'email' => 'old-address@example.com',
        ]);

        $this->postJson('/api/auth/google', ['id_token' => $this->google->token($this->claims())])
            ->assertStatus(200)
            ->assertJsonPath('user.id', $existing->id);

        $this->assertDatabaseCount('users', 1);
    }

    private function claims(array $overrides = []): array
    {
        return array_merge([
            'iss' => 'https://accounts.google.com',
            'aud' => self::WEB_CLIENT_ID,
            'sub' => '110000000000000000001',
            'email' => 'nguyenvana@gmail.com',
            'email_verified' => true,
            'name' => 'Nguyễn Văn A',
            'picture' => 'https://lh3.googleusercontent.com/a/default-user',
            'iat' => now()->timestamp,
            'exp' => now()->addHour()->timestamp,
        ], $overrides);
    }
}
