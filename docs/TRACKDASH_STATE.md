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

## Family just completed

**Avante Mk.III — COMPLETE — MARKET THIN**

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

`4f29a11227e2ed4f4d28205bf912c6d8e8f97a31`

At the verification immediately before the first Admin recompute runs, `https://trackdash.it/api/version` returned the same `4f29a112…` SHA.

This confirms that Vercel had unblocked and Production included all functional Avante work through `a8ed6e10…`.  
Documentation-only commits subsequently advanced `main`, so final Completion Gate still requires a fresh equality check between the actual current `main`, Vercel Production and `/api/version`.

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

**Status: DONE**

On 2026-09-21 the Admin market refresh was run four times in total for this final drain.

Final live queue:

- total `new_complete_unbuilt` recompute jobs: **0**
- Avante Mk.III jobs: **0**
- locked jobs: **0**
- jobs with error: **0**

All **24 / 24 Avante Mk.III Release** have a canonical recomputed signal.

Representative final outputs:

- `92470`: Observed price **€29.49**, no fabricated Market Value;
- `95425`: Observed/effective European reference **€42.66**;
- `95464`: Observed price **€20.99**;
- `95087`: Market Value **€34.91**, SOLD anchor **€34.91**, confidence low;
- thin-evidence releases remain `insufficient` / low-confidence rather than receiving invented values.

## 8. QA Production

**Status: PASSED**

Production QA performed after canonical recompute:

- **24 / 24** Avante Release pages return HTTP 200;
- all 24 pages expose the correct Item Number / Release identity;
- no checked page exposes public `SOLD 0`;
- no checked page exposes the stale fallback “Market data coming / Dati di mercato in arrivo”;
- `94692` is publicly distinct as **Avante Mk.III Red Special 2009**;
- `95425` is publicly distinct as **Avante Mk.III Red Special (2018 Re-release)**;
- `95425`, `95464`, `92470` expose observed-price behavior rather than a fabricated consolidated Market Value;
- `95087` exposes the consolidated Estimated value path.

### Collection consistency QA

Verified in current code:

- Collection fetches canonical catalog products for the user's exact product IDs;
- each collection row resolves the **exact `releaseId`**;
- Collection consumes the shared `useMarketSignals()` map;
- `enrichCollection()` derives Market Value / Observed price from the same exact Release signal;
- `ProductImage` receives the exact Release, so Collection images stay aligned with catalog/release data;
- there is no separate Collection-only market-value copy that can silently drift.

### Scanner QA

Verified in current code:

- Scanner uses the same canonical `PRODUCTS` catalog;
- explicit JAN/EAN exact match has priority;
- exact Item Number resolution is conservative;
- reused Item Numbers fail closed to model-level selection instead of choosing an arbitrary Release;
- distinct unique Item Numbers such as `94692` and `95425` resolve through the same canonical catalog identity used by the public Release pages.

### Version alignment

Before this final STATE checkpoint:

- GitHub `main`: `e7042640b40bd02547af5b99fe8117d0c34efca0`
- Vercel Production: `e7042640b40bd02547af5b99fe8117d0c34efca0`
- `/api/version`: `e7042640b40bd02547af5b99fe8117d0c34efca0`

The documentation commit that records this final checkpoint will advance `main`; after it is created, perform one fresh Production/`api/version` alignment check.

## 9. Repository verification gate

**Status: SATISFIED**

Known full `pnpm verify` green baseline:

`6820a6a714fe2a162f52bdfa6c57477ab9743f15`

A GitHub compare from that verified baseline to `e7042640…` shows the final tree differs only by:

- `docs/TRACKDASH_METHOD_MASTER.md`;
- `docs/TRACKDASH_OPERATIONS.md`;
- `docs/TRACKDASH_STATE.md`;
- migrations `0133`–`0136`.

There are **no executable application/source-code differences** after the verified baseline in the final tree.

The four migrations are applied to live Supabase and have been validated by the completed recompute + Production QA.

Therefore the repository verification gate is considered satisfied for the final executable code state.

---

# COMPLETION GATE

## Avante Mk.III result

**COMPLETE — MARKET THIN**

Reason:

- catalog identity complete: 24 / 24;
- image audit complete, with intentional placeholders where exact image was not safely found;
- production status / rarity audited;
- Initial Market Scan coverage complete: 24 / 24;
- canonical recompute complete: queue 0;
- Production QA passed: 24 / 24 public Release pages;
- Collection canonical alignment verified;
- scanner identity behavior verified;
- version alignment passed before final documentation checkpoint;
- repository verification gate satisfied;
- remaining thin-market / missing-exact-image cases are documented and allowed by the Master Completion Gate.

No unfinished manual task remains for this family. Future market changes are handled by the normal adaptive refresh/cron system.

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

Avante Mk.III is complete.

Next TrackDash work should:

1. fresh-check `main = Vercel Production = /api/version` after this documentation checkpoint deploys;
2. leave Avante to the normal adaptive market refresh system;
3. start the next requested family from the Master workflow, using the current STATE and OPERATIONS documents as session bootstrap.

No further manual Avante recompute is required unless new evidence deliberately enqueues it again.

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
