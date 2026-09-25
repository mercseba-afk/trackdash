# TrackDash — Family Completion Master

> Mini 4WD vertical state / continuation index: `docs/MINI4WD_VERTICAL.md`
> Global runtime/project checkpoint: `docs/TRACKDASH_STATE.md`
> Release publication gate: `docs/RELEASE_PUBLICATION_GATE.md`

This document is the persistent operational contract for catalog/family work.

## Single Source of Truth — mandatory

Catalog, Release pages, Collection, scanner and PWA/app MUST project the same canonical Release identity.

- Release identity, Item Number, JAN, year, chassis, rarity, status and exact images come from the canonical catalog/database.
- Public market data comes from the canonical market signal pipeline.
- Collection MUST NOT maintain a parallel image catalog, price engine or stale release identity.
- A cron/recompute update to a Release must propagate automatically to Catalog, Release page, Collection and PWA/app.
- Collection cards use the exact Release image; never silently fall back to a sibling/reissue image.
- The same public market semantics apply everywhere: **Valore stimato** when robust; otherwise **Prezzo minimo richiesto** when a valid current ASK exists; otherwise "Dati di mercato in verifica".
- Collection totals must count exactly what its cards expose. A copy with a Prezzo minimo richiesto is a market-referenced copy even when it has no consolidated Market Value.
- Personal gain/loss can remain more conservative and use only a consolidated Market Value.
- When a legacy catalog identity is corrected, owned collection rows must be migrated to the correct Release without losing purchase price/date, condition, notes, personal photos or sharing state.

## Family workflow

AUDIT CATALOGO → IMMAGINI → STATUS/RARITÀ → INITIAL MARKET SCAN → RECOMPUTE → QA PRODUCTION → CRON ENROLLMENT → COMPLETION GATE.

Enrollment is never treated as scan execution.

## Release identity / production waves

Same Item + same JAN + same specification + no reliable physical discriminator = one collector Release, with later dates stored as production waves.

Different Item Numbers or a reliable physical discriminator = distinct collector Releases.

## Public Release Publication Gate

A researched/canonical Release is not automatically public.

Permanent rule: a sufficiently verified Release is public only when it has at least one of:
- an EXACT VERIFIED / HIGH-CONFIDENCE MATCHED Release image; or
- credible market evidence attributable to that exact Release.

A consolidated Market Value is not required. A photo-only verified Release may remain public while market research continues; a market-backed verified Release may remain public while the exact image is still missing.

If both exact/high-confidence image and credible market evidence are missing, keep the Release as `research_only` in the database/master and exclude it from public Catalog/Product/Release surfaces. Never use a sibling image or ambiguous listing merely to pass the gate.

See `docs/RELEASE_PUBLICATION_GATE.md` for the decision matrix and promotion rules.

## Legacy Family Audit

Families created before this Master are not blindly rebuilt from zero.

For each legacy family:
1. read the canonical DB/runtime state and all existing Release references;
2. reconstruct the real family genealogy against current evidence;
3. preserve every stable Release UUID that already represents the correct physical Release;
4. when a legacy identity is wrong, migrate only the affected Collection/Wishlist/market references to the verified canonical Release without losing user data;
5. keep correct existing images, sources and market evidence; replace only incorrect or non-exact data;
6. run the missing Master phases: image audit, status/rarity, Initial Market Scan where absent/stale, recompute, Production QA and cron enrollment;
7. verify Catalog, Release pages, Collection, scanner and PWA all resolve the same canonical Release after the correction.

A legacy audit is complete only when the current family satisfies the same Completion Gate as a newly inserted family.

## Images

Image policy is Release-specific and applies globally to **all families and all future Releases**.

Priority:

1. official Tamiya / archive;
2. reliable exact-product retailer;
3. trustworthy contemporary source;
4. high-confidence marketplace/listing match;
5. placeholder only after a genuine second-pass search.

A marketplace/retailer image is acceptable even when it is not official if the Release match is strong and there is no concrete mismatch. Use Item Number, JAN, edition name, color, chassis/configuration and packaging as discriminants.

Image confidence classes:

- **EXACT VERIFIED** — official or reliably attributable exact-product asset;
- **HIGH-CONFIDENCE MATCHED** — marketplace/retailer/listing image strongly attributable to the exact Release;
- **PLACEHOLDER** — identity remains materially uncertain after audit.

Never silently inherit a Product image, sibling Release image or base/reissue image for a specific variant.

Before accepting a placeholder, run a targeted second pass across relevant exact-product retailers and marketplaces such as eBay, Mercari, Yahoo Auctions, Suruga and Mandarake.

Permanent decision rule:

**high-confidence correct image > placeholder > probably wrong image.**

A missing official asset alone is NOT sufficient reason to leave a placeholder if a defensible high-confidence exact-Release image exists elsewhere.

Collection, Release pages, Catalog and PWA/app must all project the same selected Release image from the canonical catalog.

## Market

Europe-first. Prefer effective delivered cost when shipping is known. Extra-EU item-only evidence with unknown European shipping is secondary. Do not invent VAT, duty or shipping.

Do not require an arbitrary SOLD count before exposing useful market information:
- robust convergence → Valore stimato
- valid current ASK → Prezzo minimo richiesto
- evidence under audit / no publishable reference yet → Dati di mercato in verifica

Never display SOLD 0 as a statement that no sales occurred.

## Refresh

Marketplace: HOT 72h / NORMAL 7d / COLD 14d.
Retail: HOT 7d / NORMAL 14d / COLD 30d.
SOLD research: HOT 14d / NORMAL 30d / COLD 60d.

Only due + READY jobs are automatically claimed. Failed jobs are not marked successful.

## Completion

A family is complete only after every Release has been audited through the workflow. Honest documented gaps are allowed (for example exact image not found or genuinely thin market); unperformed work is not.


## Public ASK terminology — 2026-09-23 invariant

The public ASK label is always **Prezzo minimo richiesto** / **Lowest asking price**.

It means the minimum valid current asking cost among observed listings, using effective delivered cost when shipping is known. It is not a completed sale and must never be presented as Market Value.

ASK evidence counts use **N annunci osservati** / **N observed listings**. ASK-derived trend, when the trend guard passes, uses **Trend prezzi richiesti** / **Asking price trend**.

Do not vary the main label according to whether one or multiple listings are present. Do not reintroduce "Prezzo osservato", "Richiesta venditore osservata" or "Richiesta più bassa osservata" as public labels.
