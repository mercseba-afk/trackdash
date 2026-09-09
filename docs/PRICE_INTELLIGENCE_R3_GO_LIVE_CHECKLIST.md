# Price Intelligence R3 — go-live checklist

- [x] R2 relaxed evidence storage live (0037/0038).
- [x] R3 additive market-regime storage migration 0039 rollback-tested.
- [x] R3 migration 0039 applied to production.
- [x] Product Research source registered as manual external market source.
- [x] Pilot Product Research aggregates imported with reused item numbers quarantined as item pools.
- [x] R3 regression tests cover 18069 anomaly, 94717 thin market, out-of-stock retail, shipping-aware starting cost, source overlap, trends, and adaptive scheduler.
- [x] Preview build passes all market tests and 19/19 Next.js routes.
- [x] Legacy demo values are suppressed from public MarketEstimateCard surfaces.
- [ ] Current retail/active marketplace pilot observations imported.
- [ ] R3 signals computed from current + sold evidence for pilot releases.
- [ ] Scanner providers activated; queue remains disabled until provider access/compliance is verified.

The unchecked items are data/provider activation work, not blockers for shipping the additive R3 architecture. Until a real current R3 signal exists, the public UI must show an empty/data-coming state rather than a synthetic valuation.
