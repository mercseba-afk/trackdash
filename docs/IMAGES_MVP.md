# TrackDash — Catalog Images

## What this is

The catalog image system: product and release cards show a real photo
when one is available, instead of always showing the illustrated
placeholder (`components/product-art.tsx`).

**Phase 1 goal:** a *scalable, safe pipeline* for adding images to 62,
200, or 2,000 releases without touching application code each time, and
without ever attaching one release's image to a different release.
Phase 1 shipped that pipeline with a deliberately tiny proving set (3
mappings).

**Phase 2 (this update) used that pipeline to populate real coverage.**
As of Phase 2: **25 / 36 products** have a genuine product-level image
(confirmed against official `tamiya.com` pages), up from 3. Release-level
exact images remain deliberately sparse (1 — Magnum Saber Premium) per
"UNKNOWN > INVENTED": a correct product image beats a guessed release
image, so Phase 2 did not chase 62/62 exact release coverage. See
"Coverage (Phase 2)" below for the full breakdown, including exactly
which products are still uncovered and why.

**Still an MVP at the storage layer.** Images are remote image URLs
stored as plain text in the existing `product_images` / `release_images`
tables — nothing is downloaded into this repository, and nothing is
uploaded to Supabase Storage. Swapping a remote URL for our own
hosted/licensed image later is a **data change** (edit
`scripts/data/tamiya-images.ts`, regenerate the seed migration), not a UI
or schema change. Every consumer (resolver, UI component) only ever sees
"a URL or null," never anything host-specific.

## The three image concepts (never merged)

| Concept | Table | Meaning |
|---|---|---|
| **Product image** | `product_images` | Generic image of the *model* — a reasonable representative photo. |
| **Release image** | `release_images` | Image of one *specific edition* (this Premium, this Black Special...). |
| **Collection Item photo** | `collection_item_photos` | A photo of the *user's own physical specimen* (owner-only, RLS-scoped). |

These are three separate tables and three separate concepts. A user's
photo is never catalog truth; a release image is never silently used for
a different release (see the resolver).

## Identity: by TrackDash seed keys, never item number

An image mapping targets a product or release by **TrackDash's own
immutable identifiers**, exactly like every catalog UUID:

- **Product image** → the product's `seedKey`
  (`stableUuid(product:${productSeedKey})`).
- **Release image** → the pair `productSeedKey + releaseSeedKey`
  (`stableUuid(release:${productSeedKey}:${releaseSeedKey})`).
- **The image row's own id** is likewise seed-key-derived
  (`stableUuid(product-image:${productSeedKey}:0)` /
  `stableUuid(release-image:${productSeedKey}:${releaseSeedKey}:0)`).

The **Tamiya item number never participates in identity**. It is
correctable factual data (an item number can be fixed by a later audit
without the image needing to move), so it lives only as optional
human-readable metadata (`tamiyaItemNumber`). This is enforced: the
validator hard-fails if an item-number-shaped identity field
(`productItem`/`releaseItem`/`itemNumber`) ever reappears.

## Resolver (the definitive fallback policy)

`lib/images/resolve.ts` — pure functions, no React, no fetching. **Two
different chains**, depending on whether a specific release is in view:

- **Specific release** — `resolveReleaseImageUrl(release, product)`:
  `exact release image → product image → null`. **Never** a sibling
  release's image. Showing a *different* edition's photo as though it
  were the selected one is misleading — editions of the same model can
  look genuinely different.
- **Generic product** (no specific release, e.g. a catalog grid card) —
  `resolveProductImageUrl(product)`: `product image → any suitable
  release image → null`. The sibling-release fallback lives **only**
  here: showing *some* representative photo for the model in general is
  reasonable in a way it isn't for a specifically-selected edition.
- `resolveDisplayImageUrl(product, release?)` picks the right chain and
  is what the UI calls.

`null` means "no image anywhere" → the caller shows the placeholder.

