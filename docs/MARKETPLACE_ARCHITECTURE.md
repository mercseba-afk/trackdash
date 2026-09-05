# TrackDash — Marketplace Architecture & Strategic Review

**Status:** analysis only. No code, schema, migration, or UI was changed
by this document. Nothing here is implemented.

**Scope:** how TrackDash *should* evolve from collection tracker toward
community/marketplace without damaging the core product. Written against
the repository as of `f19e630` (Catalog Model V2 closed, deployed).

---

## 1. Executive assessment

**The hierarchy is right. The timing is the risk.**

`PRODUCT → RELEASE → COLLECTION ITEM → MARKETPLACE LISTING` is the
correct spine, and the existing schema supports it better than most
projects at this stage — because the hard part (a clean, admin-owned
catalog with stable release identity) is already done. A listing that
points at a collection item inherits product/release/item-number/chassis/
year for free and cannot fork the catalog. That is exactly right, and I
would not change it.

But three things need saying plainly:

1. **A marketplace is a different product with different failure modes.**
   Collection tracking fails softly (a wrong chassis is annoying).
   A marketplace fails hard (a scam is a betrayal). The moment TrackDash
   lists items for sale, it inherits trust obligations it currently has
   none of — even as pure classifieds.

2. **The binding constraint is liquidity, not architecture.** A
   marketplace with 40 users and 12 listings is worse than no
   marketplace: it looks abandoned, and an empty marketplace tab actively
   damages perceived product quality. You cannot engineer your way past
   this. The prerequisite is users, not code.

3. **There are real structural gaps to close first** (Section 2). None
   are fatal, but two of them (hard-delete of collection items; no public
   read path for profiles/collections) must be resolved *before* any
   listing exists, not after.

**Recommendation in one line:** build Public Collections first, treat it
as the actual community product, and let marketplace demand prove itself
before building listings. Details in Section 14 and 19.

---

## 2. Current architecture compatibility

What I actually found in the repo, and what it means.

### Already well-suited

| Component | Why it fits |
|---|---|
| `collection_items` | Has `user_id`, `product_id`, `release_id`, `condition`, `acquisition_price/date/currency`, `quantity`, `notes`. A listing can reference one row and inherit everything identifying. Nothing about it is marketplace-hostile. |
| `collection_item_photos` | Already the right place for specimen photos, ownership checked *through the parent row* — the exact pattern a listing's photos should reuse rather than duplicating. |
| Catalog (`products`/`product_releases`) | Admin-owned, public-read, stable UUIDs, item number **not** identity. A seller can never fork or mutate catalog truth. This is the single most valuable thing already in place. |
| `wishlist_items` | `release_id` is **nullable** (product-level "any release" vs release-level "specifically this one"). Demand signal is already modeled correctly for matching — see Section 7. |
| Market schema (`price_points`) | Already has `price_type` (`sold`/`listing`/`user`/`msrp`), `is_sold`, `reliability_score`, `source_id` with `base_trust_score`. An internal listing is just another *source* — no schema rewrite needed to keep asking prices out of market value. Genuinely good foresight. |
| RLS pattern | Consistent owner-scoped policies with a parent-row-ownership idiom already established. A listing policy would follow the same shape. |

### Structural gaps that must be decided before listings exist

**(a) Collection items are hard-deleted.**
`removeCollectionItemAction` → `deleteCollectionItem` is a real `DELETE`,
and `collection_item_photos` / `collection_item_value_history` cascade.
Today that's fine. With listings and sale history it is not: deleting an
item would erase the provenance of a completed sale, and any
`marketplace_listings.collection_item_id` FK would either block the
delete (confusing UX) or cascade away the sale record (data loss).
**Decision needed before Stage 3: soft-delete / archive for collection
items, or listings that snapshot enough to survive independently.** I
recommend soft-delete (`archived_at`), because it also solves "sold but
I want it out of my active collection view."

**(b) There is no public read path for `profiles` or `collection_items`.**
Both are strictly owner-only (`profiles_select_own`,
`collection_items_owner_all`). This is a *good* default, but it means
public collections and public listings are not a UI feature — they need a
deliberate new visibility model and new RLS policies. This is the single
largest piece of unbuilt work between here and a marketplace, and it is
mostly *policy design*, not code volume.

