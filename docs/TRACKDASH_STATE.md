# TRACKDASH — PROJECT STATE

> Persistent operational snapshot.  
> **Last updated:** 2026-09-22  
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

## Current completed family

**Avante Mk.III — COMPLETE — MARKET THIN (post-completeness audit)**

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

**COMPLETE — MARKET THIN**

The reopened Market Completeness backfill has now passed the hard gate for all 24 Release.

Completion rationale:

- canonical family count: **24**;
- current-offer/public-empty A-class: **0**;
- stale market-method signals: **0**;
- Avante recompute queue: **0 jobs / 0 errors**;
- all empty public-signal Release have been challenged and classified;
- no current condition-safe exact offer is being suppressed by an empty signal;
- historical/OOS, undated SOLD and unsplittable lot evidence remain context rather than forced values;
- Production is aligned to the functional commit carrying the final eBay known-listing repair.

This status does not mean every Release has a Market Value. It means every Release has passed the evidence/completeness rules without inventing a value.

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


# MARKET COMPLETENESS BACKFILL — LIVE CHECKPOINT 2026-09-22

## Automatic revalidation completed

The user ran four Admin market refresh cycles against the prepared 14-target eBay backfill queue.

Verified results:

- all 14 prepared eBay jobs were attempted successfully;
- scan errors: **0**;
- temporary backfill priority was restored to the normal policy;
- `18626` now has multiple accepted current offers and a v4 observed market reference;
- `18627` now has multiple accepted current offers and a v4 observed market reference;
- `95469` now has an accepted current offer and a v4 observed market reference;
- false-positive eBay results for `94692`, `94772`, `94673` were correctly rejected rather than contaminating the exact Release.

## New exact market evidence persisted

- Dyna-Hawk GX `95000`: exact active Mercari listing, new/unused, **JPY 4,900 ≈ EUR 27.12**, current offer; recompute queued.
- Proto-Emperor Sanfrecce `18074`: exact Yahoo Flea completed sale, unused, **JPY 3,400 ≈ EUR 21.49**, sold 2023-09-05; historical context, recompute queued.
- Avante Mk.III `92218`: exact Yahoo Auctions completed sale, unused, **JPY 7,000 ≈ EUR 37.62**, ended 2026-06-07; recompute queued.
- Avante Mk.III `92207`: exact Yahoo Auctions completed sale, unused, **JPY 6,750 ≈ EUR 36.27**, ended 2026-06-07; recompute queued.

Current recompute queue at this checkpoint: **4 jobs, 0 errors**.

## 92207 conflicting Yahoo Shopping page

A Yahoo Shopping page whose title says `92207` also exposes conflicting merchant product number `92195-000`.

TrackDash therefore:

- quarantined the candidate as `needs_review`;
- removed its current offer state;
- does **not** publish JPY 40,103 as a 92207 current price.

## Regional currency pipeline blocker

`92284` has an exact active eBay offer in MYR, but the old worker quarantined it only because the market FX path was restricted to EUR/USD/JPY/GBP.

PR #188 adds ECB-backed regional market FX without expanding the user acquisition-currency UI.

- PR head `e09f9fd99e2ada38172309846eee8523c024e9c1`
- Typecheck: SUCCESS
- full `pnpm verify`: SUCCESS
- merged to main as `46fd2396c17e88e4d992d0242c34cc594401c606`

The first Production deployment of that merge failed during `pnpm run build`. The FX branch Preview itself was READY, so the failure is being isolated against the additional market-context commits that landed on main while PR #188 was open. Production remains on the previous READY deployment until repaired.

## Public historical context

Current main already contains the safe UI distinction between:

- current observed price;
- Market Value;
- historical/non-current market references.

A Release with verified historical/non-current evidence no longer needs to look identical to a Release with zero market evidence.

Avante remains:

**REOPENED — MARKET COMPLETENESS BACKFILL**

Do not close until the remaining challenge classifications, queued recomputes, 92284 regional-currency rescan, Production alignment and final completeness audit all pass.

---


# MARKET COMPLETENESS BACKFILL — PRODUCTION ALIGNED / 92284 NEXT

## Production alignment

The market-context build regression was isolated to a stale regression-test marker and repaired.

Current verified functional alignment before this documentation checkpoint:

