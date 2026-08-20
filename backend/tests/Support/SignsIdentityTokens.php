<?php

namespace Tests\Support;

use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Stands in for Apple's and Google's signing infrastructure.
 *
 * A generated RSA key plays the provider's signing key, and its public half is
 * served as the JWKS the verifier fetches. Tests can then mint tokens the
 * verifier accepts, and mint near-misses it must reject.
 */
trait SignsIdentityTokens
{
    private ?\OpenSSLAsymmetricKey $providerKey = null;

    private string $providerKeyId = 'test-key-1';

    /**
     * Generate the provider key and serve its JWKS at both provider endpoints.
     */
    protected function bootIdentityProvider(): void
    {
        $this->providerKey = openssl_pkey_new([
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
            'private_key_bits' => 2048,
        ]);

        // JWKS responses are cached by URL; clear so each test serves its own.
        Cache::flush();

        Http::fake([
            'appleid.apple.com/auth/keys' => Http::response($this->jwks()),
            'www.googleapis.com/oauth2/v3/certs' => Http::response($this->jwks()),
        ]);
    }

    /**
     * Sign a set of claims as the provider would.
     *
     * @param  array<string, mixed>  $claims
     */
    protected function signIdentityToken(array $claims): string
    {
        return JWT::encode($claims, $this->providerKey, 'RS256', $this->providerKeyId);
    }

    /**
     * A token signed by a key the provider does not publish — the shape an
     * attacker can actually produce.
     *
     * @param  array<string, mixed>  $claims
     */
    protected function signWithUntrustedKey(array $claims): string
    {
        $rogueKey = openssl_pkey_new([
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
            'private_key_bits' => 2048,
        ]);

        return JWT::encode($claims, $rogueKey, 'RS256', $this->providerKeyId);
    }

    /**
     * The provider's published key set, in JWKS form.
     *
     * @return array{keys: list<array<string, string>>}
     */
    private function jwks(): array
    {
        $details = openssl_pkey_get_details($this->providerKey);

        return [
            'keys' => [[
                'kty' => 'RSA',
                'use' => 'sig',
                'alg' => 'RS256',
                'kid' => $this->providerKeyId,
                'n' => $this->base64Url($details['rsa']['n']),
                'e' => $this->base64Url($details['rsa']['e']),
            ]],
        ];
    }

    private function base64Url(string $binary): string
    {
        return rtrim(strtr(base64_encode($binary), '+/', '-_'), '=');
    }
}
