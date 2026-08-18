<?php

namespace App\Http\Controllers;

use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AppStoreWebhookController extends Controller
{
    protected SubscriptionService $subscriptionService;

    public function __construct(SubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }

    /**
     * Handle Apple App Store Server Notifications V2 webhook.
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        Log::info('App Store Server Notification received', ['ip' => $request->ip()]);

        $payload = $request->all();
        $this->subscriptionService->handleAppStoreWebhook($payload);

        // Apple requires HTTP 200 OK
        return response()->json(['status' => 'success'], 200);
    }
}
