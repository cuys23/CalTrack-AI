# 0001 StoreKit 2 Integrated Directly

Date: 2026-08-19

## Status

Accepted

## Context

CalTrack AI sells auto-renewable subscriptions and one non-consumable lifetime
unlock. Guideline 3.1.1 requires that unlocking paid capability go through
In-App Purchase.

The client does not currently perform a purchase at all. At
`src/screens/onboarding/OnboardingSubScreens.tsx:72-84` it constructs a fake
JWS with `btoa()` and submits `mock_hdr.<payload>.mock_sig`. No StoreKit
library is installed.

The backend already carries most of a real implementation: the
`subscriptions`, `iap_transactions`, `subscription_products`, and
`app_store_notifications` tables; `SubscriptionService` with a notification
state machine covering renewal, grace period, expiry, revocation, and refund;
and an `AppStoreWebhookController` for Server Notifications V2. The one missing
piece is signature verification — `AppleJwsDecoder.php:12-34` decodes the
payload and discards `$signatureB64` without validating it.

The open question was whether to complete that verification ourselves or
delegate subscription infrastructure to a third-party service.

## Decision

Integrate StoreKit 2 directly. Add a client-side IAP library for the purchase
flow, and complete signature verification in our own backend by validating the
JWS x5c certificate chain against the Apple root, either by hand or by adopting
Apple's App Store Server Library.

## Alternatives Considered

1. **RevenueCat.** Delegate purchase, entitlement, and receipt validation to a
   managed service; replace our verification path with RevenueCat webhooks.
2. **StoreKit 2 directly.** Keep the existing backend and add the missing
   verification step. Selected.

## Consequences

Positive:

- The existing backend subscription infrastructure is retained rather than
  discarded. Roughly 80 percent of the server-side work already exists and its
  notification state machine is correct.
- No revenue share, and no dependency on a third party for entitlement
  correctness or availability.
- Subscription state stays in our own database, already modelled and indexed.

Tradeoffs:

- We own JWS chain verification, including Apple certificate rotation. This is
  security-critical code and is the specific place where the current
  implementation failed.
- We own Sandbox and production notification handling, and any future StoreKit
  API changes.
- Phase 2 is longer than it would be with a managed service.

## Follow-Up

- Verification must satisfy the invariant standard in
  `docs/patterns/encoding-invariants.md`: valid transactions pass, and a forged
  signature is rejected for the intended reason.
- `tests/Feature/IapApiTest.php:35-45` currently asserts that a `"mock_sig"`
  signature succeeds. It must be inverted to assert rejection; a still-passing
  original is proof the fix did not land.
- Webhook payloads require the same verification as purchase receipts. The
  endpoint is public and unauthenticated by design, so signature validation is
  its only trust boundary.
- Reconcile existing `subscriptions` rows against real App Store transactions
  once verification lands, and revoke entitlements with no matching
  transaction.
