# 0004 Barcode Lookup Via Open Food Facts

Date: 2026-08-19

## Status

Accepted

## Context

Barcode scanning presented a working interface over no implementation, in the
same way as the features covered by [decision 0002](0002-shell-feature-disposition.md):

- `src/services/aiFoodEngine.ts:257-261` — `scanBarcode(code)` accepted a barcode
  and ignored it, always returning the first entry of a six-item hardcoded table.
- `App.tsx` — passed the literal `'8934563128901'` regardless of what the camera
  actually read, so the scanned value never reached the lookup at all.

It was not among the three features decision 0002 disposed of, so its treatment
was left open. The owner has chosen to implement it rather than remove it.

Implementing requires a product database. The app has no such data: the `foods`
table stores items belonging to a meal log, not a catalogue.

## Decision

Look up scanned barcodes against **Open Food Facts**, through our own backend
rather than directly from the app.

A new endpoint `GET /api/food/barcode/{barcode}` performs the lookup, normalises
the response, and passes it through the existing `NutritionValidator` before
returning it.

The endpoint is available to all authenticated accounts. It is not behind
`check.premium`: unlike AI scanning it costs nothing per call, and gating a free
lookup would only make the paywall feel arbitrary.

## Alternatives Considered

1. **Remove barcode scanning**, as was done for voice logging and recipe import.
   Rejected by the owner.
2. **Call Open Food Facts directly from the app.** Fewer moving parts, but
   crowd-sourced nutrition data reaches the user unvalidated, and the repository
   describes a server-centric architecture that this would work against.
3. **A commercial database** with better Vietnamese coverage. Rejected for v1.0:
   it means a contract, a key to manage, and per-call cost, for a feature whose
   usage is unknown.
4. **Open Food Facts through our backend.** Selected.

## Consequences

Positive:

- The scanned code now determines the result.
- Crowd-sourced values pass through `NutritionValidator`, which already corrects
  negative numbers, absurd magnitudes, and calorie figures inconsistent with
  their macros. Open Food Facts is community-edited and does contain such
  entries.
- No API key, no contract, no per-call cost. Open Food Facts is open data.
- A different data source can be substituted later behind the same endpoint.

Tradeoffs:

- **Vietnamese coverage is thin.** Many local products will not be found. The
  interface must treat "not found" as an ordinary outcome and offer manual entry,
  not present it as an error.
- Availability now depends on a third party we do not control. A failed lookup
  must say so rather than fall back to invented data — the defect this decision
  exists to correct.
- Open Food Facts asks callers to identify themselves with a descriptive
  User-Agent, which the backend must send.
- Nutrition is published per 100g; portion sizing stays the user's to adjust.

## Follow-Up

- Results are not cached. Volume is unknown and Open Food Facts is a free public
  service, so a cache table would be speculative for now. Marked `ponytail:` at
  the call site with its upgrade path.
- The privacy declaration in Phase 4 must record that a scanned barcode is sent
  to a third party. No user or device identifier accompanies it.
- If Vietnamese coverage proves too thin in practice, revisit alternative 3.
