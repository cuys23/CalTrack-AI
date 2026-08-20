# Execution Plan: CalTrack AI v1.0 App Store Release

Date: 2026-08-19

## Status

Active

Phases 1 and 2 are done. Phase 3 is complete except for work that needs
hardware or credentials: the development build, the per-screen iPad pass, and
the AI provider keys. No phase is blocked on a product decision.

The iPad estimate that was outstanding has been measured: 12–16 hours for a
per-screen pass, on top of the global content cap now in place.

## Outcome

CalTrack AI v1.0 is approved on the Apple App Store, with:

- Sign in with Apple and Google authenticated by server-verified provider
  tokens;
- Pro entitlement granted only by a StoreKit 2 transaction whose JWS signature
  verifies against the Apple certificate chain;
- no unauthenticated access to user data or admin surfaces;
- published Privacy Policy and Terms whose contents match actual data flow and
  the App Store Connect privacy declaration.

## Context

Authority and evidence behind this plan:

- Audit of commit `f8efa52`, 2026-08-19 — three independent read-only passes
  (Expo frontend, Laravel backend, App Store guideline conformance). Findings
  cited inline below with `file:line`.
- `docs/PROGRESS.md` — rewritten on 2026-08-19 against observed state and now
  usable again. It previously recorded Waves 0-5 as complete at 100%, which code
  inspection contradicted for Waves 1, 2 and 5; that history is kept in the file
  itself so the failure mode stays visible.
- `docs/API.md` — endpoint contract, accurate as of the audit.
- Apple App Store Review Guidelines 2.1, 3.1.1, 3.1.2, 4.8, 5.1.1(v), 1.4.1.
- `docs/patterns/encoding-invariants.md` — governs the three security fixes in
  Phase 1, which are invariant work rather than ordinary bug fixes.

Baseline proof at planning time: `npx tsc --noEmit` passes clean;
`php artisan test` passes 13/13 with 55 assertions. Both baselines predate the
fixes below and must be re-established after each phase.

## Scope

In scope:

- Server-side verification of Apple and Google identity tokens.
- Server-side verification of StoreKit 2 JWS, for both purchase verification
  and App Store Server Notification V2 webhooks.
- Authentication on all `routes/web.php` surfaces.
- Real Sign in with Apple, Google Sign-In, and StoreKit 2 clients replacing the
  current mock payloads.
- Enforcement of the Pro entitlement in both client and API.
- Deletion of voice logging and recipe import (decision 0002).
- HealthKit integration behind the existing Health sync screen (decision 0002).
- iPad layout across all screens, and the accompanying screenshot set
  (decision 0003).
- Production deployment path: image build, migration, storage linking,
  HTTPS, and minimal CI.
- Legal pages, in-app legal links, health disclaimer, and privacy declarations.
- Release mechanics through TestFlight to submission.

Out of scope for v1.0:

- Android release. Configuration is retained but unvalidated.
- Widgets and Apple Watch surfaces. Present as static preview imagery only;
  they require native extensions outside the current build setup.
- Password reset. `password_reset_tokens` exists with no flow attached.
- Real offline sync queue. Local persistence is retained; the "cloud sync"
  claim is removed from user-facing copy in Phase 3.

## Approach

Six phases. Ordering is dependency-driven, not cosmetic: Phase 0 has
Apple-side latency outside our control and must start first; Phase 1 precedes
Phase 2 because a real client against an unverifying server proves nothing and
hides which side is at fault.

### Phase 0 — Apple account prerequisites (~4h work, 1-3 days latency)

Runs in parallel with everything from day one.

- Confirm Apple Developer Program membership is active.
- Sign the Paid Apps Agreement; complete tax forms and banking. Without this,
  IAP products never reach "Ready to Submit".
- Register App ID `com.caltrack.app`; enable the Sign in with Apple capability.
- Create the App Store Connect app record; capture the real `ascAppId` and
  `appleTeamId`.
- Create the subscription group with two auto-renewable tiers.
  `com.caltrack.lifetime_pro` must be created as a Non-Consumable, not a
  subscription.
- Complete the current Age Rating questionnaire, including the Social Media
  section.

