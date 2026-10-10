# Poseidon-X — family evidence and launch gate (2026-10-10)

> Authoritative family-specific RESEARCH checkpoint, NOT a publication/Production-completion checkpoint. Preserve global Market Method v4, SOLD/ASK separation, TTL-aware public projection and existing UUIDs.

## Historical identity: complete kits vs accessories

Only the **Black Special ITEM 94584** has been substantiated as a complete standalone Mini 4WD assembly kit.

| Classification | Item | Product / generation | Release year | Chassis | Public catalog handling |
| --- | --- | --- | --- | --- | --- |
| Full Mini 4WD kit | 94584 | Black Special **1993 original** | 1993 (November, day unverified) | Super 1 | New ProductRelease `936ac729-f26b-5a21-bec1-f2620b93c5c4`; `research_only` until gate passes |
| Full Mini 4WD kit | 94584 | Black Special **2006 reissue** | 2006 (retailer 12/14; contemporary ~12/16) | Super 1 | New ProductRelease `c37d4161-aa31-535b-b1de-9040730a4cdd`; historically evidenced, family still coming_soon |
| Accessory | 94076 | Poseidon-X original Body Parts Set, J-CUP event | July 1993 | NO chassis | Context in `products.metadata.family_audit` only; **no ProductRelease** |
| Bundle | 94583 | Super Mini 4WD Memorial Box Vol.1 | 2006 | Multiple | Distinct commercial bundle, not a standalone Poseidon-X kit |
| Accessory | 94817 | Poseidon-X Silver Plated Body Set | 2011 | NO chassis | Accessory, not a ProductRelease |
| Accessory | 94804 | Super II Chassis FRP Reinforcement Set / Poseidon body | 2011 | Not a complete Poseidon-X kit | Accessory, not a ProductRelease |

1993 94584 Black Special and 2006 94584 reissue are distinct *collector generations* of the same item number. 2006 verified JAN `4950344945849` **must never be assigned to 1993**. 1993 original JAN unknown. 2006 retail date evidence conflicts; `release_date` is intentionally NULL, with discrepancy documented. 2006 original retail JPY900 pretax / JPY945 incl. 5% historical consumption tax. 1993 original JPY600 historical context. EUR MSRP unknown, no invented rarity.

Stable identifiers: `stableUuid("product:poseidon-x-94584")` = `e8a13fb8-4af2-5f5f-936e-8871d9567289`; releases `stableUuid("release:poseidon-x-94584:black-special-1993")` and `stableUuid("release:poseidon-x-94584:black-special-2006")`. Never regenerate or reassign after deployment.

## Historical sources

- CoroCoro, original 1993 custom design and Japan Cup event **body-only** item: https://corocoro-news.jp/special/331657/
- Contemporary 2006 manufacturer release news: https://response.jp/article/2006/12/06/89096.html
- 2006 Tamiya specifications reproduced by a specialist shop, **full Black Special kit**: https://myrcstation.com/products/tamiya-94584-poseidon-x-black-special-super-1-chassis-94584
- HLJ exact 2006 SKU/JAN/date, **discontinued historical retail**, NOT active ASK: https://www.hlj.com/poseidon-black-special-tam94584
- Suruga historical exact retailer record: https://www.suruga-ya.jp/product/detail/603007818
- Contemporary independent reissue item/packaging/JPY1993 vs JPY2006 verification: https://www.tea-league.com/mt/tea/archives/2006/12/x_6.html
- Accessories: https://www.suruga-ya.jp/ and https://www.hlj.co.jp/ exact-product searches; do not put their JAN/prices in the Black Special records.
- Historical Tamiya product catalog excerpt lists '94584 JR POSEIDON X BLACK SP. LTD EDITION' under Racing Mini 4WD; archived distributor copy: https://images.carid.com/tamiya/items/pdf/tamiya-product-catalog.pdf

## Image audit

- **1993 original**: exact packaging-generation photo not yet verifiable; explicit placeholder (never reuse a 2006 catalog photo as exact 1993).
- **2006 reissue**: exact SKU shop page and its 800x800 JPEG independently checked; a visual preview confirms Poseidon-X Black Special model. The high-confidence, source-attributed product photo is stored in `release_images`; the Next image allowlist is narrowed to its exact filename. Image URL: https://myrcstation.com/cdn/shop/products/96b79938ea5aeb7c1d696355af5e2d88_1200x1200.jpg?v=1630399392. Packaging-year evidence remains the source URL, not mere visual resemblance.
- No photo from accessory or assembled eBay sale can silently substitute an unopened collector kit generation.

