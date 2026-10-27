# Speed Champions catalog pilot

## Delivered scope

An isolated, Italian catalog preview at `/speed-champions/catalog`, with 19 exact commercial sets, search, brand/year/status/package filters, sorting, detail pages and box-first galleries. All image URLs were retrieved from the exact official LEGO product pages and visually checked on 26 October 2026. Eleven show the box alone; eight use the official box-and-model composition. Images are bundled locally under `public/speed-champions/images` to avoid runtime dependence on the LEGO CDN. The manifest preserves original URLs and attribution. Images use `object-contain`, never a replacement from a different set. A failed image has an explicit placeholder.

This is the editorial catalog and domain-model foundation, not a launched collecting vertical. It deliberately has no pretend collection buttons, invented prices or browser-only saved collections. No database migrations, scanner scheduling, market writes or production deployment are part of this change. Hot Wheels is retained. The existing Mini4WD catalog, preference switch, collection and market engines are unchanged.

Access: each page checks its own server gate. Development and Vercel previews are enabled; production requires an existing TrackDash administrator. The page tree is noindex/nofollow and is not added to the sitemap. The ordinary app proxy treats this prefix like the existing Hot Wheels prefix; the page gate remains authoritative. A dedicated catalog-only Preview mode is described below. No public navigation links to the pilot are added.

## Catalog provenance

`lib/lego/pilot-data.json` is a reviewed snapshot, not a live stock feed. Per-record official source URLs and check dates support names, piece counts, images and LEGO catalog status. BrickLink set links document the previously researched release years. The official `R_RETIRED` product status takes precedence over a stale `retiringSoon` flag. Store stock and retirement dates are not inferred. The word “available” internally means an active official catalog entry as of the recorded check, not a promise of stock today.

The researched 75878 Chiron is omitted because the official page was unavailable during this import. It can be added after exact-source/image verification. This selection covers 2019–2025; it is neither all Speed Champions releases nor the 2026 lineup.

## Identity contract for the next database phase

- One `products` identity per LEGO set number, not per real-world car. Ferrari F40 75890 and 76934 remain separate sets.
- One initial `product_releases` identity per exact commercial set. All IDs in the manifest use the existing RFC4122 UUIDv5 implementation with namespaced keys `product:lego-speed-champions:<code>` and `release:lego-speed-champions:<code>:1`.
- Double-car packs are one product/release. Individual cars, minifigures, empty boxes, instructions and loose parts cannot be priced as complete sets.
- Future identifiers use `lego_set_number` and separately verified `ean13`. No LEGO code is placed into Tamiya JAN interpretation.
- Proposed extension `lego_release_details`: `release_id` primary/FK, unique `set_number`, `piece_count`, `car_count`, `car_brand`, `subtheme`, official catalog status, source URL/check date. Preserve the shared production-status enum; map retired to discontinued and retain retiring-soon in the LEGO extension.
- Do not insert the manifest into production until the shared mapping/routing code recognizes the LEGO category: messaging currently has a Hot Wheels-versus-Mini4WD fallback, and shared collection paths are Mini4WD-oriented.

## Remaining implementation

1. Add the dormant LEGO taxonomy and extension schema, preserving RLS and restricted runtime grants; validate seed and migrations on an isolated database first.
2. Import these stable identities and sources; switch the preview reader to the database. Never relabel Mattel rows as LEGO.
3. Connect vertical-filtered collection/wishlist and messaging routes. Record box, instructions, minifigure and piece completeness separately. Initially value only verified sealed copies, consistent with TrackDash's existing policy.
4. Add an exact-set eBay matcher that excludes parts, empty boxes, instructions, incompatible brands and ambiguous bundles. Separate asking prices from completed sales and withhold values when evidence is insufficient.
5. Verify the complete authenticated journey and Mini4WD regression suite before a public launch. Replace mixed box-and-model assets with documented box-only fronts as sources become available.

