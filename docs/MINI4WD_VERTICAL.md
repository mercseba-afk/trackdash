# TrackDash — Mini 4WD Vertical

> Dedicated operational record for the Tamiya Mini 4WD vertical.
> Last updated: 2026-10-01.
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

## Progressive public catalog launch

Mini 4WD public launch is intentionally progressive.

- completed/audited family -> **available**
- legacy/unaudited family -> **coming_soon**
- intentionally deprioritized family -> **archived**

Coming-soon families remain discoverable in the chronological catalog, but do not expose legacy Release data as finished. Their cards show **In arrivo**, their detail routes show a verification message, and their detail URLs are excluded from the sitemap until promotion.

The notification center keeps a pinned **Catalogo in espansione** notice. When a family is later promoted from coming_soon to available, the database creates one normal user notification announcing that the family is ready.

Initial 2026-09-29 split:
- **20 available**
- **27 coming soon**
- **8 archived**

This launch strategy does not change the family-completion methodology. A family becomes available only after the existing audit/image/market/QA workflow is satisfied.

---

## Operational workflow

The authoritative workflow remains:

**AUDIT CATALOGO → IMMAGINI → STATUS/RARITÀ → INITIAL MARKET SCAN → RECOMPUTE → QA PRODUCTION → CRON ENROLLMENT → COMPLETION GATE**

Full rules live in:

- `docs/TRACKDASH_METHOD_MASTER.md`
- `docs/FAMILY_COMPLETION_MASTER.md`

Do not duplicate or fork those rules here.

---

## Current platform state — 2026-09-28

The latest authoritative global checkpoint is the opening **“LATEST AUTHORITATIVE CHECKPOINT — 2026-09-28 — RISING BIRD COMPLETE — MARKET THIN / SHARED-ITEM FAIL-CLOSED”** in docs/TRACKDASH_STATE.md.

Functional family close-out Production baseline:

**ab5011f48d0033e91cfb40a06832830d5f2f59b9**

At close-out:
- GitHub main pointed to that functional merge commit;
- Vercel Production for that commit was READY;
- live Supabase showed 8 canonical public Dash-3 Shooting Star Releases;
- the controlled eBay initial scan completed 6/6 unique-item jobs successfully;
- the 1989 Ondawara original had one exact Mandarake SOLD anchor at EUR 147.17 but no consolidated Market Value;
- recompute queue, scan locks, stale v4 and due Dash-3 eBay queue were clear;
- shared ITEM/JAN 18019 remained fail-closed between the 1989 original and 2007 reissue.

Future sessions must still verify current main, Vercel Production and live Supabase before a material Production change.

Current shared market UI cleanup remains **closed**. No further UI work remains on that block unless a new regression/evidence requires it.

---

## Current / recent reference families

### Rising Bird

Status:

**COMPLETE — MARKET THIN / SHARED-ITEM FAIL-CLOSED — TWO DOCUMENTED IMAGE GAPS**

Canonical family: **3 public Releases**

- 18017 — 1989 Original Japan / Type 3
- 18017 — 1989 USA MRC / Lightning Racers Special Pack
- 18017 — 2007 Reissue / Type 3

Durable state:
- all three share ITEM 18017 and remain fail-closed for unattended eBay attribution;
- the USA Lightning Racers package is physically distinct through packaging + booklet;
- 2007 Reissue JAN: 4950344996643;
- exact/high-confidence image coverage: **1/3**, with stable Suruga hero on the 2007 reissue;
- 1989 Japan and 1989 USA package heroes remain intentional placeholders;
- historical indicative 1989 Original SOLD: EUR 69.33 / JPY 12,000 / 2025-09-05;
- that sale is outside the current 365-day SOLD window, so it remains historical evidence rather than a current public SOLD anchor;
- recompute=0, locks=0, due eBay=0.

Do not reopen this family without new evidence or a real pipeline regression.

### Dash-3 Shooting Star

Status:

**COMPLETE — MARKET THIN / ACTIVE — ONE DOCUMENTED IMAGE GAP**

Canonical family:

**8 public Releases**

