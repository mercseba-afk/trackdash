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

## Automatic SOLD-only recovery audit (Mini 4WD)

Admin `/admin` now includes **Mini 4WD · Recupero valori da vendite concluse**. This is a live **read-only** analysis and priority view, not another pricing engine:

- It derives the current set from all verified public Mini4WD Releases belonging to available families, joins their canonical `new_complete_unbuilt` signals, then groups SOLD-only Releases (positive SOLD anchor but NULL MV) by **2+ selected sales first** and **single sale second**. New families and Releases join automatically; the number need not remain 45.
- It fetches existing exact/release-matched aggregate research and the current recompute queue; for 3–4 selected SOLD it flags potential same-release/same-source exact historical corroboration using tight date, seller-count, price-agreement and identity gates. The diagnostic NEVER changes prices or creates SOLD and must not be interpreted as a confirmed MV.
- On page load and after Admin “Esegui ora”, the protected `getAdminMini4wdSoldRecoveryAction()` refreshes the report. Each row shows selected SOLD count, anchor, category and pending canonical recompute state.
- **Automatic valuation is already change-driven:** the existing `market_aggregate_observations_queue_recompute` and `price_points_queue_market_recompute` database triggers enqueue an existing or newly published Release when its qualifying evidence changes; `runMarketRecomputeBatch(8)` under the protected daily market cron computes v4. Do not add a redundant daily 45-Release scan/recompute loop or promote the audit to an independent price calculation.
- This is NOT automated external SOLD acquisition: eBay Product Research and other closed-sales sources without compliant APIs still require captured/verified research. A single accepted real sale remains visible as SOLD, not a fabricated MV; when additional credible data arrive the same generic pipeline re-evaluates automatically.

The pure classifier at `lib/market/automation/sold-recovery-classifier.ts` is for audit prioritization, never the source of canonical MV. The diagnostic rules have negative regression tests for ambiguous edition, single historical seller, source mismatches, insufficient history and future/stale windows.

# 2. CANONICAL RECOMPUTE

Implementation:

`lib/market/automation/recompute-worker.ts`

Function:

`runMarketRecomputeBatch(limit = 8)`

Canonical signal function:

`recomputeReleaseMarketSignal(...)`

Repository/service layer:

`MarketR3Repository`

## Time-driven offer expiry maintenance

Before claiming normal recompute jobs, `runMarketRecomputeBatch(...)` now checks whether a persisted current offer crossed the canonical publication freshness boundary **after** its Release signal was last materialized.

Canonical publication TTLs remain:
- marketplace current offer: **360 hours / 15 days**;
- retail current offer: **744 hours / 31 days**.

These TTLs are intentionally separate from the slower 28/42/84-day scan cadence. A Release may therefore temporarily return to “market under observation” while waiting for its next scheduled scan rather than continuing to expose an unverified old offer.

When a qualifying expiry is detected:
- the Release is enqueued through the normal `trackdash_enqueue_market_recompute` path;
- the same Admin/cron recompute lane can clear stale `starting_offer_candidate_id`, ASK/retail anchors and current-offer counts;
- an expiry already reflected by a later recompute is not enqueued again;
- a Release already present in the recompute queue is not re-enqueued/reset.

This is a recompute event, **not** a scan and not automatically a HOT/material market move.

## Runnable-source queue hygiene

Operational monitoring must mirror the worker's real claim gates rather than counting compatibility rows. In particular:
- `market_scan_targets` is not the authoritative automatic backlog counter;
- exact-page retail is runnable only when `market_scan_queue.enabled=true`, the source policy is `adapter_status='ready'`, the job is due/unlocked, and an enabled `market_scan_endpoints` row exists for the same Release/source with `exact_release_verified=true`;
- eBay Active backlog must be evaluated from its real `market_scan_queue` plus the identity/worker gates used by `trackdash_claim_ebay_active_jobs`;
- manual/planned/parked sources are not automatic scanner failures.