The four cases, and the critical rule, are covered by
`scripts/test-image-resolver.mjs` (`pnpm images:test`):

| Case | Situation | Result |
|---|---|---|
| A | Product has a product image (generic view) | product image |
| B | Release has its own exact image | that release image (beats product image) |
| C | Release has no image, product has one | product image |
| D | No image anywhere | `null` → placeholder |
| **HARD** | Imageless release, only a *sibling* has an image | `null` → placeholder — **never** the sibling's image |

## Rendering

`components/catalog/product-image.tsx` (`<ProductImage>`) is the only
place resolution + rendering meet — a drop-in replacement for
`<ProductArt>` (same props). No URL resolves → `<ProductArt>` directly
(no `<Image>` attempted). A URL resolves but fails to load (404, dead
host) → `onError` swaps to `<ProductArt>`, never a broken-image icon. A
`useEffect` resets the failure flag when the resolved URL changes, so a
stale failure never blocks a new working URL.

## The manifest: `scripts/data/tamiya-images.ts`

A plain array of `TamiyaImageEntry`. Each entry can carry:

- `productSeedKey` (required) and `releaseSeedKey` (only for a
  release-specific image) — **identity**.
- `imageUrl` (required) — the image.
- `sourcePageUrl` — the page it was verified against (required by the
  validator's default config).
- `sourceType` — `official_manufacturer | official_catalog | other`.
- `sourceDomain` — raw host string, human-readable.
- `tamiyaItemNumber` — optional metadata only (never identity).
- `attribution` — optional `{ holder?, license?, usageNote? }`.
- `note` — free text.

### UNKNOWN > INVENTED (including attribution/licensing)

Leave any field you don't actually know **undefined** — never guess. This
applies especially to `attribution`: recording an official image URL here
for development/private-beta use **does not by itself grant any
redistribution or public-hotlinking right**. The `attribution` slot is a
place to record licensing facts *when they are actually known*, not a
place to assert a license we don't have. Do not invent a `license`
string. (This is a metadata policy, not legal analysis — see the caveat
at the end.)

## How to add a new image

1. Add an entry to `scripts/data/tamiya-images.ts` with, at minimum, the
   target `productSeedKey` (+ `releaseSeedKey` for a release image),
   `imageUrl`, and `sourcePageUrl`. Fill in `sourceType`/`attribution`
   only with what's actually known.
2. Validate the manifest:
   ```bash
   pnpm images:check
   ```
   This hard-fails on: a non-existent product/release seed key; a release
   key resolving to a different product; a duplicate identical mapping;
   two entries targeting the same exact release; an empty/malformed URL; a
   missing source URL (when required); or any item-number-derived
   identity.
3. Confirm the resolver policy still holds (fixtures, no DB needed):
   ```bash
   pnpm images:test
   ```
4. Regenerate the seed migration:
   ```bash
   pnpm db:seed:images:generate
   ```
   This overwrites `supabase/migrations/0008_seed_catalog_images.sql`
   **only until it has shipped to production.** `0008` was applied to
   live Supabase on 2026-09-05 (see `docs/CATALOG_MODEL_V2.md`), so new
   images now belong in a **new, later migration**, not a rewrite of
   `0008` — the same rule that protects `0003_seed_initial_catalog`.
   `0011_images_phase2_product_coverage.sql` is the working example: it
   contains only the rows genuinely new since `0008` (extracted by
   diffing the full regenerated output against `0008`'s own committed
   rows), not a re-declaration of `0008`'s three original rows. Because
   every insert is `ON CONFLICT (id) DO NOTHING` and every id is
   seed-key-derived and stable, a fresh later migration re-emitting an
   already-present row would be harmless even if included — but keeping
   each migration to its own genuinely new rows is the cleaner practice
   and is what `0011` does.
5. If a genuinely new official image *host* is introduced, add it to
   `next.config.mjs`'s `images.remotePatterns` (with a reason) — see
   below.

## Seeder idempotency

`scripts/seed-images.mjs` derives each image row's id from its seed key
and emits `ON CONFLICT (id) DO NOTHING`. Running it twice produces
byte-identical SQL, and applying it twice inserts nothing the second
time. Verified in the Phase 1 verification run (two regenerations
diff-clean). Changing an entry's *metadata* (source type, attribution,
note) does **not** change the emitted SQL — those fields aren't seeded,
so `0008` is stable against metadata edits.