- 18019 — 1989 Original / Ondawara Type 3
- 18019 — 2007 Reissue / Type 3
- 18630 — 2008 MS
- 94820 — 2011 Blue Plated / Type 3
- 92338 — 2015 Dragontail Red / Super 1
- 92339 — 2015 Dragontail Blue / Super 1
- 92340 — 2015 Dragontail White / Super 1
- 92341 — 2015 Dragontail Black / Super 1

Durable state:
- Memorial Box Vol.1 2005 is a set occurrence, not a standalone Release;
- 1989 original and 2007 reissue share ITEM/JAN 18019 and remain fail-closed for unattended eBay attribution;
- the 1989 vintage identity is separated by Ondawara / first-edition packaging evidence;
- external-source exact images are explicitly allowed: Suruga CDN heroes were recovered for 94820 and all four Dragontail colors using the same stable management-ID pattern already used elsewhere in TrackDash;
- 94820 is an autonomous Blue Plated full kit;
- all four Dragontail colors are autonomous fixed ITEM identities;
- shared SK Japan code 4519869512006 is not treated as a unique color barcode;
- Silver Body is a Grade-Up Parts/body-set item and remains outside the collector Release family;
- exact/high-confidence image coverage is **7/8**;
- only intentional placeholder: 18019 Original 1989 Ondawara;
- 1989 Original SOLD anchor **EUR 147.17**, 1 sale / 1 source, no MV;
- 18630 minimum current effective ASK **EUR 25.71**;
- 92338 Red minimum current effective ASK **EUR 72.99**;
- 94820 / 92339 / 92340 / 92341 currently have no publishable exact European current ASK;
- eBay listing-level sold counters must not be converted into invented granular sales;
- final hard gate: A=0, B=0, stale v4=0, recompute=0, locks=0, due eBay=0.

Do not reopen the family merely because the single vintage Ondawara hero remains unavailable or because the market is thin.

### Dash-2 Burning Sun

Status:

**COMPLETE — MARKET THIN / ACTIVE — SIX DOCUMENTED IMAGE GAPS**

Canonical family:

**10 public Releases**

- 18015 — 1989 Original / Type 1
- 18026 — 1990 Type 3
- 18628 — 2008 MS
- 94675 — 2009 MS Finished Model
- 94819 — 2011 Green Plated
- 92343–92346 — 2016 Burning Sun Helios four fixed-color prize Releases / Super 1
- 92373 — 2017 Kirin Mets Cola Original / MS

Durable state:
- Memorial Box Vol.1 2005 is a set occurrence, not a standalone Release;
- 94819 is an autonomous Green Plated commercial kit, distinct from the plated Memorial Box occurrence;
- all four Helios colors are autonomous fixed ITEM identities;
- 92373 is an autonomous campaign boxed kit;
- exact/high-confidence image coverage is **4/10**;
- six placeholders are intentional after second-pass image research;
- 94675 Finished Model stays outside the automatic new_complete_unbuilt valuation lane;
- 18628 has canonical minimum effective ASK **EUR 24.64** from one exact Europe-comparable current offer;
- 18026 has exact market evidence but no public European ASK because the currently purchasable exact listing is EBAY_US / north_america and the older eBay.it state is availability unknown;
- all nine valuation-compatible eBay jobs completed successfully;
- stale v4=0, recompute=0, locks=0, due eBay=0.

Europe-first invariant illustrated by 18026:
- exact identity acceptance and public price publication are separate decisions;
- extra-EU marketplace shipping is not assumed to be delivered-to-Europe cost;
- do not reject valid exact evidence merely to force a raw accepted-evidence counter to zero.

Do not reopen this family merely because six hero images remain unavailable or because thin Releases have no numeric European signal.

### Dash-1 Emperor

Status:

**COMPLETE — ACTIVE / MIXED MARKET DEPTH — SEVEN DOCUMENTED IMAGE GAPS**

Canonical family:

**17 public Releases**

