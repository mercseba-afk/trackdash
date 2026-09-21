# TRACKDASH — PROJECT STATE

> Persistent operational snapshot.  
> **Last updated:** 2026-09-21  
> This file is the cross-chat continuity source for the current TrackDash state.  
> Before changing production data/code, re-verify GitHub `main`, Vercel Production and live Supabase where the value can have changed since this snapshot.

---

## SESSION BOOTSTRAP — READ FIRST

For every TrackDash continuation/new chat, read in this order:

1. `docs/TRACKDASH_METHOD_MASTER.md` — authoritative method and Completion Gate.
2. `docs/TRACKDASH_STATE.md` — latest project/family status and exact next action.
3. `docs/TRACKDASH_OPERATIONS.md` — behavior of Admin refresh, cron, recompute and operational commands.
4. Then verify only the live facts that can have changed: current `main`, Vercel Production commit, queue/status in Supabase.

Do **not** reconstruct project state from chat memory when these repository sources exist.

---

# CURRENT FOCUS

## Family in progress

**Avante Mk.III**

Product ID:

`de719716-e50a-5811-b99d-18bbb153b166`

Current family identity:

- canonical family: **24 Release**;
- `94692` = Red Special 2009;
- `95425` = distinct Red Special 2018 re-release;
- `94772` = Competition Pack 2010;
- `92470` = Korea Mini 4WD Cup 2026;
- `95464` = one Release; later production activity is a production wave, not a second Release.

---

# REPOSITORY / PRODUCTION

## Last functional repository baseline before documentation checkpoint

Last known functional/data commit before this STATE document:

`a8ed6e10ae3e64d39b1e48b63e1a55439b7c6924`

It includes the most recent Avante market endpoint work through migration `0136`.

The documentation commits that create/update this file will naturally move `main` beyond that SHA.  
Therefore, in a future session, obtain the **actual current main HEAD from GitHub** rather than treating the SHA above as permanent.

## Vercel Production

Last verified READY Production commit:

`4a52720db15679f6ce2c0095571d208a13e2fb5b`

Production is therefore **behind current main**.

The later deployment attempt was blocked by the Vercel free build/deploy rate limit.  
Do not declare Production aligned until:

1. current `main` deploys READY;
2. `https://trackdash.it/api/version` returns the same current main SHA;
3. Production QA passes.

A temporary one-shot recompute route was experimented with while Production was on `4a52720…`.  
The route has since been removed from `main`, and its one-time authorization table was dropped from Supabase. It must not be reused or recreated as a shortcut.

---

# AVANTE MK.III — COMPLETION MATRIX STATUS

## 1. Catalog audit

**Status: DONE**

- 24 canonical Release rows are present in live Supabase.
- Stable IDs/scanner identity are aligned with the current canonical family.
- Red Special 2009 and 2018 are separate identities.

## 2. Images

**Status: AUDITED**

Exact image rows currently exist for **18 / 24** Release.

Intentional exact-image placeholders remain for:

- `92207`
- `92218`
- `92219`
- `92221`
- `92284`
- `92470`

These placeholders are intentional until a stable, directly attributable exact-release asset is available.  
Do not silently inherit a generic Avante image or a sibling Release image.

For `92470`, an exact Tamiya Hong Kong product page has been found, but a stable directly attributable image asset has not yet been adopted into TrackDash.

## 3. Production status / rarity

**Status: AUDITED / STORED**

Known values are stored per Release; unknown values remain unknown rather than invented.

## 4. Initial Market Scan

**Status: DONE FOR FAMILY COVERAGE**

All **24 / 24 Avante Mk.III Release** now have at least one real direct or contextual market evidence record.

Important rules already applied:

- exact Release identity before valuation;
- historical/out-of-stock retail is not current availability;
- unresolved multi-Release lots are never divided into fake per-Release prices;
- SOLD without an exposed sale date can be retained as market evidence but not promoted to principal valuation evidence by inventing `sold_on`;
- unsupported currencies can be retained in review instead of being forced through the canonical valuation lane;
- absence of visible SOLD is not treated as absence of market.

### Important market corrections / evidence

- `95425`: exact eBay ASK for ITEM 95425 stored separately from 94692.
- `95464`: exact eBay ASK stored; Pieroni page remains review because availability signals conflict.
- `92470`: exact eBay ASK stored.
- `18626`, `18627`, `18662`: exact European retail observations stored as out-of-stock where appropriate.
- `92422`, `92428`, `92430`, `94741`, `94951`, `18662`: Yahoo closed-sales evidence stored as indicative exact-release SOLD evidence with non-invented dates/FX.
- `94673`, `94674`, `94692`, `94715`, `94772`, `94777`, `95469`: exact RCJAZ historical/out-of-stock evidence stored.
- `92207`, `92218`, `92284`: exact Mercari sold-market evidence stored without inventing missing sale dates.
- `92219 + 92221`: one exact two-Release Mercari lot is stored as unresolved/needs-review and **must never be split into two artificial prices**.