- GitHub main: `53f9f2bd045b6df85b5ed9e4ce077c953def75e9`
- Vercel Production: `53f9f2bd045b6df85b5ed9e4ce077c953def75e9`
- `/api/version`: `53f9f2bd045b6df85b5ed9e4ce077c953def75e9`
- Vercel state: **READY**
- Typecheck on repair branch: **SUCCESS**
- full `pnpm verify`: **SUCCESS**

This Production includes:

- safe historical/non-current market context surfaces;
- unresolved exact multi-Release lots counted as context without splitting their price;
- ECB-backed regional marketplace FX, including MYR, for market ingestion;
- user acquisition-currency UI remains unchanged.

## 92284 STARGEK — exact next scan

Release:

`92284 — Avante Mk.III Nero STARGEK 10th Anniversary Special`

Release ID:

`805c2619-0c0c-5aa1-adc5-df25cafe5c8f`

Known exact active eBay listing:

`204435589176`

- price: MYR 450
- shipping: MYR 120
- condition: new / unassembled
- previous status: `needs_review`
- previous reason: `UNSUPPORTED_CURRENCY`

The regional FX fix is now in Production, so this Release is prepared for canonical rescan.

Its eBay queue row is temporarily:

- `priority = 200`
- `next_scan_at = 2000-01-01`

Live claim-order verification confirms **92284 is the first eligible eBay job**.

After its scan, restore ordinary queue priority.

## Current recompute queue before next Admin run

Four known jobs are already pending, with no recorded errors:

- `95000` — Dyna-Hawk GX Black Special
- `18074` — Proto-Emperor Sanfrecce Hiroshima
- `92218` — Avante Mk.III EVA Awakening
- `92207` — Avante Mk.III EVA Unit-01

Because Admin scan/recompute lanes run concurrently, the 92284 scan may enqueue its recompute after the same run has already claimed the existing four jobs. Re-check the queue after the Admin run rather than assuming 92284 recomputed in that same cycle.

## QA correction — 92422 / 92428

The identical-looking active prices on `92422` and `92428` are **not cross-assignment**.

Each Release has its own exact eBay listing with the correct Item Number in the title:

- `92422`: EUR 73.20 + EUR 12.20 shipping
- `92428`: EUR 73.20 + EUR 12.20 shipping

The matching equal prices come from the seller/listing market, not from Release contamination.

## Exact next action

Run **Admin → Aggiornamento mercato → Esegui ora** once.

After it finishes:

1. verify eBay item `204435589176` is accepted and resolved to 92284;
2. verify MYR→EUR FX provenance and current offer state;
3. restore 92284 queue priority;
4. inspect the recompute queue;
5. run a second Admin refresh only if 92284 or another backfill recompute remains;
6. perform the final 24/24 Avante completeness audit.

Avante remains **REOPENED — MARKET COMPLETENESS BACKFILL** until this final gate passes.

---

# 92284 POST-REFRESH DIAGNOSIS — KNOWN LISTING DIRECT REFRESH REQUIRED

Two requested Admin refreshes were executed after Production alignment.

Verified live outcome:

- the first refresh drained the four previously pending recomputes;
- 95000 recomputed with its current observed offer;
- 92218 and 92207 recomputed with their persisted completed-sale anchors;
- the Sanfrecce 18074 historical 2023 evidence remains historical context outside the current valuation window;
- the second 92284-specific refresh completed successfully with targets_attempted=1 and targets_succeeded=1;
- that run found 0 candidates, so eBay item 204435589176 remained unchanged as needs_review / UNSUPPORTED_CURRENCY;
- 92284 still had no current offer state/public observed price after that refresh.

The first diagnosis that EBAY_MY should be queried was corrected after checking the official eBay Buy API marketplace support matrix. EBAY_MY is not a supported Buy/Browse marketplace identifier. The stored exact listing is exposed through ebay.it with MYR pricing, so marketplace and currency must not be conflated.

Root cause:

- regional MYR FX support is present;
- queue claim, worker execution and recompute are healthy;
- normal keyword Browse search does not return the already-known exact listing;
- therefore a successful search job can still miss a known active listing because of eBay indexing/ranking.

Canonical repair:

- keep normal keyword discovery on supported marketplaces;
- use Browse getItemByLegacyId for persisted exact numeric eBay item IDs on unique Releases;
- run direct known-listing refresh before keyword discovery;
- deduplicate numeric legacy IDs against REST v1|...|0 IDs;
- preserve fail-closed behavior for shared Item Numbers;
- do not manually force the candidate, offer state or Release signal.

