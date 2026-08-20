<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\SignsIdentityTokens;
use Tests\TestCase;

/**
 * Sign in with Apple and Google Sign-In previously trusted whatever identity the
 * client claimed in its request body. Anyone who knew a victim's email address
 * could obtain a valid session as that victim, without a password.
 *
 * These tests prove that identity now comes from a provider-signed token, and
 * that the tokens an attacker can actually produce are refused.
 */
class SocialAuthTest extends TestCase
{
    use RefreshDatabase;
    use SignsIdentityTokens;

    private const APPLE_AUDIENCE = 'com.vin.calorielq';

    private const GOOGLE_AUDIENCE = '1234567890-test.apps.googleusercontent.com';

    protected function setUp(): void
    {
        parent::setUp();

        $this->bootIdentityProvider();

        config()->set('services.apple.audiences', [self::APPLE_AUDIENCE]);
        config()->set('services.google.audiences', [self::GOOGLE_AUDIENCE]);
    }

    // ---------------------------------------------------------------- Apple

    public function test_apple_sign_in_accepts_a_properly_signed_token(): void
    {
        $response = $this->postJson('/api/auth/apple', [
            'identity_token' => $this->signIdentityToken($this->appleClaims()),
            'name' => 'Người Dùng Táo',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['token', 'user' => ['id', 'email']]);

        $this->assertDatabaseHas('users', [
            'apple_user_id' => '001234.apple.subject',
            'email' => 'apple.user@privaterelay.appleid.com',
        ]);
    }

    public function test_apple_sign_in_keys_the_account_on_the_token_subject(): void
    {
        $existing = User::factory()->create(['apple_user_id' => '001234.apple.subject']);

        // A later sign-in omits email, as Apple does after first authorization.
        $claims = $this->appleClaims();
        unset($claims['email']);

        $this->postJson('/api/auth/apple', ['identity_token' => $this->signIdentityToken($claims)])
            ->assertStatus(200)
            ->assertJsonPath('user.id', $existing->id);

        $this->assertSame(1, User::count());
    }

    public function test_apple_sign_in_rejects_a_token_signed_by_an_untrusted_key(): void
    {
        $this->postJson('/api/auth/apple', [
            'identity_token' => $this->signWithUntrustedKey($this->appleClaims()),
        ])->assertStatus(401)->assertJsonPath('success', false);

        $this->assertSame(0, User::count());
    }

    public function test_apple_sign_in_rejects_a_token_issued_for_another_app(): void
    {
        $this->postJson('/api/auth/apple', [
            'identity_token' => $this->signIdentityToken(
                $this->appleClaims(['aud' => 'com.someone.else'])
            ),
        ])->assertStatus(401)->assertJsonPath('success', false);
    }

    public function test_apple_sign_in_rejects_an_expired_token(): void
    {
        $this->postJson('/api/auth/apple', [
            'identity_token' => $this->signIdentityToken(
                $this->appleClaims(['exp' => now()->subHour()->timestamp])
            ),
        ])->assertStatus(401)->assertJsonPath('success', false);
    }

    /**
     * The original attack: identity asserted directly in the request body. The
     * field no longer exists, so the request cannot even be formed.
     */
    public function test_apple_sign_in_ignores_identity_claimed_in_the_request_body(): void
    {
        $victim = User::factory()->create([
            'email' => 'victim@example.com',
            'apple_user_id' => '001234.apple.subject',
        ]);

        $this->postJson('/api/auth/apple', [
            'apple_user_id' => '001234.apple.subject',
            'email' => 'victim@example.com',
        ])->assertStatus(422);

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertSame(1, User::count());
        $this->assertSame('victim@example.com', $victim->fresh()->email);
    }

    // --------------------------------------------------------------- Google

    public function test_google_sign_in_accepts_a_properly_signed_token(): void
    {
        $this->postJson('/api/auth/google', [
            'id_token' => $this->signIdentityToken($this->googleClaims()),
        ])->assertStatus(200)->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', [
            'google_user_id' => '110000000000000000001',
            'email' => 'google.user@example.com',
        ]);
    }

    public function test_google_sign_in_rejects_a_token_signed_by_an_untrusted_key(): void
    {
        $this->postJson('/api/auth/google', [
            'id_token' => $this->signWithUntrustedKey($this->googleClaims()),
        ])->assertStatus(401)->assertJsonPath('success', false);

        $this->assertSame(0, User::count());
    }

    public function test_google_sign_in_rejects_a_token_issued_for_another_client(): void
    {
        $this->postJson('/api/auth/google', [
            'id_token' => $this->signIdentityToken($this->googleClaims(['aud' => 'someone-else.apps.googleusercontent.com'])),
        ])->assertStatus(401)->assertJsonPath('success', false);
    }

    /**
     * An unverified address proves nothing about who owns it, so it must not
     * attach to an account that already exists.
     */
    public function test_google_sign_in_refuses_to_attach_to_an_account_via_unverified_email(): void
    {
        $victim = User::factory()->create(['email' => 'victim@example.com']);

        $this->postJson('/api/auth/google', [
            'id_token' => $this->signIdentityToken($this->googleClaims([
                'sub' => '999999999999999999999',
                'email' => 'victim@example.com',
                'email_verified' => false,
            ])),
        ])->assertStatus(422);

        $this->assertNull($victim->fresh()->google_user_id);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    /**
     * The original attack: an email address in the request body was enough to
     * take over the account holding it.
     */
    public function test_google_sign_in_ignores_identity_claimed_in_the_request_body(): void
    {
        $victim = User::factory()->create(['email' => 'victim@example.com']);

        $this->postJson('/api/auth/google', [
            'google_user_id' => 'anything-at-all',
            'email' => 'victim@example.com',
        ])->assertStatus(422);

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertNull($victim->fresh()->google_user_id);
    }

    // ---------------------------------------------------------------- Claims

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function appleClaims(array $overrides = []): array
    {
        return array_merge([
            'iss' => 'https://appleid.apple.com',
            'aud' => self::APPLE_AUDIENCE,
            'sub' => '001234.apple.subject',
            'email' => 'apple.user@privaterelay.appleid.com',
            'iat' => now()->timestamp,
            'exp' => now()->addHour()->timestamp,
        ], $overrides);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function googleClaims(array $overrides = []): array
    {
        return array_merge([
            'iss' => 'https://accounts.google.com',
            'aud' => self::GOOGLE_AUDIENCE,
            'sub' => '110000000000000000001',
            'email' => 'google.user@example.com',
            'email_verified' => true,
            'name' => 'Google User',
            'iat' => now()->timestamp,
            'exp' => now()->addHour()->timestamp,
        ], $overrides);
    }
}