**(c) `profiles` has `username` (unique, notNull) but no public surface.**
Good news: the identity primitive for a public profile already exists.
No `bio`, `public` flag, or contact preference — those are additive.

**(d) No soft state on collection items at all.**
There is no `visibility`, no `status`. Every marketplace concept
("public", "for sale", "open to offers") needs *somewhere* to live. See
Section 5 for where I think it belongs (short answer: split it —
visibility on the item, sale state on the listing).

**(e) `quantity > 1` is unresolved for selling.**
The schema explicitly allows `quantity: 3` for genuinely identical
copies. Selling *one of three* is undefined: does the listing carry a
quantity? Does selling decrement? See Section 4.

---

## 3. Recommended marketplace model

**Classifieds / contact marketplace is the correct choice for V1 and
V2. I agree with the stated preference, and I'd go further: it should
stay classifieds much longer than you probably expect.**

Why this is right:

- **Payments are a business, not a feature.** Escrow, chargebacks, KYC,
  refunds, tax reporting, and dispute resolution are an entire company's
  worth of work. Taking money means becoming a payment intermediary with
  regulatory exposure that has nothing to do with Mini 4WD.
- **Classifieds convert a weakness into a shape.** Low liquidity is
  tolerable in classifieds (a board of "here's what exists") and fatal in
  transactional marketplaces (broken checkout, no buyer protection,
  abandoned carts).
- **The hobby already transacts elsewhere.** Collectors use eBay,
  Mercari, Facebook groups, local meets. TrackDash's edge is *knowing
  exactly which release a specimen is* — that's a discovery and
  identification advantage, not a payments advantage.

**Honest counter-argument:** classifieds capture no revenue per
transaction and make the "did the sale happen?" signal unreliable — which
weakens Price Intelligence (Section 11) and makes fee-based monetization
impossible. That's a real cost. I still think it's the right trade at
this stage, because the alternative costs far more and risks the core
product.

### Minimum flow

```
Collection Item (owned, private)
  → "List for sale"  [owner action]
  → set asking price, currency, shipping willingness, notes, choose photos
  → Listing becomes ACTIVE (publicly visible)
  → buyer sees listing, uses "Contact seller"  [no payment]
  → seller marks SOLD (optionally: sale price, to whom) or WITHDRAWN
  → Collection Item becomes archived-as-sold, or stays with sold history
```

Everything identifying (product, release, item number, chassis, year) is
**read through** the collection item's release. The seller never types
it, and cannot override it.

---

## 4. Collection Item relationship

### Is the hierarchy correct? Yes — with caveats.

`Marketplace Listing → Collection Item → Release → Product` is correct
because the thing being sold is a *specimen*, not a model. It prevents
catalog forking, gives photos/condition/provenance for free, and makes
"you can only sell what you own" enforceable in one line of RLS.

### Real problems found, and how I'd handle them

**Selling something not in your collection.**
Don't support it. Requiring "add to collection first" is a *feature*: it
guarantees the item is catalog-identified and gives the seller a reason
to use the core product. The friction is one dialog they'd fill anyway.

**Collection item deleted while a listing exists.**
Real problem (Section 2a). Fix with soft-delete + `on delete restrict`
semantics on active listings: you cannot delete an item with an active
listing; withdraw it first. Sold listings keep pointing at the archived
item.

**Multiple listings of the same specimen.**
Must be prevented for *active* listings — a partial unique index on
`(collection_item_id) where status = 'active'` is the clean expression.
Historical listings (relisted after withdrawal) should absolutely be
allowed to accumulate; that's the listing history.

**Relisting.** Falls out of the above: a new listing row referencing the
same collection item, previous one `withdrawn`/`expired`. Do not "reopen"
an old listing — a new row keeps price history honest.

**Quantity > 1.** The cleanest MVP answer: **listings only apply to
quantity-1 items.** If a user wants to sell one of three identical
copies, the UI splits the row (quantity 3 → quantity 2 + a new
quantity-1 row) and lists the new one. This avoids a partial-quantity
state machine entirely and matches the existing "different in any way →
separate rows" convention. Do *not* put `quantity` on the listing in V1.

**Sealed vs assembled / custom builds / condition.** Already handled by
`condition` on the collection item, and correctly so — condition belongs
to the specimen, not to the sale. A custom build is a specimen property
(and per Catalog Model V2, must never mutate catalog chassis). The
listing should *display* condition, never redefine it.

