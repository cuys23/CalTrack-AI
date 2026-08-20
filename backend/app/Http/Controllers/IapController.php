<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionProduct;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IapController extends Controller
{
    protected SubscriptionService $subscriptionService;

    public function __construct(SubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }

    /**
     * List active subscription products configured for Apple IAP.
     */
    public function getProducts(): JsonResponse
    {
        $products = SubscriptionProduct::where('is_active', true)->get();

        if ($products->isEmpty()) {
            // Default production products
            $products = collect([
                [
                    'product_id' => 'com.vin.calorielq.monthly_pro',
                    'name' => 'CalTrack Pro Hàng Tháng',
                    'type' => 'auto_renewable',
                    'duration' => '1_month',
                    'price_usd' => '4.99',
                    'trial_days' => 7,
                    'is_active' => true,
                ],
                [
                    'product_id' => 'com.vin.calorielq.yearly_pro',
                    'name' => 'CalTrack Pro 1 Năm (Tiết kiệm 50%)',
                    'type' => 'auto_renewable',
                    'duration' => '1_year',
                    'price_usd' => '29.99',
                    'trial_days' => 7,
                    'is_active' => true,
                ],
                [
                    'product_id' => 'com.vin.calorielq.lifetime_pro',
                    'name' => 'CalTrack Pro Trọn Đời',
                    'type' => 'non_consumable',
                    'duration' => 'lifetime',
                    'price_usd' => '69.99',
                    'trial_days' => 0,
                    'is_active' => true,
                ]
            ]);
        }

        return response()->json([
            'success' => true,
            'products' => $products,
        ]);
    }

    /**
     * Verify client transaction receipt / signed JWS from StoreKit 2.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'transaction_jws' => 'required|string',
        ]);

        $user = $request->user();
        $result = $this->subscriptionService->verifyPurchase($user, $request->transaction_jws);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Restore purchases when re-installing or changing devices.
     */
    public function restore(Request $request): JsonResponse
    {
        $request->validate([
            'transactions' => 'required|array',
        ]);

        $user = $request->user();
        $result = $this->subscriptionService->restorePurchases($user, $request->transactions);

        return response()->json($result);
    }

    /**
     * Get current user's active premium status and entitlement details.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeSubscription = $user->activeSubscription;

        return response()->json([
            'success' => true,
            'is_premium' => $user->isPremium(),
            'subscription' => $activeSubscription,
        ]);
    }
}
