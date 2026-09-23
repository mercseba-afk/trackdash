# TRACKDASH — PROJECT STATE

> Persistent operational snapshot.  
> **Last updated:** 2026-09-23  
> This file is the cross-chat continuity source for the current TrackDash state.  
> Before changing production data/code, re-verify GitHub `main`, Vercel Production and live Supabase where the value can have changed since this snapshot.

---

## LATEST AUTHORITATIVE CHECKPOINT — 2026-09-23 — HOT WHEELS EBAY ASK PRODUCTION AUDIT CHECKPOINT

**This checkpoint supersedes older Hot Wheels continuation instructions while preserving every frozen Mini 4WD market rule below.**

### Runtime / Production state

- GitHub `main`: **`19097c9c66e07a7b774e40bbb1284185521f421c`**
- Vercel Production: **`dpl_EMHbukor1R4hnzzXPaWbtwBeQHQG`**, READY
- `/api/version`: **`19097c9c66e07a7b774e40bbb1284185521f421c`**
- merged PR: **#212**
- Hot Wheels feature code is now in Production while the public Hot Wheels gate remains closed
- Hot Wheels public Production gate: **closed**
- automatic Hot Wheels Preview deploys: **disabled**

### Hot Wheels catalog state retained

Permanent pilot hierarchy remains:

**Product = Casting → ProductRelease = meaningful commercial Release → Subvariant = minor physical/package difference**

Live catalog:

- Mini 4WD Products: **55**, unchanged
- Hot Wheels Products/Castings: **5**
- Hot Wheels Releases currently in audit population: **13**
- LB-ER34 family: **9 Releases**
- all Hot Wheels UI work remains IT/EN

### Hot Wheels eBay ASK matcher — audit-ready

Dedicated matcher:

`lib/market/automation/hotwheels-ebay-matcher.ts`

Read-only audit:

`lib/market/automation/hotwheels-ebay-audit.ts`

Protected Admin UI:

- `lib/actions/hotwheels-admin.ts`
- `components/admin/hotwheels-market-audit.tsx`

Existing Mini 4WD eBay classifier/worker behavior remains unchanged.

Canonical Hot Wheels market condition for this pilot:

**NEW + unopened + original commercial packaging/card**

Loose, opened, damaged-package, custom/accessory-only and ordinary lot evidence is excluded from automatic canonical ASK matching.

Regional/Factory Set/short-card/long-card packaging remains review-only as a potential Subvariant.

### Two-stage exact identity strategy

1. Browse search + title classification.
2. Only a review caused by missing identifier may receive a bounded eBay `getItem` lookup.
3. MPN / GTIN / localized aspects can confirm the exact Mattel code.
4. Longer structured identifiers such as `JBC35-N521` can confirm `JBC35`.
5. sibling code → reject.
6. package/subvariant or other independent review reason cannot be overridden by structured identifier data.

This preserves high precision without discarding valid listings whose seller omitted the Mattel code from the title.

### Validation

Latest matcher/audit reconciliation:

- `typecheck`: **SUCCESS**
- `verify`: **SUCCESS**
- PR #212: **MERGED**
- Hot Wheels market candidates: **0**
- Hot Wheels market offer states: **0**
- Hot Wheels market signals: **0**

No Hot Wheels ASK has yet been persisted into the shared Price Engine.

### Environment decision

A temporary Preview audit proved that Preview does not contain Production eBay credentials:

`EBAY_BROWSE_CREDENTIALS_NOT_CONFIGURED`

Do not duplicate Production eBay secrets into Preview solely for this pilot.

The first real API audit can now run through the existing protected Production Admin + MFA path. Production eBay credentials are available there; Preview remains intentionally uncredentialed.

### HOT WHEELS AUDIT OBSERVABILITY — 2026-09-23

The first real HCJ81 Admin audit reached Production successfully, but its read-only result was intentionally not persisted.

A Hot Wheels-only observability patch is now in progress on branch:

`feat/hotwheels-audit-observability`

It adds one structured runtime summary per completed protected Admin audit:

`[hotwheels-ebay-audit]`

The log contains only public listing diagnostics and aggregate matching outcomes. It logs no auth/session data or secrets and introduces **no Market Engine writes**.

Mini 4WD code/data behavior remains unchanged.

### Exact next action

1. keep Hot Wheels public gate closed;
2. run **HCJ81** first in Admin → Hot Wheels eBay ASK audit, exact-code query only;
3. inspect accepted/review/rejected results and second-pass MPN recovery;
4. verify packaging/Subvariant cases remain review-only;
5. enable context-query recall only after HCJ81 exact-query precision is satisfactory;
6. continue across the remaining 12 pilot Releases one at a time;
7. keep Hot Wheels market writes disabled until matching quality is explicitly accepted;
8. validate SOLD source/licensing separately later.

Post-deploy QA already verified Mini 4WD `/catalog` at HTTP 200 with **55 models**, Hot Wheels public catalog at HTTP 404 by design, and no immediate error/fatal logs on the new Production deployment.

---

## PREVIOUS AUTHORITATIVE CHECKPOINT — 2026-09-23 — HOT WHEELS DEFINITIVE CATALOG MODEL

**This checkpoint supersedes older Hot Wheels branch/catalog wording below while preserving all frozen Mini 4WD market semantics.**

### Global runtime baseline

Verified immediately before recording this checkpoint:

- GitHub `main`: **`7622532749372909c6589b50be447114d9260db5`**
- Vercel Production: **`dpl_3kAHSnjXnEiCSAkSc66nZUg1q2SG`**
- Production state: **READY**
- `https://trackdash.it/api/version`: **`7622532749372909c6589b50be447114d9260db5`**
- current Hot Wheels working branch: **`feat/hotwheels-pilot-shell`**
- current Hot Wheels PR: **#212**
- Hot Wheels public gate in Production: **closed**
- Mini 4WD public Production behavior: unchanged

The existing public market terminology and Market Engine rules documented in the previous checkpoint remain fully authoritative.

### Hot Wheels identity hierarchy — FINAL FOR PILOT

TrackDash Hot Wheels now uses one frozen hierarchy:

**Product = exact Casting → ProductRelease = meaningful commercial Release → Hot Wheels Subvariant = minor physical/package difference**

Do not create a separate family entity.

Do not create a new Release merely for a regional card, minor wheel/base/interior/window/deco difference or similar manufacturing/package variance.

Those belong under `hotwheels_release_subvariants` unless reliable evidence later proves that the item is a distinct commercial/market identity.

### Live Hot Wheels data state

Current live Supabase counts:

- Mini 4WD Products: **55**
- Hot Wheels Products/Castings: **5**
- first complete Hot Wheels casting family: **LB-ER34 Super Silhouette Nissan Skyline**
- LB-ER34 canonical Releases: **9**
- LB-ER34 canonical/debut Release: **HCJ81 — 2022 Mountain Drifters 4/5**
- LB-ER34 casting sources: **3**

The five original pilot identities remain represented inside the wider pilot catalog:

- `HWF11`
- `HWR91`
- `JBC35`
- `JBL16`
- `JBK59`

### Definitive Hot Wheels schema layers

Already live and retained:

- `release_identifiers`
- `hotwheels_release_details`
- `hotwheels_release_subvariants`

New casting layer from migration `0151_hotwheels_casting_details.sql`:

- `hotwheels_casting_details`
- `hotwheels_casting_sources`

Casting facts may include, when verified:

- model/real-car reference
- designer
- debut year
- debut series
- scale
- verification state
- casting-level metadata

Release facts continue to include line/subseries/mix/collector/chase/variation/country/wheels/exclusivity/master-series/theme/packaging where verified.

### LB-ER34 verified casting facts

- designer: **Mark Jones**
- casting debut: **2022**
- debut series: **Car Culture: Mountain Drifters**
- model reference: **Nissan Skyline R34 with Liberty Walk LB-ER34 Super Silhouette body kit**
- Release count: **9**
- casting provenance rows: **3**

### UI invariant — Italiano / English

Every Hot Wheels user-facing change must ship with both:

- **Italiano**
- **English**

Current pilot catalog/detail already follows this rule.

Catalog UI now distinguishes:

- distinct Castings
- exact Releases

Release detail shows Casting/family facts separately from Release-specific facts.

### Validation

Latest code checkpoint before the casting migration:

- PR #212 branch `typecheck`: **SUCCESS**
- PR #212 branch `verify`: **SUCCESS**

Live DB validation:

- new casting tables created successfully
- LB-ER34 casting row verified live
- LB-ER34 remains exactly **9 Releases**
- category counts remain **55 Mini 4WD / 5 Hot Wheels**
- explicit public-read RLS policies exist on both new casting tables
- existing unrelated Supabase advisor warnings were not changed by this work

### Exact next Hot Wheels action

The Hot Wheels catalog model is now **structurally frozen for the pilot**.

Next work is Market Intelligence, not more catalog-schema redesign:

1. define exact eBay EU ASK query/exclusion rules per pilot Release;
2. run a controlled ASK audit over the five original pilot identities plus all LB-ER34 Releases;
3. measure exact-release matching quality;
4. validate SOLD source/API licensing separately;
5. feed accepted observations into the existing shared TrackDash Market Engine;
6. validate Collection/Wishlist behavior with real Hot Wheels signals;
7. only then decide the next Production merge/public-opening checkpoint.

