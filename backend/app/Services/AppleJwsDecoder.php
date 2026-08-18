<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class AppleJwsDecoder
{
    /**
     * Decode a compact JWS string (header.payload.signature) and return payload as array.
     */
    public function decode(string $jws): ?array
    {
        $parts = explode('.', $jws);
        if (count($parts) !== 3) {
            Log::warning('Invalid JWS structure received', ['parts_count' => count($parts)]);
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        $payloadJson = $this->base64UrlDecode($payloadB64);
        if (!$payloadJson) {
            return null;
        }

        $decoded = json_decode($payloadJson, true);
        if (!is_array($decoded)) {
            Log::warning('Failed to json_decode JWS payload', ['raw' => $payloadJson]);
            return null;
        }

        return $decoded;
    }

    /**
     * Decode standard Base64URL string.
     */
    public function base64UrlDecode(string $input): ?string
    {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $input .= str_repeat('=', $padlen);
        }
        $decoded = base64_decode(strtr($input, '-_', '+/'));
        return ($decoded !== false) ? $decoded : null;
    }
}