Gate: real Team ID in hand. `eas.json:31-39` currently holds placeholders
(`TEAMID1234`, `ascAppId 6470000000`) and `eas submit` cannot run until they
are replaced. The bundle ID also fixes the `aud` claim that Phase 1 validates
against.

### Phase 1 — Backend verification boundaries (~24h)

Invariant work. Each item needs positive proof that valid input passes and
negative proof that the forbidden input fails for the intended reason.

- `AuthController.php:98-136` — verify the Apple identity token against the
  JWKS at `appleid.apple.com/auth/keys`: signature, `iss`, `aud` equal to the
  bundle ID, and expiry. Requires a JWT library; `composer.json` has none.
- `AuthController.php:141-178` — verify the Google ID token equivalently, with
  `aud` equal to the OAuth client ID.
- Add a `google_user_id` column and resolve accounts by provider identity
  rather than by email. Email lookup is the mechanism that currently makes
  account takeover trivial.
- `AppleJwsDecoder.php:12-34` — replace payload-only decoding with x5c chain
  verification to the Apple root, or adopt Apple's App Store Server Library.
  `$signatureB64` is presently read and discarded. Apply to both
  `SubscriptionService::verifyPurchase` and the webhook handler.
- `routes/web.php:6-8` — require authentication on `/`, `/admin`, and
  `/admin/simulate-ai`. Gate `simulate-ai` behind `APP_ENV=local` or remove it
  from production entirely.
- Set `APP_DEBUG=false` in `.env.example`.

Gate: `tests/Feature/IapApiTest.php:35-45` submits `"mock_sig"` as the
signature and currently asserts success. After this phase it must **fail**, and
be rewritten to assert rejection. A still-passing original test means the fix
did not land. Add matching negative tests for forged identity tokens and for
unauthenticated `/admin` access.

### Phase 2 — Real client SDKs (~32h)

- Add `expo-apple-authentication`; replace `mockAppleUser`
  (`AuthModal.tsx:32-38`) with a real `signInAsync()` and forward the identity
  token.
- Add a Google Sign-In SDK; replace `mockGoogleUser`
  (`AuthModal.tsx:74-81`).
- Add a StoreKit 2 client library per decision 0001; replace the `btoa()`
  construction at `OnboardingSubScreens.tsx:72-84` with a real transaction.
- Remove the catch block at `OnboardingSubScreens.tsx:91-96`, which grants Pro
  when verification fails. Combined with the `localhost` fallback below, it
  grants Pro unconditionally in any production build.
- Wire Restore Purchases to the existing `/iap/restore` endpoint.
- Set `EXPO_PUBLIC_API_URL` for the production EAS profile and remove the
  `http://localhost:8000/api` fallback at `apiClient.ts:5` from release builds.
- Enforce entitlement: default `isPro` to false (`AppContext.tsx:101` currently
  defaults it true), read it in the screens that gate paid capability, and
  attach the existing `check.premium` middleware to `/meal/analyze`. The
  middleware is registered at `bootstrap/app.php:17` but attached to no route.

Gate: on a Sandbox account, purchase → cancel → restore completes end to end,
and an unpurchased account is refused a scan by the API, not only by the UI.

### Phase 3 — Feature honesty and correctness (~34h, plus iPad layout)

Principle: nothing ships that misrepresents what it does. A reviewer pressing a
button that does nothing is a Guideline 2.1 rejection; a smaller app that works
is not.

Per decision 0002:

- Delete `VoiceLogSheet` (`ScanningSubSheets.tsx:15-28`, returns "Bún bò Huế"
  regardless of input) together with its route, import, and the menu entry at
  `NutritionDetailScreen.tsx:130`, plus `App.tsx:20, 58, 339, 358-359`.
- Delete `RecipeImportScreen` (`RecipeAndSavedScreens.tsx:164-178`, never calls
  `onImported()`) together with `App.tsx:21, 43, 276-278, 350`.
- Implement HealthKit behind `HealthSyncSettingsScreen`
  (`ExerciseScreens.tsx:62-109`): add the dependency and entitlement, declare
  `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` in
  `app.json`, handle permission denial, and remove the static
  `isAutoSynced: true` at `AppContext.tsx:187`. Fix the read and write scope
  before implementation starts; leaving it open reproduces the ambiguity
  decision 0002 exists to close.