**Photos.** Reuse `collection_item_photos`. A listing should reference
which photos to show (or simply show all of the item's photos in V1)
rather than creating a parallel photo table. Duplicating photos would
immediately create a "which is canonical?" problem.

---

## 5. Marketplace state machine

### The critical modeling decision: split visibility from sale state

This is the enum mistake most projects make and then have to rewrite.
`private / public / open_to_offers / for_sale / sold` looks like one
enum. **It is two orthogonal concepts:**

- **Collection Item visibility** — do others see that I own this?
  `private | public`. Meaningful with no marketplace at all.
- **Listing state** — the lifecycle of one *sale attempt*.

Conflating them breaks immediately: "sold" is a fact about a *sale*, not
a visibility level; an item can be public-and-not-for-sale forever; and
after a sale you still want the item visible in a public collection as
"previously owned."

### Recommended

**On `collection_items` (or a visibility column):**
```
visibility: private | public          (default private)
```

**On `marketplace_listings`:**
```
draft → active → sold
              → withdrawn
              → expired
```

- `draft` — created, not yet published. Keep it; it makes "save and
  finish later" trivial and costs nothing.
- `active` — publicly visible, contactable.
- `sold` — terminal. Records that a sale occurred (see Section 10).
- `withdrawn` — terminal, seller-initiated. Relist = new row.
- `expired` — terminal, system-initiated after N days. **Include this
  from day one.** Stale listings are the #1 killer of classifieds
  credibility; auto-expiry with a "renew" nudge is the cheapest possible
  quality mechanism.
- `reserved` — **omit in V1.** Without payments it's unenforceable and
  becomes a lie ("reserved" for someone who ghosted). Add later only if
  sellers actually ask.

### Where does `open_to_offers` go?

**Not a listing status. A listing `sale_mode`.**

```
sale_mode: fixed_price | open_to_offers
```

Reason: an open-to-offers item goes through the *same* lifecycle
(active → sold/withdrawn/expired). The only difference is whether an
asking price is set and how the CTA reads. Making it a status would
force every state transition to be duplicated. Making it a mode keeps
the state machine four states wide forever.

This also lets `asking_price` be nullable-and-meaningful: `NULL` +
`open_to_offers` is coherent; `NULL` + `fixed_price` is invalid.

---

## 6. Conceptual data model

**Conceptual only — no migration, no schema change.**

### `marketplace_listings`

| Field | Why it exists | Must NOT duplicate |
|---|---|---|
| `id` | Listing identity. | — |
| `collection_item_id` → `collection_items` | **The** link. Everything identifying is read through it. | product/release/item number/chassis/year — never copied here |
| `seller_user_id` → `profiles` | Denormalized owner for fast public queries + RLS without a join on every read. Must always equal the item's owner (enforced). | — |
| `status` | `draft/active/sold/withdrawn/expired`. | — |
| `sale_mode` | `fixed_price / open_to_offers`. | — |
| `asking_price`, `currency` | Commercial data — the actual new information. NULL allowed when `open_to_offers`. | acquisition price (that's the item's, private) |
| `shipping_note` (free text) or `ships_to` | Classifieds-level shipping willingness only. | a real shipping/rates engine |
| `seller_notes` | Sale-specific description ("box has a crease"). | the item's own `notes` (private) |
| `contact_preference` | How to reach the seller (in-app, per Section 12). | raw email/phone in a public column |
| `published_at`, `expires_at` | Drives expiry + sorting. | — |
| `sold_at`, `sold_price`, `sold_currency` | Sale outcome, seller-declared. See Section 10/11. | — |
| `created_at`, `updated_at` | Standard. | — |

Constraints worth locking now: partial unique on `collection_item_id`
where `status = 'active'`; check that `asking_price IS NOT NULL` when
`sale_mode = 'fixed_price'` and status is beyond draft.

### `collection_items` (additive, no restructure)

- `visibility` (`private`/`public`, default `private`)
- `archived_at` (soft-delete; also "sold, keep the record")

### Possibly needed later, NOT in MVP

- `listing_contacts` / `listing_inquiries` — if in-app messaging happens.
  Even a minimal version needs a contact record for rate-limiting and
  abuse handling; see Section 12.
- `listing_events` — audit trail of state transitions. Nice, not
  required for MVP; `status` + timestamps cover most needs.

**Explicitly not designing:** orders, carts, payments, escrow, invoices,
shipping labels, fees. None are needed for classifieds.

---

## 7. Wishlist integration

This is TrackDash's **best marketplace idea** and the cheapest to build.

The wishlist already models demand at exactly the right granularity:
`release_id` nullable = "any release of this model", set = "specifically
this edition." That distinction is precisely what matching needs.

### Matching semantics

- Wishlist row with `release_id = X` matches listings whose item's
  release is X. Exact.
- Wishlist row with `release_id = NULL` (product-level) matches listings
  for **any** release of that product. Broader, and correct — the user
  said they don't care which edition.

Matching is a straightforward join; no schema change is needed to
*compute* it.

### What to show, in order of cost

1. **Aggregate demand on the catalog page** — "3 collectors want this."
   No marketplace required, works today, and is genuinely motivating for
   sellers. Cheapest real community signal in the whole product.
2. **Availability on the wishlist** — "1 available" next to a wishlist
   row once listings exist. High perceived value, trivial query.
3. **Notifications** — deliberately later. Requires delivery
   infrastructure, preference management, and anti-spam thought.

**Recommendation:** ship (1) *before* any marketplace exists. It makes
the wishlist more valuable immediately and generates the demand data that
tells you whether a marketplace is even warranted.

Privacy note: aggregate counts only. Never "user X wants this" without
explicit opt-in — that turns a wishlist into a targeting list.

---

## 8. Open to Offers

### Assessment: valuable, and I'd ship it *with* listings — not before.

**Value.** It fits how this hobby actually behaves. Many collectors have
grails they'd part with at the right number but won't actively list. That
inventory is invisible to every existing marketplace. Surfacing it is a
genuine differentiator — arguably more differentiating than for-sale
listings, which eBay already does better.

**Difference from For Sale.** For Sale = "I've decided to sell, here's
the price." Open to Offers = "I'm not selling, but make your case."
Different intent, same lifecycle — hence `sale_mode`, not `status`
(Section 5).

**Risks, honestly:**
- *Spam / lowballing.* The main risk. A collector who gets six €5 offers
  on a grail turns the feature off and resents it. Mitigations: rate-limit
  contacts per user per day; let the seller set a "don't bother below X"
  hint; make offers require a message, not one-tap.
- *Privacy.* Open-to-offers implicitly advertises "I own something
  valuable." This compounds the collection-visibility risk (Section 9).
- *Liquidity dilution.* If most items are open-to-offers and few are
  for-sale, the marketplace reads as "nothing is actually buyable."
  Watch this ratio; consider surfacing for-sale listings preferentially.

**Sequencing.** Building it *before* the classic marketplace would mean
building contact/abuse infrastructure with no listings to justify it.
Building it *after* means a second migration to the state machine. Since
`sale_mode` costs one column, **ship both together in Stage 3** — but
launch with for-sale prominent and open-to-offers secondary, so the
marketplace doesn't read as empty.

---

## 9. Public collections & community

### Recommendation: **private by default, public per-item, opt-in.**

Not "always public" (unacceptable), and not a single account-wide toggle
(too blunt — collectors want to show the nice stuff and hide the grails).

Concretely:
- `collection_items.visibility` defaults to `private`.
- Profile has an opt-in "public profile" flag; without it, nothing shows
  regardless of item visibility.
- Listing an item for sale **implies** public visibility for that item
  (you cannot sell secretly) — but only that item.

### What can be public

| Data | Default | Note |
|---|---|---|
| Username, avatar, country, collector level | public if profile is public | Already exists on `profiles` |
| Owned items (per-item opt-in) | private | The core "show my collection" feature |
| Wishlist | private; opt-in public | Useful socially, but also a targeting list — opt-in only |
| Items for sale / open to offers | public (implied by listing) | — |
| Collection *statistics* (count, by chassis/series) | opt-in | Safer than item-level detail |
| **Total collection value** | **never public** | See risk below |
| Acquisition price / date / source / private notes | **never public** | Owner-only, always |

### The real privacy risk

A public collection of high-value sealed vintage kits, plus a country
field, plus a contact channel, is a **targeting dataset for theft**. This
is not hypothetical for collectibles communities. Concrete mitigations:
never expose aggregate value publicly; never expose precise location
(country is enough, no city/postal); make value-relevant fields
(acquisition price) structurally owner-only in RLS, not merely hidden in
the UI.

**Strategic point:** public collections are worth building *for their own
sake*, independent of any marketplace. Showing off a collection is the
oldest motivation in the hobby, it drives sign-ups, and it generates the
public surface a marketplace would later need anyway. This is why it's
Stage 1.

---

## 10. Ownership & sold history

### Recommended: **B for MVP** (seller keeps a historical record; buyer
creates their own item), **C as the eventual model.**

