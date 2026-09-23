# TrackDash — Hot Wheels Vertical

> Dedicated operational record for the Hot Wheels integration.
> Last updated: 2026-09-23.
> This file records every material decision, implementation step, validation result and next action for the Hot Wheels vertical.
> `docs/TRACKDASH_STATE.md` remains the cross-project authoritative checkpoint and must reference material Hot Wheels milestones.

---

## Non-negotiable invariants

1. **Do not regress Mini 4WD.** Existing Mini 4WD catalog, Collection, Wishlist, Scanner, Market Engine, UI terminology, cron behavior and PWA behavior must remain unchanged unless a separate verified Mini 4WD task explicitly changes them.
2. **Reuse before duplicating.** Hot Wheels must use the same Product / Release / Collection / Wishlist / Market foundations wherever possible. Do not create a second app or parallel price engine.
3. **Single Source of Truth remains mandatory.** Catalog identity and market publication continue to come from the canonical database/pipeline.
4. **Exact Release remains the valuation identity.** Hot Wheels must distinguish the collectible commercial Release/variant, not merely the casting/model.
5. **UNKNOWN > INVENTED.** Unverified identifiers, variants, images, prices, SOLDs and dates remain unknown rather than inferred.
6. **Public market semantics are shared.** `Valore stimato`, `Prezzo minimo richiesto`, `Trend prezzi richiesti`, observed ASK/SOLD counts and existing publication guards remain canonical unless a future explicit cross-vertical decision changes them.

---


## Hot Wheels catalog hierarchy — FROZEN 2026-09-23

TrackDash uses the following permanent identity hierarchy for Hot Wheels:

**Product = exact casting → ProductRelease = meaningful commercial variation → Hot Wheels Subvariant = minor physical/package difference**

This was chosen after comparing established collector-catalog patterns rather than treating every visible difference as a separate Release.

### Product = casting

A TrackDash Hot Wheels Product represents the **exact Hot Wheels casting/tooling identity**, not merely the real-world vehicle name.

Two Hot Wheels with the same real-car name but different castings/tooling must not be forced into the same Product merely because they depict the same vehicle.

### ProductRelease = commercial collector Release / major variation

Create a separate TrackDash Release when the market and catalog identity meaningfully distinguish the item, for example:

- different Mattel toy number / SKU;
- different year + line / series;
- Mainline vs Premium / Boulevard / Car Culture / RLC / Elite 64;
- Treasure Hunt / Super Treasure Hunt / Chase;
- retailer / convention / club exclusive when commercially distinct;
- materially different deco/colorway intentionally issued as a collectible variation;
- a retool that is treated by established collector references as a distinct casting identity should normally become a different Product rather than merely a Release.

Release-level Hot Wheels fields include, when verified:

- Mattel identifier(s);
- year;
- line;
- subseries;
- mix/case;
- overall collector number;
- position within the mini-series;
- chase type;
- variation code;
- country of manufacture;
- wheel type;
- exclusivity;
- master series/theme;
- packaging form.

### Subvariant = minor difference under one Release

Do **not** create a new ProductRelease solely for a minor manufacturing/package difference when the underlying commercial release is the same.

Use `hotwheels_release_subvariants` for examples such as:

- regional card/package difference;
- minor wheel variation;
- base variation;
- interior/window variation;
- small deco/tampo variation;
- production-country difference that does not represent a separate commercial issue.

A subvariant may be marked `market_distinct = true` only when reliable collector/market evidence shows that the minor variant should eventually be valued separately. The shared TrackDash Market Engine remains Release-based until explicit subvariant valuation support is implemented.

### Loose vs packaged

Loose vs packaged is primarily a **copy/condition attribute**, not a reason to create duplicate catalog Releases. A separate catalog entry is justified only when the item was genuinely issued as a different commercial configuration (for example a set-only exclusive).

### Why this hierarchy

Reference patterns consulted on 2026-09-23:

- hobbyDB Model Cars guidance: variants belong under the exact same casting; minor wheel/packaging differences are subvariants; loose vs packaged should generally not create duplicate database items:
  `https://help.hobbydb.com/support/solutions/articles/36000580147-model-cars`
- Hot Wheels Newsletter digital catalog consistently exposes:
  `Toy # / Casting / Variation / Country / Year / Wheels / Packaging`, together with series, line, number-in-series, exclusivity and master-series data:
  `https://catalog.hwcollectorsnews.com/`
- HWtreasure distinguishes regular Mainline, Treasure Hunt and Super Treasure Hunt through exact toy number, Mix, overall collector number, mini-series position and chase identity:
  `https://www.hwtreasure.com/2025-super/`

TrackDash does not copy those databases mechanically; these sources are used to validate the **domain model and vocabulary**.

---

## Language invariant — IT / EN

Every new or modified user-facing Hot Wheels surface must be implemented in both:

- **Italiano**
- **English**

This is part of the definition of done for Hot Wheels changes, not a later translation pass.

Whenever a Hot Wheels UI component is added or materially changed:

1. both IT and EN copy must exist in the same work unit;
2. the existing TrackDash locale switch must continue to work;
3. new fixed English-only labels are not acceptable unless the term itself is an industry proper name/acronym (e.g. RLC, SKU, Super Treasure Hunt);
4. the Hot Wheels vertical state file must be updated in the same work unit.

---

## Product architecture

TrackDash is being evolved from a Mini 4WD-only application into one platform with independent collectible verticals:

- `mini4wd` — existing Tamiya Mini 4WD vertical.
- `hotwheels` — new Hot Wheels collector/Premium vertical.

The target architecture is:

**one account → one shared application engine → independent catalog verticals**

Shared where possible:

- authentication/account;
- Collection;
- Wishlist;
- canonical Product / Release identity model;
- price-evidence pipeline;
- Market Value / ASK / SOLD publication logic;
- historical price infrastructure;
- PWA;
- UI components.

Vertical-specific where required:

- catalog metadata;
- identifier vocabulary;
- release matching;
- filters;
- scanner identity rules;
- source adapters;
- research methodology.

No user-facing mixed catalog is planned. Each vertical will have its own catalog context while an account may eventually own items across both.

---

## Rollout roadmap

### Phase 1 — multi-vertical foundation
- add a central vertical registry;
- remove application assumptions that every Product is automatically Mini 4WD;
- retain existing `categories` + `brands` canonical database model;
- no UI/routing changes yet.

### Phase 2 — dormant Hot Wheels catalog identity
- add Mattel brand and Hot Wheels category to canonical catalog data;
- no Hot Wheels Releases yet;
- no public navigation yet;
- confirm Mini 4WD queries remain isolated and unchanged.

### Phase 3 — vertical-aware queries / routing shell
- add explicit catalog filtering by vertical;
- design stable URL/context strategy;
- preserve legacy Mini 4WD URLs or provide safe compatibility routing;
- no mass data import.

### Phase 4 — five real pilot Releases
One representative Release from each useful collector segment:
- RLC;
- Elite 64;
- Super Treasure Hunt / Chase;
- Boulevard;
- Car Culture.

Validate end to end:
catalog → exact identity → image strategy → ASK → SOLD → market publication → Collection → Wishlist.

### Phase 5 — 40-Release data pilot
Use the research sample to measure:
- EU ASK coverage;
- recent SOLD coverage;
- seller diversity;
- exact-release matching quality;
- EUR/Europe usefulness;
- MV publication rate;
- trend feasibility;
- source/API sustainability.

### Phase 6 — public Hot Wheels experience
Only after the data pilot is credible:
- onboarding vertical choice;
- vertical switcher;
- public Hot Wheels catalog;
- Hot Wheels-specific filters/metadata;
- wider catalog ingestion.

---

## Data-source working hypothesis

Pilot stack, still to be validated before Production dependency:

- eBay Browse API → active ASK;
- commercial SOLD providers such as SoldComps / CompSniper → pilot SOLD research only until licensing/sustainability is verified;
- Mattel / reliable collector databases / retailers → identity and reference research;
- European retailers → retail availability/reference;
- future TrackDash user purchase records → proprietary Europe-first transaction evidence.

hobbyDB may be useful as a partner/reference source but is not required for the first pilot.

---

## Images

Image availability and image rights are separate concerns.

For early internal pilots:
- exact-release images from official/retailer/reference sources may be used to verify identity;
- placeholders are acceptable in TrackDash until a publishable asset is licensed or contributed.

For a public catalog:
- do not silently republish third-party product photography as permanent TrackDash catalog assets without suitable rights;
- preferred long-term paths are Mattel authorization/asset partnership, retailer/data partnership, or contributor-licensed user photography;
- marketplace listing images remain tied to marketplace evidence and must not automatically become the canonical Release image.

---

## Deployment discipline — Vercel

Because the current Vercel plan is hitting build-rate limits, Hot Wheels work should minimize automatic Preview/Production deployments.

Working rule:

1. continue multiple small verified implementation steps on the same Hot Wheels feature branch;
2. use GitHub Actions `typecheck` + `verify` after code changes;
3. avoid automatic Vercel Preview builds on the Hot Wheels working branch;
4. merge only at meaningful macro-checkpoints;
5. perform one Production deploy + QA per macro-checkpoint;
6. use a manual Preview only when a visual/runtime check cannot reasonably wait for the macro-checkpoint.

Current working branch:
`feat/hotwheels-multivertical-foundation`

Current PR:
**#211 — Add multi-vertical foundation for Hot Wheels**

Base `main` at branch creation:
`0e091747ad6a4944ba16aa0c5bfecda8c0f90168`

---

## Implementation log

### 2026-09-23 — Step 1: multi-vertical foundation

Status: **implemented on branch, not merged to main**.

Changes:

- added `lib/verticals.ts`;
- registered `mini4wd` and `hotwheels`;
- widened `ProductCategory` from the Mini 4WD-only literal to the central vertical type;
- changed the DB-to-app Product mapper so category is resolved from the canonical eager-loaded DB category instead of hardcoded `"mini4wd"`;
- unsupported/missing verticals fail closed rather than silently becoming Mini 4WD.

Explicitly untouched:

- no Supabase schema/data migration;
- no Hot Wheels brand/category row yet;
- no Hot Wheels Release;
- no route or public navigation change;
- no onboarding change;
- no Collection/Wishlist behavior change;
- no Scanner behavior change;
- no Market Engine or market terminology change;
- no Mini 4WD catalog data change.

Validation so far:

- PR #211 opened;
- `typecheck`: SUCCESS;
- full `verify`: running at the time this step was first recorded;
- Vercel Preview attempt hit the existing build-rate limit; this is not a code failure.

---

### 2026-09-23 — Deployment policy applied

Status: **implemented on branch, not merged to main**.

`vercel.json` now disables automatic Git deployments specifically for:

`feat/hotwheels-multivertical-foundation`

Production behavior on `main` is intentionally unchanged. This is a working-branch optimization only, intended to avoid consuming Vercel Preview build capacity while the Hot Wheels macro-block is developed and validated through GitHub Actions.

---

### 2026-09-23 — Step 2: dormant canonical catalog identities

Status: **applied to live Supabase and represented on the working branch; no public Hot Wheels catalog yet**.

Canonical reference identities added:

- brand: `Mattel`
  - id: `6f100164-74bd-56bd-9dd1-221ea269ed8a`
  - slug: `mattel`
- category/vertical: `Hot Wheels`
  - id: `cdaaff01-f4f9-52ff-951a-ddbbba542d5c`
  - slug: `hotwheels`

Repository representation:

- `supabase/migrations/0145_hotwheels_vertical_foundation.sql`
- canonical IDs also pinned in `lib/verticals.ts`

Live verification after insertion:

- `mini4wd`: **55 products**
- `hotwheels`: **0 products**

Therefore this step changes no visible catalog content and cannot mix Hot Wheels into the existing Mini 4WD catalog.

Important deployment state:

- live Supabase now contains the dormant Mattel/Hot Wheels reference rows;
- application `main` / Production code is still unchanged;
- PR #211 remains unmerged.

---

### 2026-09-23 — Step 3: vertical-isolated catalog queries

Status: **implemented on branch, not merged to main**.

Changes:

- added `listProductsForVertical(vertical, limit)` in the canonical catalog query layer;
- the query filters by the canonical category ID from `lib/verticals.ts`;
- added `fetchCatalogProductsForVertical(vertical)` in the server action layer;
- the legacy `fetchCatalogProducts()` remains a compatibility wrapper explicitly pinned to `mini4wd`.

Isolation invariant:

- existing `/catalog` continues to receive only Mini 4WD products;
- future Hot Wheels routes can request `hotwheels` explicitly;
- Collection/Wishlist ID-based hydration remains cross-vertical and is intentionally not filtered, because a future user may own both verticals in one account.

No public routing/UI change has been made in this step.

---

### 2026-09-23 — Step 4: Hot Wheels identity schema foundation

Status: **implemented on branch and applied to live Supabase; tables intentionally empty**.

New shared table:

- `release_identifiers`
  - generic per-Release identifier registry;
  - supports multiple schemes such as Mattel product code, UPC/EAN and future vertical identifiers;
  - reused identifiers are allowed across different Releases;
  - lookup index on `scheme + value`;
  - public read only through RLS/policies;
  - existing Mini 4WD `item_number` / `barcode_jan` remain untouched and authoritative for the current scanner.

New Hot Wheels-specific extension:

- `hotwheels_release_details`
  - one row per Hot Wheels Release;
  - `line_slug`, `line_name`, `subseries`, `mix_code`, `collector_number`, `series_position`, `chase_type`, `packaging_variant`;
  - JSON metadata only for long-tail attributes that do not yet justify dedicated columns.

Repository migration:

`supabase/migrations/0146_hotwheels_release_identity_foundation.sql`

Live verification after migration:

- `release_identifiers`: **0 rows**
- `hotwheels_release_details`: **0 rows**
- Mini 4WD products: **55**
- Hot Wheels products: **0**

Supabase advisor result:

- no new security finding is attached to either new table;
- both tables have RLS + explicit public SELECT policy/grant;
- their new indexes are currently reported as unused only because the tables are empty;
- existing unrelated project advisor warnings remain separate work and were not changed by this Hot Wheels block.

Mini 4WD preservation:

- no Mini 4WD Release, identifier, Collection row, Wishlist row, scanner index or market observation was migrated or rewritten;
- no backfill into `release_identifiers` was performed.

---

## Exact next action

Before adding any Hot Wheels Release:

1. merge PR #211 as the first multi-vertical macro-checkpoint only after current branch checks remain green;
2. verify Vercel Production and `/api/version` align with the merged main;
3. QA that the existing Mini 4WD catalog/Collection/Scanner public behavior is unchanged;
4. after Production parity is confirmed, start the next Hot Wheels branch for the dormant UI/routing shell and first 5 pilot Releases.


---

## POST-MERGE MACRO CHECKPOINT — 2026-09-23

First multi-vertical foundation checkpoint is now **MERGED + PRODUCTION VERIFIED**.

Merged PR:

**#211 — Add multi-vertical foundation for Hot Wheels**

Merged main SHA:

`7622532749372909c6589b50be447114d9260db5`

Vercel Production:

`dpl_3kAHSnjXnEiCSAkSc66nZUg1q2SG`

Production state:

**READY**

Verified:

- GitHub `main` = `7622532749372909c6589b50be447114d9260db5`
- `https://trackdash.it/api/version` = `7622532749372909c6589b50be447114d9260db5`
- public `/catalog` = HTTP 200
- public catalog still exposes **55 Mini 4WD products**
- no Hot Wheels Product/Release is mixed into the legacy catalog
- Collection and Scanner protected routes still resolve correctly through Auth
- Vercel runtime errors in the immediate post-deploy window: **none observed**

Live Supabase foundation remains:

- `mini4wd`: 55 products
- `hotwheels`: 0 products
- `release_identifiers`: 0 rows
- `hotwheels_release_details`: 0 rows

This is the point at which Mini 4WD catalog/family work may safely resume in parallel, provided shared infrastructure is not being refactored simultaneously.

### Parallel-work rule

Safe in parallel:

- Mini 4WD family audit/data work;
- Hot Wheels Release research/import;
- vertical-specific market/source research.

Coordinate before parallel edits to:

- shared Collection engine;
- shared Wishlist engine;
- shared Scanner engine;
- shared Market Engine/publication policy;
- common navigation/onboarding;
- shared DB schema.

Current Hot Wheels continuation branch:

`feat/hotwheels-pilot-shell`

Automatic Vercel Preview deployments are disabled for branches matching:

`feat/hotwheels-*`

### Exact next Hot Wheels action

1. create the dormant Hot Wheels routing/shell behind a non-public gate;
2. keep existing Mini 4WD routes unchanged;
3. prepare the first 5 real Hot Wheels pilot Releases;
4. only after those work end-to-end, expand to the 40-Release pilot.


### 2026-09-23 — Step 5: dormant gated Hot Wheels shell

Status: **implemented on `feat/hotwheels-pilot-shell`, not merged to main**.

Changes:

- `lib/verticals.ts` now carries:
  - `basePath`
  - `publicEnabled`
- Mini 4WD:
  - `basePath = ""`
  - `publicEnabled = true`
- Hot Wheels:
  - `basePath = "/hotwheels"`
  - `publicEnabled = false`

Dormant routes added:

- `/hotwheels`
- `/hotwheels/catalog`

Current behavior while the gate is false:

- both routes fail closed with 404;
- no navigation entry is added;
- no onboarding choice is added;
- no crawler indexing is allowed for the Hot Wheels catalog shell;
- legacy Mini 4WD routes remain unchanged.

The Hot Wheels catalog shell already uses `fetchCatalogProductsForVertical("hotwheels")` when enabled, so it is structurally isolated from the Mini 4WD catalog.

Next action remains the first five real pilot Releases; the public gate stays false until those are validated end-to-end.


### 2026-09-23 — Step 6: first five pilot Releases seeded

Status: **applied to live Supabase; still hidden behind the Hot Wheels public gate**.

Pilot set:

1. **RLC '71 Lamborghini Miura P400 SV — HWF11**
   - year: 2025
   - line: Red Line Club
   - official Mattel source
2. **Elite 64 Aston Martin Valkyrie — HWR91**
   - year: 2025
   - line: Elite 64
   - official Mattel source
3. **2025 Super Treasure Hunt '87 Audi quattro — JBC35**
   - year: 2025
   - line: Mainline / Factory Fresh 2/5
   - Mix A
   - 016/250
   - two independent trusted collector references
4. **Boulevard Alfa Romeo GTV6 3.0 — JBL16**
   - year: 2025
   - line: Boulevard
   - official Mattel source
5. **Car Culture Silhouettes LB-ER34 Super Silhouette Nissan Skyline — JBK59**
   - year: 2025
   - line: Car Culture / Silhouettes 1/5
   - official Mattel source + collector corroboration for color/series position

Repository migration:

`supabase/migrations/0148_hotwheels_pilot_five_releases.sql`

Cross-vertical hardening immediately before the seed:

- migration `0147_product_rarity_optional.sql`;
- Product rarity may now be NULL;
- existing Mini 4WD rarity values were not changed;
- Hot Wheels pilot rows intentionally use NULL rarity rather than an invented rarity label.

Live verification after seed:

- Mini 4WD products: **55**
- Hot Wheels products: **5**
- Hot Wheels exact Releases: **5**
- `release_identifiers`: **5 rows**
- `hotwheels_release_details`: **5 rows**
- Hot Wheels provenance rows: **7**

Image policy for the pilot:

- no Mattel/retailer image is copied into `product_images` or `release_images`;
- official pages are stored as provenance/reference URLs only;
- UI uses TrackDash placeholder art until a publishable/licensed canonical image is available.

No market observations have been seeded. ASK/SOLD/MV remain a separate next step.


### 2026-09-23 — Step 7: private Hot Wheels pilot Preview

Status: **READY — private Vercel Preview QA passed; not merged to Production**.

Preview branch:

`feat/hotwheels-pilot-shell`

Preview commit:

`4036fbee1227b5bf0e6cdcce3a74e6008f45189c`

Vercel Preview deployment:

`dpl_BPBRn4f68WvPNSvcX3RCUr5Ws8jX`

Stable branch Preview hostname:

`trackdash-git-feat-hotwheels-pilot-shell-mercseba-8773.vercel.app`

QA verified:

- `/hotwheels/catalog` → HTTP 200;
- all five pilot identifiers are rendered: `HWF11`, `HWR91`, `JBC35`, `JBL16`, `JBK59`;
- exact Release detail route for the RLC Miura `HWF11` → HTTP 200;
- Release detail renders the expected identity and the intentional “Initial scan not run yet” market placeholder;
- Production `/catalog` still renders **55 Mini 4WD products**;
- Hot Wheels is **not exposed on Production** because PR #212 is still unmerged and the Production Hot Wheels gate remains disabled.

Preview authentication correction:

- root `proxy.ts` now treats `/hotwheels` as public-content routing, so signed-out Preview visitors can reach the pilot;
- this does not open Production Hot Wheels by itself: the server-side vertical gate remains authoritative.

Preview-only environment warning:

- Vercel reports a non-fatal R3 bootstrap warning because the Preview environment does not currently expose `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`;
- Hot Wheels pilot catalog/detail pages still render HTTP 200;
- Production has not shown this as a Hot Wheels runtime regression;
- do not modify the shared Market Engine merely to silence this Preview environment warning.

Deployment discipline restored after QA:

- automatic Vercel previews are disabled again for `feat/hotwheels-*`;
- no additional Preview should be created for ordinary follow-up commits unless a new visual/runtime QA checkpoint explicitly requires one.

### Exact next Hot Wheels action

1. keep PR #212 unmerged while the user reviews the private Preview;
2. start the first exact-release Market Intelligence scan on the five pilot Releases;
3. validate eBay EU ASK matching first;
4. validate a sustainable SOLD source separately before treating third-party SOLD data as a Production dependency;
5. attach market observations to the existing shared TrackDash Market Engine rather than creating a Hot Wheels-specific price engine;
6. only after identity + market + Collection/Wishlist parity are proven, decide the next Production merge/public-opening checkpoint.


### 2026-09-23 — Step 8: catalog hierarchy hardening

Status: **implemented on branch + applied to live Supabase after green CI**.

Architecture changes:

- TrackDash Product is now formally defined as the exact Hot Wheels **casting**;
- ProductRelease is the meaningful commercial collector variation;
- minor manufacturing/package differences use a dedicated `hotwheels_release_subvariants` table instead of creating unnecessary Release rows.

New standard Release detail fields:

- `variation_code`
- `country_of_manufacture`
- `wheel_type`
- `exclusivity`
- `master_series`
- `theme`

New subvariant structure:

- code/name;
- country of manufacture;
- wheel type;
- packaging;
- base/interior/window/deco differences;
- verification status + source;
- `market_distinct` future-value flag.

Repository migration:

`supabase/migrations/0149_hotwheels_casting_variant_model.sql`