Per decision 0003:

- Survey every screen at tablet width and build a real iPad layout. Estimate
  the effort during the survey and record it here — the phase total above does
  not yet include it. The camera scan and paywall screens carry the highest
  risk of a stretched appearance.

Both `__DEV__`-gated surfaces are fine as they stand: the screen jumper at
`App.tsx:408` does not reach release builds and needs no change.
- `CameraScanScreen.tsx:39-50` — surface capture failures instead of
  substituting a hardcoded Unsplash image, which silently logs food the user
  never photographed. Handle permanently denied permission by directing the
  user to Settings.
- `ProfileScreen.tsx:76-98` — after successful deletion, clear AsyncStorage and
  SecureStore, sign out, and return to onboarding. Currently only a toast is
  shown and all local data survives.
- Delete `src/services/aiGateway.ts`; no module imports it.
- `AppContext.tsx:197-206` — `achievements` is never loaded or persisted, so
  progress resets on every launch.
- Configure real Gemini and OpenAI keys and add a per-user daily cost ceiling.
  Both keys are empty, so `AiVisionService.php:148-183` currently returns
  hardcoded food for every scan. Route throttling of 15/min is not a cost
  control.
- Rewrite `docs/PROGRESS.md` against observed state.
- Remove "offline-first cloud sync" from README and user-facing copy, or
  implement a real sync queue. No NetInfo listener exists despite the
  dependency being installed.

### Phase 4 — Infrastructure and legal (~20h)

- Rewrite the Privacy Policy to state that meal photographs are transmitted to
  Google and OpenAI for analysis. The current text asserts the opposite.
- Publish Privacy Policy, Terms, and a Support page as public HTML.
  `LegalController` returns JSON, which App Store Connect cannot accept as a
  Privacy Policy URL.
- Add tappable Terms and Privacy links to the paywall alongside price, billing
  period, and cancellation instructions (Guideline 3.1.2).
- Add the health disclaimer to the scan result screen (Guideline 1.4.1). The
  present note cites data sources only.
- Extend the Privacy Policy and the App Store Connect declaration to cover
  HealthKit data. Guideline 5.1.3 applies once decision 0002 lands: health data
  may not be used for advertising, stored in iCloud, or shared with third
  parties for those purposes.
- Add `ITSAppUsesNonExemptEncryption: false` to `app.json`.
- Production Dockerfile: `composer install --no-dev --optimize-autoloader`, an
  entrypoint running `migrate --force`, `storage:link`, and config caching, a
  non-root user, and no dependency on the bind mount that currently supplies
  `vendor/`. Without `storage:link`, meal images 404 in production.
- Explicit CORS configuration, service healthchecks against the existing
  `/api/health`, and scheduled Postgres backups.
- Deploy the backend to a real HTTPS domain; register the webhook URL for App
  Store Server Notifications V2 in App Store Connect.
- Minimal CI: `php artisan test` and `npx tsc --noEmit` on push.

Gate: the App Store Connect privacy declaration matches the rewritten Privacy
Policy line for line. Divergence here is among the most common rejection
causes.

### Phase 5 — Build, TestFlight, submit (~16h plus review latency)

- `eas build --platform ios --profile production`; inspect the log for privacy
  manifest warnings and add declarations if flagged.
- Create a Sandbox tester; exercise purchase, cancellation, restore, and
  expiry on TestFlight.
- Confirm the webhook receives live Sandbox notifications.
- Capture iPhone 6.9" screenshots at 1320x2868 and iPad 13" at 2064x2752.
  Both sets are required; decision 0003 retains tablet support.
- Prepare a reviewer demo account and review notes explaining that scan
  analysis is queued and therefore delayed.
- `eas submit`, attach the build to the version, submit for review.

## Risks And Recovery

- **Phase 0 latency is external.** Paid Apps Agreement and banking approval can
  take days. Recovery: none available; this is why Phase 0 starts immediately
  and in parallel.
- **Phase 1 and Phase 2 change the authentication contract together.** A
  partial rollout locks out existing accounts. Recovery: deploy Phase 1 with
  verification enforced but retain the ability to disable it by configuration
  for one release, then remove that switch once Phase 2 ships. Record the
  switch's removal as a Phase 2 task so it does not become permanent.