**Why not A (transfer the item to the buyer).** It looks elegant and is
wrong for classifieds. The buyer may not be a TrackDash user at all. It
would destroy the seller's history (their acquisition price, their
photos, their holding period) — the exact data that makes TrackDash
valuable to the seller. And it would let one user's action mutate another
user's collection.

**Why B works now.** The seller's item is marked sold/archived and keeps
everything: `acquisition_price`, `acquisition_date`, plus `sold_price`
and `sold_at` from the listing. Holding period and realized gain are
computable from data already in one row. The buyer, if they're a user,
adds the item to their own collection normally (the existing
add-to-collection flow already does this).

Cost of B: no continuous chain-of-custody across owners. For a classifieds
MVP, that's an acceptable loss — nobody expects provenance chains yet.

**Why C later.** A separate `ownership_records` / provenance model
(specimen ↔ successive owners) is the *correct* long-term shape for
collectibles, and it's genuinely appealing for vintage Mini 4WD. But it
requires a stable specimen identity independent of any one user's
collection row — a real modeling effort. Don't build it until there's a
reason (e.g. verified provenance as a premium feature).

### What to preserve (all achievable with B)

Purchase price ✓, sale price ✓, purchase date ✓, sale date ✓, holding
period ✓ (derived), listing history ✓ (multiple listing rows per item),
ownership history ✗ (deferred to C).

