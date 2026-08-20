<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Verifies an OpenID Connect identity token against a provider's published JWKS.
 *
 * Apple and Google both issue RS256 identity tokens and both publish a JWKS
 * endpoint, so one verifier serves both. The caller supplies the provider's
 * configuration; this class holds no provider-specific knowledge.
 *
 * A token that fails any check is rejected. There is no fallback path: an
 * unverified identity token carries no more authority than an anonymous
 * request, so accepting one would defeat the purpose of verifying at all.
 */
class OidcTokenVerifier
{
    /**
     * Apple and Google both rotate signing keys. Caching for an hour keeps the
     * key set fresh enough to follow rotation while avoiding a JWKS fetch on
     * every sign-in.
     */
    private const JWKS_CACHE_SECONDS = 3600;

    /**
     * Verify an identity token and return its claims.
     *
     * @param  string  $idToken  Compact JWS supplied by the client.
     * @param  string  $jwksUrl  Provider JWKS endpoint.
     * @param  list<string>  $allowedIssuers  Acceptable `iss` values.
     * @param  list<string>  $allowedAudiences  Acceptable `aud` values.
     * @return array<string, mixed> Verified claims.
     *
     * @throws RuntimeException When the token is not verifiable or its claims
     *                          do not match the expected issuer or audience.
     */
    public function verify(
        string $idToken,
        string $jwksUrl,
        array $allowedIssuers,
        array $allowedAudiences,
    ): array {
        if ($allowedAudiences === []) {
            // Without an audience an attacker may present a token that a
            // provider legitimately issued for a different application.
            throw new RuntimeException('No audience configured for identity token verification.');
        }

        $keys = $this->fetchKeys($jwksUrl);

        try {
            $claims = (array) JWT::decode($idToken, $keys);
        } catch (Throwable $e) {
            // JWT::decode covers signature, `exp`, and `nbf`. Its message names
            // the specific failure and is safe to surface to the caller's log.
            Log::warning('Identity token signature verification failed', [
                'jwks_url' => $jwksUrl,
                'reason' => $e->getMessage(),
            ]);

            throw new RuntimeException('Identity token signature is not valid.', previous: $e);
        }

        $issuer = $claims['iss'] ?? null;
        if (! is_string($issuer) || ! in_array($issuer, $allowedIssuers, true)) {
            throw new RuntimeException('Identity token issuer is not accepted.');
        }

        // `aud` is a string for a single audience and a list for several.
        $audiences = (array) ($claims['aud'] ?? []);
        if (array_intersect($audiences, $allowedAudiences) === []) {
            throw new RuntimeException('Identity token audience is not accepted.');
        }

        if (! isset($claims['sub']) || ! is_string($claims['sub']) || $claims['sub'] === '') {
            throw new RuntimeException('Identity token has no subject.');
        }

        return $claims;
    }

    /**
     * Fetch and parse the provider's JWKS.
     *
     * @return array<string, Key>
     */
    private function fetchKeys(string $jwksUrl): array
    {
        $jwks = Cache::remember(
            'oidc_jwks:'.sha1($jwksUrl),
            self::JWKS_CACHE_SECONDS,
            function () use ($jwksUrl): array {
                $response = Http::timeout(10)->get($jwksUrl);

                if (! $response->successful()) {
                    throw new RuntimeException("Could not fetch JWKS from {$jwksUrl}.");
                }

                return $response->json();
            }
        );

        if (! is_array($jwks) || ! isset($jwks['keys'])) {
            throw new RuntimeException("JWKS from {$jwksUrl} is malformed.");
        }

        return JWK::parseKeySet($jwks);
    }
}
