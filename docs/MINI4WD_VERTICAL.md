# TrackDash — Mini 4WD Vertical

> Dedicated operational record for the Tamiya Mini 4WD vertical.
> Last updated: 2026-09-23.
> This file records the current state, durable Mini 4WD-specific decisions, reference families and exact continuation rules.
> It is an index/state document, not a replacement for the operational Masters.
> `docs/TRACKDASH_STATE.md` remains the cross-project authoritative checkpoint.

---

## Document hierarchy

For Mini 4WD work, read and apply these documents together:

1. `docs/TRACKDASH_STATE.md` — global project/runtime checkpoint.
2. `docs/MINI4WD_VERTICAL.md` — current Mini 4WD vertical state and continuation index.
3. `docs/TRACKDASH_METHOD_MASTER.md` — authoritative operational method for Mini 4WD family/catalog/market work.
4. `docs/FAMILY_COMPLETION_MASTER.md` — persistent family completion contract and Single Source of Truth invariants.
5. `docs/TRACKDASH_OPERATIONS.md` — Admin refresh, cron, recompute and operational behavior.

If an older family implementation detail conflicts with a newer Master rule, **the current Master wins**.

Do not reconstruct Mini 4WD state from chat memory when these repository documents exist.

---

## Vertical identity

- vertical slug: `mini4wd`
- primary brand: **Tamiya**
- canonical collectible identity: **exact commercial Release**
- parent grouping: Product / model family
- important identifiers:
  - Tamiya Item Number;
  - JAN / barcode when verified;
  - release year/date;
  - chassis;
  - edition/release type;
  - color/physical discriminator;
  - production wave where applicable.

TrackDash does **not** value a generic model when a more exact Release identity is available.

---

## Non-negotiable invariants

1. **Exact Release first.**
   Collection, Wishlist, Scanner and Market evidence must resolve to the correct Release whenever possible.

2. **Single Source of Truth.**
   Catalog, Release pages, Collection, Dashboard, Market, Wishlist, Scanner result, site and PWA project the same canonical DB Release identity.

3. **UNKNOWN > INVENTED.**
   Never invent Item Number, JAN, year, image, SOLD, price, production status, rarity or a distinction between reissues.

4. **Production waves are not automatically new Releases.**
   Same Item + same JAN + same specification + no reliable physical discriminator = one Release with production-wave/restock history.

5. **Exact images only.**
   A specific Release must not silently inherit a sibling/reissue image. Intentional placeholder is preferred to a wrong image.

6. **Europe-first market semantics.**
   Prefer effective delivered European cost when known. Extra-EU item-only/local shipping evidence is context, not automatically European landed cost.

7. **Public pricing terminology is frozen.**
   - robust consolidated value → **Valore stimato**
   - valid current minimum ASK → **Prezzo minimo richiesto**
   - valid ASK trend → **Trend prezzi richiesti**
   - evidence counts → **N annunci osservati / N vendite osservate**
   - no publishable current reference → **Dati di mercato in verifica**

8. **Collection must remain synchronized automatically.**
   A catalog image, identity correction, recompute or market update must propagate to Collection/PWA without a parallel stale catalog or price engine.

---

## Operational workflow

The authoritative workflow remains:

**AUDIT CATALOGO → IMMAGINI → STATUS/RARITÀ → INITIAL MARKET SCAN → RECOMPUTE → QA PRODUCTION → CRON ENROLLMENT → COMPLETION GATE**

Full rules live in:

- `docs/TRACKDASH_METHOD_MASTER.md`
- `docs/FAMILY_COMPLETION_MASTER.md`

Do not duplicate or fork those rules here.

---

## Current platform state — 2026-09-23

The latest authoritative global checkpoint is the opening **“LATEST AUTHORITATIVE CHECKPOINT — 2026-09-23”** in `docs/TRACKDASH_STATE.md`.

Final functional Production baseline recorded there before the documentation-only checkpoint:

`203434b969f7a7f46fa26a636dcf9cdcf6a01234`

Documentation-only `main` after PR #210:

`0e091747ad6a4944ba16aa0c5bfecda8c0f90168`

Important distinction:

- `203434b…` = functional Production checkpoint;
- `0e091747…` = subsequent documentation-only main checkpoint.

Future sessions must still verify current `main`, Vercel Production and `/api/version` before a material Production change.

Current shared market UI cleanup is considered **closed**. No further UI work remains on that block unless a new regression/evidence requires it.

---

## Current / recent reference families

### Avante Mk.III

Status:

**COMPLETE — MARKET THIN (post-completeness audit)**

Canonical family:

**24 Releases**

Key identity rules already closed:

- `94692` = Red Special 2009;
- `95425` = distinct Red Special 2018 re-release;
- `94772` = Competition Pack 2010;
- `92470` = Korea Mini 4WD Cup 2026;
- `95464` = one Release with later production wave, not a duplicate Release.

Do not reopen this family without new evidence, a real identity correction or a pipeline regression.

### Manta Ray Mk.II

Role:

**practical reference family for the current workflow**

It established reusable patterns for:

- Europe-first refresh policy;
- adaptive scan cadence;
- exact retail endpoints;
- indicative Yahoo closed-sale evidence;
- intentional image-gap documentation;
- Initial Scan vs automatic refresh separation.

When a newer Master conflicts with an older Manta implementation detail, the newer Master wins.

### Dyna-Hawk GX

Canonical family:

**4 Releases**

- `19201` — 1998 — Super X
- `94717` — 2010 — Super XX Special
- `95000` — 2013 — Black Special
- `95467` — 2019 Reissue — Super XX Special

Important durable rule from this family:

extra-EU local shipping must not be treated as delivered-to-Europe cost. RCJAZ and similar exact retail evidence may prove market breadth/history without automatically defining European Market Value.

### DASH-X1 Proto-Emperor

Canonical family:

**4 Releases**

- `94708` — VS, 2009
- `18074` — Premium, 2013
- `95450` — Premium Black Special, 2019
- shared-item `18074` — Sanfrecce Hiroshima Special Edition, 2023

Shared Item `18074` remains **fail-closed** for automatic Release inference.

Final durable market example:

- standard `18074`: robust SOLD-based Market Value supported by multi-seller evidence;
- `95450`: no consolidated MV under seller-concentration rules; canonical current **Prezzo minimo richiesto** uses the cheapest valid effective current cost rather than the typical/average ASK anchor.

That public-surface correction is global and applies to every Mini 4WD Release.

---

## Scanner state

The Scanner remains an exact identity tool, not a fuzzy valuation shortcut.

Durable rules:

- use Item/JAN identity index;
- reused/shared identifiers must not arbitrarily choose a Release;
- ambiguous cases fail closed / require disambiguation;
- after local identity matching, hydrate the matched Release from the canonical DB before display/actions;
- a Release missing from the canonical DB must not continue as a stale local scanner result.

Known reused/shared-identity cases such as `18038` and shared `18074` are important regression examples.

---

## Market Engine state

The Mini 4WD Price Engine currently separates:

- current ASK evidence;
- completed-sale/SOLD evidence;
- retail observations;
- market signals;
- consolidated Market Value;
- canonical minimum current effective cost;
- ASK trend;
- recompute / refresh scheduling.

Durable publication rule:

**do not require an arbitrary SOLD count to show useful information.**

- robust convergence → **Valore stimato**
- valid current ASK → **Prezzo minimo richiesto**
- insufficient/currently unaudited evidence → **Dati di mercato in verifica**

At the same time, a thin or seller-concentrated SOLD cluster must not be promoted into a fake consolidated Market Value.

---

## Source state

### eBay
- Production Browse integration is available for active ASK.
- Exact matching / deduplication / market publication guard rails remain required.
- eBay SOLD access is not treated as a simple generally available public API dependency.

### RCJAZ
- Exact historical/current retail endpoints are useful Mini 4WD evidence.
- Source-level integration exists in the project.
- Extra-EU shipping semantics remain Europe-first: unknown landed cost must stay unknown.

### Yahoo / Mercari / Japanese sources
Useful especially for historical/thin families, but:
- exact Release identity first;
- do not invent sale dates;
- unresolved lots must not be split into fake per-Release prices;
- unsupported/uncertain FX or condition remains review/context where appropriate.

---

## Images

Current permanent rule:

- exact Release image preferred;
- official Tamiya / official archive/catalog / reliable exact-product sources are prioritized;
- intentional placeholders are valid when an exact attributable image cannot be found;
- never silently use a generic Product or sibling Release image.

Catalog image changes must propagate automatically to Collection and PWA through the canonical Release projection.

---

## Interaction with the new Hot Wheels vertical

Mini 4WD remains a first-class TrackDash vertical.

The Hot Wheels integration must **not**:
- rename or reinterpret Mini 4WD fields in a way that breaks current behavior;
- replace Mini 4WD catalog identities;
- introduce a parallel Collection or Market Engine;
- mix Hot Wheels products into the Mini 4WD catalog context;
- weaken existing Mini 4WD scanner ambiguity safeguards;
- change current public market terminology without an explicit cross-platform decision.

Shared infrastructure should be generalized only where it preserves current Mini 4WD behavior.

Hot Wheels-specific work is tracked separately in:

`docs/HOTWHEELS_VERTICAL.md`

---

## Maintenance rule

Update this file in the **same work unit** whenever a material Mini 4WD-specific fact changes, including:

- current family/family status;
- canonical family Release count or identity;
- important source/adapter state;
- scanner identity behavior;
- Mini 4WD-specific market methodology or source behavior;
- reference family;
- blocker;
- exact next Mini 4WD action.

Do not duplicate every migration/commit log from `TRACKDASH_STATE.md`; record only the durable Mini 4WD vertical state and link back to the global checkpoint for runtime/deployment chronology.

---

## Exact next Mini 4WD action

There is **no pending Mini 4WD UI cleanup** from the 2026-09-23 market-label block.

The next Mini 4WD family / Product Research / SOLD task is independent from the Hot Wheels architecture work.

Until a new Mini 4WD task is explicitly started:

- preserve current Production behavior;
- do not reopen completed families without evidence;
- keep `TRACKDASH_METHOD_MASTER.md` and `FAMILY_COMPLETION_MASTER.md` authoritative;
- any shared multi-vertical refactor must prove Mini 4WD parity before merge/Production.


---

## Multi-vertical production parity checkpoint — 2026-09-23

The first shared Hot Wheels/multi-vertical foundation is now merged and verified in Production at:

`7622532749372909c6589b50be447114d9260db5`

Mini 4WD parity checks after deployment:

- public Catalog still returns **55 Mini 4WD products**;
- no Hot Wheels Product/Release is mixed into the Mini 4WD catalog;
- Collection and Scanner protected routes still resolve through the existing Auth flow;
- no immediate Vercel runtime error was observed;
- no Mini 4WD Release/catalog/market row was migrated into the new Hot Wheels tables.

**Mini 4WD family work may resume in parallel from this checkpoint.**

Parallel work is safe when it stays vertical-specific. Coordinate before modifying shared Collection, Wishlist, Scanner, Market Engine, navigation/onboarding or shared schema.