The existing five pilot Releases are not split or rewritten by this migration.

Bilingual UI hardening in the same branch:

- Hot Wheels pilot shell now includes the existing TrackDash language switch;
- catalog hero/cards/details are implemented in Italian and English;
- `/hotwheels/*` is included in the public-locale bootstrap paths;
- new Hot Wheels Release fields are displayed only when verified/present.

No Vercel Preview was intentionally requested for this ordinary follow-up block; automatic Hot Wheels previews remain disabled.


### 2026-09-23 — Step 9: first complete Hot Wheels casting family

Status: **LIVE IN SUPABASE — catalog-only; public Hot Wheels gate still closed**.

Casting:

**LB-ER34 Super Silhouette Nissan Skyline**

Product ID:

`5fbe93c1-ec35-5351-a34f-f754cd032920`

Canonical/debut Release:

`HCJ81 — Car Culture Mountain Drifters 4/5 — 2022`

Canonical Release ID:

`f16ed92f-34fb-5fd6-bd8b-c26ff3e831ee`

Verified canonical family:

1. `HCJ81` — 2022 — Car Culture / Mountain Drifters — 4/5 — Red — A1
2. `HCK01` — 2022 — Car Culture / Mountain Drifters — 0/5 Chase — Black — B1
3. `HCN54` — 2022 — Team Transport #44 / Fleet Street — Imperial red — C1
4. `HKF21` — 2023 — Boulevard #70 — White — D1
5. `HKF49` — 2023 — Car Culture 2-Pack Nissan Skylines — Red — set SKU
6. `HPX97` — 2023 — Team Transport Fast & Furious / Carry On — Silver
7. `JDJ24` — 2024 — Boulevard All Stars — White — D2
8. `JBK59` — 2025 — Car Culture / Silhouettes — 1/5 — White — F1
9. `JKF36` — 2026 — Car Culture / Aérostyles — 0/5 Chase — Gold — G1

Live verification:

- Product count for this casting: **1**
- Release count under the casting: **9**
- canonical release points to `HCJ81`
- original release year: **2022**
- all nine Releases have Hot Wheels line/series identity;
- verified variation codes are stored when supported by the reference catalog;
- manufacturing country and wheel type are stored when verified;
- no Mini 4WD Product or Release was changed.

Repository migration:

`supabase/migrations/0150_hotwheels_lb_er34_family.sql`

### Deliberately unresolved / not promoted

**2023 HKF21 ZAMAC — reported 10 produced**

A collector reference reports an ultra-limited ZAMAC version made for a Liberty Walk Los Angeles pop-up.

Current handling:

- NOT inserted as a canonical Release;
- NOT inserted as a verified Subvariant yet;
- candidate classification: **Subvariant, likely market-distinct**;
- requires independent corroboration before public catalog/market publication.

**HPX97 Chase wording**

One collector checklist labels the 2023 Fast & Furious Team Transport `HPX97` as CHASE, while another detailed reference confirms the release but does not explicitly present the Skyline itself as a chase.

Current handling:

- Release is canonical and verified;
- `chase_type` remains NULL;
- secondary chase wording is retained only as context metadata;
- no public Chase label until stronger corroboration exists.

### Family-model result

This family validates the intended Hot Wheels structure:

- one casting can contain many collector Releases;
- different line/SKU/year/deco issues remain separate Releases;
- repackaging with a new Mattel identifier can remain a separate commercial Release;
- minor physical differences do not automatically multiply Release rows;
- uncertain micro-variants remain UNKNOWN / pending rather than being invented.

### Exact next Hot Wheels action

**Market Intelligence pilot on the five original pilot identities + the now-expanded LB-ER34 family.**

Order:

1. define exact eBay ASK queries and exclusion rules per Release;
2. run controlled EU-first ASK audit;
3. measure false-positive rate when matching casting vs exact Release;
4. validate SOLD provider/licensing path separately;
5. only after clean matching, write market observations into the shared TrackDash engine;
6. do not merge/open public Hot Wheels UI until market + Collection/Wishlist behavior is validated.

Do not create a new Vercel Preview for catalog-only follow-up commits unless a visual QA checkpoint is explicitly useful.


### 2026-09-23 — Step 10: definitive casting data layer

Status: **IMPLEMENTED ON BRANCH + APPLIED TO LIVE SUPABASE — public Hot Wheels gate still closed**.

This step does **not** change the frozen hierarchy from Step 8/9. It completes it.

Permanent hierarchy remains:

**Product = exact Casting → ProductRelease = meaningful commercial Release → Subvariant = minor physical/package difference**

#### Schema reconciliation

The already-live Release/Subvariant model from migration `0149_hotwheels_casting_variant_model.sql` remains authoritative and unchanged:

Release-level fields retained:

- `variation_code`
- `country_of_manufacture`
- `wheel_type`
- `exclusivity`
- `master_series`
- `theme`
- existing line/subseries/mix/collector/chase/packaging fields

Subvariant fields retained:

- code/name
- country of manufacture
- wheel type
- packaging
- base/interior/window/deco variation
- `market_distinct`
- verification + source metadata

No duplicate competing schema was introduced.

#### New casting-level extension

Migration:

`supabase/migrations/0151_hotwheels_casting_details.sql`

New tables:

- `hotwheels_casting_details`
- `hotwheels_casting_sources`

Casting-level facts now have dedicated queryable fields:

- real/model reference
- designer
- casting debut year
- debut series
- scale when verified
- verification status
- casting-specific metadata

Casting provenance is stored separately from Release provenance so future audits can explain exactly why a designer/debut fact exists.

#### First verified casting backfill

**LB-ER34 Super Silhouette Nissan Skyline**

- Product ID: `5fbe93c1-ec35-5351-a34f-f754cd032920`
- designer: **Mark Jones**
- casting debut year: **2022**
- debut series: **Car Culture: Mountain Drifters**
- model reference: **Nissan Skyline R34 with Liberty Walk LB-ER34 Super Silhouette body kit**
- verification status: **verified**
- casting sources: **3**
- existing Release count remains: **9**

Sources recorded at casting level:

- Orange Track Diecast casting database
- Hot Wheels Newsletter
- Hot Wheels collector reference for body-kit/debut corroboration

#### UI / language

The pilot catalog now reports both:

- number of exact Releases
- number of distinct Castings

Exact Release detail shows a separate **Casting / famiglia** block before Release-specific facts.

For LB-ER34 this includes, in both Italiano and English:

- casting debut
- debut series
- designer
- number of Releases in the family

No user-facing Hot Wheels copy was added in English-only form.

#### Validation

Branch checkpoint before the live migration:

- `typecheck`: **SUCCESS**
- `verify`: **SUCCESS**

Live verification after migration:

- Mini 4WD Products: **55**
- Hot Wheels Products/Castings: **5**
- LB-ER34 Releases: **9**
- LB-ER34 casting sources: **3**
- new casting tables have RLS enabled and explicit SELECT policies for `anon` + `authenticated`
- no new security-advisor finding is attached to the new Hot Wheels casting tables

No Vercel Preview was requested for this data/schema follow-up; automatic Hot Wheels previews remain disabled.

### Exact next Hot Wheels action

The catalog model is now considered **structurally frozen for the pilot**.

Do not add more schema layers before market evidence proves one is required.

Proceed with:

1. exact-release eBay EU ASK query rules for the five original pilot identities and the full LB-ER34 family;
2. false-positive/false-negative measurement per Release;
3. controlled ASK ingestion through the shared TrackDash market pipeline;
4. independent SOLD provider/licensing validation;
5. Market Value only where shared TrackDash consolidation rules pass;
6. Collection/Wishlist parity after market signals exist;
7. then decide the next merge/public-opening checkpoint.



### 2026-09-23 — Step 11: Hot Wheels eBay ASK matching foundation

