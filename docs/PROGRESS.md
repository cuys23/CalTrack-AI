# CalTrack AI — Progress

> **Last verified:** 2026-08-19 against commit `f8efa52` plus the Phase 1–3 work
> described below.

This file records observed state. The plan of record is
[`docs/plans/active/appstore-release.md`](plans/active/appstore-release.md); the
accepted product choices are in [`docs/decisions/`](decisions/).

## History Of This File

An earlier version of this document reported Waves 0–5 complete at 100% and
Wave 6 at 70%. Three independent audits on 2026-08-19 found that claim wrong in
material ways:

- **Authentication** was recorded as done. No sign-in SDK was installed; the
  client sent an invented user id and the server accepted it without
  verification. Anyone who knew an email address could sign in as its owner.
- **In-app purchase** was recorded as done. No StoreKit library was installed;
  the client built a fake receipt with `btoa()` and the server never checked the
  signature. Its own test suite asserted that a signature of `"mock_sig"` should
  succeed.
- **Security and legal compliance** was recorded as done. The operator dashboard
  was reachable without any authentication.

The lesson is in the process, not the checklist: completion was recorded from
intent rather than from evidence. Every entry below therefore names what was
actually run, and separates what was proven from what remains unproven.

## Current Status

| Phase | State | Evidence |
| :--- | :--- | :--- |
| 0 · Apple account prerequisites | Not started | Requires App Store Connect access |
| 1 · Backend verification boundaries | **Complete** | Covered by the suite below |
| 2 · Real client SDKs | Code complete, device proof pending | `tsc --noEmit` clean; purchase flow needs hardware |
| 3 · Feature honesty and correctness | Complete except hardware/keys | Covered by the suite below |
| 4 · Infrastructure and legal | Code complete, deploy pending | Stack built and run; 52 tests, pint clean |
| 5 · Build, TestFlight, submit | Not started | |

Suite now: **52 tests, 163 assertions**. Baseline before this work: 13 tests, 55 assertions.

## Phase 1 — Backend Verification Boundaries (complete)

- Apple and Google identity tokens are verified against each provider's JWKS:
  signature, issuer, audience, and expiry. One `OidcTokenVerifier` serves both.
- Accounts are keyed on the provider subject rather than on the email address.
  A `google_user_id` column was added for this.
- StoreKit 2 JWS payloads are verified by walking the x5c certificate chain to a
  pinned Apple Root CA - G3. Applied to purchases and to webhooks, including the
  nested transaction inside a notification.
- The operator dashboard requires credentials and fails closed when none are
  configured. The simulation endpoint is registered outside production only.
- `APP_DEBUG=false` in `.env.example`.

Proven both ways: correctly signed input is accepted, and forged signatures,
foreign roots, algorithm substitution, tampered payloads, foreign audiences, and
expired tokens are each rejected for their own reason.

## Phase 2 — Real Client SDKs (code complete)

- `expo-apple-authentication` and `@react-native-google-signin/google-signin`
  replace the invented user objects. Only the signed token is sent.
- `expo-iap` replaces the fabricated receipt; `purchase.purchaseToken` carries
  the StoreKit 2 JWS the backend verifies.
- The catch block that granted Pro whenever verification failed is gone.
- Entitlement defaults to locked, is never persisted locally, and is re-fetched
  from the server on launch.
- `check.premium` is attached to `/meal/analyze`, so the paywall is enforced by
  the API rather than only drawn in the interface.
- A release build without `EXPO_PUBLIC_API_URL` now fails at startup instead of
  silently addressing `localhost`.

**Unproven:** no purchase or provider sign-in has been executed. All three need
a development build on a device, which is carried into Phase 5.

## Phase 3 — Feature Honesty And Correctness (in progress)

Done:

- Voice logging and recipe import deleted with all their references
  (decision 0002). Both presented complete interfaces over no implementation.
- Apple Health implemented for real against HealthKit: reads step count and
  active energy, writes body mass, and asks for nothing else. Health data stays
  on the device.
- Camera capture failures are surfaced instead of substituting a stock
  photograph, which had been causing users to log meals they never photographed.
  A permanently denied permission now routes to Settings, the only place the
  decision can still be changed.
- Account deletion clears the auth token and all local data, then returns to the
  signed-out state. Deleting only the server record left the data on the phone.
- Dead module `src/services/aiGateway.ts` deleted; nothing imported it.
- Achievements are now persisted. The storage key existed but nothing wrote to
  it, so badge progress reset on every launch.
- A per-account daily ceiling bounds paid vision calls. Per-minute throttling
  limited burst rate but placed no bound on the daily bill.
- Removed claims of background cloud sync from the README and the sign-in
  screen. No sync queue exists; local data reaches the server only through
  direct API calls.
- Barcode scanning implemented against Open Food Facts through our own backend
  (decision 0004). The scanned code previously made no difference to the result.
  Community-supplied values pass through `NutritionValidator`, and a product we
  cannot find opens manual entry rather than inventing one.

Outstanding:

- Development build, which HealthKit and IAP both now require. Expo Go can no
  longer run this project.
- iPad layout across all screens, plus its effort estimate (decision 0003).
- AI provider keys. While `GEMINI_API_KEY` and `OPENAI_API_KEY` are both empty,
  `AiVisionService` returns hardcoded sample food for every scan.
- Vietnamese coverage in Open Food Facts is thin, so barcode lookups will often
  find nothing. That path is handled, but the hit rate is unmeasured.

## Phase 4 — Infrastructure And Legal (code complete)

- Privacy Policy, Terms, and Support are published as public HTML pages at
  `/legal/privacy`, `/legal/terms`, and `/support`. The previous versions were
  JSON, which App Store Connect cannot accept for either required URL.
- The Privacy Policy now states what actually happens: meal photographs go to
  Google Gemini and OpenAI, scanned barcodes go to Open Food Facts, and health
  data never leaves the device. The previous text claimed photographs were never
  shared with third parties.
- The paywall shows the billing period, renewal behaviour, and how to cancel,
  with working links to both documents (Guideline 3.1.2).
- The scan result screen carries a medical disclaimer (Guideline 1.4.1); it
  previously cited data sources only.
- The Dockerfile installs dependencies and ships the application inside the
  image. It previously did neither and only worked because compose bind-mounted
  the host directory over it.
- An entrypoint runs migrations, links storage, and caches configuration on
  start. None of that ran before, so a fresh deployment came up with no schema
  and every uploaded photograph returning 404.
- `docker-compose.prod.yml` adds health checks, drops the published database and
  cache ports, persists uploads on a volume, and takes a nightly database dump.
- CORS origins are named explicitly instead of defaulting to every origin.
- `.github/workflows/ci.yml` runs the backend suite and the type check.
- `pint` was applied across the backend and now passes.

The stack was built and run locally on 2026-08-19. Doing so exposed five
defects that reading the files had not: a `composer.lock` requiring a newer PHP
than the image provided, a missing `.dockerignore` that overwrote the production
vendor directory and would have baked `.env` into the image, an nginx container
with no document root, build targets silently repointed by adding a stage, and a
backup container whose inline command YAML had mangled. All are fixed and the
running stack was verified end to end through nginx.

`.env.production.example` documents the deployment environment.

## Known Gaps

- CI is checked in but has never executed; the repository has no remote.
- No frontend tests and no lint configuration.
- No password reset flow, though `password_reset_tokens` exists.
- Backups are local to the host. They survive a bad migration, not the loss of
  the host.