Keep 92284 at temporary high eBay priority until the repaired Production worker has revalidated item 204435589176 through the direct legacy-ID path. After successful ingestion, restore ordinary family eBay priority and run the final Avante 24/24 completeness audit.

---

# AVANTE MK.III — FINAL MARKET COMPLETENESS AUDIT 2026-09-22

## 92284 final revalidation

The repaired Production worker revalidated exact eBay legacy item:

`204435589176`

for:

`92284 — Avante Mk.III Nero STARGEK 10th Anniversary Special`.

Verified result:

- direct legacy-ID retrieval succeeded;
- eBay returned the listing as EUR **96.25** + EUR **25.67** shipping;
- exact item identity remained correct;
- listing end date: **2026-08-29T11:57:42Z**;
- candidate classification: **rejected / LISTING_ENDED** for the active-ASK lane;
- no current offer state was created;
- no current Observed price was published;
- the existing exact Mercari SOLD candidate remains historical/context-only because its sale date is not exposed.

Therefore 92284 being publicly empty for current price is **intentional and correct**, not a pipeline miss.

Its temporary eBay priority has been restored to the family baseline:

- priority: **95**;
- activity tier: **normal**;
- interval: **168h**;
- next scan: **2026-09-29**.

## Empty Market Challenge — final classifications

The remaining Avante Release with no current public price were challenged and are now explained:

- `94673` — exact RCJAZ historical/out-of-stock only;
- `94674` — exact RCJAZ historical/out-of-stock only;
- `94692` — exact RCJAZ historical/out-of-stock evidence exists; current public market results also exist, but the condition-safe evidence found is used/ambiguous for the canonical `new_complete_unbuilt` lane, so no forced current anchor is published;
- `94715` — exact historical/out-of-stock evidence; no condition-safe current exact offer promoted;
- `94772` — exact historical/out-of-stock evidence; no condition-safe current exact offer promoted;
- `94777` — exact historical/out-of-stock evidence; no condition-safe current exact offer promoted;
- `92219 + 92221` — exact current Mercari two-Release lot at JPY 22,000, new/unassembled, already persisted as unresolved multi-Release context and intentionally **never split** into fake per-Release prices;
- `92284` — ended exact eBay listing plus undated exact Mercari SOLD context; no current ASK.

This satisfies the Empty Market Challenge rule: every empty Avante Release is now explained by historical/OOS evidence, unsplittable lot evidence, condition ambiguity, or ended/undated market evidence rather than by an uninvestigated gap.

## Final hard-gate numbers

Live Supabase audit:

- canonical family count: **24**;
- A-class current offer + public empty: **0**;
- Market Method v4 signals: **24 / 24**;
- stale method signals: **0**;
- Avante recompute jobs: **0**;
- Avante recompute errors: **0**.

## 94692 user Collection alignment

The user's Collection is correctly linked to the canonical 2009 Release:

- Item Number: `94692`;
- Release ID: `e07a5f39-d476-54c5-a509-4fb3ffb1a0ec`;
- copy count: **1**;
- condition: **Sealed**;
- acquisition price: **EUR 15.00**;
- exact Release image is present from the Tamiya 94692 asset.

Collection therefore resolves the same exact Release identity used by Catalog/Release detail and remains aligned with canonical Release data.

## Final functional alignment before this STATE documentation update

Verified immediately before writing this checkpoint:

- GitHub main: `065818860828d47ef6a877916fe3b9e57ee44293`;
- Vercel Production: `065818860828d47ef6a877916fe3b9e57ee44293`;
- `/api/version`: `065818860828d47ef6a877916fe3b9e57ee44293`;
- Vercel state: **READY**;
- PR #191 Typecheck: **SUCCESS**;
- PR #191 full `pnpm verify`: **SUCCESS**.

The documentation commit that records this checkpoint will advance `main` without changing executable application behavior. Re-check deployment alignment after that docs-only commit before treating the repository snapshot as fully synchronized.

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

Avante Mk.III requires **no further family-completion action**.

For future TrackDash work:

1. keep `docs/TRACKDASH_METHOD_MASTER.md`, this STATE file and `docs/TRACKDASH_OPERATIONS.md` as the bootstrap source;
2. use the stabilized Initial Scan + Empty Market Challenge workflow on the next family;
3. do not reopen Avante unless new evidence, a catalog identity correction or a pipeline regression creates a real reason;
4. separately continue the one-time completeness backfill for older non-Avante catalog B-class cases already identified.

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
