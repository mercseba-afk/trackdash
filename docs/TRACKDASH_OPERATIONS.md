# TRACKDASH — OPERATIONS

> Persistent operational reference for commands, buttons, cron jobs and workers.  
> Update this file whenever operational behavior, batch sizes, security requirements or worker composition changes.

---

# 1. ADMIN — “AGGIORNAMENTO MERCATO”

## UI

Location:

**Admin → Aggiornamento mercato → Esegui ora**

Current UI implementation:

`components/screens/admin-screen.tsx`

Server action:

`lib/actions/admin.ts → runAdminMarketRefreshAction()`

## Security

The action calls:

`requireAdmin()`

Admin access requires:

- authenticated TrackDash admin;
- MFA assurance level `aal2`.

This is not a public endpoint.

## What the button actually does

It runs these three lanes **in parallel** using `Promise.allSettled`:

1. `runExactPageMarketScanBatch(4)`
2. `runEbayActiveMarketScanBatch(4)`
3. `runMarketRecomputeBatch(8)`

Therefore one button press is both:

- a small market refresh;
- and a canonical recompute worker execution.

It is intentionally the manual equivalent of the recurring market cycle.

## Result shown in Admin

The UI summarizes:

- `Retail succeeded / attempted`
- `eBay succeeded / attempted`
- `Ricalcolo succeeded / attempted`

If any lane reports failure, Admin shows a partial-update warning rather than pretending that everything succeeded.

## Important scope rule

The button is **global, not family-scoped**.

It processes whatever work is due/claimable in the queues.

Therefore, if older Manta Ray jobs are ahead of Avante jobs, the first recompute batch can process Manta first.

Never infer “8 Avante were recomputed” merely because the UI says `Ricalcolo 8/8`.  
Check the queue/signals when family-specific completion matters.

---

# 2. CANONICAL RECOMPUTE

Implementation:

`lib/market/automation/recompute-worker.ts`

Function:

`runMarketRecomputeBatch(limit = 8)`

Canonical signal function:

`recomputeReleaseMarketSignal(...)`

Repository/service layer:

`MarketR3Repository`

## Recompute is NOT a scan

It does not search the web.

It takes already persisted market evidence and calculates the canonical TrackDash signal, including where justified:

- market regime;
- observed/current market signal;
- Market Value;
- active anchor;
- retail anchor;
- SOLD anchor;
- confidence;
- offer/sold counts;
- trend data when supported.

Never duplicate this algorithm manually in SQL just to “finish” a family.

## Queue claim behavior

RPC:

`trackdash_claim_market_recompute_jobs`

Current behavior:

- default Admin limit: **8**
- hard worker maximum: **25**
- claim lock: **10 minutes**
- only jobs with `available_at <= now()`
- only unlocked/expired-lock rows;
- ordered by `dirty_at ASC`, then `release_id`;
- uses `FOR UPDATE SKIP LOCKED`.

Meaning: **oldest dirty jobs are processed first**.

Each claimed job is processed sequentially inside the worker.

## Finish behavior

On success:

`trackdash_finish_market_recompute_job(... p_success: true ...)`

On failure:

`trackdash_finish_market_recompute_job(... p_success: false, p_error: ...)`

A failure is recorded per job and must not be silently treated as success.

---

# 3. EXACT-PAGE MARKET SCAN

Admin batch:

`runExactPageMarketScanBatch(4)`

Purpose:

- process enabled, due, exact verified endpoints;
- update current/historical retail evidence according to page state;
- preserve availability semantics;
- enqueue recompute when material evidence changes.

Important:

- exact endpoint identity must match the exact Release;
- out-of-stock historical retail is not current availability;
- ambiguous availability must be quarantined/reviewed;
- failure must not fake `last_success_at`.

---

# 4. EBAY ACTIVE MARKET SCAN

Admin batch:

`runEbayActiveMarketScanBatch(4)`

Purpose:

- process due eBay Active jobs;
- find exact Release current marketplace offers;
- normalize candidate/offer state;
- enqueue recompute on material changes.

Important:

- ITEM/release identity first;
- duplicate listings are deduplicated;
- shipping and cost basis stay explicit;
- unsupported/ambiguous cases fail closed rather than contaminating canonical signals.

---

# 5. REGULAR CRON

Route:

`app/api/cron/market-scan/route.ts`

The normal recurring cycle uses the same three kinds of workers:

- exact-page scan;
- eBay Active scan;
- recompute.

The cron is a **dispatcher**, not a full-catalog daily rescan.

Only due/claimable jobs should run.

## Security

The cron route is protected by `CRON_SECRET`.

Do not bypass, expose, reconstruct or commit that secret.

Do not create temporary public backdoors to imitate cron when the Admin action already provides the authorized manual path.

---

# 6. INITIAL SCAN VS ADMIN/CRON REFRESH

## Initial Market Scan

Performed during family insertion/completion.

It is deep and multi-source:

- active marketplace;
- retail;
- SOLD/completed research;
- regional/history context;
- manual sources when necessary.

It must not be replaced by merely enrolling queue rows.

## Admin / Cron Refresh

Lightweight recurring maintenance after Initial Scan.

It processes only the sources/work currently due and supported by READY adapters.

Manual/planned sources do not become magically automated because Admin Refresh ran.

---

# 7. PRODUCTION VERSION ALIGNMENT

Endpoint:

`/api/version`

Completion requirement:

**GitHub current main SHA = Vercel Production deployed SHA = /api/version**

Use this to distinguish:

- code exists on main;
- code actually exists in Production.

A READY older Production is not alignment.

Do not declare final QA complete while Production is on a stale commit.

---

# 8. COLLECTION / RELEASE DATA CONSISTENCY

TrackDash must treat Release data as canonical across:

- catalog;
- Release detail;
- Collection;
- PWA/mobile presentation.

When image or market signal changes for a Release, Collection must derive from the same canonical Release/signal data and update as well.

Do not implement Collection-only copies of images or market values that can drift from the Release.

Expected public behavior:

- robust Market Value → `Valore stimato €XX`;
- valid current ASK without robust MV → observed/current price presentation such as `Disponibile da` / `Prezzo osservato`, according to current UI policy;
- audited thin/no current market → honest fallback;
- never public `SOLD 0` as if it meant no sales exist.

---

# 9. MARKET COMPLETENESS AUDIT — HARD GATE

Run this after family recompute and before declaring a family COMPLETE.

The audit is performed against live Supabase and classifies Release-level inconsistencies.

## A — current offer but public signal empty

Definition:

- at least one `market_offer_states` row is `in_stock` / `low_stock`;
- the offer is still valid under the current publication freshness policy;
- public signal has no Market Value, active/retail anchor, starting item price or effective cost.

Result:

**BLOCKED — PIPELINE / STALE SIGNAL**

This count must be **zero** before Completion Gate.

## B — evidence exists but public signal empty

Definition:

- accepted market candidate and/or exact aggregate SOLD evidence exists;
- public signal still has no Market Value or observed/current/sold anchor.

This is not automatically an error. It triggers the **Empty Market Challenge** from the Master.

Each such Release must be classified after second-pass research as one of:

- current market found → persist evidence + recompute;
- recent attributable SOLD found → persist evidence + recompute;
- historical/out-of-stock only;
- ambiguous/wrong Release/wrong condition;
- genuinely no observable market after challenge.

No B-class Release may be silently accepted as “market thin” without the challenge.

## C — stale market method version

Compare `market_release_signals.market_method_version` against the current method version.

Any older signal must be enqueued through:

`trackdash_enqueue_market_recompute(release_id, condition)`

and processed by the canonical recompute worker.

A market-method deploy is not complete while stale-version signals remain.

## Current invariant

Completion requires:

- A = 0;
- stale method versions = 0;
- all B rows challenged and classified;
- family public QA rerun after resulting recomputes.


---

# 10. OPERATION CHANGE RULE

Whenever a material operational behavior changes, update this document in the same work unit.

Examples:

- Admin batch size changes 4/4/8 → update here;
- another worker is added to Admin refresh → update here;
- cron cadence/security changes → update here;
- recompute queue ordering changes → update here;
- an operation becomes family-scoped → update here.

A chat explanation is not sufficient project documentation.

---

# 11. QUICK REFERENCE

Current Admin market button:

**Retail 4 + eBay Active 4 + Recompute 8**

Current recompute ordering:

**oldest dirty first**

Current recompute lock:

**10 minutes**

Current Admin market action:

**authorized admin + MFA AAL2**

Current cron:

**protected by CRON_SECRET**

Current Completion version check:

**main SHA = Production SHA = /api/version**
