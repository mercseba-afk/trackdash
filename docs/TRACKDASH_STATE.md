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

## Family reopened by Market Completeness Audit

**Avante Mk.III — REOPENED — MARKET COMPLETENESS BACKFILL**

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

# MARKET COMPLETENESS REOPEN — 2026-09-21

The previous Avante result **COMPLETE — MARKET THIN** is revoked.

Reason: the new Empty Market Challenge found that some Release previously left with no public market reference do in fact have observable current/recent exact-release market evidence. The first Initial Market Scan was therefore not deep enough for those empty cases.

## Global live audit

Across the current catalog (184 Release), the first systematic completeness audit found:

- **A — current stored offer but public signal empty: 2 Release**
- **B — real evidence exists but public signal empty: 17 Release**
- **OK / other: 165 Release**

The two A-class rows are stale `market_method_version = v3` signals:

- Dash-1 Emperor `18025`
- Dash-1 Emperor Black Special `94704`

Both have been enqueued through the canonical `trackdash_enqueue_market_recompute` RPC for v4 recompute.

## Empty Market Challenge — confirmed misses

The targeted second-pass web challenge has already confirmed that this is not limited to `94692`.

### Avante Mk.III current/recent market found after the first audit

- `94692` — current exact listings/search-market evidence exists; prior TrackDash evidence was only RCJAZ historical out-of-stock.
- `18626` — current exact stock found externally.
- `18627` — current exact Italian retail stock found externally.
- `92207` — current exact Mercari market found.
- `92218` — recent/current exact Mercari market found; condition must remain exact before persistence.
- `92284` — current exact regional marketplace evidence found.
- `95469` — current exact Mercari market found.
- `94715` — recent exact completed-market reference found.
- `94777` — probable current exact market signal found, still requires exact-listing confirmation before persistence.

### Other catalog Release already confirmed by the same global challenge

- Avante Jr. `18014` — current exact retail/eBay market.
- Avante Jr. Black Special `95501` — current exact eBay market.
- Dyna-Hawk GX `94717` — current exact eBay market.
- Dyna-Hawk GX Black Special `95000` — current exact Mercari market.

This proves the issue was **Initial Market Scan completeness**, not simply a conservative valuation threshold.

## Permanent hard gate now active

The Master and Operations docs now require:

1. after recompute, every Release with no MV and no observed/current price enters the **Empty Market Challenge**;
2. targeted second-pass multi-source research must be completed before a thin/no-market result is accepted;
3. current valid offer + public empty signal must equal **BLOCKED — PIPELINE / STALE SIGNAL**, never COMPLETE;
4. stale `market_method_version` signals must be recomputed before Completion Gate;
5. family completion requires zero unchallenged empty Release.

Regression coverage was also added to ensure a single exact current offer remains publishable as observed-market context even when it is not enough for a consolidated Market Value.

## Current Avante status

**NOT COMPLETE.**

The family remains reopened until:

- all Avante B-class empty Release receive the targeted challenge;
- exact valid evidence found is persisted;
- canonical recompute is rerun for affected Release;
- family completeness audit returns no unexplained empty Release;
- Production QA is rerun.

---

# COMPLETION GATE

## Avante Mk.III result

**REOPENED — MARKET COMPLETENESS BACKFILL**

Do not restore `COMPLETE` or `COMPLETE — MARKET THIN` until the new hard gate passes for all 24 Release.

---


# MARKET COMPLETENESS BACKFILL — QUEUE PREPARED 2026-09-22

## Hard-gate audit baseline

Global catalog audit: **184 Release**

- A — current valid stored offer but public signal empty: **2**
- B — market evidence exists but public signal empty: **17**
- OK / other: **165**

The two A rows are stale Market Method v3 signals:

- `18025` Dash-1 Emperor (2026 Reissue)
- `94704` Dash-1 Emperor Black Special

Both have been enqueued for canonical v4 recompute.

## Identity-safe classification

The backfill must not force an Item Number onto the wrong production occurrence.

Confirmed reused Item Numbers among the suspect rows:

- `18014` → original + 2012 reissue + 2024 reissue;
- `95501` → 2019 + 2021 + 2024 occurrences;
- `18074` → regular Proto-Emperor Premium + Sanfrecce Hiroshima special.

Therefore these remain fail-closed until evidence identifies the exact physical occurrence. Current marketplace evidence for the Item Number alone must not be assigned arbitrarily to one of those Release rows.

## Unique suspect Release — eBay canonical revalidation

Fourteen unambiguous suspect Release have been prepared for a one-time canonical eBay Production revalidation:

- `18626`
- `18627`
- `92207`
- `92218`
- `92284`
- `94673`
- `94674`
- `94692`
- `94715`
- `94772`
- `94777`
- `95469`
- `94717`
- `95000`

For these eBay queue rows:

- `priority = 200`;
- `next_scan_at = 2000-01-01` as a **temporary one-time backfill override**;
- normal `scan_interval_hours` was not changed.

This is necessary because `trackdash_claim_ebay_active_jobs` orders by:

`next_scan_at ASC, priority DESC, id`

so priority alone does not overtake older due backlog.

Live queue verification confirms these 14 rows are currently the **first 14 eligible eBay jobs**, before the normal Aero Manta Ray backlog.

Admin eBay batch size is 4, so four successful Admin market refresh executions are sufficient to attempt all 14 prepared jobs, subject to per-job failures/retries.

After the one-time revalidation, restore normal priority policy where the scheduler does not do so automatically.

## External challenge already confirms first-scan misses

The second-pass challenge has already established that some previously empty rows do have real market activity. Examples include:

- `18626` — exact new current eBay market observed;
- `18627` — exact new current eBay/Italian-market listing observed;
- `94692` — multiple exact-item marketplace/search-market signals observed; prior TrackDash state only retained historical RCJAZ OOS;
- `94715` — recent exact Mercari completed sale observed;
- `95469` — exact recent/current Mercari market and completed-sale evidence observed;
- `95000` — exact current eBay fixed-price listing observed externally despite an earlier canonical eBay scan yielding no accepted candidate.

These findings confirm the backfill is a real **Initial Market Scan completeness correction**, not a relaxation of Market Value standards.

## Important distinction

A valid current exact offer can support **Observed price** without automatically becoming Market Value.

Active auctions, ambiguous production occurrences, used/built/incomplete kits and historical OOS references do not get promoted merely to avoid an empty UI.

The goal is maximum real evidence, not forced values.

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

1. Complete the Empty Market Challenge for all Avante Release whose public market signal is empty.
2. Persist only exact-release current/recent evidence that passes identity/condition checks.
3. Recompute only affected Release through the canonical queue.
4. Run the family Market Completeness Audit again.
5. Require:
   - A-class current-offer/public-empty = 0;
   - stale market-method signals = 0;
   - no unchallenged empty Avante Release.
6. Rerun Production QA and version alignment.
7. Only then restore an allowed Completion Gate result.

Separately, the same one-time completeness backfill must be applied to the other catalog B-class cases already identified, so future family work can proceed under the stabilized method without reopening old releases one by one.

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