---

## 11. Price Intelligence relationship

**Lock this rule now: an asking price is never a market value.**

The existing schema already supports the distinction correctly —
`price_points.price_type` (`sold`/`listing`/`user`/`msrp`),
`price_sources.base_trust_score`, `is_sold`, `reliability_score`. An
internal marketplace should be **a new `price_sources` row**, not a new
mechanism.

### The four signals, ranked by trust

| Signal | `price_type` | Trust | Use |
|---|---|---|---|
| Confirmed external sale (eBay sold, etc.) | `sold` | Highest | Primary market value input |
| **Internal confirmed sale** (seller marked sold + price) | `sold`, own source, lower trust score | Medium | Include, but discounted — it's self-reported |
| Accepted offer | `sold`-ish | Medium-low | Only if both parties confirm; otherwise ignore |
| **Internal asking price** (active listing) | `listing` | Low | Display as "asking", never feed market value |
| Estimated market value | derived | — | Output, never input |

### Manipulation vectors and cheap defenses

The obvious attack: a user lists their own kit at €5,000, TrackDash shows
"market value €5,000," they sell elsewhere on that fake authority. Or the
reverse: fake low sales to depress a value before buying.

Defenses proportionate to an MVP:
- **Asking prices never enter valuation.** Structural, not statistical —
  this alone removes the easiest attack.
- **Self-reported sales get a low `base_trust_score`** and never
  single-handedly move an estimate; require a minimum sample.
- **Outlier rejection** before aggregation (the `reliability_score`
  column exists for exactly this).
- **A seller's own sale shouldn't dominate their own item's displayed
  value.** Watch for self-dealing loops.
- **Show sample size and confidence in the UI** (the schema already
  carries `sample_size` and `confidence`, and an `is_demo` honesty flag —
  keep that discipline).

**Honest limitation:** in classifieds, TrackDash never observes the
actual transaction. Every internal "sold" is self-reported and therefore
gameable. Treat internal sale data as weak evidence permanently, unless
the model becomes transactional.

---

## 12. Trust, abuse & moderation

Even without payments, a marketplace creates abuse surface. Keep the MVP
proportionate — no enterprise trust-and-safety stack.

### Necessary for MVP

