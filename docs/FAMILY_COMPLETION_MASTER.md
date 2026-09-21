# TrackDash — Family Completion Master

This document is the persistent operational contract for catalog/family work.

## Single Source of Truth — mandatory

Catalog, Release pages, Collection, scanner and PWA/app MUST project the same canonical Release identity.

- Release identity, Item Number, JAN, year, chassis, rarity, status and exact images come from the canonical catalog/database.
- Public market data comes from the canonical market signal pipeline.
- Collection MUST NOT maintain a parallel image catalog, price engine or stale release identity.
- A cron/recompute update to a Release must propagate automatically to Catalog, Release page, Collection and PWA/app.
- Collection cards use the exact Release image; never silently fall back to a sibling/reissue image.
- The same public market semantics apply everywhere: Market Value when robust, otherwise Observed Price when credible, otherwise "Dati di mercato in verifica".
- Collection totals must count exactly what its cards expose. A copy with an Observed Price is a market-referenced copy even when it has no consolidated Market Value.
- Personal gain/loss can remain more conservative and use only a consolidated Market Value.
- When a legacy catalog identity is corrected, owned collection rows must be migrated to the correct Release without losing purchase price/date, condition, notes, personal photos or sharing state.

## Family workflow

AUDIT CATALOGO → IMMAGINI → STATUS/RARITÀ → INITIAL MARKET SCAN → RECOMPUTE → QA PRODUCTION → CRON ENROLLMENT → COMPLETION GATE.

Enrollment is never treated as scan execution.

## Release identity / production waves

Same Item + same JAN + same specification + no reliable physical discriminator = one collector Release, with later dates stored as production waves.

Different Item Numbers or a reliable physical discriminator = distinct collector Releases.

## Images

Exact Release image first. If no exact attributable asset is found after a real audit, store no sibling image and document the intentional placeholder.

## Market

Europe-first. Prefer effective delivered cost when shipping is known. Extra-EU item-only evidence with unknown European shipping is secondary. Do not invent VAT, duty or shipping.

Do not require an arbitrary SOLD count before exposing useful market information:
- robust convergence → Valore stimato
- credible current evidence → Prezzo osservato
- evidence under audit / no publishable reference yet → Dati di mercato in verifica

Never display SOLD 0 as a statement that no sales occurred.

## Refresh

Marketplace: HOT 72h / NORMAL 7d / COLD 14d.
Retail: HOT 7d / NORMAL 14d / COLD 30d.
SOLD research: HOT 14d / NORMAL 30d / COLD 60d.

Only due + READY jobs are automatically claimed. Failed jobs are not marked successful.

## Completion

A family is complete only after every Release has been audited through the workflow. Honest documented gaps are allowed (for example exact image not found or genuinely thin market); unperformed work is not.
<!-- verify-trigger -->
