# Decisions

Decision records preserve lasting product, architecture, data ownership,
security, compatibility, and validation choices that future work must inherit.

Use `docs/templates/decision.md`. Task-local implementation choices remain in
the active execution plan and do not require a separate decision.

An installed consumer begins with no fabricated decisions. Add local decision
documents here as real choices are accepted, then index them in this file.

## Index

- [0001 StoreKit 2 Integrated Directly](0001-storekit-2-direct-integration.md)
  — Accepted 2026-08-19. Complete JWS verification in our own backend rather
  than delegating subscriptions to a managed service.
- [0002 Disposition Of Non-Functional Features](0002-shell-feature-disposition.md)
  — Accepted 2026-08-19. Delete voice logging and recipe import; implement
  Health sync against HealthKit. Removes Expo Go from the workflow.
- [0003 iPad Support Retained For v1.0](0003-ipad-support-retained.md)
  — Accepted 2026-08-19. Keep `supportsTablet: true` and build a real iPad
  layout rather than shipping a stretched phone interface.
- [0004 Barcode Lookup Via Open Food Facts](0004-barcode-lookup-via-open-food-facts.md)
  — Accepted 2026-08-19. Implement barcode scanning against Open Food Facts
  through our own backend, rather than removing the feature.