- 18012 — 1988 Original / Oshika Type 1
- 18025 — 1990 Original / Type 3
- 18012 — 2007 Reissue / Type 1
- 18625 — 2008 MS
- 94666 — 2008 Type 3 Special Kit
- 94670 — 2008 MS Finished Model
- 94704 — 2009 MS Black Special
- 94818 — 2011 Silver-Plated Body Specification
- 18069 — 2012 Premium / Super II
- 92267–92270 — 2014 Imperial Force four fixed-color prize Releases / VS
- 95296 — 2017 Black Special with 2023 production wave / MS
- 95110 — 2018 Memorial / 30 Years of the Japan Cup
- 95622 — 2021 Type 3 Special Kit Reissue
- 18025 — 2026 Type 3 Reissue

Durable state:
- Memorial Box Vol.1 2005 is a set occurrence, not a standalone Release;
- 95296 2017 + 2023 is one Release with a later production wave;
- 18012 1988 Oshika and the 2007 reissue are collector-distinct;
- shared ITEM 18012 and 18025 generations remain fail-closed for unattended eBay attribution;
- image coverage is **10/17**;
- intentional placeholders: 18012 Original 1988, 18025 Original 1990, 94670 Finished Model and all four Imperial Force colors;
- 1988 Oshika 18012 MV/SOLD anchor **EUR 179.41**;
- 18625 SOLD **EUR 13.75**, minimum current effective ASK **EUR 25.71**;
- 94704 minimum current effective ASK **EUR 12.31**;
- 18069 Premium MV/SOLD anchor **EUR 16.85**, minimum current effective ASK **EUR 24.00**;
- 95110 SOLD **EUR 15.53**, minimum current effective ASK **EUR 57.75**;
- 95622 minimum current effective ASK **EUR 55.20**;
- 2026 18025 retail-driven MV **EUR 8.43**;
- final market hard gate: A=0, B=0, stale v4=0, recompute=0, locks=0, due eBay=0.

Worker regression closed during this family:
- 95110 exposed a lifecycle bug when an already-assigned exact eBay candidate later became rejected/ended;
- PR #287 preserves the exact Release assignment while availability/lifecycle changes are handled in market_offer_states;
- targeted 95110 rerun succeeded after the fix.

Do not reopen the family merely because seven exact hero images remain unavailable or because some thin Releases have no numeric signal.

### Thunder Dragon Jr.

Status:

**COMPLETE — MARKET THIN / ACTIVE — TWO DOCUMENTED IMAGE GAPS**

Canonical family:

**6 public Releases**

- `18008` — 1987 Original / Oshika 5-digit
- `2908` — 1987 Oshika 4-digit KIT No.2908
- `18008` — 1998 Memorial Edition / Limited Reissue
- `18008` — 2012 Spot Reissue
- `18068` — Thunder Dragon Premium / VS
- `95336` — Clear Special / Polycarbonate Body

Durable state:
- `18008` Original 1987 and `2908` are collector-distinct packaging/numbering identities sharing historical JAN `4950344180080`;
- the old blanket “First Production” wording for 2908 was removed because evidence is packaging-specific rather than proof of universal earliest chronology;
- all three shared `18008` generations remain fail-closed for unattended eBay attribution;
- Lotte Racer Mini 4WD Chocolate is promotion context only, not an autonomous Release;
- Memorial Box Vol.2 (2005) is a five-car set occurrence, not a duplicate standalone Release;
- image coverage is **4/6**; only the two 1987 packaging identities intentionally retain placeholders;
- Memorial 1998 SOLD anchor **EUR 20.74**;
- Premium 18068 SOLD anchor **EUR 19.51**, minimum current effective ASK **EUR 87.94**;
- Clear Special 95336 SOLD anchor **EUR 7.04**, minimum current effective ASK **EUR 26.14**;
- no Release currently has sufficient evidence for a consolidated Market Value;
- final unique-item eBay run completed successfully for 2908, 18068 and 95336;
- market hard gate: A=0, B=0, stale v4=0, recompute=0, locks=0, due eBay=0.

Do not reopen this family merely because the two exact 1987 hero images remain unavailable or because thin Releases have no numeric public signal.

### Thunder Shot Jr.

Status:

**COMPLETE — MARKET THIN / NO CURRENT EXACT ASK**

