# TrackDash — Catalog Images (MVP)

## What this is

The first real image system for the catalog: product/release cards show
an actual photo when one is available, instead of always showing the
illustrated placeholder (`components/product-art.tsx`).

**Deliberately an MVP architecture.** Images are remote-hotlinked official
Tamiya URLs, stored as plain text in the existing `product_images` /
`release_images` tables — nothing is downloaded into this repository, and
nothing is uploaded to Supabase Storage. Swapping a Tamiya URL for our own
hosted/licensed image later (`https://our-storage.../image.jpg` instead of
`https://tamiya.../image.jpg`) is a **data change** — edit
`scripts/data/tamiya-images.ts`, regenerate the seed migration — not a UI
or schema change. Every consumer (the resolver, the UI component) only
ever sees "a URL or null," never anything host-specific.

## How image resolution works

Three layers, each with exactly one job:

1. **`lib/images/resolve.ts`** — pure functions implementing the priority
   order (no React, no fetching). **Two different chains**, not one —
   corrected during the catalog integrity pass (see
   `docs/CATALOG_AUDIT.md`) after the first version let a specific
   release's view fall back to a *different* release's photo, which is
   misleading precisely because releases of the same product can look
   genuinely different:
   - `resolveReleaseImageUrl(release, product)`: this release's own image
     → the parent product's generic image → `null`. **Never** falls back
     to a sibling release's image — showing a different edition's photo
     as though it were the one specifically selected would misrepresent
     it.
   - `resolveProductImageUrl(product)`: the product's own image → any of
     its releases' images → `null`. The sibling-release fallback lives
     **only** here — showing *some* representative photo for the model in
     general (no specific release selected, e.g. a catalog grid card) is
     reasonable in a way it isn't for a specific edition.
   - `resolveDisplayImageUrl(product, release?)`: picks whichever of the
     two above applies, based on whether a release was given. This is the
     one the UI actually calls.

   A release-specific image always wins over the generic product image
   when displaying that release specifically — e.g. Dash-1 Emperor's
   original 1990 release, if it had its own `release_images` row, would
   show that instead of the generic product photo even though both exist
   (this catalog currently doesn't attach one to that specific release —
   see `docs/CATALOG_AUDIT.md`'s note on why the current Tamiya photo for
   item 18025 is stored generically rather than tied to the 1990 row
   specifically).

2. **`components/catalog/product-image.tsx`** (`<ProductImage>`) — the
   only place resolution + rendering meet. A **drop-in replacement** for
   `<ProductArt>`: identical props (`product`, `release?`, `className?`,
   `size?`), so every existing call site was swapped with a pure
   import/rename change, not a redesign. Behavior:
   - No URL resolves → renders `<ProductArt>` directly (the existing
     data-driven illustrated placeholder) — never attempts an `<Image>` at
     all.
   - A URL resolves → renders `next/image`, `object-contain`, filling its
     container (callers already pass sizing via `className`, same as they
     did for `<ProductArt>`).
   - The image fails to load (404, dead host, malformed URL, ...) → the
     `onError` handler swaps to `<ProductArt>` instead of leaving a broken
     image icon on screen. A `useEffect` resets that failure flag whenever
     the resolved URL itself changes (e.g. selecting a different release
     in product-detail-screen.tsx), so a stale failure never blocks a
     genuinely different, working URL.

3. **`product_images` / `release_images`** (existing tables, unchanged
   schema) — `lib/db/queries/catalog.ts` already eager-loads both via
   Drizzle relations; `lib/actions/mappers.ts` already maps them onto
   `Product.images` / `ProductRelease.images: string[]`. The resolver
   just reads `images[0]`.

The UI never knows or cares which of these three layers a given image
came from, or whether it's a Tamiya hotlink or (later) our own storage.

## Data import: how a URL gets into the database

```
scripts/data/tamiya-images.ts   (source of truth: verified mappings)
          │
          ▼
scripts/seed-images.mjs          (resolves natural keys -> stable UUIDs,
          │                       emits SQL)
          ▼
supabase/migrations/0006_seed_catalog_images.sql
```

