# Public collector mercatino — 30 October 2026

- Public navigation: Mercatino replaces the Community anchor in desktop/mobile navigation and footer.
- `/shop` H1: Mini 4WD in vendita tra collezionisti. Public indexed listing, canonical, description, Open Graph, Twitter and sitemap entry.
- Same ShopScreen and copy cards for app and public site. Individual copy pages public, noindex/follow because offers can be withdrawn.
- Only explicitly open_to_offers Tamiya copies with public releases in available, non-archived families. Showcase and private copies excluded. Existing bounded 100-candidate query retained.
- Signed-in reads keep existing Drizzle/RLS path. Anonymous reads use a narrow server-only admin projection with explicit filters; no anonymous database permissions changed. Collector username is public, email, purchase data, private collection IDs and user IDs are not serialized.
- Accepted/non-cancelled offers exclude reserved/reported/confirmed copies for both audiences. Reservation lookup fails closed.
- Personal sale photo first, release/family fallback retained. Private storage stays private; only eligible available sale-copy photo URLs are signed for 20 minutes. Deferred original photos remain an existing recovery item.
- Offer button opens account invitation for visitors; signup/login preserve exact copy and offer intent. After authentication, the offer dialog opens on that copy. Server action still rejects unauthenticated writes. Own-copy guard retained.
- Selling invitation links to collection (or signup with collection destination).
- No scanner runs, scheduler changes, caps, market-price recalculation or database migration.

Validation: full verify including TypeScript, catalog/market/auth/proxy regression checks; 11 shop tests covering anonymous/authenticated projection, hidden/archived and reserved exclusions, fail-closed reservation lookup, private-ID stripping, mobile navigation, offer invitation return paths and server-side authentication before writes. Browser binary unavailable in this workspace; no browser end-to-end claim. Production anonymous HTTP and metadata checks recorded at release.

## Production verification

Production `64c11f362e26ea9add7cc0a03d6ee9db768a67a5`, Vercel `dpl_CnGj8VSpyw8SaVFzyg4Tiqwm7ahG`, READY.
Initial anonymous HTTP test caught a 500: Supabase logs showed permission denied on collection_shares for the backend service role. Applied idempotent SELECT grants on only the required columns of collection_shares, collector_profiles, products, brands, product_images and release_images (see scripts/sql/grant-public-shop-server-projection-2026-10-30.sql). No anon grants or RLS policy changes. Existing service grants on product_releases/photos/deal tables retained.
Anonymous `/shop` then returned 200 with exact H1, SEO title and four active copy links. Homepage returned 200 and the Mercatino navigation link. Runtime Vercel logs were inaccessible (403); diagnosis used Supabase postgres/edge logs instead. Security advisors reviewed before/after; existing unrelated notices remain outside this change.
Detail copy returned 200 with offer CTA and noindex/follow; malformed share ID returned 404. Sitemap includes /shop; messages still redirect to login. Public HTML has canonical, index/follow, Open Graph title and no private projection identifiers.

## English marketplace, confirmation return and homepage follow-up

- `/en/shop` and `/en/shop/[shareId]` reuse the exact existing listing and copy detail. Proxy binds English SSR locale; language switch preserves copy ID, query and hash. Public/mobile/footer and app shop navigation respect the active locale. Release links and offer return targets remain localized.
- Listing SEO now has distinct IT/EN title, description, canonical, hreflang and social metadata. Sitemap includes both listings with language alternates. Copy details remain noindex/follow in both languages because availability is transient.
- Email signup supplies an explicit same-origin `/auth/callback?flow=signup&next=...&locale=...` redirect. Confirmation callback distinguishes signup from recovery, retains the exact offer intent through onboarding (including delayed confirmation), and retains the login return target if the PKCE exchange fails. Existing Google and password-recovery behavior retained.
- Callback passes the current SDK's `sb_flow_id` to `exchangeCodeForSession`, selecting the correct verifier when signup/Google flows run in separate tabs. Auth SDK validates this flow identifier.
- Homepage Community anchor retained for existing links, content replaced with a compact marketplace teaser and localized public CTA. Repetitive simulated conversation removed. Marketplace explains the process in three concise steps and retains a short direct payment/shipping note.
- Full `npm run verify` passed, including 23 shop/component tests and 13 real-handler callback tests (mock Auth transport), locale proxy and existing recovery/MFA regressions. Form tests execute actual signup/login submit handlers, metadata functions and language switch callbacks. Home/shop SSR tests render actual components in IT/EN.
- No account was created and no real email was sent. SMTP delivery, provider redirect allowlist and full browser authentication are not certified by mocked transport tests. No scanner/budget/database-permission changes in this follow-up.
