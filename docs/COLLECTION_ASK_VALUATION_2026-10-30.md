# Collection asking-price valuation — 30 October 2026

## Decision and scope

The owner approved a single consistent basis for collection totals: current external asking prices. Completed-sale evidence and canonical Market Value remain separate Release market context and never fill gaps in this total. This replaces the previous MV → SOLD → individual ASK fallback chain.

- At least two independently identified sellers for an exact, complete, new/unbuilt Release.
- Prefer a sample of at least two Italian sellers; otherwise use the full verified EU sample.
- One vote per seller, taking that seller's lowest comparable quote; normalized listing identifiers remove duplicate eBay records.
- Asking observations no older than 15 days, future/malformed timestamps excluded. Current stock and accepted exact-edition/condition checks remain upstream.
- For now only EU-origin evidence qualifies. Unknown origin and extra-EU quotes cannot establish import-comparable cost with the stored fields. Basic item-plus-shipping metadata is not a complete import quote.
- Explicitly exclude TrackDash/internal sources. User-entered collection prices cannot affect valuation.
- Kit-only median, shipping excluded. No SOLD/MV, historical ASK or single-seller fallback.
- Owned physical copies must be Sealed to use the currently available new/unbuilt benchmark. Other conditions remain awaiting valuation; no invented condition multipliers.

## Implementation

Server projection adds three safe fields: collectionAskItemEUR, collectionAskSellerCount, collectionAskObservedAt. Private candidate/seller identities remain server-only. The existing international informational ASK median and canonical SOLD/MV are unchanged. No database migrations, writes, scanner runs, scheduler changes, limits or extra upstream calls.

Collection, Dashboard, Profile, copy detail, rankings and breakdowns consume the same collection reference. Missing references show “Da valutare”; covered/total counts accompany totals and partial totals are explicitly identified. Recent collection cards do not fall back to international display quotes. Purchase-price comparisons use this same ASK reference and are labeled “Differenza indicativa”. Completed sales stay separate in the Collection card and Release market details.

Server cache key is bumped to prevent a pre-change map from being served after release. Current-offer deadlines remove collection medians on expiry; the next shared refresh recomputes from surviving offers. The client also rejects missing/expired projection fields. No fallback to an old SOLD-based valuation during outages.

## Current evidence and limitation

Read-only production audit: 11 public Mini 4WD releases have at least two distinct eligible EU sellers, and 5 have only one, before normalized-listing deduplication. This is evidence coverage, not a newly scanned market.

The owner's currently held #95425, #95466 and #95467 have only non-EU current quotes in the stored sample. Under the agreed import safeguards all three remain awaiting valuation. The previous EUR31.05 total (Manta 16.13 plus Dyna 14.92, Avante absent) is not retained as an asking-price collection total. Acquiring independently verified Italian/EU quotes is needed to cover them; no replacement prices are fabricated.

## Validation

Full npm verify passed; TypeScript passed. Updated pure collection policy tests cover independent sellers, listing duplicates, Italy preference, extreme prices, internal and unknown/extra-EU origins, invalid/future/stale dates, no SOLD/MV fallback and expiry. Fourteen cache/projection/provider/analytics tests pass, including real server projection retaining the separate international ASK, independent collection median and cross-surface updates. Public surface and cross-surface contract checks pass after the final UI adjustment.

No live user offers or private collection rows were modified. Authenticated browser validation has not been completed; checks use actual source with deterministic boundary mocks plus read-only production evidence. Production release must be verified against its exact build SHA.

Rollback: deploy the prior code commit 26696257824d6e1199784351ba273a14d4a77df1. No data rollback needed.
