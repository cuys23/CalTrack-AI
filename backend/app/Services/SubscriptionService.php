<?php

namespace App\Services;

use App\Models\AppStoreNotification;
use App\Models\IapTransaction;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SubscriptionService
{
    protected AppleJwsDecoder $jwsDecoder;

    public function __construct(AppleJwsDecoder $jwsDecoder)
    {
        $this->jwsDecoder = $jwsDecoder;
    }

    /**
     * Verify and process a client purchase token or transaction JWS.
     */
    public function verifyPurchase(User $user, string $signedTransactionJws): array
    {
        try {
            $txData = $this->jwsDecoder->verify($signedTransactionJws);
        } catch (\Throwable $e) {
            // No fallback path. An unverified transaction grants no entitlement,
            // because its payload is base64 the caller wrote themselves.
            Log::warning('Rejected IAP purchase with unverifiable transaction', [
                'user_id' => $user->id,
                'reason' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Invalid transaction token signature.',
            ];
        }

        $productId = $txData['productId'] ?? $txData['product_id'] ?? null;
        $originalTxId = (string) ($txData['originalTransactionId'] ?? $txData['original_transaction_id'] ?? $txData['transactionId'] ?? $txData['transaction_id'] ?? '');
        $transactionId = (string) ($txData['transactionId'] ?? $txData['transaction_id'] ?? $originalTxId);
        $environment = $txData['environment'] ?? 'Sandbox';

        // One purchase, one account: a valid JWS handed to a friend must not
        // entitle their account too.
        $owner = Subscription::where('original_transaction_id', $originalTxId)->value('user_id');
        if ($owner && $owner !== $user->id) {
            Log::warning('Transaction replayed on a different account', [
                'original_transaction_id' => $originalTxId,
                'owner_id' => $owner,
                'claimed_by' => $user->id,
            ]);

            return [
                'success' => false,
                'message' => 'Giao dịch này đã được sử dụng cho một tài khoản khác.',
            ];
        }

        $purchaseDate = isset($txData['purchaseDate']) ? Carbon::createFromTimestampMs($txData['purchaseDate']) : now();
        $expiresDate = isset($txData['expiresDate']) ? Carbon::createFromTimestampMs($txData['expiresDate']) : now()->addMonth();

        return DB::transaction(function () use ($user, $productId, $originalTxId, $transactionId, $environment, $purchaseDate, $expiresDate, $txData) {
            // 1. Audit Log Transaction
            IapTransaction::updateOrCreate(
                ['transaction_id' => $transactionId],
                [
                    'user_id' => $user->id,
                    'original_transaction_id' => $originalTxId,
                    'product_id' => $productId,
                    'purchase_date' => $purchaseDate,
                    'expires_date' => $expiresDate,
                    'type' => $txData['type'] ?? 'Auto-Renewable Subscription',
                    'status' => 'success',
                    'raw_payload' => $txData,
                ]
            );

            // 2. Upsert Subscription Entitlement
            $subscription = Subscription::updateOrCreate(
                ['original_transaction_id' => $originalTxId],
                [
                    'user_id' => $user->id,
                    'product_id' => $productId,
                    'status' => 'active',
                    'starts_at' => $purchaseDate,
                    'expires_at' => $expiresDate,
                    'auto_renew_status' => true,
                    'environment' => $environment,
                    'canceled_at' => null,
                ]
            );

            return [
                'success' => true,
                'is_premium' => true,
                'subscription' => $subscription,
                'expires_at' => $subscription->expires_at?->toIso8601String(),
                'product_id' => $productId,
            ];
        });
    }

    /**
     * Restore previous purchases for user by original transaction ID or signed list.
     */
    public function restorePurchases(User $user, array $transactions): array
    {
        $restored = [];

        foreach ($transactions as $tx) {
            $jws = is_string($tx) ? $tx : ($tx['signedTransactionInfo'] ?? null);
            if ($jws) {
                $result = $this->verifyPurchase($user, $jws);
                if ($result['success'] ?? false) {
                    $restored[] = $result['subscription'];
                }
            }
        }

        $activeSubscription = $user->activeSubscription;

        return [
            'success' => count($restored) > 0 || $activeSubscription !== null,
            'is_premium' => $activeSubscription !== null && $activeSubscription->isValid(),
            'subscription' => $activeSubscription,
            'restored_count' => count($restored),
        ];
    }

    /**
     * Handle Apple App Store Server Notifications V2 Webhook.
     */
    public function handleAppStoreWebhook(array $payload): bool
    {
        $signedPayload = $payload['signedPayload'] ?? null;
        if (! $signedPayload) {
            Log::warning('No signedPayload in App Store webhook', $payload);

            return false;
        }

        // The webhook endpoint is public by design, so Apple's signature is its
        // only trust boundary. An unverified payload could revoke or extend any
        // subscription whose original transaction id the sender happened to know.
        try {
            $decoded = $this->jwsDecoder->verify($signedPayload);
        } catch (\Throwable $e) {
            Log::warning('Rejected App Store webhook with unverifiable payload', [
                'reason' => $e->getMessage(),
            ]);

            return false;
        }

        $notificationUuid = $decoded['notificationUUID'] ?? uniqid('notif_', true);
        $notificationType = $decoded['notificationType'] ?? 'UNKNOWN';
        $subtype = $decoded['subtype'] ?? null;
        $data = $decoded['data'] ?? [];
        $environment = $data['environment'] ?? 'Sandbox';

        // The nested transaction is signed separately and carries the fields that
        // drive entitlement state, so it is verified on its own terms.
        $signedTx = $data['signedTransactionInfo'] ?? null;
        $txData = null;

        if ($signedTx) {
            try {
                $txData = $this->jwsDecoder->verify($signedTx);
            } catch (\Throwable $e) {
                Log::warning('Rejected App Store webhook with unverifiable transaction info', [
                    'notification_type' => $notificationType,
                    'reason' => $e->getMessage(),
                ]);

                return false;
            }
        }

        $originalTxId = $txData['originalTransactionId'] ?? null;

        // Log notification
        AppStoreNotification::create([
            'notification_uuid' => $notificationUuid,
            'notification_type' => $notificationType,
            'subtype' => $subtype,
            'original_transaction_id' => $originalTxId,
            'environment' => $environment,
            'raw_payload' => $decoded,
            'processed_at' => now(),
        ]);

        if (! $originalTxId) {
            return true;
        }

        $subscription = Subscription::where('original_transaction_id', $originalTxId)->first();
        if (! $subscription) {
            Log::info("Subscription not found for webhook originalTx: {$originalTxId}");

            return true;
        }

        // Process notification events
        switch ($notificationType) {
            case 'DID_RENEW':
            case 'SUBSCRIBED':
                if ($txData && isset($txData['expiresDate'])) {
                    $subscription->expires_at = Carbon::createFromTimestampMs($txData['expiresDate']);
                }
                $subscription->status = 'active';
                $subscription->auto_renew_status = true;
                $subscription->save();
                break;

            case 'DID_FAIL_TO_RENEW':
                $subscription->status = ($subtype === 'GRACE_PERIOD') ? 'in_grace_period' : 'billing_retry';
                $subscription->save();
                break;

            case 'EXPIRED':
                $subscription->status = 'expired';
                $subscription->save();
                break;

            case 'REVOKE':
            case 'REFUND':
                $subscription->status = 'revoked';
                $subscription->canceled_at = now();
                $subscription->expires_at = now();
                $subscription->save();
                break;

            case 'DID_CHANGE_RENEWAL_STATUS':
                $subscription->auto_renew_status = ($subtype === 'AUTO_RENEW_ENABLED');
                $subscription->save();
                break;
        }

        return true;
    }
}
