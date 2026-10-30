# Collection asking-price references — 30 October 2026

## Final policy

The owner rejected the first implementation's two-EU-seller threshold because it hid useful data. Collection values retain one consistent ASK basis with flexible coverage:

1. Current quotes (within 15 days): Italian first, then EU, then international.
2. If no current quote exists, use previously observed asking evidence up to 180 days and display its observation date, using the same geographic preference.
3. One identified seller provides an individual quote; multiple independent sellers provide a median. One seller gets one vote (its lowest exact-kit quote), with normalized listing deduplication.

The current data layer supplies only last-observed in-stock/low-stock offers. Out-of-stock retail and explicit unavailable states remain excluded. A dated quote is evidence of a previously observed price, not a claim of present stock.

Only accepted exact-edition, complete new/unbuilt candidates qualify for the currently supported Sealed-copy benchmark. Internal/TrackDash sources and user-entered own prices are excluded. Other physical conditions remain unvalued without an appropriate benchmark; no condition multipliers are invented.

International item-only prices are usable indicative references, with provenance and kit-only scope visible. They are not Italian checkout prices and no shipping/import estimate is fabricated. Existing Italian/EU quotes take precedence over cheaper overseas quotes.

Canonical Market Value, SOLD and the separate international informational ASK remain unchanged. SOLD/MV never fill gaps in this collection total. Collection, Dashboard, Profile, copy detail and rankings use the same asking reference. Missing records are not treated as zero; partial coverage is disclosed.

## Implementation and lifecycle

Public projection exposes safe price/count/date/origin/historical/valid-until fields, never private seller or collection identities. Current and dated asking references have independent validity from active shopping offers. On current-offer expiry the collection reference becomes dated; after its bounded historical deadline it is removed. Returning to the app triggers the existing shared refresh; no new scan, database writes, migrations or polling cadence changes.

Cache key bumped to prevent the strict-policy snapshot from surviving the release. Shared collection captions identify “1 quotazione” versus a seller median, region, and historical observation date. Purchase comparisons retain the same ASK basis and “Differenza indicativa” label.

## Validation

Full npm verify and TypeScript passed. Dedicated tests cover international and single quotes, seller deduplication, Italy/EU preference, current-over-historical precedence, source/identity/date guards, preservation as dated evidence, 180-day expiry and no SOLD mixing. Fourteen cache/provider/analytics/projection regressions pass; public and cross-surface contracts pass. No user collections, real offers or original evidence rows were modified.

Owner-session browser rendering has not been tested in this environment. Verify the deployed build SHA and public projection of #95425, #95466, #95467 after release. Those records have international asking data and should no longer be suppressed solely by region or single-seller sample size.

Rollback code: 5a099fcb73ef388cc16c2024c8866535adac9d9c restores the stricter policy; no data rollback is needed.