The recompute lifecycle is a separate operational dependency. The backend service role must retain EXECUTE on:
- `trackdash_enqueue_market_recompute(uuid,text)`;
- `trackdash_claim_market_recompute_jobs(integer,integer)`;
- `trackdash_finish_market_recompute_job(uuid,text,timestamptz,boolean,text)`.

A due recompute row that remains at `attempts=0` across cron runs is a blocker and must be investigated before interpreting stale materialized current-offer fields as current market data.

Only sources with `adapter_status = 'ready'` belong in enabled automatic scan queues.

Sources marked `manual` or `planned` may still provide valid stored context/research evidence, but their automatic queue/target rows must remain disabled until an executable adapter is promoted to `ready`. `include_by_default` is therefore disabled for non-ready source policies.

## Initial canonical signal for every published Release (migration 0223)

Do not confuse marketplace enrollment or barcode availability with initial **canonical recompute** coverage. Every *verified, public* Mini4WD Release under an *available* family must have either its `new_complete_unbuilt` canonical row in `market_release_signals` or a job in `market_recompute_queue`. This invariant must include Releases with NULL Item Number / JAN.

The DB itself now enforces first-job creation on:
- verified public Release insertion;
- visibility/verification transitions into verified public;
- a family changing from `coming_soon` to `available` with existing public Releases.

The helper `private.trackdash_ensure_initial_public_release_market(uuid)` always delegates to the existing canonical `trackdash_enqueue_market_recompute` RPC but does nothing if a corresponding signal OR job already exists, avoiding resets of in-flight recomputes. On 2026-10-10 its initial migration backfilled **50** previously uncovered public Releases; the queue also held **2** older value-recompute jobs. The canonical worker must drain these in later runs.

Operational audit query (execute read-only in Supabase):

```sql
WITH published AS (
  SELECT r.id
  FROM public.product_releases r
  JOIN public.products p ON p.id = r.product_id
  JOIN public.categories c ON c.id = p.category_id
  WHERE c.slug = 'mini4wd'
    AND p.metadata->>'launch_status' = 'available'
    AND r.catalog_visibility = 'public'
    AND r.verification_status = 'verified'
)
SELECT
  count(*) AS public_releases,
  count(*) FILTER (WHERE s.release_id IS NOT NULL) AS canonical_signals,
  count(*) FILTER (WHERE s.release_id IS NULL AND q.release_id IS NOT NULL) AS pending_first_recomputes,
  count(*) FILTER (WHERE s.release_id IS NULL AND q.release_id IS NULL) AS missing_both
FROM published p
LEFT JOIN public.market_release_signals s
  ON s.release_id = p.id AND s.condition = 'new_complete_unbuilt'
LEFT JOIN public.market_recompute_queue q
  ON q.release_id = p.id AND q.condition = 'new_complete_unbuilt';
```

**Success conditions:** `missing_both = 0` immediately after publication; subsequently `pending_first_recomputes = 0` after the queue is drained, with failure states investigated. The global Vercel cron `/api/cron/market-scan` is scheduled daily at `03:17 UTC` and processes up to eight canonical recomputes per cycle (older due jobs first); repeated authorized Admin "Esegui ora" can accelerate the queue but is NOT a new per-Release web scan requirement. Never claim queue insertion equals actual Price Intelligence completion, never treat empty Market Value as scan failure, and do not create Market Values by hand.

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

## RCJAZ source-level integration

RCJAZ is integrated as a reusable exact-retail source, not as a one-off Release rule.

Parser:

`rcjaz_product_page`

The dedicated parser recognizes the RCJAZ exact-product fields used by the public product page, including:

- exact Item Number;
- product price/currency;
- `Available in shop` → `in_stock`;
- `Not Available` / sold-out states → `out_of_stock`;
- Cloudflare challenge pages → fail closed / review.

### Automatic enrollment

A RCJAZ endpoint may be auto-enrolled only when:

