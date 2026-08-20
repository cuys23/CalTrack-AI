<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Verifies the signed payloads Apple issues for StoreKit 2 transactions and App
 * Store Server Notifications V2.
 *
 * Apple signs these with a leaf certificate whose chain terminates at the Apple
 * Root CA - G3. The root is pinned from `resources/certs`, so a payload is only
 * accepted when Apple actually signed it.
 */
class AppleJwsDecoder
{
    private const EXPECTED_CHAIN_LENGTH = 3;

    /**
     * Verify a compact JWS and return its payload claims.
     *
     * @return array<string, mixed>
     *
     * @throws RuntimeException When the structure, chain, or signature fails.
     */
    public function verify(string $jws): array
    {
        $parts = explode('.', $jws);

        if (count($parts) !== 3) {
            throw new RuntimeException('JWS must have three segments.');
        }

        $header = $this->decodeSegment($parts[0], 'header');

        $algorithm = $header['alg'] ?? null;
        if ($algorithm !== 'ES256') {
            throw new RuntimeException('JWS algorithm must be ES256.');
        }

        $chain = $header['x5c'] ?? null;
        if (! is_array($chain) || count($chain) !== self::EXPECTED_CHAIN_LENGTH) {
            throw new RuntimeException('JWS header must carry a three-certificate x5c chain.');
        }

        $leafPublicKey = $this->verifyCertificateChain($chain);

        try {
            $claims = (array) JWT::decode($jws, new Key($leafPublicKey, 'ES256'));
        } catch (Throwable $e) {
            Log::warning('Apple JWS signature verification failed', ['reason' => $e->getMessage()]);

            throw new RuntimeException('JWS signature is not valid.', previous: $e);
        }

        return $claims;
    }

    /**
     * Validate the certificate chain and return the leaf's public key.
     *
     * @param  list<string>  $chain  Base64 DER certificates, leaf first.
     */
    private function verifyCertificateChain(array $chain): string
    {
        [$leaf, $intermediate, $root] = array_map(
            fn (string $der): \OpenSSLCertificate => $this->parseCertificate($der),
            $chain
        );

        $pinnedRoot = $this->pinnedAppleRoot();
        if (! openssl_x509_export($root, $presentedRootPem) ||
            ! openssl_x509_export($pinnedRoot, $pinnedRootPem) ||
            ! hash_equals($pinnedRootPem, $presentedRootPem)) {
            throw new RuntimeException('JWS chain does not terminate at the pinned Apple root.');
        }

        if (openssl_x509_verify($intermediate, $root) !== 1) {
            throw new RuntimeException('JWS intermediate certificate is not signed by the Apple root.');
        }

        if (openssl_x509_verify($leaf, $intermediate) !== 1) {
            throw new RuntimeException('JWS leaf certificate is not signed by the intermediate.');
        }

        $this->assertCurrentlyValid($leaf);
        $this->assertCurrentlyValid($intermediate);

        $publicKey = openssl_pkey_get_public($leaf);
        if ($publicKey === false) {
            throw new RuntimeException('JWS leaf certificate has no readable public key.');
        }

        $details = openssl_pkey_get_details($publicKey);
        if (! is_array($details) || ! isset($details['key'])) {
            throw new RuntimeException('JWS leaf public key could not be exported.');
        }

        return $details['key'];
    }

    /**
     * Reject a certificate that is expired or not yet valid.
     */
    private function assertCurrentlyValid(\OpenSSLCertificate $certificate): void
    {
        $parsed = openssl_x509_parse($certificate);

        if (! is_array($parsed) || ! isset($parsed['validFrom_time_t'], $parsed['validTo_time_t'])) {
            throw new RuntimeException('JWS certificate validity period could not be read.');
        }

        $now = time();

        if ($now < $parsed['validFrom_time_t'] || $now > $parsed['validTo_time_t']) {
            throw new RuntimeException('JWS certificate is outside its validity period.');
        }
    }

    /**
     * Convert a base64 DER certificate from the x5c header into an OpenSSL certificate resource.
     */
    private function parseCertificate(string $base64Der): \OpenSSLCertificate
    {
        $pem = "-----BEGIN CERTIFICATE-----\n"
            .chunk_split($base64Der, 64, "\n")
            ."-----END CERTIFICATE-----\n";

        $certificate = openssl_x509_read($pem);

        if ($certificate === false) {
            throw new RuntimeException('JWS chain contains an unreadable certificate.');
        }

        return $certificate;
    }

    /**
     * Load the pinned Apple Root CA - G3.
     */
    private function pinnedAppleRoot(): \OpenSSLCertificate
    {
        $path = config('services.apple.storekit_root_certificate')
            ?: resource_path('certs/AppleRootCA-G3.pem');

        $pem = is_readable($path) ? file_get_contents($path) : false;

        if ($pem === false) {
            throw new RuntimeException("Pinned Apple root certificate is missing at {$path}.");
        }

        $certificate = openssl_x509_read($pem);

        if ($certificate === false) {
            throw new RuntimeException('Pinned Apple root certificate could not be parsed.');
        }

        return $certificate;
    }

    /**
     * Decode one base64url JWS segment as JSON.
     *
     * @return array<string, mixed>
     */
    private function decodeSegment(string $segment, string $label): array
    {
        $json = $this->base64UrlDecode($segment);
        $decoded = $json !== null ? json_decode($json, true) : null;

        if (! is_array($decoded)) {
            throw new RuntimeException("JWS {$label} is not valid JSON.");
        }

        return $decoded;
    }

    /**
     * Decode a Base64URL string.
     */
    public function base64UrlDecode(string $input): ?string
    {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $input .= str_repeat('=', 4 - $remainder);
        }

        $decoded = base64_decode(strtr($input, '-_', '+/'), true);

        return ($decoded !== false) ? $decoded : null;
    }
}