## Price Intelligence initial research — no fabricated value

- EU eBay offer around EUR50+EUR10 shipping is **already assembled/used**: cannot establish new_complete_unbuilt ASK/MV; https://www.ebay.it/p/1958427716.
- Suruga 2006 catalog currently shows a **used/second-hand** JPY7300 retail listing, not proven new/sealed nor delivered EU cost; context only: https://www.suruga-ya.jp/product/detail/603007818.
- Mercari JP unbuilt but substantially package-damaged JPY7370 + JP shipping JPY660-1320: not an EU landed-cost quote, original/reissue identity may be ambiguous; context only: https://jp.mercari.com/shops/product/wJNjAjVqquaZXUVwvujkJR.
- HLJ historical USD/JPY shop price is **DISCONTINUED** and not a current asking price.
- No validated qualified new/sealed **SOLD** or Europe-delivered **ASK** has been integrated. `Market Value` must remain absent until canonical engine finds sufficient qualifying evidence. Do not manually populate `market_release_signals` or `market_offer_states`.
- Retain SOLD / ASK / retail / historical context as separate lanes and apply TTL publication (marketplace 360h, retail 744h); Europe-first after condition, authenticity and exact edition checks.

## Automatic enrollment: no family-specific hardcode

- On canonical first signal or explicit verified enrollment, `trackdash_enroll_release_market_scans(release_id)` creates dynamic source policy scan entries.
- **eBay Active** source is `ready`, but ITEM 94584 is shared:
  - 2006 has globally unique JAN `4950344945849` so is eligible for enrollment; worker must still verify structured listing JAN.
  - 1993 original lacks proven JAN, so eBay unattended must stay parked and **never infer** that ambiguous 94584 listings belong to 1993.
  - First new enrollment normally uses NORMAL/42-day cadence unless a separately audited initial scan is explicitly run.
- **Ready exact retail** currently iModellini / Pieroni (and Gandolfi with no default enrollment). Only count as runnable if source policy ready + exact Release endpoint `enabled=true,exact_release_verified=true`; a queue row alone is NOT an actual scanner.
- HLJ / Suruga / RCJaz are not `ready` automated workers at this checkpoint: their source URLs are research context, not evidence of an operational retail scan.
- Recompute is a separate worker; a queued job is **not a completed recompute**. Confirm `market_release_signals` and its TTL-aware public projection before publication.

## Price Guard system-wide eligibility

Existing active daily **TrackDash Price Guard** automation dynamically queries `market_release_signals`, offer state/history, ASK snapshots, active scanner queues, recompute and public projections; it does not contain a fixed family or ITEM whitelist. Thus Poseidon-X and **future** families are eligible *once canonical signals and queues exist*. Do not append a Poseidon name to a list. The guard should preserve the important distinction between old persisted materialized fields and actually TTL-filtered public values, and MUST NOT equate ASK with SOLD.

The automated monitoring prompt's global scope does **not** imply guaranteed exhaustive per-Release scanning at each run; verify signal enrollment and audit coverage rather than asserting that.

## Publication gate — still OPEN

1. Validate migration in actual DB transaction / staging, confirm stable IDs and provenance; family remains `coming_soon`.
2. Confirm 2006 exact image, independently verify 1993 generation photo or acceptable attributable market evidence and apply the same Publication Gate as other families; keep 1993 research_only until then.
3. Complete real initial market scan (not just queue) / Europe-first second-pass Empty Market Challenge for both; run canonical recompute; verify market public projection and existing family signal non-regression. One-time 0220 makes the safe 2006 JAN-qualified eBay job due at the next worker run (1993 stays parked). This is a **scheduled scan**, not proof of a completed scan.
4. Execute `pnpm verify`, image/identity checks, market method/public surface/queue tests, TypeScript and build, PR and Vercel Preview.
5. Verify Release cards, IT/EN, scanner, Collection, Wishlist, offer opening, Market, SEO, sitemap and notifications; ensure no accessory represented as kit. No special case code unless a verified defect exists.
6. Only after these gates: update `launch_status` `coming_soon -> available` **once**, allowing the existing one-family notification trigger; verify Production READY and live trackdash.it. Add final authoritative Production checkpoint to `docs/TRACKDASH_STATE.md`.

**DO NOT mark this family complete or Production published unless all gates are actually verified.**