- **Existing accounts were created without identity verification.** Any account
  in the database may have been created or accessed by someone other than its
  owner. Recovery: treat pre-fix accounts as unverified and require
  re-authentication after Phase 2 deploys.
- **Any Pro entitlement granted before Phase 2 is unpaid.** Recovery: reconcile
  `subscriptions` against real App Store transactions after JWS verification
  lands, and revoke entitlements with no matching transaction.
- **HealthKit ends the Expo Go workflow.** Decision 0002 requires a native
  module, so the project must move to a development build. Everyone working on
  the app is affected, and the change lands mid-plan. Recovery: create and
  verify the development build at the start of Phase 3, before the HealthKit
  work depends on it, so the workflow change is isolated from the feature work.
- **iPad effort is unestimated.** Decision 0003 adds layout work across every
  screen with no figure attached, which makes the Phase 3 total unreliable
  until the survey completes. Recovery: run the tablet-width survey first in
  Phase 3 and revise the estimate here before committing to a submission date.
- **Storage rewrite risk in Phase 4.** Moving off the bind mount changes where
  uploaded images live. Recovery: verify `storage:link` and image retrieval in
  staging before production cutover; keep the previous volume until verified.
- **Rejection is expected to be possible even after this plan.** Recovery:
  Resolution Center response within one business day; the disclaimer, privacy
  declaration, and reviewer notes are the three items most likely to need
  revision.

## Progress

Phase 0 — Apple account prerequisites

- [ ] Developer Program membership confirmed active
- [ ] Paid Apps Agreement signed; tax and banking complete
- [ ] App ID registered; Sign in with Apple capability enabled
- [ ] App Store Connect record created; real `ascAppId` and `appleTeamId`
      captured
- [ ] `eas.json:31-39` placeholders replaced
- [ ] Subscription group and three products created
- [ ] Age Rating questionnaire completed

Phase 1 — Backend verification boundaries — **complete 2026-08-19**

- [x] JWT library added to `composer.json` (`firebase/php-jwt` ^7.1)
- [x] Apple identity token verified against JWKS
- [x] Google ID token verified
- [x] `google_user_id` column added; account resolution moved off email
- [x] StoreKit 2 JWS signature verified for purchases
- [x] Webhook payload signature verified
- [x] Authentication required on all `routes/web.php` surfaces
- [x] `APP_DEBUG=false` in `.env.example`
- [x] `IapApiTest` mock-signature case inverted to assert rejection
- [x] Negative tests added for forged identity tokens and unauthenticated
      `/admin`

Phase 2 — Real client SDKs — **code complete 2026-08-19, device proof pending**

- [x] `expo-apple-authentication` integrated; mock payload removed
- [x] Google Sign-In integrated; mock payload removed
- [x] StoreKit 2 purchase flow integrated; `btoa()` construction removed
- [x] Pro-on-failure catch block removed
- [x] Restore Purchases wired to `/iap/restore`
- [x] Production API URL configured; `localhost` fallback removed from release
- [x] `isPro` defaults false and gates paid screens
- [x] `check.premium` attached to `/meal/analyze`
- [x] Entitlement re-synced from the server on launch
- [x] Scan flow no longer fabricates a result when refused for entitlement
- [ ] Sandbox purchase, cancel, and restore verified — requires a development
      build on a device; carried into Phase 5
- [ ] Google OAuth client IDs supplied (`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`,
      `GOOGLE_OAUTH_CLIENT_IDS`, and the reversed id in `app.json`)

Phase 3 — Feature honesty and correctness

- [ ] Development build created and verified; Expo Go workflow retired
- [x] Tablet-width survey completed; iPad effort estimated and recorded here
- [x] Global tablet content cap applied (camera excluded)
- [ ] Per-screen visual pass at tablet width
- [x] `VoiceLogSheet` and all references deleted
- [x] `RecipeImportScreen` and all references deleted
- [x] HealthKit read and write scope fixed and documented
- [x] HealthKit integrated; entitlement and usage descriptions declared
- [x] HealthKit permission denial handled
- [ ] Static `isAutoSynced` demo value removed
- [x] Camera capture failure surfaced; permanent denial handled
- [x] Account deletion clears local state and signs out
- [x] `aiGateway.ts` deleted
- [x] `achievements` persistence fixed
- [x] Per-account daily AI cost ceiling added
- [ ] AI provider keys configured (`GEMINI_API_KEY` / `OPENAI_API_KEY`)
- [x] `docs/PROGRESS.md` rewritten against observed state
- [x] Cloud sync claims removed from user-facing copy
- [x] Barcode scanning implemented against Open Food Facts (decision 0004)

