<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Verifies the OpenID Connect identity tokens returned by Sign in with Apple
 * and Google Sign-In.
 *
 * Both providers hand the client a JWT signed by their own keys. Nothing inside
 * one may be trusted — least of all `sub`, which is the user's identity — until
 * the signature, issuer, audience and expiry have all been checked here.
 */
class IdentityTokenVerifier
{
    /**
     * @return array{sub: string, email: ?string, email_verified: bool, name: ?string, picture: ?string}
     */
    public function apple(string $identityToken): array
    {
        return $this->verify($identityToken, [
            'issuers' => ['https://appleid.apple.com'],
            'jwks_url' => 'https://appleid.apple.com/auth/keys',
            'audiences' => (array) config('services.apple.client_ids'),
            'cache_key' => 'apple:jwks',
        ]);
    }

    /**
     * @return array{sub: string, email: ?string, email_verified: bool, name: ?string, picture: ?string}
     */
    public function google(string $idToken): array
    {
        return $this->verify($idToken, [
            // Google still issues both spellings of its own issuer.
            'issuers' => ['https://accounts.google.com', 'accounts.google.com'],
            'jwks_url' => 'https://www.googleapis.com/oauth2/v3/certs',
            'audiences' => (array) config('services.google.client_ids'),
            'cache_key' => 'google:jwks',
        ]);
    }

    private function verify(string $token, array $provider): array
    {
        if (empty($provider['audiences'])) {
            throw new RuntimeException('No accepted audiences are configured for this provider.');
        }

        try {
            $claims = $this->decode($token, $provider, $this->jwks($provider));
        } catch (RuntimeException $e) {
            throw $e;
        } catch (\Throwable $e) {
            // Both providers rotate their signing keys; a cached key set goes
            // stale without warning, which would otherwise lock everyone out.
            Cache::forget($provider['cache_key']);

            try {
                $claims = $this->decode($token, $provider, $this->jwks($provider));
            } catch (\Throwable $retry) {
                throw new RuntimeException('Identity token is invalid: ' . $retry->getMessage(), 0, $retry);
            }
        }

        return [
            'sub' => $claims['sub'],
            'email' => $claims['email'] ?? null,
            'email_verified' => filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOL),
            'name' => $claims['name'] ?? null,
            'picture' => $claims['picture'] ?? null,
        ];
    }

    private function decode(string $token, array $provider, array $jwks): array
    {
        $claims = (array) JWT::decode($token, JWK::parseKeySet($jwks));

        if (!in_array($claims['iss'] ?? null, $provider['issuers'], true)) {
            throw new RuntimeException('Identity token has an unexpected issuer.');
        }

        if (!in_array($claims['aud'] ?? null, $provider['audiences'], true)) {
            throw new RuntimeException('Identity token was not issued for this app.');
        }

        if (empty($claims['sub'])) {
            throw new RuntimeException('Identity token has no subject.');
        }

        return $claims;
    }

    private function jwks(array $provider): array
    {
        return Cache::remember($provider['cache_key'], now()->addDay(), function () use ($provider) {
            $response = Http::timeout(10)->get($provider['jwks_url']);

            if (!$response->successful() || !is_array($response->json('keys'))) {
                throw new RuntimeException('Unable to fetch provider public keys.');
            }

            return $response->json();
        });
    }
}
