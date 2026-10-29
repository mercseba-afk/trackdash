# Collector shop — owner pilot, 29 October 2026

## Scope

Owner-only `/shop` and `/shop/[shareId]`. No public navigation, sitemap entry, schema changes, seeded listings or real offers/messages sent. Authorization checks authenticated admin membership and the existing `SPEED_CHAMPIONS_OWNER_ID` allowlist on every data read; unlike the LEGO preview gate there is no development/preview bypass. Metadata is noindex, routes are dynamic and retain normal authenticated Proxy handling.

Owner mobile navigation: Catalogo, Collezione, Scanner, In vendita, Messaggi. Profile remains in the existing top-right account menu. Other users retain the existing navigation. Desktop owner navigation adds In vendita before Messaggi. Hot Wheels navigation stays as configured.

Vitrine shows only explicitly open-to-offers copies of publicly available Tamiya releases. Reservation check excludes accepted deals unless cancelled, including sale-reported/confirmed deals; errors fail closed. Privileged reservation lookup stays server-only and returns no deal data to clients. No private notes, acquisition prices, private item IDs or owner IDs reach the shop DTO. Existing RLS-controlled photos use short-lived signed URLs. Photo preference: actual copy, release image, family image, placeholder.

Cards link to the specific copy detail: photo, requested price or Su proposta, seller, condition, Item Number, year and chassis. Full catalog release remains linked. Existing DirectOfferDialog opens the exact share and redirects to the existing conversation after submission. Own-copy offer button is disabled; existing database checks remain authoritative against stale availability and self offers. First pilot is bounded to 100 recently updated candidate shares; full pagination belongs to wider rollout.

## Validation

- Full `npm run verify`: exit 0 (existing catalog warnings retained).
- Seven new gate/data tests: passed (no allowlist including preview/development, wrong/non-admin identity, unauthorized read, malformed ID, reservation exclusion, fail-closed lookup, safe DTO and exact copy photo).
- TypeScript and existing navigation regressions: passed.
- Production aggregate read: 5 eligible shares, 3 with requested price, 0 reserved at inspection time.
- Controlled browser fixture added in `scripts/test-shop-browser.mjs`; execution could not proceed because Chromium is absent and the standard Playwright download returned truncated archives. Browser interaction and owner-session production rendering are not claimed as verified.

No scanner changes, extra scans, price changes, subscriptions or database migrations.

## Image fallback correction

Owner reported missing preview on the EUR30 copy (actual Item 95450, rather than 95440). Its two photo records correspond to the two deferred pre-migration Storage objects: 98,870 + 97,152 = 196,022 bytes, created 18 September. `docs/recovery/public-restored-2026-10-19.md` explicitly records that file bodies were not migrated. Object metadata existence alone does not establish downloadable bytes. No original file recovery or source-project access attempted here.

The exact release JPEG responds HTTP200 image/jpeg (82,134 bytes). Shop DTO now provides that exact release image as a separate fallback for personal photos. The image component retries it on a personal-photo load error before showing the placeholder. Existing user photo records and storage policies are preserved. Owner gate/data tests and TypeScript passed after the change.

## Collector rollout and card refinement — 29 October

User approved opening the shop after the screenshot-based layout refinements. This section supersedes the owner-only access scope above: `/shop` and copy details now allow every authenticated collector, with the existing server authentication/data guard retained. Signed-out requests still pass through the normal login redirect; metadata remains noindex. LEGO Speed Champions retains its independent owner restriction.

Navigation now derives shop visibility directly from the signed-in session, removing the owner-only permission request. Mini 4WD mobile navigation for all collectors: Catalogo, Collezione, Scanner, In vendita, Messaggi. Profile remains in the top-right account menu. Existing Hot Wheels navigation unchanged.

Visual changes: full-width white image area with reduced inset; two-line title/edition blocks and flex-aligned footer; smaller medium-weight “Su proposta” in both cards and detail; collector icon and plain username in cards; remove pilot badge. Personal photo → exact release fallback remains intact.

Validation: full npm verify exit 0, TypeScript clean, 8 dedicated access/data/navigation tests passed (including an ordinary non-admin collector). Browser fixture updated for the new visibility policy; actual browser execution remains unavailable in this environment as previously recorded. No scanner, market valuation, database or storage changes, and no real offers sent.