- **`scripts/data/tamiya-images.ts`** — a plain array of
  `{ productItem, releaseItem?, imageUrl, sourcePageUrl, sourceDomain,
  verifiedAgainstItem?, note }`. Keyed on **this catalog's own natural
  identifiers** (the same `item` fields used in `lib/data/products.ts`'s
  `SEEDS`), not on database UUIDs. Every entry's `note` records exactly
  how it was verified, and flags it explicitly when this catalog's item
  number doesn't match Tamiya's real numbering for that model (see
  "Accuracy over coverage" below — this happened more than once).

- **`scripts/seed-images.mjs`** — generates the migration. For each
  mapping entry it looks up the matching product (and release, if
  `releaseItem` is set) in `lib/data/products.ts`'s real `PRODUCTS` array
  to get its real (stable, deterministic) UUID, derives a **stable id for
  the image row itself** via `stableUuid()` (e.g.
  `stableUuid('product-image:${productItem}:0')`), and emits an
  `ON CONFLICT (id) DO NOTHING` insert. Running it twice never creates a
  duplicate row — same idempotent pattern as
  `scripts/generate-catalog-seed.mjs` (Step 4B) for the catalog itself.
  `position = 0` is used for every row here (the primary image); a future
  gallery feature can add position 1, 2, 3, ... without touching these
  ids.

To add more images later: add entries to `tamiya-images.ts`, then:

```bash
node --experimental-strip-types scripts/seed-images.mjs \
  > supabase/migrations/0006_seed_catalog_images.sql
pnpm db:migrate
```

(Regenerating **overwrites** 0006 rather than creating 0007+, since it's
still the same logical "catalog images" seed migration and hasn't been
applied to production as of this step — see the git history/report for
this step for the exact state at time of writing. Once this migration
*has* shipped to production, treat it the same way
`0003_seed_initial_catalog.sql` is treated: new images belong in a new,
later migration, not a rewrite of this one.)

## Accuracy over coverage

Every mapping in `tamiya-images.ts` was verified by fetching the real
Tamiya product page and confirming its title/description names the same
model — never generated by guessing a URL pattern from an item number.

This mattered in practice, and led directly to a much larger effort: the
**catalog integrity pass** (`docs/CATALOG_AUDIT.md`), which audited and
corrected `lib/data/products.ts` itself rather than working around
mismatches only in the image layer. For example, this catalog's item
`18626` was originally labeled "Aero Avante," but that item number is a
real, different Tamiya kit (Avante Mk.III Azure); the real Aero Avante is
Tamiya item `18701` — the catalog itself now uses `18701`, so this
image's mapping no longer needs a workaround, it just matches directly.
Several other products had similar (in some cases worse — two products
independently using the same real item number) issues; see
`docs/CATALOG_AUDIT.md` for the full list. Where a mismatch couldn't be
confidently resolved by name, the entry (in the catalog and/or the image
mapping) was left unverified rather than risk asserting the wrong fact or
attaching the wrong photo to the wrong model.

See the Images MVP step's own report for the exact current coverage
count and the list of what's still on the placeholder.

## Next.js remote image configuration

`next.config.mjs`'s `images.remotePatterns` allows exactly one host:

| Host | Path prefix | Why |
|---|---|---|
| `www.tamiya.com` | `/japan_contents/img/**` | The only domain any URL in `tamiya-images.ts` uses — Tamiya's own product-image path, confirmed via each page's own `og:image` meta tag. |

No wildcards, no additional hosts "just in case." Add a new entry (with a
matching reason) only when a genuinely new official Tamiya image host is
used in `tamiya-images.ts`.

Optimization is left **on** (not `unoptimized: true`) specifically so
this restriction is actually enforced — Next.js skips the remote-pattern
allowlist entirely when `unoptimized` is set, which would make this table
purely decorative.

## What's explicitly out of scope for this step

Per the Images MVP brief: no Supabase Storage buckets, no downloading
Tamiya's images into this repo or re-hosting them, no user-uploaded
images, no collection-item personal photos, no image recognition/scanner
work, no price-intelligence work. This step is the image *architecture*
(resolver, component, import pipeline) plus an initial, deliberately
partial, accuracy-first set of real URLs — not a finished asset pipeline.