- host is an approved RCJAZ domain;
- URL is an individual product page (`-p-<id>.html`);
- URL contains the Release Item Number;
- the Item Number is unique in the current TrackDash catalog.

Exact RCJAZ pages found in either:

- `release_sources`;
- accepted exact/strong `market_candidates`;

are backfilled into `market_scan_endpoints`.

Future qualifying `release_sources` / accepted candidates auto-enroll through database triggers.

### Reused/shared Item Numbers

Shared Item Numbers are **never inferred automatically**.

They may still have RCJAZ automation when an endpoint was explicitly curated and already has:

`exact_release_verified = true`

In that case queue/target enrollment is allowed because Release identity was established separately.

### Queue hygiene

RCJAZ queue/target rows without an exact verified endpoint are disabled.

Therefore:

**enabled RCJAZ queue job = exact endpoint-backed Release**

and generic catalog cross-product rows do not consume worker capacity.

### Current execution gate

RCJAZ currently remains:

`adapter_status = planned`

because a prior Vercel live probe received HTTP 403 / Cloudflare challenge.

The parser/enrollment/queue integration is live in Supabase, but Admin/cron must not claim RCJAZ until a live Vercel canary succeeds.

Do not switch RCJAZ to `ready` merely because a page works in a browser or external crawler.

### Europe-first semantics

RCJAZ is extra-EU.

A current RCJAZ price is valid evidence of:

- availability;
- market breadth;
- retail history / sell-through.

But when European landed shipping/import cost is unknown it remains:

**EXTRA-EU ITEM-ONLY / LANDED COST UNKNOWN**

and cannot alone define or lower the European observed price.

---

# 4. EBAY ACTIVE MARKET SCAN

Admin batch:

`runEbayActiveMarketScanBatch(4)`

Purpose:

- process due eBay Active jobs;
- find exact Release current marketplace offers;
- normalize candidate/offer state;
- enqueue recompute on material changes.

Current keyword-search marketplace coverage:

- EBAY_IT;
- EBAY_DE;
- EBAY_GB;
- EBAY_US.

Known exact listings are not allowed to depend only on keyword-search ranking. When TrackDash already stores an exact numeric eBay legacy item ID for a unique Release, the worker also refreshes that listing directly through Browse `getItemByLegacyId` before normal keyword discovery. The direct result is deduplicated against the REST item-ID form returned by search.

Do not add unsupported marketplace identifiers merely because a seller lists in another currency or country. Marketplace support and listing currency are separate concerns.

Important:

- ITEM/release identity first;
- a shared Item Number remains fail-closed unless eBay structured item details confirm the target Release's globally unique JAN;
- a structured sibling JAN rejects the candidate; missing or non-unique JAN remains `needs_review`;
- structured JAN refinement may resolve identity uncertainty only and must never override condition, lot/bundle, counterfeit, parts-only or other independent guard failures;
- duplicate listings are deduplicated;
- explicit multi-item lots are rejected; ambiguous bundle quantity is quarantined for review;
- scheduled Browse discovery requests delivery context for Italy;
- a shipping amount becomes Italy-delivered evidence only when eBay explicitly reports an IT shipping estimate; otherwise shipping remains unknown;
- unsupported/ambiguous cases fail closed rather than contaminating canonical signals.

## Automatic enrollment of new Releases

The first `market_release_signals` row remains the durable boundary for entering **TrackDash Market Watch**. A catalog Release that is only `coming_soon` is not scanned merely because it exists.

When a Release enters Price Intelligence:

- unique Item Number → eBay Active enrollment is automatic;
- shared Item Number + globally unique non-empty JAN → eBay Active enrollment is automatic;
- shared Item Number + missing or non-unique JAN → eBay Active remains parked/fail-closed;
- the eBay worker must still confirm the target JAN from structured item details before accepting a shared-ITEM listing.

Identity enrollment is dynamic. The `product_releases` trigger watches both `item_number` and `barcode_jan`:

- adding a unique JAN to an already parked shared-ITEM Release can activate its job automatically;
- removing a JAN or making that JAN non-unique parks the affected shared-ITEM job automatically;
- JAN uniqueness is global across the catalog, not only inside the Item Number family.

Newly activated eBay jobs start at **NORMAL / 42 days**. Existing active jobs preserve their distributed next-scan date and adaptive HOT/NORMAL/COLD tier.

## Slow collector cadence

The recurring eBay Active and exact-retail workers use a slow collector cadence. eBay distinguishes **offer-state churn** from a **material canonical market change**; exact retail treats availability changes and price moves of at least 5% as cadence-material.

Any accepted offer/lifecycle change may trigger recompute so the canonical signal stays fresh, but it must not automatically make the Release HOT.

Cadence escalation is based on the recomputed canonical market fingerprint:

- Market Value;
- SOLD anchor;
- active ASK anchor;
- starting effective cost;
- transition between no current offers and at least one current offer.

A price move is cadence-material at **5% or more**. Listing-count churn alone is not material.

After a successful eBay Active **or exact-retail** scan, the adaptive tier is scheduled sparsely:

- HOT: **28 days**;
- NORMAL: **42 days**;
- COLD: **84 days**.

The eBay and exact-page batches remain small dispatcher batches. Do not increase cron frequency to compensate for a slow market; let the queue spread work over time.

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


---

# 12. HOT WHEELS MARKET METHOD PREVIEW / SOLD RESEARCH

Admin Hot Wheels Market Method preview remains a controlled, MFA-protected diagnostic and is **not** part of the global 4/4/8 market refresh button.

The preview:
- runs the Hot Wheels exact eBay ASK audit;
- feeds accepted ASK observations through shared Market Method v4;
- reads canonical SOLD evidence from the same R3 repository lanes used by normal recompute;
- applies the shared current-SOLD selection policy;
- reads existing ASK snapshots;
- performs no canonical market writes.

Canonical SOLD evidence means existing accepted/eligible data in:
- `price_points` for granular external transactions;
- `market_aggregate_observations` for attributable aggregates;
- confirmed TrackDash transaction evidence.

Manual/controlled SOLD research is still distinct from automation.

Current eBay Browse integration is the active-listing lane. Do not relabel it as a completed-sale API. A manually verified ended-sale page may be persisted through the canonical candidate/price-point evidence model, but the normal Admin market refresh and cron do not currently include a SOLD-research worker.

If a future automated SOLD adapter is added:
- it must use the existing `sold_research` queue scope;
- its source must be READY/licensed/runtime-verified before cron claims it;
- exact Release + sold state + sold date + compatible condition are mandatory;
- failures must not fake `last_success_at`;
- Operations must be updated in the same work unit.


## SOLD ingestion foundation — 2026-09-30

A source-agnostic downstream SOLD ingestion layer now exists:

- `lib/market/pipeline/sold-ingestion.ts`
- `lib/market/pipeline/sold-ingestion-repository.ts`

It can normalize a qualified completed-sale event, apply historical ECB FX, deduplicate it, persist canonical `market_candidates` / `price_points`, and enqueue the existing recompute queue.

This does **not** mean the recurring cron now has an automated completed-sale source.

Current operational gate:
- eBay Browse remains active-listing only;
- `ebay_product_research` remains manual-only for SOLD evidence;
- an automated SOLD adapter must be explicitly approved, runtime-verified, and license-ready when required;
- the runner refuses sources that do not satisfy those conditions;
- the existing `sold_research` scan scope is reserved for the future READY adapter.

Revalidation safety:
if an existing candidate is reassigned to a different Release, the database trigger marks it for revalidation and disables its existing valuation point. The SOLD ingestion path must respect that state, route the candidate to review, and must not clear the guard by writing a fresh eligible point.

Therefore the current regular Admin/cron refresh remains unchanged:
**Retail 4 + eBay Active 4 + Recompute 8**.

Do not add a SOLD-research worker to cron until a real provider/source passes the readiness gate.