1. **Verified email / real account required to list.** Supabase Auth
   already provides the primitive.
2. **You can only list what you own** — enforced in RLS (Section 13),
   not just in UI. This kills the largest class of fake listings for free
   and is TrackDash's structural advantage over a generic forum.
3. **Rate limits.** Listings per user per day; contacts/offers sent per
   user per day. The single most effective anti-spam measure.
4. **Report button** on every listing and public profile, writing to a
   simple queue an admin can read. Manual review is fine at this scale.
5. **Admin takedown** — ability to unpublish a listing and suspend a
   user. Can be a service-role script initially; it does not need a UI.
6. **Auto-expiry** (Section 5) — removes abandoned listings without
   human effort.
7. **No raw contact details in public fields.** Contact goes through the
   app (or a relayed form), so a scraped listing page yields no email.
8. **Photos must come from the user's own collection item** — makes
   stolen-photo listings harder and is free given the existing model.

### Deliberately NOT in MVP

Seller ratings/reputation (meaningless at low volume, and unfair when
transactions are unverifiable), dispute resolution, identity
verification, automated fraud scoring, buyer protection, escrow.

**Honest caveat:** classifieds with a contact channel means scams *will*
occur off-platform and users *will* blame TrackDash. Set expectations
explicitly in the UI ("TrackDash does not handle payments or guarantee
transactions") from the first listing. That disclosure is part of the
MVP, not a later polish item.

---

## 13. RLS / permissions strategy

Conceptual only — **no policy in the repository was modified.**

| Question | Answer |
|---|---|
| Who can create a listing? | An authenticated user, **only** for a `collection_item` whose `user_id` is their own. Enforced with the existing parent-row-ownership idiom (`exists (select 1 from collection_items where id = collection_item_id and user_id = auth.uid())`) — the same pattern `collection_item_photos` already uses. |
| Who can modify it? | The seller only. Same check. |
| Who can read it? | `active` and `sold` listings: public (anon + authenticated). `draft`: owner only. `withdrawn`/`expired`: owner only, or public-but-delisted — I'd keep them owner-only to avoid stale public pages. |
| Item belongs to another user? | Insert/update is rejected by the `withCheck` clause. This is why the ownership check must be in RLS, not only in a server action. |
| Preventing listings of unowned specimens | Falls out of the above — there is no code path to list an item you don't own, because there's no way to reference someone else's collection item and pass the policy check. |

### Consequential change: public read on `collection_items`

Today `collection_items_owner_all` is a single `for: "all"` policy with
`user_id = auth.uid()`. Public collections/listings require an
**additional** select policy for public rows — something like
"selectable by anyone when `visibility = 'public'` and the owner's
profile is public." This is the most delicate policy work in the whole
project, because a mistake exposes private collections. It deserves
explicit tests (positive *and* negative) before shipping.

The same applies to `profiles` (currently `select_own` only) and
`collection_item_photos` (currently owner-only, but listing photos must
be publicly readable for public listings).

**Column-level caution:** making a collection item row publicly readable
exposes *every* column of that row, including `acquisition_price`,
`acquisition_source`, and private `notes`. RLS is row-level, not
column-level. **Public reads must go through a view or a restricted
projection** that omits those columns — not a naive "add a public select
policy" on the base table. This is a genuine footgun and the most likely
place to leak private data.

---

## 14. Rollout roadmap

Ordered by value-per-risk, not by the order the features were imagined.

**Stage 0 — Marketplace teaser / waitlist.**
Low cost, real signal. A "coming soon, register interest" surface plus,
ideally, the aggregate wishlist demand counter (Section 7). *Value: tells
you whether to build Stages 3+ at all.* Do this.

**Stage 1 — Public collections (+ public profiles).**
The genuine community product. Requires: visibility model, the public-read
RLS/view work (Section 13), privacy defaults. *Value: standalone, drives
sign-ups, builds the public surface a marketplace needs later.*
**This is where I'd invest first.**

**Stage 2 — Wishlist demand signals.**
"N collectors want this" on catalog/product pages; "available" counts
once listings exist. Cheap, motivating, no marketplace required for the
first half.

**Stage 3 — Classified listings + Open to Offers (together).**
The marketplace proper: `marketplace_listings`, the four-state machine,
`sale_mode`, contact flow, rate limits, expiry, report/takedown, the
"we don't handle payments" disclosure. Prerequisite: soft-delete for
collection items (Section 2a).

**Stage 4 — Wishlist matching & notifications.**
Only once listings exist and there's enough inventory for a match to be
non-embarrassing. Needs notification preferences and anti-spam design.

**Stage 5 — Transactional marketplace.**
**Do not assume this gets built.** Only if: sustained listing volume,
repeated user demand for payment handling, and an appetite for the
regulatory/support burden. A perfectly good outcome is TrackDash staying
classifieds forever and monetizing elsewhere.

---

## 15. Business model implications

Ranked by fit with collector-first positioning.

**Good fits:**
- **Premium collector analytics** (deeper valuation history, portfolio
  insight, export, advanced stats). Sells to the *collector*, aligns with
  the core product, doesn't tax the community. Best fit by a distance.
- **Freemium limits on collection size / photos / features.** Standard,
  understood, doesn't distort the marketplace. Be careful not to cap the
  core "track your collection" value so hard it kills adoption.
- **Affiliate links to external marketplaces** (eBay etc.) from
  catalog/wishlist pages. Genuinely useful to users *and* revenue-
  generating, with no marketplace required. Underrated option.

**Risky, use with care:**
- **Promoted listings.** Works only with real liquidity; with few
  listings it's transparently absurd. Also creates the first incentive to
  distort discovery. Later, if ever.
- **Seller subscription.** Suppresses supply exactly when supply is the
  scarce resource. Wrong at this stage.

**Bad fits for now:**
- **Commission / marketplace fee.** Requires transactional marketplace
  (Stage 5) *and* creates a hard incentive to push users toward on-
  platform transactions — which is where collector-first positioning
  usually dies. Also unenforceable in classifieds: users would simply
  transact off-platform.

**Principle:** monetize the *collector's* experience (analytics,
convenience), not the *community's* transactions. The moment TrackDash's
revenue depends on transaction volume, product decisions start optimizing
for GMV over collection quality — and the catalog integrity work that
makes this product special stops being the priority.