---

## PREVIOUS AUTHORITATIVE CHECKPOINT — 2026-09-23 — MARKET UI

**This section supersedes older runtime/UI wording and version checkpoints below.**  
Older sections remain as historical audit trail unless explicitly restated here.

### Final repository / Production baseline

- final functional `main` baseline before this documentation checkpoint: **`203434b969f7a7f46fa26a636dcf9cdcf6a01234`**
- merged PR **#209**: `Simplify market pricing labels and Release market UI`
- previous semantic alignment PR **#208** is included in this baseline
- Vercel Production: **`dpl_59uvTir1eT3J3vCZYTSbJQETL4zP`**
- Vercel state: **READY**
- Production aliases include `trackdash.it`
- `https://trackdash.it/api/version`: **`203434b969f7a7f46fa26a636dcf9cdcf6a01234`**
- PR #209 `typecheck`: **SUCCESS**
- PR #209 `verify`: **SUCCESS**

This is the final functional code/runtime checkpoint for the market-presentation cleanup completed on 2026-09-23. The documentation-only commit/merge that records this checkpoint will naturally advance `main` and Vercel beyond the SHA above without changing executable behavior; future sessions must still verify the live current SHA.

### Canonical public market terminology — FINAL

Public collector-facing UI must use the following semantics everywhere:

- **Valore stimato** / **Estimated value**  
  Used only when TrackDash has a sufficiently supported consolidated market value.

- **Prezzo minimo richiesto** / **Lowest asking price**  
  Used when publishing the minimum valid current ASK from observed listings.  
  It is **not** a completed sale and **not** Market Value.

- **Trend prezzi richiesti** / **Asking price trend**  
  Used only when the existing ASK trend guard rails pass.

- current ASK evidence count: **`N annunci osservati`** / **`N observed listings`**
- completed-sale evidence count: **`N vendite osservate`** / **`N observed sales`**
- when no publishable current reference exists: **Dati di mercato in verifica**

Do not reintroduce the old public labels:

- `Prezzo osservato`
- `Richiesta venditore osservata`
- `Richiesta più bassa osservata`
- `Trend richieste osservate`

Internal field/function names may retain legacy `observed` terminology where they are implementation details; the public meaning above is authoritative.

### Release / Collection market card — FINAL

The shared market overview used by exact Release pages and Collection copy detail is intentionally compact.

Show only:

1. **Valore stimato** when available, otherwise **Prezzo minimo richiesto**;
2. a valid market/ASK trend when publishable;
3. a compact evidence line when evidence exists, for example:
   - `2 annunci osservati`
   - `4 annunci osservati · 7 vendite osservate`

Do **not** repeat on every Release card:

- methodology prose such as “Riferimento ricavato da…”;
- seller-concentration warnings;
- “Ultimo aggiornamento …”;
- “Trend in raccolta …” when no valid trend exists.

Methodology belongs in the dedicated Market explanation, not in every Release card.

### Verified public examples

**94951 — Avante Mk.III Nero Clear Violet Special (2013)**

- Market Value: absent
- SOLD anchor: **€13.56**, 1 observed sale / 1 seller
- current listings observed: **2**
- canonical minimum effective current ASK: **€186.64**
- public Release card in Production:
  - **Lowest asking price / Prezzo minimo richiesto ≈ €186.64**
  - **2 listings observed / 2 annunci osservati**
- no fake consolidated Market Value and no invalid trend are shown.

**95450 — Proto-Emperor Premium Black Special (2019)**

- Market Value: absent
- canonical minimum effective current ASK: **€34.13**
- current listings observed: **4**
- observed sales: **7**
- public Release card:
  - **Lowest asking price / Prezzo minimo richiesto ≈ €34.13**
  - **4 listings observed · 7 observed sales**
- the thin 3-day ASK movement remains suppressed by the trend guard.

### Canonical catalog / Collection alignment — current invariant

Current code keeps canonical DB Release data aligned across:

- Catalog;
- exact Release pages;
- Collection list and copy detail;
- Dashboard;
- Market;
- Wishlist;
- Scanner result presentation after identity matching;
- site / PWA.

The Scanner's tested local Item/JAN matcher remains the identity index, but matched IDs are hydrated from the canonical DB catalog before display/actions and fail closed when a matched Release no longer exists canonically.

### Exact next action

No further UI work is required for this market-label cleanup.

The next Product Research / SOLD batch is a separate market-data task and does not block this checkpoint.  
Any future material TrackDash change must update this file in the same work unit and create a newer authoritative checkpoint.

---

## MULTI-VERTICAL FOUNDATION — PRODUCTION CHECKPOINT 2026-09-23

The first Hot Wheels / multi-vertical foundation macro-block is now **MERGED + PRODUCTION VERIFIED**.

- merged PR: **#211**
- current main / Production SHA: **`7622532749372909c6589b50be447114d9260db5`**
- Vercel Production: **`dpl_3kAHSnjXnEiCSAkSc66nZUg1q2SG`**
- Vercel state: **READY**
- `https://trackdash.it/api/version`: **`7622532749372909c6589b50be447114d9260db5`**
- public Mini 4WD catalog QA: **55 products, HTTP 200**
- immediate post-deploy runtime errors: **none observed**
- live Hot Wheels products: **0**
- live `release_identifiers`: **0 rows**
- live `hotwheels_release_details`: **0 rows**

The shared foundation is now stable enough for Mini 4WD family/catalog work and Hot Wheels Release/data work to proceed in parallel, as long as both are not simultaneously refactoring the same shared engine.

Dedicated vertical records:

- `docs/MINI4WD_VERTICAL.md`
- `docs/HOTWHEELS_VERTICAL.md`

Current Hot Wheels continuation branch:

`feat/hotwheels-pilot-shell`

Do not reconstruct vertical state from chat memory when these files exist.
---

## VERTICAL STATE INDEX

TrackDash now keeps one dedicated operational state file per collectible vertical:

- `docs/MINI4WD_VERTICAL.md` — Tamiya Mini 4WD vertical state, durable rules, reference families and continuation index.
- `docs/HOTWHEELS_VERTICAL.md` — Hot Wheels vertical architecture, rollout, implementation log, data-source strategy and next actions.

`docs/TRACKDASH_STATE.md` remains the global cross-project/runtime checkpoint.

---


### Dormant Hot Wheels shell — active branch

Current branch: `feat/hotwheels-pilot-shell`

- `/hotwheels` and `/hotwheels/catalog` now exist behind `publicEnabled = false`;
- they fail closed with 404 while the pilot is private;
- no primary navigation/onboarding change has been made;
- Mini 4WD remains the only public catalog experience;
- next Hot Wheels material task: first five real pilot Releases.

---

## HOT WHEELS PILOT DATA — 5 RELEASES

Live Supabase now contains the first **5** Hot Wheels pilot Products/Releases while the public Hot Wheels gate remains disabled.

Pilot identifiers:

- `HWF11` — RLC '71 Lamborghini Miura P400 SV
- `HWR91` — Elite 64 Aston Martin Valkyrie
- `JBC35` — 2025 Super Treasure Hunt '87 Audi quattro
- `JBL16` — Boulevard Alfa Romeo GTV6 3.0
- `JBK59` — Car Culture Silhouettes LB-ER34 Super Silhouette Nissan Skyline

Current live category counts:

- `mini4wd = 55 products`
- `hotwheels = 5 products`

No canonical Hot Wheels images or market observations have been inserted yet.


---

## HOT WHEELS PRIVATE PREVIEW CHECKPOINT — 2026-09-23

Current Hot Wheels branch:

`feat/hotwheels-pilot-shell`

Current PR:

**#212 — Prepare gated Hot Wheels pilot shell**

Private Vercel Preview:

- deployment: `dpl_BPBRn4f68WvPNSvcX3RCUr5Ws8jX`
- verified Preview commit: `4036fbee1227b5bf0e6cdcce3a74e6008f45189c`
- branch hostname: `trackdash-git-feat-hotwheels-pilot-shell-mercseba-8773.vercel.app`
- state: **READY**

Preview QA:

- Hot Wheels catalog HTTP 200;
- five exact pilot Releases visible with identifiers `HWF11`, `HWR91`, `JBC35`, `JBL16`, `JBK59`;
- RLC Miura exact detail HTTP 200;
- market section intentionally remains in Initial Scan pending state;
- Production Mini 4WD catalog remains **55 products**;
- Hot Wheels remains unmerged/not exposed in the Production navigation.

Live Supabase pilot state:

- Mini 4WD products: **55**
- Hot Wheels products: **5**
- Hot Wheels exact Releases: **5**
- Release identifiers: **5**
- Hot Wheels detail rows: **5**
- Hot Wheels provenance rows: **7**

Known Preview-only environment note:

- the Preview environment logs a non-fatal public R3 bootstrap warning because a Supabase server secret is unavailable there;
- the pilot pages still render successfully;
- do not treat this as a Hot Wheels catalog failure or change shared Production market behavior solely for the Preview warning.

Automatic Vercel deploys are disabled again for `feat/hotwheels-*` after this QA checkpoint.

Detailed Hot Wheels state remains in `docs/HOTWHEELS_VERTICAL.md`.

---

## HOT WHEELS CASTING / RELEASE / SUBVARIANT MODEL — 2026-09-23

