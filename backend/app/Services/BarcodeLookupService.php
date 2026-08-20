<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Resolves a packaged-food barcode to nutrition figures via Open Food Facts.
 *
 * Open Food Facts is community-edited, so its values are treated as untrusted
 * input: everything returned here passes through NutritionValidator before it
 * reaches a user. See decision 0004.
 */
class BarcodeLookupService
{
    /**
     * Barcodes are EAN-8, UPC-A, EAN-13, or GTIN-14 — always digits.
     */
    private const BARCODE_PATTERN = '/^\d{8,14}$/';

    /**
     * Nutri-Score maps onto the app's 0-100 health score. The grades are coarse
     * by design, so the values are spaced evenly rather than tuned.
     */
    private const NUTRISCORE_HEALTH = [
        'a' => 92,
        'b' => 78,
        'c' => 62,
        'd' => 46,
        'e' => 30,
    ];

    public function __construct(private NutritionValidator $validator) {}

    /**
     * Look up one barcode.
     *
     * @return array<string, mixed>|null Null when the barcode is malformed, the
     *                                   product is unknown, or the service is
     *                                   unreachable. The caller must report that
     *                                   plainly rather than substitute a guess —
     *                                   inventing a product is the defect this
     *                                   service was written to remove.
     */
    public function lookup(string $barcode): ?array
    {
        if (! preg_match(self::BARCODE_PATTERN, $barcode)) {
            return null;
        }

        $product = $this->fetchProduct($barcode);

        if (! $product) {
            return null;
        }

        $nutriments = $product['nutriments'] ?? [];

        // Open Food Facts publishes per 100g. A product with no energy figure at
        // all is an incomplete entry rather than a zero-calorie food.
        if (! isset($nutriments['energy-kcal_100g'])) {
            return null;
        }

        $name = $this->resolveName($product);

        if ($name === null) {
            // An entry with no usable name would show up as "Unknown product",
            // which helps nobody.
            return null;
        }

        // Nutrition is per 100g; the serving size the package declares is only a
        // starting portion, which the user adjusts.
        $servingGrams = $this->resolveServingGrams($product);

        [$food] = $this->validator->validateAndSanitize([[
            'name' => $name,
            'grams' => 100,
            'calories' => (int) round((float) $nutriments['energy-kcal_100g']),
            'protein_g' => (float) ($nutriments['proteins_100g'] ?? 0),
            'carbs_g' => (float) ($nutriments['carbohydrates_100g'] ?? 0),
            'fat_g' => (float) ($nutriments['fat_100g'] ?? 0),
            // A packaged label is more reliable than a photograph, but the entry
            // itself is community-supplied, so this is not certainty.
            'confidence' => 0.95,
            'health_score' => $this->resolveHealthScore($product),
            'micronutrients' => array_filter([
                'fiber_g' => isset($nutriments['fiber_100g']) ? round((float) $nutriments['fiber_100g'], 1) : null,
                'sugar_g' => isset($nutriments['sugars_100g']) ? round((float) $nutriments['sugars_100g'], 1) : null,
                'sodium_mg' => isset($nutriments['sodium_100g'])
                    ? (int) round((float) $nutriments['sodium_100g'] * 1000)
                    : null,
            ], fn ($v) => $v !== null),
        ]]);

        return [
            ...$food,
            'barcode' => $barcode,
            'brand' => $this->firstBrand($product),
            'image_url' => $product['image_url'] ?? null,
            'serving_grams' => $servingGrams,
            'source' => 'Open Food Facts',
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function fetchProduct(string $barcode): ?array
    {
        // ponytail: no cache. Volume is unknown and Open Food Facts is a free
        // public service; add a lookup table keyed on barcode if scan traffic
        // grows enough to matter.
        try {
            $response = Http::timeout(8)
                // Open Food Facts asks callers to identify themselves.
                ->withHeaders(['User-Agent' => 'CalTrackAI/1.0 (https://caltrack.ai)'])
                ->get("https://world.openfoodfacts.org/api/v2/product/{$barcode}.json", [
                    'fields' => 'code,product_name,product_name_vi,brands,serving_quantity,nutriscore_grade,image_url,nutriments',
                ]);

            if (! $response->successful()) {
                return null;
            }

            $body = $response->json();

            // `status` is 0 for an unknown or malformed code.
            if (($body['status'] ?? 0) !== 1 || ! isset($body['product'])) {
                return null;
            }

            return $body['product'];
        } catch (\Throwable $e) {
            Log::warning('Barcode lookup failed', ['barcode' => $barcode, 'reason' => $e->getMessage()]);

            return null;
        }
    }

    /** Prefer the Vietnamese name when the entry carries one. */
    private function resolveName(array $product): ?string
    {
        foreach (['product_name_vi', 'product_name'] as $key) {
            $value = trim((string) ($product[$key] ?? ''));

            if ($value !== '') {
                $brand = $this->firstBrand($product);

                // "Hảo Hảo" alone is ambiguous; "Hảo Hảo — Acecook" is not.
                return $brand && ! str_contains(mb_strtolower($value), mb_strtolower($brand))
                    ? "{$value} — {$brand}"
                    : $value;
            }
        }

        return null;
    }

    private function firstBrand(array $product): ?string
    {
        $brands = trim((string) ($product['brands'] ?? ''));

        if ($brands === '') {
            return null;
        }

        // The field is a comma-separated list, often with the manufacturer and
        // several sub-brands. The first is the most specific.
        return trim(explode(',', $brands)[0]) ?: null;
    }

    /**
     * Serving size in grams, falling back to 100g when the entry omits it.
     */
    private function resolveServingGrams(array $product): float
    {
        $serving = (float) ($product['serving_quantity'] ?? 0);

        // Guard against nonsense values; community entries include both.
        return ($serving >= 1 && $serving <= 2000) ? round($serving, 1) : 100.0;
    }

    private function resolveHealthScore(array $product): int
    {
        $grade = strtolower(trim((string) ($product['nutriscore_grade'] ?? '')));

        // Unknown grade: stay neutral rather than flattering or condemning a
        // product we have no rating for.
        return self::NUTRISCORE_HEALTH[$grade] ?? 60;
    }
}
