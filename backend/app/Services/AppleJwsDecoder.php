<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Decodes the ES256 JWS payloads Apple signs: StoreKit 2 signed transactions
 * and App Store Server Notifications V2.
 *
 * Apple puts the signing certificate chain in the `x5c` header, so a payload is
 * only trustworthy once that chain has been walked back to the pinned Apple
 * Root CA and the signature checked against the leaf certificate. Reading the
 * payload without those checks lets anyone mint their own entitlements.
 */
class AppleJwsDecoder
{
    /**
     * Verify a compact JWS and return its payload, or null if it is not
     * authentically signed by Apple.
     */
    public function decode(string $jws): ?array
    {
        try {
            return $this->verify($jws);
        } catch (\Throwable $e) {
            Log::warning('Rejected Apple JWS', ['reason' => $e->getMessage()]);

            return null;
        }
    }

    private function verify(string $jws): array
    {
        $parts = explode('.', $jws);
        if (count($parts) !== 3) {
            throw new RuntimeException('Invalid JWS structure.');
        }

        $header = json_decode((string) $this->base64UrlDecode($parts[0]), true);
        if (!is_array($header)) {
            throw new RuntimeException('Unreadable JWS header.');
        }

        // Pin the algorithm: an attacker must not get to pick it for us.
        if (($header['alg'] ?? null) !== 'ES256') {
            throw new RuntimeException('Unexpected JWS algorithm: ' . ($header['alg'] ?? 'none'));
        }

        $chain = $this->certificateChain($header['x5c'] ?? null);
        $leaf = $this->trustedLeaf($chain);

        $payload = (array) JWT::decode($jws, new Key($leaf, 'ES256'));

        // Signed transactions carry the bundle they were purchased in; a valid
        // Apple signature from someone else's app is still not our purchase.
        $expectedBundleId = config('services.apple.bundle_id');
        if (isset($payload['bundleId']) && $payload['bundleId'] !== $expectedBundleId) {
            throw new RuntimeException('JWS was signed for another bundle: ' . $payload['bundleId']);
        }

        return $payload;
    }

    /**
     * @return list<string> PEM certificates, leaf first, root last.
     */
    private function certificateChain(mixed $x5c): array
    {
        if (!is_array($x5c) || count($x5c) < 2) {
            throw new RuntimeException('JWS header carries no certificate chain.');
        }

        return array_map(
            fn (string $der) => "-----BEGIN CERTIFICATE-----\n"
                . chunk_split($der, 64, "\n")
                . "-----END CERTIFICATE-----\n",
            $x5c
        );
    }

    /**
     * Walk the chain back to the pinned Apple root and return the leaf PEM.
     *
     * @param list<string> $chain
     */
    private function trustedLeaf(array $chain): string
    {
        $root = $chain[count($chain) - 1];

        // ponytail: the root is pinned by exact bytes. Apple Root CA - G3 runs to
        // 2039, but if Apple ever re-issues it, drop the new .pem in and update
        // services.apple.root_ca_path — nothing else needs to change.
        $pinnedPath = config('services.apple.root_ca_path');
        $pinned = is_string($pinnedPath) && is_file($pinnedPath) ? file_get_contents($pinnedPath) : null;
        if (!$pinned) {
            throw new RuntimeException('Apple root certificate is not configured.');
        }

        if (!hash_equals($this->fingerprint($pinned), $this->fingerprint($root))) {
            throw new RuntimeException('JWS chain does not terminate at the Apple root certificate.');
        }

        for ($i = 0; $i < count($chain) - 1; $i++) {
            if (openssl_x509_verify($chain[$i], $chain[$i + 1]) !== 1) {
                throw new RuntimeException("Certificate chain is broken at link {$i}.");
            }
        }

        foreach ($chain as $index => $pem) {
            $info = openssl_x509_parse($pem);
            if (!$info) {
                throw new RuntimeException("Unreadable certificate at position {$index}.");
            }

            $now = time();
            if ($now < $info['validFrom_time_t'] || $now > $info['validTo_time_t']) {
                throw new RuntimeException("Certificate at position {$index} is outside its validity window.");
            }
        }

        return $chain[0];
    }

    private function fingerprint(string $pem): string
    {
        $fingerprint = openssl_x509_fingerprint($pem, 'sha256');
        if ($fingerprint === false) {
            throw new RuntimeException('Unable to fingerprint certificate.');
        }

        return $fingerprint;
    }

    /**
     * Decode standard Base64URL string.
     */
    public function base64UrlDecode(string $input): ?string
    {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $input .= str_repeat('=', 4 - $remainder);
        }

        $decoded = base64_decode(strtr($input, '-_', '+/'));

        return ($decoded !== false) ? $decoded : null;
    }
}