The Hot Wheels catalog hierarchy is now frozen on the active branch as:

**Product = exact casting → ProductRelease = meaningful commercial variation → Subvariant = minor physical/package difference**

This follows established collector-catalog patterns and prevents unnecessary Release explosion from small wheel/card/base differences.

New branch work:

- standard Hot Wheels Release metadata extended with variation code, manufacturing country, wheel type, exclusivity, master series and theme;
- new `hotwheels_release_subvariants` structure for minor wheel/package/base/interior/window/deco differences;
- bilingual Hot Wheels UI is now a permanent invariant: every user-facing change must ship in both Italiano and English in the same work unit;
- existing five pilot Releases remain unchanged;
- migration `0149_hotwheels_casting_variant_model.sql` is pending CI before live Supabase application.

Detailed rules and source references are in:

`docs/HOTWHEELS_VERTICAL.md`

---

## HOT WHEELS LB-ER34 FAMILY CHECKPOINT — 2026-09-23

The first complete Hot Wheels casting family is now live in Supabase:

**LB-ER34 Super Silhouette Nissan Skyline**

- Product/casting rows: **1**
- canonical Releases: **9**
- debut/canonical Release: `HCJ81` (2022 Mountain Drifters 4/5)
- latest audited Release: `JKF36` (2026 Aérostyles 0/5 Chase)
- migration: `0150_hotwheels_lb_er34_family.sql`
- Mini 4WD products remain: **55**
- Hot Wheels products/castings remain: **5**

This validates the frozen hierarchy:

**Product = casting → ProductRelease = meaningful commercial variation → Subvariant = minor physical/package difference**

The reported 2023 HKF21 ZAMAC 10-piece item remains a pending/candidate Subvariant and is not promoted into canonical public data without independent corroboration.

Detailed family rows, sources and next action:

`docs/HOTWHEELS_VERTICAL.md`

Next Hot Wheels phase:

**controlled EU-first Market Intelligence matching (ASK first, SOLD provider validation separately).**

---

## HOT WHEELS EBAY ASK AUDIT READY — PR #212

Current Hot Wheels working branch:

`feat/hotwheels-pilot-shell`

Current PR:

**#212 — Prepare gated Hot Wheels pilot shell**

Current runtime remains unchanged until merge:

- GitHub `main`: `7622532749372909c6589b50be447114d9260db5`
- Vercel Production: `dpl_3kAHSnjXnEiCSAkSc66nZUg1q2SG`
- `/api/version`: `7622532749372909c6589b50be447114d9260db5`
- Hot Wheels Production public gate: **closed**
- Mini 4WD behavior/data: **unchanged**

PR #212 now contains the first Hot Wheels Market Intelligence matching layer:

- dedicated Hot Wheels eBay title matcher;
- Europe-first ASK audit runner for IT/DE/FR/ES/GB;
- exact Mattel-code auto-match;
- context-only matches remain review-only;
- sibling/chase/custom/loose/lot exclusions;
- bounded second-pass eBay `getItem` lookup for MPN / GTIN / localized aspects;
- read-only Admin + MFA audit panel;
- zero market persistence during audit.

Current live Hot Wheels audit population:

**13 unique Releases**

The original five pilot identities overlap with the nine-Release LB-ER34 family through `JBK59`.

Preview eBay test was intentionally attempted once and returned:

`EBAY_BROWSE_CREDENTIALS_NOT_CONFIGURED`

No secrets were copied into Preview. The temporary diagnostic route was removed and Hot Wheels auto-preview suppression was restored.

Latest branch validation:

- `typecheck`: **SUCCESS**
- `verify`: **SUCCESS**
- PR #212: **mergeable**

Exact next action after Production alignment:

**Admin + MFA → Hot Wheels · Audit eBay ASK → HCJ81 → exact query only**

The audit is read-only and must not write market observations until matching quality has been reviewed.

Detailed rules and reasoning live in `docs/HOTWHEELS_VERTICAL.md`.

---

## SESSION BOOTSTRAP — READ FIRST

For every TrackDash continuation/new chat:

1. read `docs/TRACKDASH_STATE.md` first for the latest global/runtime checkpoint;
2. read the active vertical file:
   - Mini 4WD → `docs/MINI4WD_VERTICAL.md`
   - Hot Wheels → `docs/HOTWHEELS_VERTICAL.md`
3. for Mini 4WD family/catalog/market work, also read:
   - `docs/TRACKDASH_METHOD_MASTER.md`
   - `docs/FAMILY_COMPLETION_MASTER.md`
4. read `docs/TRACKDASH_OPERATIONS.md` when Admin refresh, cron, recompute or operational commands are involved;
5. then verify only live facts that can have changed: current `main`, Vercel Production commit, `/api/version`, and relevant live Supabase queue/status.

Do **not** reconstruct project or vertical state from chat memory when these repository sources exist.

---

# CURRENT FOCUS

## Current completed family

**Avante Mk.III — COMPLETE — MARKET THIN (post-completeness audit)**

Product ID:

`de719716-e50a-5811-b99d-18bbb153b166`

Current family identity:

- canonical family: **24 Release**;
- `94692` = Red Special 2009;
- `95425` = distinct Red Special 2018 re-release;
- `94772` = Competition Pack 2010;
- `92470` = Korea Mini 4WD Cup 2026;
- `95464` = one Release; later production activity is a production wave, not a second Release.

---

# REPOSITORY / PRODUCTION

## Last functional repository baseline before documentation checkpoint

Last known functional/data commit before this STATE document:

`a8ed6e10ae3e64d39b1e48b63e1a55439b7c6924`

It includes the most recent Avante market endpoint work through migration `0136`.

The documentation commits that create/update this file will naturally move `main` beyond that SHA.  
Therefore, in a future session, obtain the **actual current main HEAD from GitHub** rather than treating the SHA above as permanent.

## Vercel Production

Last verified READY Production commit:

`4f29a11227e2ed4f4d28205bf912c6d8e8f97a31`

At the verification immediately before the first Admin recompute runs, `https://trackdash.it/api/version` returned the same `4f29a112…` SHA.

This confirms that Vercel had unblocked and Production included all functional Avante work through `a8ed6e10…`.  
Documentation-only commits subsequently advanced `main`, so final Completion Gate still requires a fresh equality check between the actual current `main`, Vercel Production and `/api/version`.

A temporary one-shot recompute route was experimented with while Production was on `4a52720…`.  
The route has since been removed from `main`, and its one-time authorization table was dropped from Supabase. It must not be reused or recreated as a shortcut.

---

# AVANTE MK.III — COMPLETION MATRIX STATUS

## 1. Catalog audit

**Status: DONE**

- 24 canonical Release rows are present in live Supabase.
- Stable IDs/scanner identity are aligned with the current canonical family.
- Red Special 2009 and 2018 are separate identities.

## 2. Images

**Status: AUDITED**

Exact image rows currently exist for **18 / 24** Release.

Intentional exact-image placeholders remain for:

- `92207`
- `92218`
- `92219`
- `92221`
- `92284`
- `92470`

These placeholders are intentional until a stable, directly attributable exact-release asset is available.  
Do not silently inherit a generic Avante image or a sibling Release image.

For `92470`, an exact Tamiya Hong Kong product page has been found, but a stable directly attributable image asset has not yet been adopted into TrackDash.

## 3. Production status / rarity

**Status: AUDITED / STORED**

Known values are stored per Release; unknown values remain unknown rather than invented.

## 4. Initial Market Scan

**Status: DONE FOR FAMILY COVERAGE**

All **24 / 24 Avante Mk.III Release** now have at least one real direct or contextual market evidence record.

Important rules already applied:

- exact Release identity before valuation;
- historical/out-of-stock retail is not current availability;
- unresolved multi-Release lots are never divided into fake per-Release prices;
- SOLD without an exposed sale date can be retained as market evidence but not promoted to principal valuation evidence by inventing `sold_on`;
- unsupported currencies can be retained in review instead of being forced through the canonical valuation lane;
- absence of visible SOLD is not treated as absence of market.

### Important market corrections / evidence

- `95425`: exact eBay ASK for ITEM 95425 stored separately from 94692.
- `95464`: exact eBay ASK stored; Pieroni page remains review because availability signals conflict.
- `92470`: exact eBay ASK stored.
- `18626`, `18627`, `18662`: exact European retail observations stored as out-of-stock where appropriate.
- `92422`, `92428`, `92430`, `94741`, `94951`, `18662`: Yahoo closed-sales evidence stored as indicative exact-release SOLD evidence with non-invented dates/FX.
- `94673`, `94674`, `94692`, `94715`, `94772`, `94777`, `95469`: exact RCJAZ historical/out-of-stock evidence stored.
- `92207`, `92218`, `92284`: exact Mercari sold-market evidence stored without inventing missing sale dates.
- `92219 + 92221`: one exact two-Release Mercari lot is stored as unresolved/needs-review and **must never be split into two artificial prices**.

## 5. Identity bug fixed

A legacy RCJAZ endpoint whose URL was clearly ITEM `94692` had been attached to Release `95425`.

This was corrected by:

`0134_avante_red_special_endpoint_identity.sql`

The endpoint now belongs to the correct 2009 Release `94692`.