Phase 4 — Infrastructure and legal — **code complete 2026-08-19**

- [x] Privacy Policy rewritten to disclose third-party AI processing
- [x] Privacy Policy extended to HealthKit and barcode lookup
- [x] Privacy Policy, Terms, and Support published as public HTML
- [x] Paywall legal links, pricing, and cancellation terms added
- [x] Health disclaimer added to scan results
- [x] `ITSAppUsesNonExemptEncryption` declared
- [x] Production Dockerfile and entrypoint
- [x] CORS, healthchecks, and Postgres backups configured
- [x] CI running backend tests and type checking
- [x] `pint` debt cleared; the suite now passes clean
- [x] Docker image built and the full stack run locally
- [ ] Backend deployed to HTTPS domain
- [ ] Webhook URL registered in App Store Connect
- [ ] App Store Connect privacy declaration reconciled with the policy

Phase 5 — Build, TestFlight, submit

- [ ] Production build succeeds; privacy manifest warnings resolved
- [ ] Sandbox purchase lifecycle verified on TestFlight
- [ ] Webhook confirmed receiving live Sandbox notifications
- [ ] iPhone 6.9" and iPad 13" screenshot sets captured
- [ ] Reviewer demo account and review notes prepared
- [ ] Submitted for review

## Decisions

- 2026-08-19: `docs/PROGRESS.md` is not treated as authority for this work.
  Three independent audits contradict its completion claims for Waves 1, 2, and
  5. This plan is the status record until Phase 3 rewrites it.
- 2026-08-19: Backend verification precedes client SDK integration. A verified
  client against an unverifying server produces no evidence and obscures which
  side is at fault.

- 2026-08-19: The `__DEV__`-gated screen jumper at `App.tsx:408` was inspected
  and needs no change. It does not reach release builds.
- 2026-08-19: One `OidcTokenVerifier` serves both Apple and Google. Both issue
  RS256 tokens and publish a JWKS, so the providers differ only in
  configuration. Two classes would have duplicated the security-critical part.
- 2026-08-19: The pinned StoreKit root certificate path is configurable.
  Verification pins Apple's real root, which no test can sign under, so tests
  pin a root they generate. Without that seam only negative proof is possible,
  and a verifier that rejected everything would pass every negative test.
- 2026-08-19: The admin dashboard uses a single HTTP Basic credential from
  config rather than a user role. It closes the hole without a schema change or
  a roles model. Marked `ponytail:` in the middleware with its upgrade path:
  move to an `is_admin` column if more than one operator needs access or if
  who-did-what must be answerable.
- 2026-08-19: Laravel's two skeleton `ExampleTest` files were deleted rather
  than repaired. The feature one asserted that `/` returns 200, which stopped
  being true once the dashboard required credentials; neither asserted anything
  about this product, and `AdminAccessTest` now covers `/`.
- 2026-08-19: `pint --test` fails across the repository, mostly in files this
  phase did not touch. Reformatting everything would have buried the security
  diff. Deferred to Phase 4, where CI is established.
- 2026-08-19: `expo-iap` was chosen for StoreKit, following decision 0001.
  `expo-in-app-purchases` no longer exists; Expo's SDK 57 guidance names
  `expo-iap` and `react-native-purchases` (RevenueCat), and decision 0001 rules
  out the latter. `purchase.purchaseToken` carries the StoreKit 2 JWS, which is
  exactly what the Phase 1 verifier consumes.
- 2026-08-19: `@react-native-google-signin/google-signin` was chosen over
  `react-native-nitro-google-signin`. Both are listed by Expo; the former is the
  more widely deployed. The Credential Manager feature that separates them is
  Android-only and outside the v1.0 iPhone scope.
