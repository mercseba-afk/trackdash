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
