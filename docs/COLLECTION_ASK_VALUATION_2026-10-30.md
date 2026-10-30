# Catalog and collection: one asking-price reference — 30 October 2026

## Approved behavior

The catalog and a comparable owned copy display the same value under the same label, **Prezzi negli annunci**. The collection total uses:

- **La tua collezione, oggi**
- A dynamic computed total (EUR97.24 for the owner's three audited releases at rollout)
- **Valore basato sui prezzi negli annunci.**

The total sums catalog asking references for eligible Sealed copies; canonical Market Value and completed sales remain separate context. User-entered asking prices do not directly contribute to market evidence. Coverage/partial-total information remains visible when no catalog asking reference exists.

## One selector

`sealedCollectionReference` now directly calls the existing catalog selector `observedMarketReferencePrice`. This is the actual shared function, rather than two algorithms that usually give similar results. Current representative ASK, the catalog's selected current quote, and its dated historical fallback all use the same existing precedence. International and single-seller references remain usable, as in the catalog.

The separate Italy/EU-preferred collection median is removed. Compatibility projection fields are mirrors of the catalog selector via `withCatalogAskingReference`; collection calculations do not trust them as an independent price source. Public-cache expiry synchronizes those mirrors after changing the shared current/historical fields. Thus expiry, cached/offline refresh, and new snapshots cannot create different catalog and collection asking values.

The provider's existing freshness rules and dated-history limit remain authoritative. A dated reference keeps its date and geographic provenance; item-only ASK is not a landed Italian checkout price. The currently supported new/unbuilt evidence benchmark remains applicable to Sealed copies, without invented discounts for other physical conditions.

Catalog inline/Release detail, Collection cards/copy detail, and Dashboard use the plural label “Prezzi negli annunci”. Collection/Dashboard/Profile totals use the approved title; Collection displays the exact subtitle. Root cache key bumped for the new contract.

Explicit TS import extensions are enabled under the existing noEmit/bundler configuration so Node's strip-types tests and Next share the actual presentation module, without copying its logic into a second test-only implementation.

## Validation

TypeScript and full npm verify passed; final plural-label edits passed the surface contract and parity tests. Dedicated parity tests cover international medians, single quotes, current/historical fallback, deliberately divergent old compatibility fields, expiration and no SOLD fallback. Fourteen cache/provider/projection/analytics tests pass with the revised same-selector contract. Repository diff check clean.

No scanner runs, source prices, private collection rows, offers, migrations, scheduler limits or background cadence changed. Authenticated browser rendering is not claimed tested. Release is verified against the exact production SHA and the public projection of #95425, #95466 and #95467.

Rollback: 7dbab25fdbca8c7488ab87aeb11f474667f1e176. No database rollback needed.