No market candidate had been created from that endpoint before the correction, so no historical candidate had to be reassigned.

## 6. New endpoint migrations

Latest Avante endpoint migrations:

- `0133_avante_mkiii_retail_endpoints.sql`
- `0134_avante_red_special_endpoint_identity.sql`
- `0135_avante_finished_model_rcjaz_endpoints.sql`
- `0136_avante_94777_rcjaz_endpoint.sql`

They are applied to live Supabase.

## 7. Recompute

**Status: DONE**

On 2026-09-21 the Admin market refresh was run four times in total for this final drain.

Final live queue:

- total `new_complete_unbuilt` recompute jobs: **0**
- Avante Mk.III jobs: **0**
- locked jobs: **0**
- jobs with error: **0**

All **24 / 24 Avante Mk.III Release** have a canonical recomputed signal.

Representative final outputs:

- `92470`: Observed price **€29.49**, no fabricated Market Value;
- `95425`: Observed/effective European reference **€42.66**;
- `95464`: Observed price **€20.99**;
- `95087`: Market Value **€34.91**, SOLD anchor **€34.91**, confidence low;
- thin-evidence releases remain `insufficient` / low-confidence rather than receiving invented values.

## 8. QA Production

**Status: PASSED**

Production QA performed after canonical recompute:

- **24 / 24** Avante Release pages return HTTP 200;
- all 24 pages expose the correct Item Number / Release identity;
- no checked page exposes public `SOLD 0`;
- no checked page exposes the stale fallback “Market data coming / Dati di mercato in arrivo”;
- `94692` is publicly distinct as **Avante Mk.III Red Special 2009**;
- `95425` is publicly distinct as **Avante Mk.III Red Special (2018 Re-release)**;
- `95425`, `95464`, `92470` expose observed-price behavior rather than a fabricated consolidated Market Value;
- `95087` exposes the consolidated Estimated value path.

### Collection consistency QA

Verified in current code:

- Collection fetches canonical catalog products for the user's exact product IDs;
- each collection row resolves the **exact `releaseId`**;
- Collection consumes the shared `useMarketSignals()` map;
- `enrichCollection()` derives Market Value / Observed price from the same exact Release signal;
- `ProductImage` receives the exact Release, so Collection images stay aligned with catalog/release data;
- there is no separate Collection-only market-value copy that can silently drift.

### Scanner QA

Verified in current code:

- Scanner uses the same canonical `PRODUCTS` catalog;
- explicit JAN/EAN exact match has priority;
- exact Item Number resolution is conservative;
- reused Item Numbers fail closed to model-level selection instead of choosing an arbitrary Release;
- distinct unique Item Numbers such as `94692` and `95425` resolve through the same canonical catalog identity used by the public Release pages.

### Version alignment

Before this final STATE checkpoint:

- GitHub `main`: `e7042640b40bd02547af5b99fe8117d0c34efca0`
- Vercel Production: `e7042640b40bd02547af5b99fe8117d0c34efca0`
- `/api/version`: `e7042640b40bd02547af5b99fe8117d0c34efca0`

The documentation commit that records this final checkpoint will advance `main`; after it is created, perform one fresh Production/`api/version` alignment check.

## 9. Repository verification gate

**Status: SATISFIED**

Known full `pnpm verify` green baseline:

`6820a6a714fe2a162f52bdfa6c57477ab9743f15`

A GitHub compare from that verified baseline to `e7042640…` shows the final tree differs only by:

- `docs/TRACKDASH_METHOD_MASTER.md`;
- `docs/TRACKDASH_OPERATIONS.md`;
- `docs/TRACKDASH_STATE.md`;
- migrations `0133`–`0136`.

There are **no executable application/source-code differences** after the verified baseline in the final tree.

The four migrations are applied to live Supabase and have been validated by the completed recompute + Production QA.

Therefore the repository verification gate is considered satisfied for the final executable code state.

---

# MARKET COMPLETENESS REOPEN — 2026-09-21

The previous Avante result **COMPLETE — MARKET THIN** is revoked.

Reason: the new Empty Market Challenge found that some Release previously left with no public market reference do in fact have observable current/recent exact-release market evidence. The first Initial Market Scan was therefore not deep enough for those empty cases.

## Global live audit

Across the current catalog (184 Release), the first systematic completeness audit found:

- **A — current stored offer but public signal empty: 2 Release**
- **B — real evidence exists but public signal empty: 17 Release**
- **OK / other: 165 Release**

The two A-class rows are stale `market_method_version = v3` signals:

- Dash-1 Emperor `18025`
- Dash-1 Emperor Black Special `94704`

Both have been enqueued through the canonical `trackdash_enqueue_market_recompute` RPC for v4 recompute.

## Empty Market Challenge — confirmed misses

The targeted second-pass web challenge has already confirmed that this is not limited to `94692`.

### Avante Mk.III current/recent market found after the first audit

- `94692` — current exact listings/search-market evidence exists; prior TrackDash evidence was only RCJAZ historical out-of-stock.
- `18626` — current exact stock found externally.
- `18627` — current exact Italian retail stock found externally.
- `92207` — current exact Mercari market found.
- `92218` — recent/current exact Mercari market found; condition must remain exact before persistence.
- `92284` — current exact regional marketplace evidence found.
- `95469` — current exact Mercari market found.
- `94715` — recent exact completed-market reference found.
- `94777` — probable current exact market signal found, still requires exact-listing confirmation before persistence.

### Other catalog Release already confirmed by the same global challenge

- Avante Jr. `18014` — current exact retail/eBay market.
- Avante Jr. Black Special `95501` — current exact eBay market.
- Dyna-Hawk GX `94717` — current exact eBay market.
- Dyna-Hawk GX Black Special `95000` — current exact Mercari market.

This proves the issue was **Initial Market Scan completeness**, not simply a conservative valuation threshold.

## Permanent hard gate now active

The Master and Operations docs now require:

1. after recompute, every Release with no MV and no observed/current price enters the **Empty Market Challenge**;
2. targeted second-pass multi-source research must be completed before a thin/no-market result is accepted;
3. current valid offer + public empty signal must equal **BLOCKED — PIPELINE / STALE SIGNAL**, never COMPLETE;
4. stale `market_method_version` signals must be recomputed before Completion Gate;
5. family completion requires zero unchallenged empty Release.

Regression coverage was also added to ensure a single exact current offer remains publishable as observed-market context even when it is not enough for a consolidated Market Value.

## Current Avante status

**NOT COMPLETE.**

The family remains reopened until:

- all Avante B-class empty Release receive the targeted challenge;
- exact valid evidence found is persisted;
- canonical recompute is rerun for affected Release;
- family completeness audit returns no unexplained empty Release;
- Production QA is rerun.

---

# COMPLETION GATE

## Avante Mk.III result

**COMPLETE — MARKET THIN**

The reopened Market Completeness backfill has now passed the hard gate for all 24 Release.

Completion rationale:

- canonical family count: **24**;
- current-offer/public-empty A-class: **0**;
- stale market-method signals: **0**;
- Avante recompute queue: **0 jobs / 0 errors**;
- all empty public-signal Release have been challenged and classified;
- no current condition-safe exact offer is being suppressed by an empty signal;
- historical/OOS, undated SOLD and unsplittable lot evidence remain context rather than forced values;
- Production is aligned to the functional commit carrying the final eBay known-listing repair.

This status does not mean every Release has a Market Value. It means every Release has passed the evidence/completeness rules without inventing a value.

---


# MARKET COMPLETENESS BACKFILL — QUEUE PREPARED 2026-09-22

## Hard-gate audit baseline

Global catalog audit: **184 Release**

- A — current valid stored offer but public signal empty: **2**
- B — market evidence exists but public signal empty: **17**
- OK / other: **165**

The two A rows are stale Market Method v3 signals:

- `18025` Dash-1 Emperor (2026 Reissue)
- `94704` Dash-1 Emperor Black Special

Both have been enqueued for canonical v4 recompute.

## Identity-safe classification

The backfill must not force an Item Number onto the wrong production occurrence.

Confirmed reused Item Numbers among the suspect rows:

- `18014` → original + 2012 reissue + 2024 reissue;
- `95501` → 2019 + 2021 + 2024 occurrences;
- `18074` → regular Proto-Emperor Premium + Sanfrecce Hiroshima special.

Therefore these remain fail-closed until evidence identifies the exact physical occurrence. Current marketplace evidence for the Item Number alone must not be assigned arbitrarily to one of those Release rows.

## Unique suspect Release — eBay canonical revalidation

Fourteen unambiguous suspect Release have been prepared for a one-time canonical eBay Production revalidation:

- `18626`
- `18627`
- `92207`
- `92218`
- `92284`
- `94673`
- `94674`
- `94692`
- `94715`
- `94772`
- `94777`
- `95469`
- `94717`
- `95000`

For these eBay queue rows:

- `priority = 200`;
- `next_scan_at = 2000-01-01` as a **temporary one-time backfill override**;
- normal `scan_interval_hours` was not changed.

This is necessary because `trackdash_claim_ebay_active_jobs` orders by:

`next_scan_at ASC, priority DESC, id`

so priority alone does not overtake older due backlog.

Live queue verification confirms these 14 rows are currently the **first 14 eligible eBay jobs**, before the normal Aero Manta Ray backlog.