---

## 16. Risks

| Risk | Severity | Note |
|---|---|---|
| **Empty marketplace** | High | The most likely failure. Mitigate by sequencing (Stage 0/1 first) and by not launching listings until there's inventory. |
| **Private collection data leak via public-read RLS** | High | See Section 13's column-level warning. Needs explicit negative tests. |
| **Theft targeting via public high-value collections** | High | Never expose aggregate value; opt-in per item; no precise location. |
| **Price Intelligence manipulation** | Medium | Structurally mitigated by never feeding asking prices into valuation. |
| **Scams off-platform blamed on TrackDash** | Medium | Explicit disclosure from day one; report/takedown. |
| **Focus dilution from the core product** | Medium | Real. The catalog/collection experience is the moat; a half-built marketplace competing for attention is worse than none. |
| **Soft-delete/history gap discovered late** | Medium | Cheap to fix now, expensive after listings exist. |
| **Open-to-offers spam degrading the feature** | Low-Medium | Rate limits + minimum-message requirement. |
| **Quantity>1 selling semantics** | Low | Solved by the split-row convention (Section 4). |

---

## 17. Decisions to lock now

These are settled architectural decisions, so later work doesn't
re-litigate them:

1. **`PRODUCT → RELEASE → COLLECTION ITEM → MARKETPLACE LISTING` stands.**
   A listing never forks the catalog and never redefines identifying data
   (product, release, item number, chassis, release year) — all of it is
   read through the collection item's release.
2. **A listing always refers to a specimen the seller owns.** There is no
   "sell something not in your collection" path; add-to-collection first
   is required, and ownership is enforced in RLS (see 7).
3. **Collection Item *visibility* and Listing *lifecycle* are separate
   concepts** — never merged into one enum. Visibility (`private` /
   `public`) lives on the item and is meaningful with no marketplace at
   all; sale state lives on the listing.
4. **`open_to_offers` is a `sale_mode`, NOT a listing status.** Statuses
   stay `draft / active / sold / withdrawn / expired`; no `reserved` in
   V1.
5. **Marketplace MVP = classifieds / contact only.** TrackDash connects
   seller and buyer and does nothing else.
