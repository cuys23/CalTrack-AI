import { getAvailablePurchases } from 'expo-iap';
import { apiClient } from './apiClient';

/**
 * Hands every purchase StoreKit still holds to the backend for verification and
 * returns the entitlement the server ends up with.
 *
 * This is both the "Restore Purchases" button and the self-heal on launch: if a
 * renewal webhook from Apple was ever missed, the device still holds the current
 * signed transaction, so replaying it puts the server back in sync.
 */
export async function syncPurchasesWithServer(): Promise<boolean> {
  const purchases = await getAvailablePurchases();
  const tokens = purchases
    .map((p) => p.purchaseToken)
    .filter((t): t is string => Boolean(t));

  if (tokens.length === 0) return false;

  const res = await apiClient.restoreIapPurchases(tokens);
  return Boolean(res.is_premium);
}