Admin eBay batch size is 4, so four successful Admin market refresh executions are sufficient to attempt all 14 prepared jobs, subject to per-job failures/retries.

After the one-time revalidation, restore normal priority policy where the scheduler does not do so automatically.

## External challenge already confirms first-scan misses

The second-pass challenge has already established that some previously empty rows do have real market activity. Examples include:

- `18626` — exact new current eBay market observed;
- `18627` — exact new current eBay/Italian-market listing observed;
- `94692` — multiple exact-item marketplace/search-market signals observed; prior TrackDash state only retained historical RCJAZ OOS;
- `94715` — recent exact Mercari completed sale observed;
- `95469` — exact recent/current Mercari market and completed-sale evidence observed;
- `95000` — exact current eBay fixed-price listing observed externally despite an earlier canonical eBay scan yielding no accepted candidate.

These findings confirm the backfill is a real **Initial Market Scan completeness correction**, not a relaxation of Market Value standards.

## Important distinction

A valid current exact offer can support **Observed price** without automatically becoming Market Value.

Active auctions, ambiguous production occurrences, used/built/incomplete kits and historical OOS references do not get promoted merely to avoid an empty UI.

The goal is maximum real evidence, not forced values.

---


# MARKET COMPLETENESS BACKFILL — LIVE CHECKPOINT 2026-09-22

## Automatic revalidation completed

The user ran four Admin market refresh cycles against the prepared 14-target eBay backfill queue.

Verified results:

- all 14 prepared eBay jobs were attempted successfully;
- scan errors: **0**;
- temporary backfill priority was restored to the normal policy;
- `18626` now has multiple accepted current offers and a v4 observed market reference;
- `18627` now has multiple accepted current offers and a v4 observed market reference;
- `95469` now has an accepted current offer and a v4 observed market reference;
- false-positive eBay results for `94692`, `94772`, `94673` were correctly rejected rather than contaminating the exact Release.

## New exact market evidence persisted

- Dyna-Hawk GX `95000`: exact active Mercari listing, new/unused, **JPY 4,900 ≈ EUR 27.12**, current offer; recompute queued.
- Proto-Emperor Sanfrecce `18074`: exact Yahoo Flea completed sale, unused, **JPY 3,400 ≈ EUR 21.49**, sold 2023-09-05; historical context, recompute queued.
- Avante Mk.III `92218`: exact Yahoo Auctions completed sale, unused, **JPY 7,000 ≈ EUR 37.62**, ended 2026-06-07; recompute queued.
- Avante Mk.III `92207`: exact Yahoo Auctions completed sale, unused, **JPY 6,750 ≈ EUR 36.27**, ended 2026-06-07; recompute queued.

Current recompute queue at this checkpoint: **4 jobs, 0 errors**.

## 92207 conflicting Yahoo Shopping page

A Yahoo Shopping page whose title says `92207` also exposes conflicting merchant product number `92195-000`.

TrackDash therefore:

- quarantined the candidate as `needs_review`;
- removed its current offer state;
- does **not** publish JPY 40,103 as a 92207 current price.

## Regional currency pipeline blocker

`92284` has an exact active eBay offer in MYR, but the old worker quarantined it only because the market FX path was restricted to EUR/USD/JPY/GBP.

PR #188 adds ECB-backed regional market FX without expanding the user acquisition-currency UI.

- PR head `e09f9fd99e2ada38172309846eee8523c024e9c1`
- Typecheck: SUCCESS
- full `pnpm verify`: SUCCESS
- merged to main as `46fd2396c17e88e4d992d0242c34cc594401c606`

The first Production deployment of that merge failed during `pnpm run build`. The FX branch Preview itself was READY, so the failure is being isolated against the additional market-context commits that landed on main while PR #188 was open. Production remains on the previous READY deployment until repaired.

## Public historical context

Current main already contains the safe UI distinction between:

- current observed price;
- Market Value;
- historical/non-current market references.

A Release with verified historical/non-current evidence no longer needs to look identical to a Release with zero market evidence.

Avante remains:

**REOPENED — MARKET COMPLETENESS BACKFILL**

Do not close until the remaining challenge classifications, queued recomputes, 92284 regional-currency rescan, Production alignment and final completeness audit all pass.

---


# MARKET COMPLETENESS BACKFILL — PRODUCTION ALIGNED / 92284 NEXT

## Production alignment

The market-context build regression was isolated to a stale regression-test marker and repaired.

Current verified functional alignment before this documentation checkpoint:

- GitHub main: `53f9f2bd045b6df85b5ed9e4ce077c953def75e9`
- Vercel Production: `53f9f2bd045b6df85b5ed9e4ce077c953def75e9`
- `/api/version`: `53f9f2bd045b6df85b5ed9e4ce077c953def75e9`
- Vercel state: **READY**
- Typecheck on repair branch: **SUCCESS**
- full `pnpm verify`: **SUCCESS**

This Production includes:

- safe historical/non-current market context surfaces;
- unresolved exact multi-Release lots counted as context without splitting their price;
- ECB-backed regional marketplace FX, including MYR, for market ingestion;
- user acquisition-currency UI remains unchanged.

## 92284 STARGEK — exact next scan

Release:

`92284 — Avante Mk.III Nero STARGEK 10th Anniversary Special`

Release ID:

`805c2619-0c0c-5aa1-adc5-df25cafe5c8f`

Known exact active eBay listing:

`204435589176`

- price: MYR 450
- shipping: MYR 120
- condition: new / unassembled
- previous status: `needs_review`
- previous reason: `UNSUPPORTED_CURRENCY`

The regional FX fix is now in Production, so this Release is prepared for canonical rescan.

Its eBay queue row is temporarily:

- `priority = 200`
- `next_scan_at = 2000-01-01`

Live claim-order verification confirms **92284 is the first eligible eBay job**.

After its scan, restore ordinary queue priority.

## Current recompute queue before next Admin run

Four known jobs are already pending, with no recorded errors:

- `95000` — Dyna-Hawk GX Black Special
- `18074` — Proto-Emperor Sanfrecce Hiroshima
- `92218` — Avante Mk.III EVA Awakening
- `92207` — Avante Mk.III EVA Unit-01

Because Admin scan/recompute lanes run concurrently, the 92284 scan may enqueue its recompute after the same run has already claimed the existing four jobs. Re-check the queue after the Admin run rather than assuming 92284 recomputed in that same cycle.

## QA correction — 92422 / 92428

The identical-looking active prices on `92422` and `92428` are **not cross-assignment**.

Each Release has its own exact eBay listing with the correct Item Number in the title:

- `92422`: EUR 73.20 + EUR 12.20 shipping
- `92428`: EUR 73.20 + EUR 12.20 shipping

The matching equal prices come from the seller/listing market, not from Release contamination.

## Exact next action

Run **Admin → Aggiornamento mercato → Esegui ora** once.

After it finishes:

1. verify eBay item `204435589176` is accepted and resolved to 92284;
2. verify MYR→EUR FX provenance and current offer state;
3. restore 92284 queue priority;
4. inspect the recompute queue;
5. run a second Admin refresh only if 92284 or another backfill recompute remains;
6. perform the final 24/24 Avante completeness audit.

Avante remains **REOPENED — MARKET COMPLETENESS BACKFILL** until this final gate passes.

---

# 92284 POST-REFRESH DIAGNOSIS — KNOWN LISTING DIRECT REFRESH REQUIRED

Two requested Admin refreshes were executed after Production alignment.

Verified live outcome:

- the first refresh drained the four previously pending recomputes;
- 95000 recomputed with its current observed offer;
- 92218 and 92207 recomputed with their persisted completed-sale anchors;
- the Sanfrecce 18074 historical 2023 evidence remains historical context outside the current valuation window;
- the second 92284-specific refresh completed successfully with targets_attempted=1 and targets_succeeded=1;
- that run found 0 candidates, so eBay item 204435589176 remained unchanged as needs_review / UNSUPPORTED_CURRENCY;
- 92284 still had no current offer state/public observed price after that refresh.

The first diagnosis that EBAY_MY should be queried was corrected after checking the official eBay Buy API marketplace support matrix. EBAY_MY is not a supported Buy/Browse marketplace identifier. The stored exact listing is exposed through ebay.it with MYR pricing, so marketplace and currency must not be conflated.

Root cause:

- regional MYR FX support is present;
- queue claim, worker execution and recompute are healthy;
- normal keyword Browse search does not return the already-known exact listing;
- therefore a successful search job can still miss a known active listing because of eBay indexing/ranking.

Canonical repair:

- keep normal keyword discovery on supported marketplaces;
- use Browse getItemByLegacyId for persisted exact numeric eBay item IDs on unique Releases;
- run direct known-listing refresh before keyword discovery;
- deduplicate numeric legacy IDs against REST v1|...|0 IDs;
- preserve fail-closed behavior for shared Item Numbers;
- do not manually force the candidate, offer state or Release signal.

Keep 92284 at temporary high eBay priority until the repaired Production worker has revalidated item 204435589176 through the direct legacy-ID path. After successful ingestion, restore ordinary family eBay priority and run the final Avante 24/24 completeness audit.

---

# AVANTE MK.III — FINAL MARKET COMPLETENESS AUDIT 2026-09-22

## 92284 final revalidation