Status: **IMPLEMENTED + GREEN ON PR #212 — real Production eBay audit not yet executed**.

Scope is Hot Wheels-only. Existing Mini 4WD eBay matching/worker behavior is intentionally unchanged.

#### Shared transport reused without changing Mini 4WD behavior

The existing eBay Browse adapter now also exposes generic read-only transport required by Hot Wheels:

- `searchEbayActiveListingsByQuery(query, marketplace, limit)`
- `fetchEbayActiveItemDetails(itemId, marketplace)`

The new item-detail read exposes, when returned by eBay:

- MPN
- GTIN
- brand
- localized item aspects

No existing Mini 4WD classifier, query builder, worker, lifecycle rule or market write path was modified to call these new Hot Wheels flows.

#### Dedicated Hot Wheels matcher

New module:

`lib/market/automation/hotwheels-ebay-matcher.ts`

Pilot matching policy:

1. exact Mattel identifier in title + compatible casting → **accepted**;
2. compatible casting/line/chase context without identifier → **needs_review**;
3. sibling Release identifier → **rejected**;
4. wrong casting → **rejected**;
5. regular Release with Chase/STH wording → **rejected**;
6. Chase target without exact identifier stays review-only;
7. loose/custom/wheel-swap/card-only/accessory listings → **rejected**;
8. ordinary lots/bundles → **rejected**;
9. legitimate Team Transport / 2-Pack package wording is allowed.
10. regional / Factory Set / short-card packaging wording stays **needs_review** even with an exact code, because it may represent a meaningful Subvariant rather than the baseline package.

Exact-title acceptance reason:

`MATTEL_IDENTIFIER_EXACT`

#### Second-pass eBay item-detail resolution

Review-only listings may receive a bounded read-only `getItem` lookup.

New resolver:

`refineHotWheelsEbayListingWithItemDetails(...)`

If the target Mattel code appears in MPN / GTIN / item aspects, including inside a longer identifier such as:

`JBC35-N521`

the listing may be promoted to:

`MATTEL_IDENTIFIER_ITEM_DETAILS`

If a sibling code is found instead, the listing is rejected as:

`SIBLING_RELEASE_IDENTIFIER_ITEM_DETAILS`

If no code is found or the detail lookup fails, the listing remains review-only.

A rejected title can never be upgraded by the second pass.

#### Read-only Hot Wheels ASK audit runner

New module:

`lib/market/automation/hotwheels-ebay-audit.ts`

It automatically derives the current Hot Wheels Release profiles from canonical DB data rather than maintaining a separate hardcoded list.

Current live audit population:

**13 unique Hot Wheels Releases**

because the original five pilot identities overlap with the nine-Release LB-ER34 family through `JBK59`.

Europe-first marketplaces:

- EBAY_IT
- EBAY_DE
- EBAY_FR
- EBAY_ES
- EBAY_GB

The audit runner performs **no market writes**:

- no `market_candidates`
- no `market_offer_states`
- no scan queue writes
- no recompute
- no Market Value publication

It reports:

- raw counts per marketplace
- unique listings
- accepted / needs-review / rejected counts
- decision reason codes
- bounded item-detail resolution status

#### Production Admin audit panel

New admin-only action/component:

- `lib/actions/hotwheels-admin.ts`
- `components/admin/hotwheels-market-audit.tsx`

Access remains protected by the existing TrackDash:

**Admin + MFA (AAL2)**

UI is implemented in both Italiano and English.

The panel:

- loads only Hot Wheels Release profiles;
- runs one Release at a time;
- defaults to exact-code query only;
- optionally enables the context query for recall measurement;
- is explicitly labelled **Read only / Solo lettura**;
- displays accepted / review / rejected results and second-pass status.

#### Why Production is required for the first API audit

A temporary Preview-only diagnostic was tested and then completely removed.

Preview environment result:

`EBAY_BROWSE_CREDENTIALS_NOT_CONFIGURED`

Therefore TrackDash eBay Production credentials are not duplicated into Vercel Preview.

This is intentional and remains unchanged.

The temporary Preview audit route and proxy exception were removed, and automatic `feat/hotwheels-*` Preview deploys are disabled again.

The first real eBay API audit must therefore run through the protected Production Admin panel after the next macro merge/deploy.

#### Empirical title-pattern finding

Public eBay checks confirmed that exact Mattel codes are often absent from listing titles even when present in item specifics / MPN.

This validates the two-stage strategy:

**title exact code → strong auto-match**

**context match without code → review → bounded getItem MPN/GTIN check**

rather than either:

- rejecting all no-code listings; or
- auto-accepting fuzzy casting matches.

#### Validation

Latest branch:

- `typecheck`: **SUCCESS**
- `verify`: **SUCCESS**
- Hot Wheels matcher tests are part of `market:adapter:test`
- new eBay item-detail transport is covered by mocked adapter tests
- PR #212 remains mergeable
- Mini 4WD tests remain green

### Exact next Hot Wheels action

This is now a meaningful macro-checkpoint.

Next sequence:

1. merge PR #212 once the checkpoint documentation is included;
2. verify Production main / Vercel / `/api/version` alignment;
3. from Admin + MFA, run the first read-only eBay ASK audit on `HCJ81`;
4. inspect exact/review/reject quality before enabling the context query;
5. continue one Release at a time across the 13 pilot Releases;
6. do **not** persist eBay observations into the Market Engine until matching precision is accepted;
7. SOLD provider/licensing validation remains a separate later gate.



### 2026-09-23 — Step 12: ASK matcher safety reconciliation

Status: **IMPLEMENTED + GREEN — read-only; no Hot Wheels market rows written**.

This step reconciles the two experimental eBay item-detail paths into one canonical flow:

**Browse search → title classifier → bounded getItem only for identity review → structured MPN/GTIN/aspect refinement**

There is now only one item-detail transport:

`fetchEbayActiveItemDetails(itemId, marketplace)`

and one Hot Wheels structured refinement path:

`refineHotWheelsEbayListingWithItemDetails(...)`

#### Canonical Hot Wheels market condition

For the current TrackDash Hot Wheels market pilot, the canonical object is:

**NEW + unopened + original commercial packaging/card**

This mirrors the Mini 4WD principle of valuing the complete original new item while remaining Hot Wheels-specific.

Automatic ASK rejection includes explicit title evidence such as:

- loose;
- opened / unsealed;
- open or opened blister;
- damaged/cracked blister;
- damaged card;
- no card / without card;
- custom / wheel swap;
- card-only / blister-only / protector-only;
- reproduction/accessory-only cases;
- ordinary lots/bundles when the commercial product itself is not a multi-item release.

Legitimate Team Transport and official 2-Pack releases remain valid commercial forms.

#### Packaging / Subvariant guard

The following explicit packaging wording remains **needs_review**, even when the exact Mattel code is present:

- Factory Sealed Set / Factory Set;
- short card;
- international card;
- long card;
- regional card.

Reason:

`PACKAGE_SUBVARIANT_REVIEW`

The exact Release identity can be correct while the package represents a meaningful Subvariant. These observations must not silently become the baseline new-carded ASK.

#### Structured identifier refinement — constrained

A second-pass eBay `getItem` call is allowed only when the first-pass review is caused by:

`IDENTIFIER_NOT_IN_TITLE`

The structured read may use:

- MPN;
- GTIN;
- localized item specifics/aspects.

An identifier embedded in a longer structured value is supported, for example:

`JBC35-N521` → target Mattel code `JBC35`.

Accepted second-pass reason:

`MATTEL_IDENTIFIER_ITEM_DETAILS`

Sibling-code evidence still rejects the listing:

`SIBLING_RELEASE_IDENTIFIER_ITEM_DETAILS`

Important fail-closed rule:

Structured item details **cannot** override an independent review reason such as:

- `PACKAGE_SUBVARIANT_REVIEW`;
- `RELEASE_DISCRIMINATOR_MISSING`.

The audit runner also skips unnecessary `getItem` calls for those non-identity review cases.

#### Verification

Latest branch checks after reconciliation:

- `typecheck`: **SUCCESS**
- `verify`: **SUCCESS**
- Hot Wheels matcher tests include damaged/open package rejection;
- packaging-subvariant review regression;
- MPN/detail promotion;
- longer MPN value such as `JBC35-N521`;
- sibling-code rejection;
- protection against promoting packaging review through item details.

Live Hot Wheels market table check:

- Hot Wheels Releases: **13**
- `market_candidates`: **0**
- `market_offer_states`: **0**
- `market_release_signals`: **0**

Therefore all Hot Wheels eBay work up to this checkpoint is still diagnostic/read-only.

#### Preview credential finding

The temporary Preview diagnostic correctly returned:

`EBAY_BROWSE_CREDENTIALS_NOT_CONFIGURED`

TrackDash Production eBay secrets are intentionally not copied to Preview.

The Preview diagnostic/proxy exception was removed. The supported first real audit path is the protected Production Admin + MFA panel already implemented in Step 11.

### Exact next Hot Wheels action

This completes the Hot Wheels ASK-matching macro-block.

Next sequence:

1. merge PR #212;
2. verify `main = Vercel Production = /api/version`;
3. keep Hot Wheels public catalog gate closed;
4. from protected Admin + MFA, run the first read-only ASK audit on `HCJ81` using exact-code query only;
5. inspect accepted/review/rejected quality;
6. only then test context-query recall;
7. proceed one Release at a time across the 13 pilot Releases;
8. do **not** write Hot Wheels market candidates/offers/signals until matching precision is explicitly accepted;
9. SOLD source/licensing validation remains a separate later gate.


### 2026-09-23 — Step 13: Production ASK audit checkpoint

Status: **PR #212 MERGED + PRODUCTION VERIFIED — first real eBay audit ready in Admin**.

Merged PR:

**#212 — Prepare gated Hot Wheels pilot shell**

Production application SHA:

`19097c9c66e07a7b774e40bbb1284185521f421c`

Vercel Production:

`dpl_EMHbukor1R4hnzzXPaWbtwBeQHQG`

Post-deploy QA:

- GitHub `main` = **`19097c9c66e07a7b774e40bbb1284185521f421c`**
- `https://trackdash.it/api/version` = **`19097c9c66e07a7b774e40bbb1284185521f421c`**
- Vercel Production state = **READY**
- public Mini 4WD `/catalog` = HTTP 200 and still reports **55 Mini 4WD models**
- public `/hotwheels/catalog` = HTTP 404 by design
- no error/fatal runtime log observed on the new Production deployment during immediate post-deploy QA
- Hot Wheels market rows remain: candidates **0**, offers **0**, signals **0**

Important environment result:

- Production contains the existing eBay credentials required by the read-only Admin audit;
- Preview credentials remain intentionally absent;
- no Hot Wheels market write path has been enabled.

### Exact next Hot Wheels action

Run the first real API audit from the protected TrackDash Admin + MFA panel:

**HCJ81 — 2022 Car Culture Mountain Drifters 4/5**

Initial mode:

- exact-code query only;
- context query OFF;
- read-only;
- no candidate/offer/signal writes.

Evaluate:

- exact accepted listings;
- review cases;
- rejected false positives;
- item-detail MPN recovery;
- packaging/Subvariant reviews.

Only after HCJ81 precision is judged clean should the context query be enabled to measure recall, and only then proceed through the remaining 12 pilot Releases.


### 2026-09-23 — Step 14: read-only audit observability

Status: **IMPLEMENTED ON BRANCH — no market writes introduced**.

The first real HCJ81 Admin audit completed successfully in Production, but the read-only design intentionally left no persisted audit result and no server summary.

To avoid requiring screenshots for every pilot Release, the protected Admin audit action now emits one structured Production log entry per completed run:

`[hotwheels-ebay-audit]`

The log contains only public/listing diagnostic data required for QA:

- Release ID / Mattel identifier / casting;
- exact vs context-query mode;
- raw result counts by eBay marketplace;
- unique / accepted / review / rejected totals;
- reason-code histogram;
- second-pass item-detail lookup histogram;
- a bounded sample of accepted/review public listings with title, marketplace, price, shipping and reason codes.

It does **not** log:

- user/session/auth data;
- eBay credentials/tokens;
- Supabase secrets;
- private account data.

It does **not** write:

- market candidates;
- offer states;
- market signals;
- recompute jobs.

Purpose:

- allow the controlled 13-Release pilot to be evaluated directly from Vercel runtime logs;
- keep the Market Engine untouched until exact-release precision is accepted;
- reduce repeated manual screenshot exchange during audit QA.

The existing Hot Wheels public gate remains closed and Mini 4WD matching/worker behavior remains untouched.

### Exact next Hot Wheels action

After this observability patch reaches Production:

1. re-run **HCJ81** with exact-code query only;
2. inspect the `[hotwheels-ebay-audit]` Production log;
3. measure accepted/review/rejected quality and second-pass MPN recovery;
4. only if precision is clean, enable context-query recall for HCJ81;
5. then proceed through the remaining 12 pilot Releases one at a time.


### 2026-09-23 — Step 15: first real HCJ81 audit result

Status: **FIRST PRODUCTION READ-ONLY AUDIT OBSERVED — no market writes**.

Release:

**HCJ81 — 2022 Car Culture Mountain Drifters 4/5**

Mode:

- exact-code query only;
- context query OFF;
- read-only;
- original new/carded market condition;
- no candidates/offers/signals persisted.

Observed result:

- raw eBay results across IT/DE/FR/ES/GB: **27**
- unique listings after dedupe: **19**
- accepted: **2**
- needs review: **11**
- rejected: **6**

Marketplace raw counts:

- IT: **7**
- DE: **2**
- FR: **0**
- ES: **8**
- GB: **10**

Reason-code distribution:

- `IDENTIFIER_NOT_IN_TITLE`: **11**
- `MATTEL_IDENTIFIER_ITEM_DETAILS`: **1**
- `CASTING_NOT_CONFIRMED`: **6**
- `MATTEL_IDENTIFIER_EXACT`: **1**

Second-pass detail enrichment:

- matched: **1**
- no match: **4**
- limit reached: **7**
- not needed: **7**

Interpretation:

- the accepted set is high-confidence;
- one valid HCJ81 listing was recovered through structured eBay item details even though the code was absent from the title;
- six false positives were rejected because the target casting could not be confirmed;
- eleven candidates remain review-only primarily because sellers omitted the Mattel code from the title;
- the previous diagnostic cap of 5 detail lookups was too low to resolve the remaining review population.

One accepted listing recovered through item details:

- eBay IT
- title: `Hot Wheels Mountain Drifters LB-ER34 Super Silhouette Nissan Skyline Rosso 2022`
- item price: **€42.57**
- shipping: **€13.46**
- reason: `MATTEL_IDENTIFIER_ITEM_DETAILS`

This is diagnostic evidence only and is **not** yet a TrackDash ASK observation.

Decision:

- do **not** enable the broader context query yet;
- first exhaust the exact-query review population more thoroughly;
- increase the controlled read-only `getItem` diagnostic cap from **5 to 15**;
- keep the matcher thresholds unchanged.

Next audit should re-run HCJ81 exact-query only with the higher detail depth. If review volume materially collapses while accepted precision remains clean, then context-query recall can be tested.


### 2026-09-23 — Step 16: strong release context discriminators

Status: **IMPLEMENTED ON BRANCH — matcher threshold extended only with high-precision Release structure**.

