# Recent retail reserve — 18 November 2026

## Shared policy

Only after every existing catalog ASK reference (including the existing 180-day historical lane), a verified exact complete/unbuilt retail kit may supply a dated reserve when the shop is out of stock. Both release date and observation must be within 30 days, with no future dates. Deadline is the earlier of release/observation plus 30 days. A newer genuine current quote automatically wins on the next shared server refresh. IT/EN distinguish the reserve as the last out-of-stock shop price. Catalog and collection keep the same reference.

The reserve never enters active ASK medians, purchasable offers, current offer/seller counts, market highlights, SOLD evidence, Market Value or trends. FX is item-only; unknown shipping/import costs stay unknown. Existing historical quotes retain their current 180-day behavior. No new cron, worker, schema or polling frequency.

## Access and failure isolation

Existing public offer RLS intentionally permits only in-stock/low-stock offers. Preserve it. Read recent release dates through the public catalog connection, then load only the relevant recent sold-out offers through the existing server-only admin client. Candidates must be accepted, exact/strong, complete, not a lot, correctly assigned and not pending revalidation. Raw candidate/source data is stripped before public serialization. Failure of the optional reserve query returns no reserves and preserves the normal pricing path.

## Regression evidence

Read-only snapshot from Frankfurt production at 2026-11-18T12:21:45Z: 260 public Mini 4WD releases from available families, 531 in-stock/low-stock offer records. Compared the actual pre-change and changed public projection at the same fixed clock. All 260 outputs match without reserves. Injecting a hypothetical EUR 0.01 eligible reserve leaves all 100 existing price references byte-for-byte unchanged (94 current, 6 historical). No canonical pricing data was modified for this comparison. Monthly trend inputs were held absent in both projections; canonical trend fields are preserved independently by the reserve helper.

Automated tests cover new-release zero-evidence fallback, replacing the reserve with a current quote, existing current/historical preservation, stale/future/invalid/ambiguous rejection, collection parity, IT/EN wording, offline expiry, no highlights/MV/SOLD changes, and optional source failure preserving map/detail parity. Entire repository verify suite passed before the final query-access refinement; affected typecheck/cache/reserve tests rechecked afterward. Local webpack compilation succeeded; page-data collection requires the production DATABASE_URL and is verified during Vercel deployment.

## Initial evidence

Godzilla #95731, JAN 4950344957316: Hobby Search exact page https://www.1999.co.jp/11470628 shows JPY 1,584 and out of stock, checked 18 November. Release date 7 November 2026. ECB 17 November rate: EUR 1 = JPY 175.05, yielding EUR 9.05 item-only. This is a foreign shop reserve, not an Italian delivered price or a confirmed sale. Dedicated idempotent SQL: `scripts/sql/godzilla-recent-retail-reserve-2026-11-18.sql`. No source activation or scheduler changes.