## 5. Identity bug fixed

A legacy RCJAZ endpoint whose URL was clearly ITEM `94692` had been attached to Release `95425`.

This was corrected by:

`0134_avante_red_special_endpoint_identity.sql`

The endpoint now belongs to the correct 2009 Release `94692`.

No market candidate had been created from that endpoint before the correction, so no historical candidate had to be reassigned.

## 6. New endpoint migrations

Latest Avante endpoint migrations:

- `0133_avante_mkiii_retail_endpoints.sql`
- `0134_avante_red_special_endpoint_identity.sql`
- `0135_avante_finished_model_rcjaz_endpoints.sql`
- `0136_avante_94777_rcjaz_endpoint.sql`

They are applied to live Supabase.

## 7. Recompute

**Status: PENDING / QUEUED**

At the last live check:

- total `new_complete_unbuilt` recompute jobs: **31**
- Avante Mk.III jobs: **24**
- older Manta Ray Mk.II jobs: **7**
- locked jobs: **0**
- jobs with error: **0**

The queue is global and processed oldest-first.

The official Admin action executes `runMarketRecomputeBatch(8)`, therefore one Admin refresh can process at most **8 recompute jobs**.

Because the 7 Manta jobs are older, the first Admin run is expected to process those first plus the next oldest job, subject to any newer queue changes.

Do not assume a fixed number of button presses without re-checking the queue after runs; approximately four runs would drain 31 jobs if no new work is enqueued and all succeed.

## 8. QA Production

**Status: NOT YET COMPLETE**

Required after recompute:

- inspect resulting `market_release_signals`;
- ensure valid ASK shows observed/current price and does not fabricate Market Value;
- ensure historical out-of-stock retail does not appear as current availability;
- ensure no public `SOLD 0`;
- ensure Collection preview derives from the same canonical Release/signal data as catalog/release pages;
- verify exact images/placeholders;
- verify scanner distinctions, especially `94692` vs `95425`;
- verify current `main = Production /api/version`.

## 9. Repository verification gate

The Master requires full `pnpm verify` on the exact final code intended for `main`.

A full verification was green earlier in the Avante work, before the latest SQL/documentation changes.  
Before declaring the family complete, run/confirm the verification gate again on the final main state.

---

# ADMIN MARKET REFRESH — CURRENT OPERATIONAL FACT

The button:

**Admin → Aggiornamento mercato → Esegui ora**

is the official manual equivalent of the regular market cycle.

It currently launches in parallel:

- `runExactPageMarketScanBatch(4)`
- `runEbayActiveMarketScanBatch(4)`
- `runMarketRecomputeBatch(8)`

This behavior is documented in detail in:

`docs/TRACKDASH_OPERATIONS.md`

Do not rediscover or guess this behavior from chat memory in future sessions. Read the Operations document and verify code only if the document may have become stale or the behavior is being changed.

---

# EXACT NEXT ACTIONS

1. Use **Admin → Aggiornamento mercato → Esegui ora**.
2. Let the run finish and record the returned:
   - Retail succeeded / attempted;
   - eBay succeeded / attempted;
   - Ricalcolo succeeded / attempted.
3. Re-check `market_recompute_queue`.
4. Repeat only as needed until the relevant recompute jobs are drained, accounting for newly enqueued jobs.
5. Inspect Avante `market_release_signals` after recompute.
6. Perform Catalog / Release / Collection / Scanner QA.
7. When Vercel permits, deploy the actual current `main`.
8. Verify `/api/version` equals the current GitHub main SHA.
9. Confirm full repository verification gate on the final main.
10. Only then evaluate the Master Completion Gate and mark Avante Mk.III COMPLETE / COMPLETE — MARKET THIN / other allowed result.

---

# REFERENCE FAMILY

**Manta Ray Mk.II** remains the practical benchmark for the current workflow.

Its implementation established the expected patterns for:

- Europe-first refresh policy;
- adaptive scan cadence;
- exact retail endpoints;
- indicative Yahoo closed-sale evidence;
- intentional image-gap documentation;
- Initial Scan vs automatic refresh separation.

When a newer Master rule conflicts with an older Manta implementation detail, **the current Master wins**.

---

# STATE MAINTENANCE RULE

Update this file in the **same work unit** whenever any of these materially changes:

- current family or family status;
- canonical Release count/identity;
- migrations applied;
- market evidence coverage;
- recompute/scan queue state when it changes the next action;
- Production commit/alignment;
- blocker;
- Completion Gate;
- exact next action.

Do not finish a material TrackDash work block with the only accurate state living in chat.