Second HCJ81 exact-query audit result:

- unique listings: **19**
- accepted: **2**
- review: **9**
- rejected: **8**
- item-detail matched: **3**
  - target HCJ81 recovered: **1**
  - sibling Release codes detected and rejected: **2**
- item-detail no match: **9**
- item-detail not needed: **7**
- no remaining `limit_reached` cases

Interpretation:

The higher detail depth resolved all pending structured eBay lookups. The remaining 9 review items are genuinely missing a usable Mattel identifier in title/item specifics.

Catalog comparison across the nine LB-ER34 Releases shows that some commercial Releases have a second exact identity tuple that is safe enough to use:

- subseries + exact series position;
- subseries + exact collector number;
- line + exact collector number.

Examples:

- HCJ81 = **Mountain Drifters + 4/5**
- HCK01 = **Mountain Drifters + 0/5 + Chase**
- HKF21 = **Boulevard + #70**

This is now implemented as a high-precision context acceptance path:

`RELEASE_CONTEXT_DISCRIMINATORS_EXACT`

Important safeguards:

- broad context such as year + color is **not** enough;
- casting match is still mandatory;
- non-chase target + chase wording is rejected;
- chase target requires chase context in addition to the strong Release discriminators;
- sibling Mattel codes still reject;
- package/Subvariant wording still remains review-only;
- new/carded condition guards remain unchanged.

HCJ81 examples:

Accepted without Mattel code:

`Mountain Drifters ... 4/5`

Still review-only:

`2022 Mountain Drifters ... Red`

Reason:

4/5 is a Release-level discriminator; year/color alone can still overlap or be seller-entered ambiguously.

No Mini 4WD matcher/worker behavior is changed.

### Exact next Hot Wheels action

1. deploy this matcher update after CI passes;
2. re-run HCJ81 exact-code query only;
3. compare accepted/review/rejected against the 2/9/8 baseline;
4. manually inspect any newly accepted context-only listings via runtime sample;
5. if precision remains clean, then enable the broader context query for HCJ81 to measure recall;
6. keep all Hot Wheels market writes disabled until this validation is complete.


### 2026-09-23 — Step 17: Italy-delivered ASK cost semantics

Status: **IMPLEMENTED ON BRANCH — read-only audit only; no Market Engine writes**.

This step addresses two goals from the first real HCJ81 audits:

1. recover valid Hot Wheels listings without becoming overly strict;
2. make ASK values realistic for an Italian/European collector by considering shipping and origin.

#### Matching policy — less drastic without becoming fuzzy

The second HCJ81 exact-query audit exhausted all structured eBay item-detail lookups:

- 19 unique listings;
- 2 accepted;
- 9 review;
- 8 rejected;
- 1 target HCJ81 recovered via structured item details;
- 2 sibling Release codes detected and correctly rejected;
- no remaining lookup-limit cases.

The remaining review population genuinely lacked usable Mattel identifiers.

TrackDash now allows a second high-precision acceptance path when the catalog itself provides an exact commercial tuple:

- subseries + exact series position;
- subseries + exact collector number;
- line + exact collector number.

Example:

- HCJ81 = `Mountain Drifters + 4/5`
- HCK01 = `Mountain Drifters + 0/5 + Chase`
- HKF21 = `Boulevard + #70`

Reason code:

`RELEASE_CONTEXT_DISCRIMINATORS_EXACT`

Still **not** sufficient on their own:

- generic year;
- generic color;
- casting-only wording;
- broad “Premium” wording.

This preserves real recall without turning TrackDash into a fuzzy title matcher.

#### Shipping / delivered-cost policy for Hot Wheels

The Hot Wheels audit now requests eBay results with:

`deliveryCountry:IT`

This restricts discovery to items eBay says can be shipped to Italy.

Important: TrackDash does **not** infer a postal code. eBay's optional `contextualLocation` with postal code is not used until a real destination ZIP is intentionally available. No fake ZIP is introduced.

The eBay transport now records, when supplied by Browse:

- real item-location country;
- shipping estimate country;
- item price;
- shipping amount.

These fields are additive. Existing Mini 4WD search callers do not pass a delivery country and keep their previous transport behavior.

#### EUR audit cost semantics

Each Hot Wheels audit listing now computes:

- `itemPriceEUR`;
- `shippingEUR`;
- `shippingAdjustedSubtotalEUR`;
- `effectiveCostEUR`;
- `costBasis`.

Supported cost bases:

- `delivered_eu`
  - origin country is in the EU;
  - shipping amount is known;
  - effective cost = item + shipping in EUR;
  - eligible to become a future European/Italian Lowest Asking Price after market-write validation.

- `extra_eu_import_unknown`
  - origin is outside the EU;
  - item + visible shipping remains useful market context;
  - effective European landed cost stays unknown because VAT/import/duty handling is not safely inferred;
  - cannot automatically undercut a verified EU delivered offer.

- `shipping_unknown`
  - item is shippable to Italy but Browse returned no usable shipping amount;
  - item-only price remains context.

- `origin_unknown`
  - shipping may be visible but the real item origin is not available;
  - do not label it delivered.

- `fx_unavailable`
  - currency cannot be reliably converted for the audit.

Free shipping naturally produces:

`effectiveCostEUR = itemPriceEUR`

#### Why this is stricter than a raw eBay price but not overly conservative

TrackDash does **not** discard extra-EU listings merely because landed cost is incomplete.

They remain:

- valid identity/availability evidence;
- useful price context;
- potentially useful for trend/market breadth later.

They simply do not become the canonical European delivered minimum unless the true landed basis is known.

Likewise, a high shipping charge does not cause rejection. If it is a real EU-delivery cost, the listing remains valid and its higher effective cost simply loses against a cheaper delivered offer.

This preserves real market information while preventing misleading €15 item-only listings from beating a genuine €25 delivered offer.

#### Admin audit UI

The protected Hot Wheels eBay audit table now shows, in IT/EN:

- item price;
- shipping;
- effective/adjusted EUR cost;
- cost-basis label;
- origin country;
- shipping-estimate country.

The Production diagnostic log also reports:

- lowest accepted EU delivered cost;
- accepted delivered-offer count;
- cost basis and origin for sampled accepted/review listings.

#### eBay API basis

Current eBay Browse documentation confirms:

- `deliveryCountry` filters for items shippable to the specified country;
- `itemLocation.country` exposes item origin;
- `X-EBAY-C-ENDUSERCTX contextualLocation` improves calculated shipping and requires a postal code where applicable.

TrackDash uses only the information it can verify and leaves postal-code contextual shipping for a later explicit buyer-location feature.

### Exact next Hot Wheels action

1. run CI on context-discriminator + destination-aware audit changes;
2. deploy only after `typecheck` + `verify` are green;
3. re-run HCJ81 with exact-code query only;
4. inspect newly accepted context-only listings and Italy-delivered cost diagnostics;
5. confirm that `Mountain Drifters + 4/5` improves recall without accepting HCK01 or other siblings;
6. confirm realistic EU delivered minimum;
7. only then enable the broader context query for HCJ81;
8. keep market candidates/offers/signals at zero until this validation is explicitly accepted.


### 2026-09-23 — Step 18: HCJ81 exact-query delivered-cost validation

Status: **VALIDATED IN PRODUCTION — context-query pilot now authorized**.

Production application SHA:

`e420ab564294f7f86a9c37322c16cdb3f9944e33`

HCJ81 was re-run in protected Admin with:

- exact-code query only;
- context query OFF;
- delivery country Italy;
- no market writes.

Observed result:

- raw marketplace counts: IT **7**, DE **2**, FR **0**, ES **8**, GB **10**
- unique listings: **19**
- accepted: **4**
- review: **6**
- rejected: **9**

Comparison with the previous exact-query baseline:

- accepted: **2 → 4**
- review: **9 → 6**
- rejected: **8 → 9**

Reason-code distribution:

- `RELEASE_CONTEXT_DISCRIMINATORS_EXACT`: **2**
- `MATTEL_IDENTIFIER_ITEM_DETAILS`: **1**
- `MATTEL_IDENTIFIER_EXACT`: **1**
- `IDENTIFIER_NOT_IN_TITLE`: **6**
- `CASTING_NOT_CONFIRMED`: **8**
- `SIBLING_RELEASE_IDENTIFIER_ITEM_DETAILS`: **1**

Structured-detail status:

- matched: **2**
- no match: **6**
- not needed: **11**
- no lookup-limit residual.

Interpretation:

The new Release-context discriminator path recovered **2 additional accepted listings** without increasing fuzzy acceptance.

At least one recovered context-only title explicitly contains:

`Mountain Drifters ... 4/5`

which is the intended HCJ81 exact commercial tuple.

The sibling guard remains active: a sibling Release identifier discovered in structured eBay details was rejected.

#### Delivered-cost result

Among the four accepted listings:

- accepted EU-delivered offers: **1**
- lowest accepted EU-delivered total: **€99.50**
- other accepted examples include extra-EU offers whose item + visible shipping subtotal is materially lower, but their true European landed cost remains unknown.

Example accepted extra-EU listing:

- origin: US
- title contains `Mountain Drifters ... 4/5`
- item: **€29.84**
- visible shipping: **€21.51**
- visible subtotal: **€51.35**
- cost basis: `extra_eu_import_unknown`

This does **not** imply that €99.50 is HCJ81 Market Value or even the realistic European asking-price level.

It only proves that the exact-code query still has insufficient European recall: with just one delivered EU accepted offer, the European minimum is too sparse and can be dominated by one aspirational seller.

#### Decision

The exact-query matcher is now sufficiently precise to proceed to the next controlled recall test:

**HCJ81 with context query ON**

The purpose is to discover additional listings that omit HCJ81 from title/search indexing while still requiring the same exact Release matcher after retrieval.

The context query does **not** relax the acceptance rules.

It only broadens discovery.

Market writes remain disabled.

### Exact next Hot Wheels action

Run HCJ81 again with:

- **Includi query contestuale = ON**
- same read-only Admin audit
- delivery country Italy
- no market writes

Then compare:

1. unique listing gain;
2. additional accepted listings;
3. false-positive/review growth;
4. additional EU-origin delivered offers;
5. lowest credible EU delivered cost;
6. whether extra-EU offers materially broaden price context.

Only after this recall test should HCJ81 ASK persistence be designed.


### 2026-09-23 — Step 19: wider European marketplace coverage

Status: **IMPLEMENTED ON BRANCH — read-only audit only; no Market Engine writes**.

The HCJ81 context-query audit improved recall without degrading review pressure:

- exact-query baseline: 19 unique / 4 accepted / 6 review / 9 rejected
- context-query result: 26 unique / 5 accepted / 6 review / 15 rejected

Interpretation:

- +7 unique listings discovered;
- +1 accepted listing;
- review count unchanged;
- most extra noise was rejected correctly;
- context query is therefore useful for recall and does not relax acceptance rules.

However, only **1 accepted EU-origin delivered offer** was found:

- lowest accepted EU-delivered total: **€99.50**

This is not treated as a reliable market minimum because one EU observation is too sparse and can be dominated by an aspirational seller.

#### Marketplace expansion

The Hot Wheels audit now queries:

- EBAY_IT
- EBAY_DE
- EBAY_FR
- EBAY_ES
- EBAY_NL
- EBAY_BE
- EBAY_AT
- EBAY_IE
- EBAY_PL
- EBAY_GB

All searches remain constrained with:

`deliveryCountry:IT`

The purpose is to improve European offer discovery while preserving the same matcher and delivered-cost rules.

No Mini 4WD search caller is changed.

The shared eBay marketplace type is extended additively only so the Hot Wheels audit can address these additional Browse marketplaces.

### Exact next Hot Wheels action

1. run CI on the expanded marketplace coverage;
2. deploy only if typecheck + verify are green;
3. re-run HCJ81 with context query ON;
4. compare:
   - unique listings;
   - accepted/review/rejected;
   - number of accepted EU-delivered offers;
   - lowest credible EU-delivered cost;
5. if European breadth materially improves and matching stays clean, freeze HCJ81 ASK discovery policy;
6. only then design first controlled persistence into the shared Market Engine.


### 2026-09-23 — Step 20: verified secondary identifiers

Status: **IMPLEMENTED ON BRANCH — HCJ81 UPC prepared; no market writes**.

The wider eBay marketplace audit confirmed that additional European marketplace IDs do not add distinct HCJ81 inventory:

- context-query result remains **26 unique / 5 accepted / 6 review / 15 rejected**;
- accepted EU-delivered offers remain **1**;
- lowest accepted EU-delivered total remains **€99.50**;
- NL/BE/AT/IE/PL mostly expose the same cross-listed inventory already seen through IT/DE/FR/ES/GB.

Decision:

Do not expand eBay marketplace coverage further merely to chase duplicate inventory.

Instead, improve exact discovery using verified **secondary identifiers** attached to the same Release.

#### HCJ81 secondary identifier

Mattel's official 2022 Hot Wheels catalog identifies the Mountain Drifters LB-ER34 release as:

- Mattel toy number: `HCJ81`
- printed UPC-A: `1 94735 01163 6`
- normalized UPC-A: **`194735011636`**

Migration prepared:

`supabase/migrations/0152_hotwheels_hcj81_upc_identifier.sql`

The UPC is stored as:

- scheme: `upc_a`
- value: `194735011636`
- `is_primary = false`
- verification: `verified`
- source: official Mattel catalog

This remains the **same ProductRelease**.

It is not:

- a new Release;
- a Subvariant;
- a replacement for HCJ81.

#### Matcher / audit behavior

Hot Wheels Release profiles can now contain:

- one primary identifier;
- zero or more verified secondary identifiers.

Exact discovery queries are generated for all verified identifiers.

For HCJ81 that means:

1. `Hot Wheels HCJ81 ...`
2. `Hot Wheels 194735011636 ...`
3. optional context query when recall mode is enabled

The acceptance matcher can confirm the Release through:

- primary identifier in title;
- verified secondary identifier in title;
- primary identifier in structured eBay item details;
- verified secondary identifier in structured eBay item details;
- existing strong commercial context tuple.

A GTIN with leading zero, such as:

`0194735011636`

matches the verified UPC-A:

`194735011636`

through normalized exact-identifier containment.

#### Sibling-safety correction

When a Release owns multiple verified identifiers, its own secondary identifiers must never be treated as sibling Release codes.

Sibling detection is now built from identifiers belonging to **other Releases of the same Casting only**.

This prevents HCJ81's UPC from becoming a false sibling exclusion.

Only identifiers with:

`verification_status = verified`

participate in automatic Hot Wheels exact matching.

#### Safety

- no Mini 4WD matcher/worker behavior is changed;
- no Hot Wheels Market Engine writes are enabled;
- public Hot Wheels gate remains closed;
- the existing new/carded and delivered-cost rules remain unchanged.

### Exact next Hot Wheels action

1. run typecheck + verify;
2. if green, apply migration 0152 to live Supabase;
3. verify HCJ81 exposes both HCJ81 and UPC 194735011636;
4. deploy the secondary-identifier matcher;
5. re-run HCJ81 with context query ON;
6. compare unique listings / accepted listings / EU delivered coverage against the current 26 / 5 / 1 baseline;
7. if UPC adds no distinct inventory, freeze eBay discovery and move to the next independent ASK/SOLD source rather than adding more eBay query permutations.
