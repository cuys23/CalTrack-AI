<?php

namespace Tests\Support;

use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;

/**
 * Stands in for Apple's or Google's JWKS endpoint so tests can mint identity
 * tokens that are structurally real but signed with a throwaway key.
 */
class FakeIdentityProvider
{
    private const KID = 'test-signing-key';

    private \OpenSSLAsymmetricKey $privateKey;

    public function __construct(string $jwksUrlPattern)
    {
        $this->privateKey = $this->newKey();
        $details = openssl_pkey_get_details($this->privateKey);

        Http::fake([
            $jwksUrlPattern => Http::response([
                'keys' => [[
                    'kty' => 'RSA',
                    'kid' => self::KID,
                    'use' => 'sig',
                    'alg' => 'RS256',
                    'n' => $this->base64Url($details['rsa']['n']),
                    'e' => $this->base64Url($details['rsa']['e']),
                ]],
            ]),
        ]);
    }

    public function token(array $claims): string
    {
        return JWT::encode($claims, $this->privateKey, 'RS256', self::KID);
    }

    /** A token that looks right but was signed by someone other than the provider. */
    public function forgedToken(array $claims): string
    {
        return JWT::encode($claims, $this->newKey(), 'RS256', self::KID);
    }

    private function newKey(): \OpenSSLAsymmetricKey
    {
        return openssl_pkey_new([
            'private_key_bits' => 2048,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ]);
    }

    private function base64Url(string $binary): string
    {
        return rtrim(strtr(base64_encode($binary), '+/', '-_'), '=');
    }
}
