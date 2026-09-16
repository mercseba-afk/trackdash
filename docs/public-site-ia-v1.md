# TrackDash public site information architecture v1

## Product principle

TrackDash is one product with two layers:

1. **Public discovery and market context** — anyone can understand a Mini 4WD Product/Release and its current TrackDash market signal without creating an account.
2. **Personal collector actions** — account required only when the visitor wants to save, scan, contact, message, manage or transact.

The Release is the primary public landing page and the strongest identity/market unit.

## Public routes

- `/` — public TrackDash home
- `/catalog` — public catalog discovery
- `/catalog/[productId]` — public Product family
- `/catalog/[productId]/releases/[releaseId]` — public exact Release
- `/market` — public Price Intelligence / market overview
- `/login`, `/signup`, `/forgot-password` — public auth entry points

Public pages must never require a TrackDash session to render their useful content.

Collector showcases remain protected in this first slice because the current read actions require an authenticated user context. A future public collector profile must get an explicit privacy-safe public read contract before `/collectors/[username]` is exposed without login.

## Account-required routes

- `/dashboard`
- `/collection`
- `/collection/[id]`
- `/wishlist`
- `/scanner`
- `/messages`
- `/collectors/[username]` until the privacy-safe public read contract exists
- `/profile`
- `/settings`
- `/onboarding`
- `/support` when the action is account-specific

When a signed-out visitor reaches a protected route or starts a personal action from a public page, authentication preserves the intended destination and returns the visitor to the same context. A normal login with no requested destination opens `/dashboard`.

## Primary navigation

### Desktop public shell

- Catalog
- Price Intelligence
- Scanner
- Sign in / Dashboard
- Primary CTA: Explore catalog (signed out) or My collection (signed in)

### Mobile public shell

Use a compact top header. A persistent app-style bottom navigation is reserved for the signed-in product shell so public pages do not pretend the visitor is already inside an account dashboard.

### Signed-in app shell target

- Dashboard
- Catalog
- Collection
- Scanner
- Messages

Wishlist, collector marketplace actions, notifications and settings remain directly accessible without consuming every mobile primary-nav slot.

## Home hierarchy

1. Position TrackDash: exact-release catalog + collection + scanner + market intelligence.
2. Show one real Release and its real Market Value signal when available.
3. Explain the four core functions with product-like UI, not generic feature icons.
4. Explain Price Intelligence: Market Value, range/confidence, completed sales and active asking prices remain distinct.
5. Show a small curated real catalog preview.
6. Show Collection as a collector library, not a finance dashboard.
7. Show Scanner as a fast path to the exact Release.
8. End with a clear catalog/account CTA and installable-PWA framing.

## Product → Release hierarchy

### Product page

Purpose: identify the model family and help the visitor choose the exact historical Release.

Priority:

1. Product identity
2. Available Releases
3. Release-level year / Item Number / edition / chassis
4. Release Market Value summary where available

### Release page

Purpose: become the authoritative page for one exact commercial Release.

Priority:

1. Exact identity: brand, Item Number, year, edition, chassis, image
2. TrackDash Market Value, range and confidence
3. **TrackDash collector availability first**
4. Contact / make-offer action with contextual auth
5. External marketplace availability second (for example eBay)
6. Price Intelligence evidence: completed sales, retail reference where relevant, active asks kept separate
7. Personal save actions: Collection / Wishlist with contextual auth
8. Related Releases / Product family navigation

Seller asking price must never be presented as TrackDash Market Value.

## Marketplace hierarchy

The existing TrackDash collector-to-collector offer flow is preserved and becomes the primary transaction layer on Release pages.

- TrackDash offers: first
- External eBay/current-market links: secondary reference/fallback
- Contact / make offer: free account action
- Seller ASK: current availability only
- Confirmed completed transaction: may become sale evidence according to the existing market method and anti-manipulation rules

## Visual direction

Use the approved Figma direction as the reference:

- roughly 70% Clean Collector Tech / 30% Modern Racing Heritage
- large off-white/white surfaces
- deep TrackDash blue as the dominant brand color
- restrained red accents
- strong Mini 4WD imagery
- editorial typography and generous whitespace
- no technical-grid / terminal / stock-market aesthetic
- no dark mode in the first redesigned public system
- no ecommerce/cart visual language for catalog cards

The existing authenticated shell may retain its current theme support while it is progressively migrated; the public redesign itself stays light.

## Implementation order

1. Public shell + public home + route access split
2. Contextual login destination + authenticated `/dashboard`
3. Catalog redesign
4. Product redesign
5. Release redesign and TrackDash-offers-first hierarchy
6. Privacy-safe public TrackDash offer read contract
7. Collection / Wishlist
8. Marketplace / Messages
9. Scanner
10. Price Intelligence / Method
11. Profile / settings / Pro surfaces
