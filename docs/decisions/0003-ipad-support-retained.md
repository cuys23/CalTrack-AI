# 0003 iPad Support Retained For v1.0

Date: 2026-08-19

## Status

Accepted

## Context

`app.json` declares `ios.supportsTablet: true`. Every screen in `src/screens/`
is laid out for phone dimensions; no iPad-specific layout, breakpoint, or
split-view handling exists.

Declaring tablet support obliges us to submit iPad screenshots at 2064x2752
and exposes the app to rejection or poor reviews if the phone layout merely
stretches on a larger display.

## Decision

Retain iPad support in v1.0. Produce a genuine iPad layout and the
corresponding screenshot set rather than shipping a stretched phone interface.

## Alternatives Considered

1. **Set `supportsTablet: false` for v1.0** and revisit once phone usage is
   established. This removes the screenshot obligation and the layout risk.
2. **Retain iPad support.** Selected.

## Consequences

Positive:

- The app is available to iPad users at launch.
- Nutrition logging and progress review benefit from a larger display,
  particularly the dashboard and weekly report screens.

Tradeoffs:

- Layout work is added to Phase 3 that no prior estimate accounted for.
- An additional screenshot set is required in Phase 5.
- Every screen must be checked at tablet width, including the camera scan flow
  and the paywall, where a stretched layout is most visible.
- Reviewers assess iPad presentation directly; a stretched interface invites
  rejection under Guideline 4.2.

## Follow-Up

- Verify layout on iPad across all screens, not only the dashboard. The camera
  scan and paywall screens carry the highest risk.
- Confirm that camera capture and image picking behave correctly at tablet
  aspect ratios.
- Capture the 2064x2752 screenshot set in Phase 5.
- Estimate and record the iPad layout effort in the execution plan once the
  screens have been surveyed at tablet width. The current plan does not carry a
  figure for it.
