<?php

namespace Tests\Support;

use Firebase\JWT\JWT;

/**
 * Builds a throwaway certificate chain (root -> intermediate -> leaf) so tests
 * can produce JWS payloads shaped exactly like Apple's, without Apple's key.
 */
class AppleTestChain
{
    public readonly string $rootPem;
    public readonly string $rootPath;

    private array $chainPem;
    private \OpenSSLAsymmetricKey $leafKey;

    public function __construct()
    {
        [$rootKey, $rootCert] = $this->selfSigned('Test Apple Root CA');
        [$intermediateKey, $intermediateCert] = $this->signedBy('Test Apple WWDR', $rootCert, $rootKey);
        [$this->leafKey, $leafCert] = $this->signedBy('Test Apple Leaf', $intermediateCert, $intermediateKey);

        $this->chainPem = array_map($this->toPem(...), [$leafCert, $intermediateCert, $rootCert]);
        $this->rootPem = $this->chainPem[2];

        $this->rootPath = tempnam(sys_get_temp_dir(), 'apple-root-') . '.pem';
        file_put_contents($this->rootPath, $this->rootPem);
    }

    /** Sign a payload the way Apple signs StoreKit transactions. */
    public function sign(array $payload, ?array $chainOverride = null): string
    {
        $x5c = array_map($this->toDerBase64(...), $chainOverride ?? $this->chainPem);

        return JWT::encode($payload, $this->leafKey, 'ES256', null, ['x5c' => $x5c]);
    }

    /** A JWS whose chain is genuine-looking but signed by an unrelated key. */
    public function signWithForeignKey(array $payload): string
    {
        $foreignKey = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
        $x5c = array_map($this->toDerBase64(...), $this->chainPem);

        return JWT::encode($payload, $foreignKey, 'ES256', null, ['x5c' => $x5c]);
    }

    /** A JWS whose chain terminates at some other root entirely. */
    public function signWithForeignChain(array $payload): string
    {
        $rogue = new self();

        return $rogue->sign($payload);
    }

    private function selfSigned(string $commonName): array
    {
        $key = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
        $csr = openssl_csr_new(['commonName' => $commonName], $key, ['digest_alg' => 'sha256']);
        $cert = openssl_csr_sign($csr, null, $key, 3650, ['digest_alg' => 'sha256']);

        return [$key, $cert];
    }

    private function signedBy(string $commonName, mixed $issuerCert, \OpenSSLAsymmetricKey $issuerKey): array
    {
        $key = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
        $csr = openssl_csr_new(['commonName' => $commonName], $key, ['digest_alg' => 'sha256']);
        $cert = openssl_csr_sign($csr, $issuerCert, $issuerKey, 3650, ['digest_alg' => 'sha256']);

        return [$key, $cert];
    }

    private function toPem(mixed $cert): string
    {
        openssl_x509_export($cert, $pem);

        return $pem;
    }

    private function toDerBase64(string $pem): string
    {
        return preg_replace('/\s+|-----[A-Z ]+-----/', '', $pem);
    }
}