The repaired Production worker revalidated exact eBay legacy item:

`204435589176`

for:

`92284 — Avante Mk.III Nero STARGEK 10th Anniversary Special`.

Verified result:

- direct legacy-ID retrieval succeeded;
- eBay returned the listing as EUR **96.25** + EUR **25.67** shipping;
- exact item identity remained correct;
- listing end date: **2026-08-29T11:57:42Z**;
- candidate classification: **rejected / LISTING_ENDED** for the active-ASK lane;
- no current offer state was created;
- no current Observed price was published;
- the existing exact Mercari SOLD candidate remains historical/context-only because its sale date is not exposed.

Therefore 92284 being publicly empty for current price is **intentional and correct**, not a pipeline miss.

Its temporary eBay priority has been restored to the family baseline:

- priority: **95**;
- activity tier: **normal**;
- interval: **168h**;
- next scan: **2026-09-29**.

## Empty Market Challenge — final classifications

The remaining Avante Release with no current public price were challenged and are now explained:

- `94673` — exact RCJAZ historical/out-of-stock only;
- `94674` — exact RCJAZ historical/out-of-stock only;
- `94692` — exact RCJAZ historical/out-of-stock evidence exists; current public market results also exist, but the condition-safe evidence found is used/ambiguous for the canonical `new_complete_unbuilt` lane, so no forced current anchor is published;
- `94715` — exact historical/out-of-stock evidence; no condition-safe current exact offer promoted;
- `94772` — exact historical/out-of-stock evidence; no condition-safe current exact offer promoted;
- `94777` — exact historical/out-of-stock evidence; no condition-safe current exact offer promoted;
- `92219 + 92221` — exact current Mercari two-Release lot at JPY 22,000, new/unassembled, already persisted as unresolved multi-Release context and intentionally **never split** into fake per-Release prices;
- `92284` — ended exact eBay listing plus undated exact Mercari SOLD context; no current ASK.

This satisfies the Empty Market Challenge rule: every empty Avante Release is now explained by historical/OOS evidence, unsplittable lot evidence, condition ambiguity, or ended/undated market evidence rather than by an uninvestigated gap.

## Final hard-gate numbers

Live Supabase audit:

- canonical family count: **24**;
- A-class current offer + public empty: **0**;
- Market Method v4 signals: **24 / 24**;
- stale method signals: **0**;
- Avante recompute jobs: **0**;
- Avante recompute errors: **0**.

## 94692 user Collection alignment

The user's Collection is correctly linked to the canonical 2009 Release:

- Item Number: `94692`;
- Release ID: `e07a5f39-d476-54c5-a509-4fb3ffb1a0ec`;
- copy count: **1**;
- condition: **Sealed**;
- acquisition price: **EUR 15.00**;
- exact Release image is present from the Tamiya 94692 asset.

Collection therefore resolves the same exact Release identity used by Catalog/Release detail and remains aligned with canonical Release data.

## Final functional alignment before this STATE documentation update

Verified immediately before writing this checkpoint:

- GitHub main: `065818860828d47ef6a877916fe3b9e57ee44293`;
- Vercel Production: `065818860828d47ef6a877916fe3b9e57ee44293`;
- `/api/version`: `065818860828d47ef6a877916fe3b9e57ee44293`;
- Vercel state: **READY**;
- PR #191 Typecheck: **SUCCESS**;
- PR #191 full `pnpm verify`: **SUCCESS**.

The documentation commit that records this checkpoint will advance `main` without changing executable application behavior. Re-check deployment alignment after that docs-only commit before treating the repository snapshot as fully synchronized.

---

# ADMIN MARKET REFRESH — CURRENT OPERATIONAL FACT

The button:

**Admin → Aggiornamento mercato → Esegui ora**

is the official manual equivalent of the regular market cycle.

It currently launches in parallel:

- `runExactPageMarketScanBatch(4)`
- `runEbayActiveMarketScanBatch(4)`
- `runMarketRecomputeBatch(8)`

This behavior is documented in detail in:

`docs/TRACKDASH_OPERATIONS.md`

Do not rediscover or guess this behavior from chat memory in future sessions. Read the Operations document and verify code only if the document may have become stale or the behavior is being changed.

---

# EXACT NEXT ACTIONS

Avante Mk.III requires **no further family-completion action**.

For future TrackDash work:

1. keep `docs/TRACKDASH_METHOD_MASTER.md`, this STATE file and `docs/TRACKDASH_OPERATIONS.md` as the bootstrap source;
2. use the stabilized Initial Scan + Empty Market Challenge workflow on the next family;
3. do not reopen Avante unless new evidence, a catalog identity correction or a pipeline regression creates a real reason;
4. separately continue the one-time completeness backfill for older non-Avante catalog B-class cases already identified.

---

# REFERENCE FAMILY

**Manta Ray Mk.II** remains the practical benchmark for the current workflow.

Its implementation established the expected patterns for:

- Europe-first refresh policy;
- adaptive scan cadence;
- exact retail endpoints;
- indicative Yahoo closed-sale evidence;
- intentional image-gap documentation;
- Initial Scan vs automatic refresh separation.

When a newer Master rule conflicts with an older Manta implementation detail, **the current Master wins**.

---

# STATE MAINTENANCE RULE

Update this file in the **same work unit** whenever any of these materially changes:

- current family or family status;
- canonical Release count/identity;
- migrations applied;
- market evidence coverage;
- recompute/scan queue state when it changes the next action;
- Production commit/alignment;
- blocker;
- Completion Gate;
- exact next action.

Do not finish a material TrackDash work block with the only accurate state living in chat.


---

# DYNA-HAWK GX — MASTER ALIGNMENT / DEPLOYMENT GATE 2026-09-22

## Canonical family

The Dyna-Hawk GX family is confirmed at **4 exact Releases**:

- `19201` — Dyna-Hawk GX — 1998 — Super X
- `94717` — Dyna-Hawk GX Super XX Special — 2010
- `95000` — Dyna-Hawk GX Black Special — 2013
- `95467` — Dyna-Hawk GX Super XX Special (2019 Reissue) — 2019

No fifth canonical Release has been established by the current audit.

## Catalog alignment already applied

- `94717` and `95467` remain distinct Releases by Item Number/year/identity.
- Their visual equivalence is explicitly documented, so `94717` may use the same verified Tamiya visual asset without implying Release identity equivalence.
- `95467` canonical JAN/GTIN is `4950344954674`, corroborated by Tamiya USA.
- Migration `0137_dyna_hawk_master_alignment.sql` persists these corrections.

## Europe-first landed-cost repair

PR #192 changed the current-offer model so local shipping from Japan/Asia/US/global sources is not treated as delivered-to-Europe cost.

Permanent runtime semantics:

- Europe/internal shipping can create delivered European cost;
- extra-EU local shipping remains contextual unless a European landed cost is explicitly known;
- marketplace region is resolved from exact eBay marketplace metadata where available;
- extra-EU item-only/local-delivery offers cannot alone define or lower the European observed price.

Merged main SHA for that repair:

`80245440dff130d491d4342fa91bf6faeeb76078`

This SHA is the current Vercel Production runtime at this checkpoint.

## 95467 — SOLD concentration vs whole-market breadth

The older public Market Value around EUR 14.92 came from a recent eBay Product Research rolling window of 5 sales concentrated in one known seller.

The family audit established that:

- this is genuine SOLD/sell-through evidence;
- one eBay seller in the SOLD dataset does **not** mean the whole market has one seller;
- RCJAZ is an independent exact retail channel for `95467`;
- an extra-EU retailer with unknown landed-to-Europe cost proves market breadth, but does not numerically validate a European Market Value;
- the current exact European eBay offer remains a separate current-market observation.

PR #195 therefore makes seller concentration a quality property of the SOLD sample rather than a statement about the entire market.

Under the new rule:

- concentrated SOLD remains visible as SOLD anchor/history/trend evidence;
- volume from one known seller does not by itself publish Market Value;
- Europe-comparable independent price evidence may corroborate it;
- otherwise the public current observed price remains separate from Market Value.

PR #195 merged main SHA:

`addcdac1c6c6c20adfef9573dcd303d37fd52dfa`

CI on PR #195:

- Typecheck: **SUCCESS**
- full `pnpm verify`: **SUCCESS**

## 95467 RCJAZ exact endpoint and current manual audit

Migration `0138_dyna_hawk_95467_rcjaz_endpoint.sql` adds the exact RCJAZ Release endpoint.

The endpoint is already present in live Supabase:

- exact_release_verified: true
- enabled: true
- queue priority: **100** (temporary closeout boost restored to source baseline)
- due: yes
- last_success_at: null

Important operational fact discovered during closeout:

- `rcjaz_public` source policy is currently **adapter_status = planned**;
- therefore Admin/cron exact-page workers will NOT claim RCJAZ yet;
- the endpoint is enrollment/preparation for the future READY adapter, not a claim that automatic scanning is already active.

The 2026-09-22 Initial Market Audit manually verified the exact RCJAZ product page and persisted an accepted exact market candidate:

- source_record_key: `rcjaz:95467`
- observation_type: `retail_in_stock`
- price: **USD 25.30**
- condition: Brand New / `new_complete_unbuilt`
- exact ITEM: `95467`
- GTIN on page: `4950344954674`
- shipping / landed cost to Europe: **unknown**
- reason: `EXTRA_EU_LANDED_COST_UNKNOWN`