## Validation & tests (run independently)

| Command | What it checks |
|---|---|
| `pnpm images:check` | The manifest: identity resolves, no duplicates/collisions, URLs valid, source present, no item-number identity. |
| `pnpm images:test` | The resolver policy: cases A/B/C/D + the sibling hard-test. |
| `pnpm catalog:check` | The full catalog invariants (includes a basic image-mapping existence check; the exhaustive image validation is `images:check`). |

All three run with plain Node (no DB, no build), so they fit CI or a
pre-commit hook.

## Next.js remote image configuration

`next.config.mjs`'s `images.remotePatterns` allowlists exactly the hosts
that appear in `tamiya-images.ts` — no wildcards, no "just in case"
hosts. Optimization is left **on** (not `unoptimized: true`) so the
allowlist is actually enforced (Next skips it entirely when `unoptimized`
is set). Add a host only when a real new official image host is used.

## Coverage (Phase 2)

| | Before Phase 2 (= live `0008`) | After Phase 2 (`0008` + `0011`) |
|---|---|---|
| `product_images` rows | **2** / 36 | **25** / 36 |
| `release_images` rows | **1** / 62 | **1** / 62 (unchanged) |
| Manifest entries (product + release, not summed with the above) | 3 | 26 |

(Product and release image counts are reported separately and must not
be added together — 2 product + 1 release = 3 manifest entries
pre-Phase-2, not "3 product images.")

Every Phase 2 entry was confirmed against a live official `tamiya.com`
page (English or Japanese) fetched or searched during this pass, using
this catalog's own already-audited item numbers (see
`docs/CATALOG_AUDIT.md`) — never a fresh, independent identity
re-verification, and never a guess. The image URL itself follows
Tamiya's own confirmed CDN path
(`japan_contents/img/usr/item/1/{item}/{item}_1.jpg`), directly observed
in fetched page markup.

### Products still without any image (11)

Left uncovered deliberately (UNKNOWN > INVENTED) — each either has no
confidently verified item number at all, or its item number was never
independently checked in the catalog audit, so there is no reliable key
to fetch an official image by:

Dash-4 Cannon Ball, Astute, Manta Ray, Fire Dragon, Dash-01 Horizon, Mad
Bull, Sword Flash, Copperfang, Thunder Shot, Emperor (Premium Black
Special), Aero Avante Japan Cup 2013.

### Exact release images not added

Step A2 (exact release images for Black/Red Special, Premium, Limited,
Anniversary, reissues with a meaningfully different look) was **not**
pursued as a bulk research pass in Phase 2 — Phase 1's single
Magnum-Saber-Premium mapping remains the only one. Every one of these
releases now at least resolves to its **product** image (25 of them) or
the placeholder, never a wrong or fabricated release-specific image. Real
exact-release coverage is future, incremental data work using the same
pipeline (`pnpm images:check` validates each addition immediately).



No mass exact-release-image research (see "Exact release images not
added" above), no
Supabase Storage buckets, no downloading/re-hosting images, no
user-uploaded images, no collection-item photo UI, no scanner, no
price-intelligence. Phase 1 is the *pipeline and its guardrails*.

## Redistribution / hotlinking caveat

Official image URLs used in development or a private beta do **not**
automatically confer rights to redistribute or hotlink them in public
production. Before a public launch, the images actually served must be
ones we're permitted to serve (our own photography, licensed assets, or
explicit permission), and the `attribution` metadata should reflect the
real, known terms. This document records that constraint; it is not legal
advice.