- 2026-08-19: Provider sign-in moved into `src/services/socialAuth.ts`.
  `AuthModal` and `SignInScreen` had near-identical copies, and two copies of
  security-sensitive code is how a fix lands in one and misses the other.
- 2026-08-19: `isPremium` lives in context but is never persisted, and is
  re-fetched from the server on launch. Persisting it would let anyone with
  device access grant themselves Pro by editing a file.
- 2026-08-19: `apiClient` now throws `ApiError` carrying the HTTP status. The
  scan flow caught every error identically and fell back to
  `AiFoodEngine.analyzeImage`, which picks a random food — so a 403 from the new
  entitlement gate would have silently fabricated a meal and made the paywall
  look broken. Entitlement failures now route to the paywall; only genuine
  network failures fall back.
- 2026-08-19: A release build with no `EXPO_PUBLIC_API_URL` now throws at
  startup instead of defaulting to `localhost`. Failing loudly in development is
  cheaper than shipping a build that silently cannot reach its backend.

- 2026-08-19: `@kingstinct/react-native-healthkit` was chosen for HealthKit. Its
  installed API takes `(identifier, options)` rather than the single-object form
  shown in its published examples; the code follows the shipped typings.
- 2026-08-19: HealthKit scope was fixed at reading step count and active energy
  and writing body mass, and nothing else. Guideline 5.1.3 weighs what an app
  requests against what it uses, so heart rate, sleep, and workout detail are
  not requested.
- 2026-08-19: iPad support is delivered by one global content-width cap rather
  than per-screen breakpoints. Forty-odd screens with no responsive machinery
  would otherwise each need their own treatment for the same result.
- 2026-08-19: The scan quota counts meal logs carrying an image for the current
  day. It reuses data already stored rather than adding a counter table.

- 2026-08-19: Barcode lookup runs through our backend rather than calling Open
  Food Facts from the app. The data is community-edited and does contain
  impossible values, so it passes through the existing `NutritionValidator`
  before a user sees it.
- 2026-08-19: A barcode with no match returns 404 and the app opens manual
  entry. Vietnamese coverage in Open Food Facts is thin, so "not found" is
  expected traffic rather than an error state.
- 2026-08-19: Barcode lookup is not premium-gated. Unlike AI scanning it costs
  nothing per call, and charging for a free lookup would make the paywall feel
  arbitrary.
- 2026-08-19: Legal text lives in Blade pages, and the API returns the page URL
  plus a short summary rather than a second copy of the wording. Two copies
  drift, and a privacy policy that contradicts itself is a review finding.
- 2026-08-19: The existing `Dockerfile` was rewritten in place rather than
  duplicated as `Dockerfile.prod`. The development compose bind-mounts over
  `/var/www`, so it keeps working, and there is one image definition to keep
  correct instead of two.
- 2026-08-19: Only the web container migrates (`RUN_MIGRATIONS`), because
  replicas starting together would otherwise race each other.
- 2026-08-19: `pint` was applied across the backend in one pass, now that CI
  exists to hold the line. Tests confirmed nothing broke. Style is advisory in
  CI: gating on pre-existing violations teaches people to ignore the result.
- 2026-08-19: `config.platform.php` is pinned in `composer.json`. Without it the
  lock records whatever PHP the person running `composer update` happens to
  have, which is how the lock came to require 8.4.1 while the declared
  constraint said 8.3.
- 2026-08-19: The web tier is a build stage in the same Dockerfile rather than a
  stock nginx image with a mounted config. It needs `public/`, and a
  self-contained app image has no bind mount to supply it.
- 2026-08-19: Backups are nightly local dumps kept 14 days. Marked `ponytail:`
  — they survive a bad migration but not the loss of the host, and must go
  off-site before real users' records depend on them.

Promoted to `docs/decisions/`, all accepted 2026-08-19:

- [0001](../../decisions/0001-storekit-2-direct-integration.md) — StoreKit 2
  integrated directly; JWS verification completed in our own backend.
- [0002](../../decisions/0002-shell-feature-disposition.md) — Voice logging and
  recipe import deleted; Health sync implemented against HealthKit.
- [0003](../../decisions/0003-ipad-support-retained.md) — iPad support retained
  with a real tablet layout.

## Validation

### Phase 1 observed results, 2026-08-19

