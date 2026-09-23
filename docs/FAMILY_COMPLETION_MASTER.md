# TrackDash — Family Completion Master

> Mini 4WD vertical state / continuation index: `docs/MINI4WD_VERTICAL.md`
> Global runtime/project checkpoint: `docs/TRACKDASH_STATE.md`

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

Exact Release image first. If no exact attributable asset is found after a real audit, store no sibling image and document the intentional placeholder.

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
