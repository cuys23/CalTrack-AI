# 0002 Disposition Of Non-Functional Features

Date: 2026-08-19

## Status

Accepted

## Context

Three features present a complete user interface with no working
implementation behind it:

- **Voice log** (`src/screens/scanning/ScanningSubSheets.tsx:15-24`). Records
  nothing. The transcript is a hardcoded string and the result is always
  "Bún bò Huế" regardless of what the user says. No audio or speech-to-text
  dependency is installed.
- **Recipe import** (`src/screens/library/RecipeAndSavedScreens.tsx:169-178`).
  Does not fetch the submitted URL. `handleImport` waits 1.5 seconds, shows
  "Đã phân tích công thức!", and calls `onBack()` — never `onImported()`, so no
  food is ever created.
- **Health sync** (`src/screens/exercise/ExerciseScreens.tsx:62-109`). Toggles
  and a save button that only raises a toast. No HealthKit dependency is
  installed, and `isAutoSynced: true` at `AppContext.tsx:187` is static demo
  data.

Guideline 2.1 requires that submitted apps be complete and that features be
functional for the reviewer. A control that visibly does nothing is a
rejection risk on its own.

## Decision

Treat the three separately rather than as one class:

- **Voice log: delete.** Remove `VoiceLogSheet` and every route, import, and
  menu entry that reaches it.
- **Recipe import: delete.** Remove `RecipeImportScreen` and every route,
  import, and menu entry that reaches it.
- **Health sync: implement for real.** Integrate HealthKit so the screen does
  what it claims.

## Alternatives Considered

1. **Remove all three from v1.0**, deferring each to a later release once real
   usage shows which are worth building.
2. **Label all three "coming soon"**, keeping the interface but disabling it.
3. **Implement all three**, adding roughly three weeks to the schedule.
4. **Split the disposition per feature.** Selected: delete the two whose value
   is unproven, implement the one judged core to the product.

## Consequences

Positive:

- No shipped control misrepresents what the app does.
- Voice log and recipe import stop appearing as completed work in status
  documents and audits; both were recorded as done before this decision.
- Health sync becomes a real differentiator rather than a placeholder.

Tradeoffs:

- HealthKit adds roughly 8 to 16 hours to Phase 3.
- HealthKit requires native configuration the project does not have today:
  the entitlement, plus `NSHealthShareUsageDescription` and
  `NSHealthUpdateUsageDescription` in `app.json`.
- **The project can no longer be exercised through Expo Go.** HealthKit
  requires a development build, which changes the day-to-day workflow for
  everyone on the project.
- Guideline 5.1.3 begins to apply: health data may not be used for advertising
  or marketing, may not be stored in iCloud, and may not be shared with third
  parties for those purposes.
- Deleting two features narrows the v1.0 feature list.

## Follow-Up

- Removal is code deletion, not merely hiding the entry points. Git history
  preserves the implementations if a later release revisits them.
- Health sync scope must be fixed before implementation begins: which
  quantities are read, which are written, and what happens when the user
  denies permission. Left open, this reproduces the ambiguity this decision
  exists to close.
- Remove the static `isAutoSynced` demo value at `AppContext.tsx:187` as part
  of the real integration.
- The privacy declaration and Privacy Policy in Phase 4 must cover HealthKit
  data alongside meal photographs.
- Widgets and Apple Watch surfaces remain static preview imagery and are out of
  scope for v1.0; they are unaffected by this decision.