This current RCJAZ observation proves an independent market channel and is retained as market breadth/context. It is intentionally NOT converted into a European delivered offer state and cannot define or lower the European observed price.

## One-time recompute migration

The Europe-first method change requires recomputing only signals that can actually change.

A clean one-time queue currently contains **15** jobs:

- all 4 Dyna-Hawk Releases;
- the 11 Avante Mk.III Releases that currently have active/current offers and can therefore be affected by the new geographic/cost-basis rule.

Queue checkpoint:

- queued: **15**
- locked: **0**
- no older recompute jobs are ahead of this batch.

Do not manually manufacture these signals in SQL. They must pass through the canonical recompute worker.

## Current blocker — Vercel daily deployment limit

Repository and Production are temporarily not aligned:

- GitHub main: `addcdac1c6c6c20adfef9573dcd303d37fd52dfa`
- Vercel Production: `80245440dff130d491d4342fa91bf6faeeb76078`

Vercel rejected the PR/main deployment because the account reached the daily deployment quota:

`api-deployments-free-per-day`

This is an infrastructure/deployment quota blocker, not a code/test failure.

A READY older preview exists with the core seller-concentration publication logic, but Completion Gate must not rely on a preview-only runtime or manual SQL signal fabrication.

## Exact next action

**Do not run Admin → Aggiornamento mercato yet.**

The canonical next sequence is:

1. get the final main commit containing PR #195 into Vercel Production;
2. verify `main SHA = Production SHA = /api/version`;
3. then run **Admin → Aggiornamento mercato → Esegui ora**;
4. inspect the recompute queue and the persisted RCJAZ `95467` market context;
5. run a second Admin cycle to consume the remaining one-time recomputes; RCJAZ itself remains PLANNED and is not expected to be automatically scanned by that button;
6. verify all four Dyna public signals, Release pages, Collection alignment and Empty Market Challenge;
7. restore any temporary scan priority;
8. close Dyna only after the family Completion Gate passes.

Dyna-Hawk is therefore:

**BLOCKED — PRODUCTION DEPLOYMENT QUOTA**

The family logic/catalog/evidence work is ready, but it is not yet valid to declare COMPLETE or instruct the user to run the normal Production Admin refresh while Production still executes the older publication policy.


---

# RCJAZ — SOURCE-LEVEL EXACT RETAIL INTEGRATION — 2026-09-22

RCJAZ is no longer modeled as a one-off endpoint rule for Dyna-Hawk `95467`.

PR #197 introduces source-level integration with these repository migrations:

- `0139_rcjaz_source_level_integration.sql`
- `0140_rcjaz_exact_endpoint_queue_cleanup.sql`
- `0141_rcjaz_verified_endpoint_queue_alignment.sql`

## Runtime/parser

New parser kind:

`rcjaz_product_page`

It handles RCJAZ exact-product pages and recognizes:

- exact Item Number on page;
- product price/currency;
- `Available in shop` as current stock;
- `Not Available` / sold-out state as unavailable context;
- Cloudflare challenge markers as fail-closed review.

Worker dispatch now selects this parser for RCJAZ endpoints.

Tests cover:

- current `95467`-style RCJAZ page;
- unavailable `94777`-style page;
- Cloudflare challenge page.

## Persistent enrollment

Safe exact RCJAZ pages are enrolled from:

- curated `release_sources`;
- accepted exact/strong `market_candidates`.

Future qualifying records auto-enroll through database triggers.

Automatic enrollment requires:

- approved RCJAZ host;
- individual product-page URL;
- Item Number present in URL;
- Item Number unique in the TrackDash catalog.

Shared/reused Item Numbers fail closed and require explicit exact endpoint verification.

Existing explicit `exact_release_verified=true` endpoints remain schedulable even for a shared Item Number.

## Live Supabase verification

The source-level migrations were applied to Production Supabase in this work unit.

Verified live state:

- RCJAZ exact endpoints: **27**
- Releases with RCJAZ exact endpoint: **25**
- Releases with enabled RCJAZ queue: **25**
- Releases with enabled RCJAZ target: **25**
- enabled RCJAZ jobs without exact endpoint: **0**
- all RCJAZ endpoints use parser `rcjaz_product_page`
- source policy remains `adapter_status = planned`
- baseline retail interval: **336h**
- `95508` explicit shared-item endpoint has queue/target enabled
- automatic enrollment test on shared Item Number `18074`: **false**, as required

Security verification:

- `anon` cannot execute `trackdash_enroll_rcjaz_endpoint`
- `authenticated` cannot execute it
- `service_role` can execute it
- Supabase security advisor did not flag the new RCJAZ functions as mutable-search-path or publicly executable SECURITY DEFINER functions

## Dyna-Hawk 95467 RCJAZ evidence

The current exact RCJAZ page was manually verified and persisted as:

- `retail_in_stock`
- USD **25.30**
- exact ITEM `95467`
- GTIN `4950344954674`
- Brand New / new complete unbuilt
- European landed shipping/import cost: unknown
- reason: `EXTRA_EU_LANDED_COST_UNKNOWN`

This proves an independent current retail channel but does not numerically define the European observed price.

## Activation gate

RCJAZ is **integrated but not automatically executed yet**.

Reason:

A previous live Vercel probe received HTTP 403 / Cloudflare challenge. The source therefore remains `PLANNED`.

The dedicated parser detects challenge pages and fails closed, but RCJAZ must not move to `READY` until a live Vercel transport canary succeeds.

External browser/search accessibility is not sufficient proof of Vercel-worker accessibility.

## Current Production blocker

Vercel has reached the daily deployment quota:

`api-deployments-free-per-day`

Therefore executable code merged after Production SHA `80245440dff130d491d4342fa91bf6faeeb76078` is not yet live at `trackdash.it`.

Do not run the one-time 15-job recompute batch through Production Admin until the final market code is deployed and:

**GitHub main SHA = Vercel Production SHA = /api/version**

## Exact next action

1. merge PR #197 after Typecheck + full `pnpm verify` are green;
2. publish the resulting main commit to Vercel Production when deployment capacity permits;
3. verify main = Production = `/api/version`;
4. keep RCJAZ `PLANNED` until a Vercel canary proves direct RCJAZ fetch works;
5. after Production alignment, run Admin Market Refresh for the prepared Dyna/Avante recompute queue;
6. verify the four Dyna public signals and Collection;
7. close the Dyna Completion Gate only after those recomputes/QA pass.



---

# POST-MERGE CHECKPOINT — DYNA + RCJAZ — 2026-09-22 13:xx Europe/Rome

This checkpoint supersedes the earlier deployment-blocker wording above.

## Repository

RCJAZ source-level integration PR #197 is **MERGED**.

Functional merge SHA:

`7401bc4358b92c82eda86e6e162ae0a44600c6b1`

PR #197 final checks:

- Typecheck: **SUCCESS**
- full `pnpm verify`: **SUCCESS**

The temporary Preview-only RCJAZ canary route was removed before merge.

## Production

Current Vercel Production / `/api/version`:

`03384158e6a173ea3a7621b1e271a404df828e65`

Therefore:

- Production already includes the Dyna Europe-first repair and the PR #195 seller-concentration publication rule;
- Production does **not yet** include the final PR #197 RCJAZ parser/enrollment application code;
- GitHub main and Production are not aligned.

Vercel status for merge SHA `7401bc43...` is still blocked by:

`api-deployments-free-per-day`

Do not declare Completion Gate passed while this mismatch exists.

## Live Supabase

RCJAZ data-layer integration is already applied and verified live:

- exact endpoints: **27**
- endpoint-backed Releases: **25**
- enabled RCJAZ queue Releases: **25**
- enabled RCJAZ target Releases: **25**
- enabled queue jobs without exact endpoint: **0**
- RCJAZ adapter status: **PLANNED**
- current exact `95467` RCJAZ candidate: USD 25.30 / in stock / European landed cost unknown
- shared Item Number automatic enrollment remains fail-closed
- explicit verified shared-item endpoints remain schedulable

The one-time market recompute queue remains:

- queued: **15**
- locked: **0**

No recompute has been consumed during the RCJAZ integration work.

## Operational consequence

**Do not ask the user to press Admin → Aggiornamento mercato yet.**

Even though the Dyna publication logic itself is already present in Production, the permanent project gate requires:

**GitHub main SHA = Vercel Production SHA = /api/version**

before the one-time migration/recompute QA is treated as canonical.

## Exact next action

1. deploy current main (functional SHA `7401bc43...` plus this docs-only checkpoint) to Vercel Production;
2. verify `main = Production = /api/version`;
3. keep RCJAZ `PLANNED` until a live Vercel outbound canary proves direct RCJAZ fetch succeeds without Cloudflare challenge;
4. then instruct the user to run **Admin → Aggiornamento mercato → Esegui ora**;
5. run/inspect enough Admin cycles to consume all 15 queued recomputes (8 per cycle, so normally two cycles if no new jobs are inserted ahead);
6. verify all four Dyna signals, Release pages and Collection cards;
7. verify Avante impacted signals were recomputed under Europe-first semantics;
8. close Dyna only when Completion Gate is green.

RCJAZ integration status:

**INTEGRATED — EXECUTION GATED BY LIVE VERCEL CANARY**

Dyna status:

**BLOCKED — FINAL PRODUCTION ALIGNMENT + RECOMPUTE QA**


---

# DASH-X1 PROTO-EMPEROR — CONTROLLED RE-AUDIT — 2026-09-22

This is a family re-audit under the frozen current method. It does **not** change the global market method.

## Genealogy

Canonical Product:

- Product: `DASH-X1 Proto-Emperor`
- Product ID: `1acf7850-c8a9-5627-b104-54db6e235ba2`
- canonical complete Releases: **4**

The family remains:

1. `94708` — DASH-X1 Proto-Emperor (VS Chassis), 2009
2. `18074` — Dash-X1 Proto-Emperor Premium, 2013
3. `95450` — Dash-X1 Proto-Emperor Premium Black Special, 2019
4. shared-item `18074` — DASH-X1 Proto-Emperor Premium — Sanfrecce Hiroshima Special Edition, 2023

`92063` is a body-parts-only predecessor and is **not** a complete Mini 4WD Release.

Shared ITEM `18074` remains fail-closed for automatic Release inference. The standard Premium and Sanfrecce collector edition are separate TrackDash Releases.

## Catalog alignment

Re-audit changes persisted live and represented by migration `0142_dash_x1_proto_emperor_reaudit.sql`:

- `94708`: discontinued, Rare; JAN already confirmed `4950344947089`
- standard `18074`: JAN `4950344180745`, active/current catalog, Common
- `95450`: JAN `4950344954506`, Uncommon; production status intentionally remains unknown
- Sanfrecce 2023: discontinued one-event collector edition, Rare

The standard `18074` notes preserve the alternate older/regional retailer GTIN `4950344063888` instead of silently treating it as the canonical JAN.

## Images

- standard `18074`: exact official Tamiya image already present
- `95450`: exact official Tamiya image already present
- Sanfrecce 2023: exact official Sanfrecce Hiroshima image added
- `94708`: **EXACT IMAGE NOT FOUND AFTER AUDIT**; remains placeholder rather than inheriting another Proto-Emperor image

`next.config.mjs` whitelists only the exact Sanfrecce news-image path required by this Release.

## Market re-audit

Standard `18074` has broad exact SOLD evidence:

- full history: 60 sales / 17 sellers / average item price EUR 16.64
- current rolling window: 19 sales / 8 sellers / average item price EUR 17.49

Its existing EUR 17.49 SOLD-based Market Value is supported by broad seller diversity and is expected to survive current-policy recompute.

`95450` requires current-policy recompute:

- full history: 25 sales / 6 sellers / EUR 13.98 average
- rolling window: 7 sales / **1 seller** / EUR 12.72 average
- current eBay asks exist
- current exact RCJAZ stock exists, but European landed cost is unknown

Under frozen v4 policy, the one-seller rolling cluster cannot establish European MV merely from volume, and extra-EU RCJAZ item-only price cannot numerically corroborate it. A canonical recompute is queued rather than manually rewriting the signal.

Sanfrecce:

- historical exact completed-sale evidence remains;
- a current eBay result was explicitly classified as **box-only 10-piece lot** and rejected from complete-kit valuation.

`94708`:

- exact RCJAZ page is historical/out-of-stock;
- no valid exact current new-complete European offer was promoted during this audit.

## RCJAZ

Exact RCJAZ endpoints now exist for:

- `94708`
- standard `18074` (pre-existing explicit shared-item endpoint)
- `95450`

RCJAZ remains globally **PLANNED** pending the separate live Vercel Cloudflare transport gate. These exact pages are nevertheless valid manually verified market context.

## Current execution state

All four family Releases are queued for canonical recompute:

- queued for family: **4**
- expected Admin recompute capacity: **8**

Do not declare the family COMPLETE before:

1. repository change is merged and Production aligned;
2. one canonical Admin Market Refresh consumes the four recomputes;
3. signals are rechecked, especially `95450`;
4. Production page/image QA passes;
5. Empty Market Challenge / hidden-offer gate is green.

Current status:

**RE-AUDIT READY — PENDING PRODUCTION ALIGNMENT + CANONICAL RECOMPUTE**


---

# DASH-X1 PROTO-EMPEROR — POST-RECOMPUTE QA — 2026-09-22

The canonical Admin refresh completed for all four family Releases.

Verified live state before the public-surface patch:

- recompute queue: **0**
- locked recomputes: **0**
- stale market-method signals: **0**
- hidden valid current offers: **0**
- all four signals recomputed under `market_method_version = v4`

Final family signals:

- `94708` — no public current price / no MV. RCJAZ exact is historical OOS. Empty Market Challenge also found an exact current eBay listing at USD 100, but eBay classifies it Used while seller text says unused/unassembled; European landed cost is not verified. It remains context only.
- standard `18074` — Market Value **EUR 17.49**, supported by 19 recent SOLD / 8 sellers.
- `95450` Black Special — Market Value correctly **null** after the seller-concentration rule; SOLD anchor **EUR 12.72** remains evidence. Canonical current starting offer is **EUR 18.36 item + EUR 15.77 shipping = EUR 34.13 delivered**.
- Sanfrecce Hiroshima 2023 — no public current price / no MV; exact historical evidence exists, while the current exact eBay result is box-only / 10-piece lot and is rejected from kit valuation.

QA exposed one **global public-read/UI defect**, not a Proto-Emperor-specific pricing problem:

- `market_release_signals` already stores canonical `starting_item_price_eur`, `starting_shipping_eur`, `starting_effective_cost_eur`;
- the public market read model was re-deriving `startingItemPriceEUR` from current offer-state ordering;
- Collection, Release detail and inline market surfaces preferred `activeAnchorEUR` before the canonical starting offer.

This could affect **any family and any Release** whose typical ASK anchor differs from the cheapest valid current offer.

The global fix therefore:

1. exposes canonical `startingEffectiveCostEUR` and `startingCostBasis` from the shared public market view;
2. keeps canonical `startingItemPriceEUR` / shipping from the recomputed signal instead of re-deriving the price;
3. makes Collection, Release detail and shared inline market UI prefer canonical starting effective cost before retail/active anchors;
4. adds a regression guard to `scripts/test-market-public-surfaces.mjs`.

No family-specific pricing rule is introduced.

Family status until this patch is merged and Production-aligned:

**QA COMPLETE — PENDING GLOBAL PUBLIC-SURFACE FIX DEPLOY**


---

# DASH-X1 PROTO-EMPEROR — COMPLETION CHECKPOINT — 2026-09-22

The controlled re-audit is closed under the frozen TrackDash method.

Final Production application SHA before this docs-only checkpoint:

`f9a7e75a310c0ba80c51c8754d68389b49503ba8`

Verified:

- GitHub main = Production = `/api/version`
- Vercel Production state: **READY**
- family Release count: **4**
- recompute queue: **0**
- locked recomputes: **0**
- stale market-method signals: **0**
- hidden valid current offers: **0**
- all family signals: `market_method_version = v4`

## Final family result

1. `94708` — 2009 VS
   - identity/catalog/status audited
   - exact image not found after serious audit; placeholder is intentional
   - RCJAZ exact historical OOS evidence
   - Empty Market Challenge completed with an exact current eBay listing, but target condition is unresolved and European landed cost is unknown
   - no public current European price / no MV

2. standard `18074` — Premium 2013
   - canonical JAN `4950344180745`
   - current catalog / active status
   - Market Value **EUR 17.49**
   - recent SOLD evidence: **19 units / 8 sellers**

3. `95450` — Premium Black Special 2019
   - canonical JAN `4950344954506`
   - Market Value **null** under the seller-concentration rule
   - SOLD anchor **EUR 12.72** remains historical evidence
   - canonical cheapest current delivered offer **EUR 34.13**
   - public market surfaces now read the canonical starting offer before the typical ASK anchor
   - the global fix applies to every family/Release, not only `95450`

4. shared-item `18074` — Sanfrecce Hiroshima 2023
   - distinct collector Release
   - exact official Sanfrecce image
   - historical exact sale evidence retained
   - current box-only / multi-piece lot excluded from complete-kit valuation
   - no public current price / no MV

## Global public-market correction closed in PR #200

The final QA found that the engine had already computed canonical `starting_*` fields correctly, while public surfaces could prefer `activeAnchorEUR`.

PR #200 fixed this globally:

- canonical `startingOfferCandidateId` binds observed-offer metadata to the same starting offer when possible;
- canonical `startingItemPriceEUR`, `startingShippingEUR`, `startingEffectiveCostEUR` are carried through the shared public read model;
- Collection, Release detail and shared inline market surfaces prefer the canonical starting effective cost before active/retail anchors;
- regression checks prevent this display drift from recurring.

No Market Engine pricing rule changed.

## Operational status

**DASH-X1 Proto-Emperor — COMPLETE — MARKET THIN**

Documented residuals that do not block Completion:

- `94708` exact image unavailable after audit;
- `94708` and Sanfrecce current market remain thin / valuation-ineligible;
- RCJAZ automatic execution remains a separate global PLANNED transport issue and does not keep this family open.

No further Admin Market Refresh is required for this family.

A COMPLETE family stays closed unless a documented material error is found or an explicit future backfill/migration is planned.