`php artisan test` — **31 passed, 106 assertions**. Baseline before this phase
was 13 passed, 55 assertions.

Positive proof, without which a verifier that refused everything would look
identical to a correct one:

- A transaction signed by a leaf chaining to the pinned root is accepted and
  grants entitlement (`IapApiTest::test_verifies_properly_signed_transaction…`).
- A properly signed Apple token creates an account keyed on its subject, and a
  later token without an email resolves to the same account rather than a
  second one.
- A properly signed Google token creates an account keyed on its subject.
- The correct operator credential still reaches the dashboard.

Negative proof, each failing for its intended reason:

- The exact token the previous test asserted would succeed — a payload with
  `mock_sig` as its signature — is now refused, and the account remains
  non-premium.
- A chain rooted outside the pinned root, a non-ES256 algorithm, and a payload
  edited after signing are all refused.
- Identity tokens signed by an unpublished key, issued for another application,
  or expired are refused, and no user record is created.
- The original attack shape for both providers — identity asserted in the
  request body — no longer forms a valid request, and issues no token.
- Google refuses to attach to an existing account through an unverified email.
- The dashboard refuses anonymous requests and wrong passwords, and returns 503
  rather than admitting anyone when no credential is configured.

Enforcement level, stated separately as the pattern requires:

- **Local validation:** `php artisan test` exists, was run, and passed.
- **Optional hook:** none installed, and none was added.
- **CI:** no workflow invokes these tests. Phase 4 establishes CI.
- **Branch protection:** unverified; nothing here demonstrates merge blocking.

Known gap: `pint --test` fails repository-wide, including in files this phase
did not touch. Deferred to Phase 4 with CI.

### Phase 2 observed results, 2026-08-19

`php artisan test` — **35 passed, 111 assertions**. `npx tsc --noEmit` — clean.

Proven here:

- An entitled account passes the AI-scan gate; a free account and an account
  whose subscription expired are both refused with 403, while manual logging
  stays free (`PremiumGateTest`).
- No mock payload, forged JWS, or `useApp() as any` cast remains anywhere in
  `src/` or `App.tsx`; grep for each returns nothing.

**Not proven, and not provable without hardware.** Apple sign-in, Google
sign-in, and StoreKit purchases all need a development build on a real device.
Nothing in this phase demonstrates that a purchase completes, only that the
code path is real and that the server refuses everything it should. Sandbox
verification is carried into Phase 5, and until it runs, Phase 2 is code
complete rather than validated.

### Phase 3 observed results, 2026-08-19

`php artisan test` — **37 passed, 114 assertions**. `npx tsc --noEmit` — clean.

- A subscriber under the daily ceiling scans normally; one at the ceiling is
  refused with 429 naming the limit (`PremiumGateTest`).
- Grep confirms no reference to `VoiceLogSheet` or `RecipeImportScreen` survives
  anywhere in `src/` or `App.tsx`, and no stock-photo fallback remains in the
  camera screen.

**Unproven:** HealthKit reads and writes have not been executed. Like the
purchase flow, they need a development build on a device.

**iPad estimate, from the tablet-width survey.** The codebase has no responsive
machinery at all: no `Dimensions` or `useWindowDimensions` usage, no `maxWidth`
anywhere, 50 hardcoded pixel widths, and row layouts throughout 14 screen files.
A global content cap now handles the common case. Remaining work is a per-screen
visual pass at tablet width, estimated **12–16 hours**, concentrated on the
paywall, the calorie rings, and the food result screen. The camera is excluded
from the cap because capping it would letterbox the viewfinder.

### Barcode lookup, 2026-08-19

`php artisan test` — **45 passed, 134 assertions**.

- Two different barcodes return two different products, which is the specific
  defect this replaced: the scanned code previously made no difference at all.
- Verified against the live service, not only against fakes: `8934563138165`
  resolves to Hảo Hảo at 455 kcal/100g, `3017620422003` to Nutella at 539, and
  both an unknown code and a malformed one return nothing.
- Community values that are impossible — 99999 kcal, negative protein — are
  corrected rather than displayed.
- An unreachable upstream service returns "not found" instead of an invented
  product.
- A malformed barcode never reaches the upstream service.

### Phase 4 observed results, 2026-08-19

