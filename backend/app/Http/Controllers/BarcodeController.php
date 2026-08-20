<?php

namespace App\Http\Controllers;

use App\Services\BarcodeLookupService;
use Illuminate\Http\JsonResponse;

class BarcodeController extends Controller
{
    public function __construct(private BarcodeLookupService $lookupService) {}

    /**
     * Resolve a scanned barcode to nutrition figures.
     *
     * A product we cannot find is an ordinary outcome, not a failure: Open Food
     * Facts covers Vietnamese products thinly, so 404 here is expected traffic
     * and the client offers manual entry in response.
     */
    public function show(string $barcode): JsonResponse
    {
        $food = $this->lookupService->lookup($barcode);

        if (! $food) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy sản phẩm cho mã vạch này.',
                'barcode' => $barcode,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'food' => $food,
        ]);
    }
}