Canonical researched family:

**16 identities — 15 public + 1 research-only**

Durable state:
- shared ITEM `18009` generations are fail-closed for unattended eBay attribution;
- two TKC Releases are distinct: `92078` (1992) and shared-item `18009` TKC Nuremberg (1999);
- Mazda Promotional Version remains `research_only` because sources conflict on ITEM `92006` vs `92008`;
- stored exact/high-confidence hero coverage after the 2026-09-27 recovery pass: **12/15 public Releases**;
- newly recovered heroes: 18009 Original 1988, 92078 TKC 1992, 92314 Legend Style Gold, 92315 Legend Style Silver;
- remaining intentional placeholders: Shonen Jump, 92254 Excalibur Red, 92255 Excalibur Clear Blue;
- public Production QA passed **15/15 Release pages**; all four newly recovered assets passed the TrackDash Next Image proxy before insertion;
- 10/10 unique-item initial eBay jobs completed successfully;
- no current exact eBay ASK was accepted;
- Black Special 18013 SOLD anchor **EUR 48.77**;
- Memorial 1998 SOLD anchor **EUR 23.65**;
- Thunder Shot RS 18059 SOLD anchor **EUR 41.79**;
- no Release currently has sufficient evidence for a consolidated Market Value;
- Thunder Shot recompute queue, due queue and locks are clear.

Do not reopen the family merely because current ASK coverage is empty or some exact hero images remain unavailable.

### Fire Dragon Jr.

Status:

**COMPLETE — MARKET THIN / ACTIVE**

Canonical family:

**9 public Releases**

- `18011` — 1988 Original
- `18011` — 1998 Memorial Edition / Limited Reissue
- `18011` — 2012 Reissue
- `18072` — Fire Dragon Premium
- `92290` — 21st Century Clear Red
- `92291` — 21st Century Pearl
- `92292` — 21st Century Black
- `92293` — 21st Century Clear Blue
- `95337` — Clear Special / Polycarbonate Body

Durable state:
- image coverage **8/9**; Memorial 1998 intentionally remains without a stored hero until a stable exact asset is recovered;
- the three `18011` generations remain fail-closed for unattended eBay attribution;
- final initial eBay scan completed **6/6 unique-item targets** without worker errors;
- Memorial 1998 SOLD anchor **EUR 16.00**;
- Premium 18072 SOLD anchor **EUR 19.04**, minimum current effective ASK **EUR 31.03**;
- Clear Special 95337 SOLD anchor **EUR 8.16**, minimum current effective ASK **EUR 24.10**;
- no Release currently has sufficient evidence for a consolidated Market Value;
- recompute queue and active locks are clear.

Do not reopen this family merely because some Releases remain market-thin.

### Avante Mk.III

Status:

**COMPLETE — CURRENT-METHOD REVALIDATED 2026-10-01 — MARKET MIXED / SIX DOCUMENTED IMAGE GAPS**

Canonical family:

**24 public Releases**

Durable state:
- genealogy remains the audited 24-Release family; no UUID rebuild;
- all 24 ITEM numbers are globally unique and all 24 unattended exact-item eBay jobs completed successfully;
- verified JANs added for 92207, 92219, 92221 and 92470;
- 95464 remains one Release with a later 2023-11-11 production/on-sale wave;
- exact/high-confidence image coverage is **18/24**;
- intentional image gaps: 92207, 92218, 92219, 92221, 92284, 92470;
- all 24 canonical signals are Market Method **v4** / algorithm **r3**;
- all 24 latest ASK snapshots use **v4-eu-delivered-2026-10**;
- old pre-EU-first ASK trends were cleared and no false stable/collector trend was created;
- 95087 Japan Cup 2015 is the only current consolidated MV in the family: **EUR 34.91**;
- notable current minimum delivered ASK: 18626 EUR 22.80, 18627 EUR 24.00, 95425 EUR 27.36, 95464 EUR 25.50, 18662 EUR 41.90, 92470 EUR 36.50;
- preserved SOLD anchors include 92207 EUR 36.27, 92218 EUR 37.62, 94741 EUR 22.22, 94951 EUR 13.56, 92422 EUR 13.49, 92428 EUR 13.22, 92430 EUR 28.33 and 18662 EUR 12.46;
- nine thin Releases correctly retain no numeric public signal after challenge rather than receiving invented values;
- 92219 + 92221 Mercari evidence is a multi-Release lot and must never be split into fake single-Release prices;
- 92284 SOLD-state evidence has no exposed completed date and therefore remains context only;
- final hard gate: current-offer/empty-signal mismatch=0, stale current-basis snapshots=0, recompute=0, due eBay=0, locks/errors=0, review blockers=0;
- public Production QA passed the family page and **24/24 Release pages** with HTTP 200.

