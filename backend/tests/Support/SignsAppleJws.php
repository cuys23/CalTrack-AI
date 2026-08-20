<?php

namespace Tests\Support;

use Firebase\JWT\JWT;

/**
 * Builds a throwaway certificate chain and signs JWS payloads with it.
 *
 * Verification pins Apple's real root, which no test can sign under. Tests
 * therefore generate their own root, point the pin at it, and sign as Apple
 * would. This proves a correctly chained payload is accepted — without it, a
 * verifier that rejected everything would pass every negative test.
 *
 * Keys are generated per run rather than committed, so no private key material
 * lives in the repository.
 */
trait SignsAppleJws
{
    /** @var array<string, mixed> */
    private array $chain = [];

    /**
     * Generate root, intermediate, and leaf, and pin the root for verification.
     */
    protected function bootAppleJwsChain(): void
    {
        $root = $this->makeSelfSignedRoot();
        $intermediate = $this->makeSignedCertificate('CalTrack Test Intermediate', $root);
        $leaf = $this->makeSignedCertificate('CalTrack Test Leaf', $intermediate);

        $rootPath = tempnam(sys_get_temp_dir(), 'caltrack_root_').'.pem';
        openssl_x509_export($root['certificate'], $rootPem);
        file_put_contents($rootPath, $rootPem);

        config()->set('services.apple.storekit_root_certificate', $rootPath);

        $this->chain = [
            'root' => $root,
            'intermediate' => $intermediate,
            'leaf' => $leaf,
            'root_path' => $rootPath,
        ];
    }

    protected function tearDownAppleJwsChain(): void
    {
        if (isset($this->chain['root_path']) && file_exists($this->chain['root_path'])) {
            unlink($this->chain['root_path']);
        }
    }

    /**
     * Sign a payload as Apple would: ES256, with the full chain in `x5c`.
     *
     * @param  array<string, mixed>  $payload
     */
    protected function signAppleJws(array $payload, ?array $x5cOverride = null, string $algorithm = 'ES256'): string
    {
        $x5c = $x5cOverride ?? [
            $this->derBase64($this->chain['leaf']['certificate']),
            $this->derBase64($this->chain['intermediate']['certificate']),
            $this->derBase64($this->chain['root']['certificate']),
        ];

        return JWT::encode($payload, $this->chain['leaf']['private_key'], $algorithm, null, ['x5c' => $x5c]);
    }

    /**
     * Base64 DER encoding, the form the `x5c` header uses.
     */
    protected function derBase64(\OpenSSLCertificate $certificate): string
    {
        openssl_x509_export($certificate, $pem);

        $body = preg_replace('/-----(BEGIN|END) CERTIFICATE-----|\s+/', '', $pem);

        return (string) $body;
    }

    /**
     * @return array{certificate: \OpenSSLCertificate, private_key: \OpenSSLAsymmetricKey}
     */
    private function makeSelfSignedRoot(): array
    {
        $key = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
        $dn = ['commonName' => 'CalTrack Test Root'];
        $csr = openssl_csr_new($dn, $key, ['digest_alg' => 'sha256']);
        $certificate = openssl_csr_sign($csr, null, $key, 3650, ['digest_alg' => 'sha256']);

        return ['certificate' => $certificate, 'private_key' => $key];
    }

    /**
     * @param  array{certificate: \OpenSSLCertificate, private_key: \OpenSSLAsymmetricKey}  $issuer
     * @return array{certificate: \OpenSSLCertificate, private_key: \OpenSSLAsymmetricKey}
     */
    private function makeSignedCertificate(string $commonName, array $issuer, int $days = 3650): array
    {
        $key = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
        $csr = openssl_csr_new(['commonName' => $commonName], $key, ['digest_alg' => 'sha256']);
        $certificate = openssl_csr_sign(
            $csr,
            $issuer['certificate'],
            $issuer['private_key'],
            $days,
            ['digest_alg' => 'sha256']
        );

        return ['certificate' => $certificate, 'private_key' => $key];
    }
}
