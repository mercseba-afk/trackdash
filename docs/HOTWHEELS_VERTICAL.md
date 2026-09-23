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

## Exact next action

Before adding any Hot Wheels Release:

1. make catalog list queries explicitly vertical-aware while keeping the existing `/catalog` path pinned to `mini4wd`;
2. verify Mini 4WD still returns the same canonical catalog and Hot Wheels returns an empty catalog;
3. only then design the dormant Hot Wheels routing shell;
4. do **not** import the first Hot Wheels Release until vertical isolation is proven.