`php artisan test` — **52 passed, 163 assertions**. `npx tsc --noEmit` — clean.
`pint --test` — **passes**, having failed repository-wide since before this work.

- The three legal pages return HTML, without authentication, as App Review reads
  them (`LegalPagesTest`). The tests assert the specific disclosures each
  guideline requires rather than merely that a page exists: every third-party
  recipient by name, health data staying on the device, account deletion,
  renewal terms with the 24-hour cancellation window, and the medical
  disclaimer.
- `docker compose -f docker-compose.prod.yml config` validates, and refuses to
  resolve without `DB_PASSWORD`, which is the intended guard.

**Container stack, built and run 2026-08-19.** The first build failed four
times, each on a defect that reading the files could not have surfaced:

1. `composer.lock` required PHP >= 8.4.1 while `composer.json` declared `^8.3`
   and the image pinned 8.3. The lock had been resolved against the developer's
   PHP 8.5. Fixed at the root by declaring `config.platform.php`, so the lock no
   longer follows whoever runs `composer update`; `^8.4` everywhere, CI included,
   which would have failed for the same reason.
2. No `.dockerignore` existed, so `COPY . .` overwrote the `--no-dev` vendor
   directory with the host's, brought `bootstrap/cache` generated against dev
   packages — Laravel then tried to boot a provider absent from the image — and
   would have baked `.env` into a pushed image.
3. The nginx container had no document root. Removing the bind mount was correct
   but left `root /var/www/public` pointing at nothing, and every request
   returned 404. A `web` build stage now carries `public/`.
4. Adding that stage silently repointed `app` and `queue-worker`, because Docker
   builds the last stage when none is named. Every service now states its target.

A fifth defect surfaced while running: the backup container restart-looped, its
inline shell command mangled by YAML folding. It is a script now, which also
writes to a `.partial` name first so an interrupted dump cannot be mistaken for
a usable one.

Observed on the running stack, through nginx:

- `/api/health`, `/api/legal/privacy`, `/api/iap/products` — 200.
- `/legal/privacy`, `/legal/terms`, `/support` — 200, `text/html`, and each
  carries the disclosures its guideline requires: Gemini, OpenAI, and Open Food
  Facts by name; health data staying on the device; the 24-hour cancellation
  window; the medical disclaimer.
- `/admin` — 401 anonymous, 401 with a wrong password, 200 with the credential.
- `/api/me` without a token — 401.
- The entrypoint ran migrations, linked storage, and cached config, routes, and
  views. All six services reported healthy.
- The backup container produced a real gzipped dump containing 18 `CREATE TABLE`
  statements.
- The image is 196 MB, runs as `www-data`, and contains neither `.env` nor the
  dev dependencies.

To repeat this: copy `.env.production.example`, generate a real `APP_KEY`, and
run `docker compose -f docker-compose.prod.yml up -d --build`. An invalid
`APP_KEY` fails only the web routes, since the API is stateless — that
asymmetry cost time to diagnose and is worth knowing.

Enforcement level:

- **Local validation:** `php artisan test` (52 passed), `tsc --noEmit`, and
  `pint --test` all exist, were run, and passed after the container work.
- **CI:** `.github/workflows/ci.yml` is checked in and invokes all three. It has
  never run — the repository has no remote configured — so nothing here shows it
  passing on a real revision. Style is advisory and does not gate.
- **Branch protection:** unverified. Nothing was configured, and a checked-in
  workflow does not demonstrate merge blocking.

### Standing validation requirements

- Focused proof: `php artisan test` for verification boundaries, including the
  inverted mock-signature case and new negative tests for forged identity
  tokens and unauthenticated admin access. `npx tsc --noEmit` for the client.
- Integration or end-to-end proof: Sandbox purchase, cancellation, restore, and
  expiry exercised on a TestFlight build against the deployed backend, with
  webhook receipt confirmed in `app_store_notifications`. Sign in with Apple
  and Google completed on a real device. Account deletion verified to remove
  both server records and local state.
- Repository-required checks: CI runs backend tests and type checking on push,
  once Phase 4 establishes it. No such automation exists today.

Enforcement status is unproven until observed. Source presence and CI
configuration do not by themselves demonstrate that merges are blocked.

## Result

Pending.