6. **No payment, checkout, escrow, shipping handling, buyer protection,
   fees, or commission in the initial marketplace.** These are explicitly
   out of scope, not merely deferred to a backlog.
7. **You can only list a specimen you own — enforced in RLS**, not only
   in UI or a server action.
8. **Ownership MVP = model B:** the seller keeps their own historical
   record (acquisition price/date, sale price/date, holding period); the
   buyer creates their own Collection Item. No cross-user item transfer.
9. **An asking price never automatically becomes market value.** Internal
   listings feed Price Intelligence only as low-trust `listing` data;
   internal self-reported sales are weak, discounted evidence.
10. **Public collections require a safe projection/view — never a plain
    public SELECT on all columns.** RLS is row-level, so exposing a
    collection row would expose `acquisition_price`,
    `acquisition_source`, and private `notes`. Public reads must go
    through a restricted projection that omits them.
11. **Hard-delete of Collection Items is incompatible with sold history
    and must be resolved before Marketplace Stage 3.** Soft-delete /
    archive is the intended fix; a sold listing must never be orphaned or
    cascade-deleted.
12. **Public collections ship before classified listings.** Stage 1
    precedes Stage 3; the community surface and its privacy model are a
    prerequisite for the marketplace, not a by-product of it.
13. Collections and profiles are **private by default**, public strictly
    opt-in per item; acquisition price and private notes are **never**
    public.
14. Aggregate collection value is **never** publicly exposed.
15. Photos come from `collection_item_photos` — no parallel listing-photo
    table.
16. Active listings are unique per collection item; relisting creates a
    new row.

## 18. Decisions deliberately postponed

- Full ownership/provenance chain (model C) — until there's a concrete
  reason.
- Notifications and matching alerts (Stage 4).
- Seller reputation/ratings — meaningless before volume.
- `reserved` state — only if sellers ask.
- In-app messaging vs. relayed contact form — decide at Stage 3 with the
  abuse model in hand.
- Any transactional marketplace, fees, or commission (Stage 5, optional).
- Promoted listings.
- Whether wishlists are ever public.

---

## 19. Final Go / No-Go

**Verdict: GO on community, CONDITIONAL GO on marketplace, with a firm
"not yet."**

**Is a marketplace coherent with TrackDash?** Yes. Collectors track what
they own and trade what they don't want — it's the same user, and
TrackDash's release-level precision is a genuine advantage over generic
marketplaces where "Mini 4WD Avante" could be five different kits. The
architecture already supports it.

**Is it a distraction?** *Right now, yes.* Not because it's wrong, but
because it's out of order. A marketplace built before there are
collections to sell from and users to sell to will be empty, and an empty
marketplace is worse than an absent one. The work between here and a good
marketplace is mostly *community and privacy* work (Stages 0–2), which is
valuable on its own and is a prerequisite regardless.

**When should it be introduced?** After public collections exist and are
used. Rough, honest prerequisites before Stage 3:
- Enough active users that a listings page isn't visibly empty (I'd want
  hundreds of engaged collectors, not dozens).
- Enough catalog coverage that most items people own are findable —
  currently **36 products / 62 releases**, which is a proving set, not
  the coverage a marketplace needs. Improving both coverage *and*
  release-level `verification_status` is arguably the hardest
  prerequisite, and it's data work, not code.
- Real signal from Stage 0/2 that people *want* to buy and sell here.

**What I would definitely build:** public collections with per-item
opt-in visibility and careful RLS; aggregate wishlist demand signals;
soft-delete for collection items; the `visibility` / `sale_mode` /
listing-state model as specified.

**What I would NOT build initially:** payments, escrow, fees, ratings,
notifications, `reserved`, promoted listings, provenance chains, in-app
messaging beyond a rate-limited contact form — and, most importantly, the
listings themselves until the prerequisites above are met.

**The one thing I'd push back on hardest:** treating the marketplace as
the next feature. The catalog currently covers 36 products / 62 releases
— a proving set, not the coverage a marketplace needs — and a meaningful
share of those releases still carry a non-`verified` `verification_status`
(release-level, per Catalog Model V2). Catalog coverage and the collection
experience are the actual moat. Marketplace value compounds *on top of*
catalog coverage and user base — building it first inverts that
dependency.

---

*This document is analysis. No code, schema, migration, RLS policy, or UI
was created or modified in producing it.*