Do not reopen this family merely because six exact hero images remain unavailable or because thin historical Releases have no numeric European signal.


### Manta Ray Mk.II

Status:

**COMPLETE — CURRENT-METHOD REVALIDATED 2026-10-01 — MARKET THIN**

Canonical family:

**10 public Releases**

Durable state:
- exact/high-confidence image coverage **9/10**; Silver Metallic Semi-Finished 2010 remains the one intentional image gap;
- 7 unique-ITEM eBay jobs completed successfully under current method;
- Pink Metallic 2007, Silver Metallic 2010 and Black Metallic 2012 remain fail-closed for unattended eBay because no autonomous ITEM/JAN is verified;
- no Release currently has a consolidated Market Value;
- current delivered ASK references are:
  - 18615 base **EUR 61.00**
  - 95462 White Special 2019 **EUR 46.36**
  - 95466 Black Special 2019 **EUR 33.90** minimum, SOLD anchor **EUR 16.13**
  - 95690 City Circuit **EUR 24.80** minimum;
- legacy pre-EU-first ASK trends, including the old 95690 **+89.03%**, are excluded from current-basis trend math;
- no Manta Release currently has a confirmed persistent collector trend;
- recompute queue, due eBay jobs, active locks, stale signals and revalidation blockers are clear;
- public family and all 10 Release routes return HTTP 200.

This family remains the practical reference for Europe-first ASK semantics, intentional image gaps, fail-closed no-ITEM event Releases and separation between collector trend and ASK movement.


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

---

## Catalog available / upcoming UX — 29/09/2026

For Mini 4WD progressive rollout, the public Catalog must not visually mix completed families with families still under verification.

Canonical behavior:
- default Catalog view = `available` only;
- dedicated **Release in arrivo / Upcoming releases** selector inside the filter area;
- upcoming cards remain visibly marked and open the existing coming-soon information dialog;
- no unreviewed Item Number, chassis, rarity or Release metadata is exposed;
- responsive behavior must remain consistent across website and installable PWA/app;
- every new UI label/copy must be maintained in Italian and English.

This is a presentation separation only: the underlying `coming_soon -> available` workflow, SEO protection and notification trigger remain unchanged.



## Proto Emperor ZX re-audit — 29/09/2026

Family closed under the current Master as **COMPLETE WITH DOCUMENTED IMAGE GAP**.

Canonical/public genealogy stays at 3 Releases:
- 18038 — 1992 Original / Zero
- 18038 — 2007 spot-production Reissue / Zero
- 95335 — 2017 Premium / Super-II

No fourth commercial Release was verified; the 1991 Autumn Cup advance sale is a pre-sale wave of the 1992 Release.

Current public market state:
- 1992 Original — SOLD anchor EUR 50.20 from 2 recent vintage-attributable completed sales; no MV.
- 2007 Reissue — exact current Japan spot-production ASK exists but remains item-only/contextual because European landed cost is unknown; no MV.
- 95335 Premium — Market Value / SOLD anchor EUR 22.78, confidence medium, 3 SOLD / 2 sources; current eBay starting effective cost EUR 73.20.

Image coverage is 2/3. Only the 1992 Original lacks a persisted exact hero; do not use the 2007 shared-ITEM image as fallback.

Shared ITEM 18038 eBay Active remains disabled/fail-closed. Exact RCJAZ endpoint exists only for 95335; current manual check reports Not Available. RCJAZ global adapter policy remains planned.