## Checks

`pnpm speed-champions:test` checks stable identities, distinct Mini4WD namespace, multi-car packaging, search/filter behavior, bundled exact-set images and production/admin/preview gates. `pnpm verify` runs this alongside the existing project regression suite. See the pull request for actual execution results and any environment limitations.

Execution on 26 October 2026: the complete `pnpm verify` suite passed, including typecheck and the new catalog/gate tests. Chromium rendered the catalog and exact-set detail, and the 390 px viewport had no horizontal overflow. Desktop and mobile captures are in `docs/previews/`. The browser smoke uses local placeholder backend configuration; expected existing market-bootstrap errors therefore do not validate live Supabase. Full pointer-driven interaction automation was inconclusive in this execution environment (scroll/navigation waits); collection, login and live-market workflows are not claimed as tested.


## Catalog-only Vercel Preview (27 October 2026)

The first Vercel Preview build failed because the project has database and Supabase variables scoped only to Production. For the editorial pilot, set the non-secret `TRACKDASH_CATALOG_ONLY_PREVIEW=1` on the Preview environment **only for branch `feat/speed-champions-pilot`**. No production credentials are copied. The flag has no effect unless `VERCEL_ENV=preview`.

In this mode the root layout renders only the catalog, with no session provider, market bootstrap, analytics, telemetry or PWA registration. The preview root redirects to the Speed Champions catalog. Proxy admits only GET/HEAD on the Speed Champions catalog/detail routes; other app routes and all POST actions return 404. Static images/styles are served normally. The database export throws on any attempted access and never creates a Postgres connection, even if a database URL is accidentally present. Mini4WD's navigation link opens the existing public site.

The default app keeps its existing database requirement, session/MFA checks, providers and market bootstrap. Regression tests cover the ordinary proxy and Production database contract as well as the isolated mode. The preview must pass a production build with all database/Supabase credentials absent. A real isolated backend remains necessary for the later authenticated collection and market phases.

## Price observations (27 October 2026)

The pilot includes 10 manually reviewed eBay asking-price observations covering 8 exact set codes, from sellers located in Italy. Source item IDs, country, condition, observation date, item price and separately observed buyer fees are in `lib/lego/price-observations.json`. These are listing snapshots, not a live eBay integration or confirmed transaction prices. No SOLD-derived market value or trend is asserted. Shipping shown to foreign destinations was deliberately excluded rather than presented as Italian shipping. 76906 is labelled new as declared, without asserting sealed condition.

Only positive EUR asking observations less than 15 days old are displayed; after expiry the UI requests fresh data. Request time is passed from server to client for consistent expiry. Card prices represent the minimum in this small reviewed sample, not the minimum across eBay. Completed/expired listings, ongoing auctions, instructions-only listings, mixed-set bundles and foreign sellers were excluded. Best-offer advertised sold prices were not accepted as realized sale prices. Further coverage requires authenticated Browse collection and a separate LEGO matcher; production eBay credentials were not copied into this isolated preview.

Public market UI follows the Mini4WD labels: Prezzo richiesto, Vendite concluse, Riferimento di mercato. It does not show listing links or seller identities. Source URLs stay in the observation dataset for internal review. Only an allowlisted aggregate summary is serialized to the client catalog; listing IDs and URLs are not included in client props or imports. Sold-derived fields stay unavailable until verified data exists. The current asking statistic remains the explicitly labelled sample range (card: minimum), not an asserted production engine valuation.

## Owner-only production pilot

Production page access requires existing admin membership AND an exact match with the server-only `SPEED_CHAMPIONS_OWNER_ID` setting. Missing configuration denies access. Other accounts and signed-out users receive a 404. Every page checks authorization and remains request-bound; no sitemap entry is added. The owner's Admin dashboard provides the private catalog link after the existing MFA check. Preview/development access remains available for isolated design review; this does not authorize production access. No Mini4WD database records are changed by this release.
