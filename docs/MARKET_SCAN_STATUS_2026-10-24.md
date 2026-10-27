# TrackDash scans and backlog — 24 October 2026


## CURRENT — catch-up activated and real test passed, 24 October 2026 20:26 Europe/Rome

Explicit user authorization received after the earlier automatic-review block. Exact recovery app commit5ed3ebdfb482296ae29de406201f384e31c0e879 deployed ONCE as dpl_GXMjo3N92tSKtpCGZarkEjGA7ELF; Vercel Ready, Production/trackdash.it, build1m25s. GET /api/version returned200 and exact5ed3ebd; unauthenticated GET /api/cron/ebay-scan?lane=ebay returned401. PR437 then marked ready and merged to MAIN as bf1ed1bec83173bb21bceeeb09d4b958605d0351. Vercel Cron Jobs confirmed Disabled after this deployment; GitHub remains the sole clock. Main remains unsuitable as the app deployment branch.

Real protected PUSH run40120629351/job120951176682 completed successfully. Four sequential HTTP200/applicationStatus=success results, each attempted1/succeeded1/failed0, at18:25:43,18:25:51,18:25:58,18:26:00 UTC (20:25–20:26 CEST). This establishes bounded catch-up works; it does NOT establish natural hourly schedule reliability. GitHub total37s/scan job33s is elapsed CI time, NOT Vercel Active CPU.

Measured DB deltas for the same enabled eBay/ready/active_marketplace cohort: due96→92, overdue>24h93→89, active locks0 and failures0. Rome-day allowance12→16 of24,8 remaining. The first-day12 baseline conservatively included all pre-cutover lane attempts. Never reset it to force another test.

Four oldest jobs confirmed completed and rescheduled:

| Item | Last success UTC | Next scan UTC | Accepted | Signal outcome |
|---|---|---|---:|---|
|95525|24Oct18:25:42|3Nov18:25:42|1|recomputed24Oct; current offers2→1; MV48.79/sold3 preserved|
|94626|24Oct18:25:51|23Nov18:25:51|0|no new evidence; MVNULL/current0/sold0 preserved|
|94716|24Oct18:25:58|23Nov18:25:58|0|no new evidence; MVNULL/current0/sold1 preserved|
|18072|24Oct18:26:00|31Oct18:26:00|1|recomputed24Oct; current0→1; MVNULL/sold2 preserved|

100 candidates examined (19+40+40+1),2 accepted active listings. No accepted listing was counted as a concluded sale. Database last_success_at proves successful no-change scans even when signal computed_at legitimately stays old. Querying queues by release alone also returns disabled alternative-source compatibility rows dated2099; exclude these when auditing eBay progress.

Public smoke: canonical95525 Release page returnedHTTP200 and MV48.79. First request served historical ASK64.60 dated1October; after the existing cache refreshed, a second read showed 'Prezzo di1venditore · annunci extra-UE ·24ott2026', ASK65.34, shipping excluded/import amount to verify. Live DB offer is in_stock/EUR65.34/shippingNULL, checked24October. This verifies automatic public integration with existing provenance/qualification labels; do not claim a new completed sale or a higher Market Value. No manual pricing update or cache-policy change was performed.

Resource limitation: latest Usage available before activation was CPU18m52s/4h, memory1.5GB-hours, invocations31K, with reporting period ending24October11:00. Runtime/Request Logs inspected did not provide an isolated measured CPU or billable-memory total for these four calls. Do not substitute HTTP/CI durations or project totals. One app build, one four-Release real test, no paid service, no extra scheduler. Budget24 is an automatic Release-attempt cap, not an HTTP invocation cap or future free-tier guarantee. Incidental Node extra-CA-file warnings were visible in runtime logs; public HTTP/data and signed worker tests passed. No TLS settings were changed in this task.


User requested real scan/price update verification and a few oldest-data scans. Read-only preflight followed by six explicitly authorized bounded sequential reruns of the existing workflow. No code, schema, policy, scheduler, plan, identity or old-database changes.

## Live scope and baseline

Frankfurt uhojhqxnzrolmnopwgpy. Production /api/version returned780c9a4db49175a1e39b9f8a3fc4b9d6dba7cf77. Existing main workflow d8690f7adb349c74bea38b1c115039ebf57a888d, .github/workflows/ebay-market-watch.yml, cron41* **hourly**, one concurrency group, same strict GitHub OIDC/canonical trackdash.it endpoint. Combined bounds remain2retail/1eBay/4recompute per cycle.

scripts/market-coverage-health.sql baseline around15:38Europe/Rome:193 verified public available Mini4WD Releases,10 withMV,53 withSOLDreference,26 freshASK,72 withsomeevidence,121empty;165eBayenabled,28identityparked,9retailrunnable,31retailvalidatedbutinactive.87 distinct runnable Releases overdue24h;oldest due263.4h. Zero failed scan runs in24h,zero stuck>20min;recompute queue empty. Don't report placeholder retail queues as executable work.

## Did automatic scans actually run?

Yes. Database day buckets use Europe/Rome:
-22Oct:6 targets attempted/succeeded.
-23Oct:27 targets attempted/succeeded,70 accepted observations. Includes the manual initial Aero/Avante work, not27 guaranteed distinct Releases and not27 autonomous schedule events.
-24Oct before this task:4 targets attempted/succeeded,16 candidates/4accepted. No scan errors. Last natural success13:35:28CEST.

Read authenticated GitHub Actions workflow list (connector cannot list all scheduled runs). It shows actual Scheduled runs today00:36,03:02,08:25,13:35CEST;23Oct00:44,03:54,09:54,15:47,20:41CEST;22Oct00:42,03:48,09:56,16:04,20:46CEST. Recent runs succeed in10–96seconds. Not regular hourly starts despite hourly YAML. Latest natural run40090502342/job120862010879 success. Missing schedule triggers/delays are observed; exact GitHub-side cause is **not established**. No unsubstantiated claim of Vercel suspension, API quota, billing limit, provider incident or scanner failure.

Sum(24/scan_interval_hours) over165 currently enabled public verified available Mini4WD eBay queue rows = **15.32 scans/day** steady-state demand under today's adaptive tiers. Observed last complete days about5 scheduled cycles/day ×1eBay/cycle cannot maintain that demand or drain backlog. This is an estimate from queue intervals, not measured billing and not a recommendation to rescan every Release daily. The intended one-hour dispatcher would provide up to24due scans/day while individual Release cadences stay7–45days.

## Executed oldest-data batch

Queue claim SQL inspected: earliest next_scan_at first, priority tie-break, FOR UPDATE SKIP LOCKED. The first six already-due runnable rows also had the oldest last_success (1Oct); no queue ordering mutation was needed. Preserved fail-closed identity and endpoint gates. No second clock and no overlapping manual runs.

Existing run39585454899 sequential successful jobs120887480750,120887568680,120887776115,120888066952,120888313102,120888463200. Each safe diagnostic HTTP200/applicationStatus=success/attempted1/succeeded1/failed0; total6actualeBayRelease scans,not18retailscans or42operations. Completed15:40:24–15:45:06CEST.

| ITEM | Edition | Last successful scan UTC | Current offers | MV EUR | SOLD reference EUR / units | Next scan UTC |
|---|---|---|---|---|---|---|
| 92277 | Neo-Tridagger ZMC Next (Navy) | 2026-10-24 13:40:24.288892+00 | 0 | NULL | NULL / 0 | 2026-11-23 13:40:24.396+00 |
| 95508 | Neo-Tridagger ZMC Carbon Special | 2026-10-24 13:40:48.776285+00 | 4 | NULL | 17.21 / 3 | 2026-10-31 13:40:48.838+00 |
| 92279 | Neo-Tridagger ZMC Next (White) | 2026-10-24 13:41:47.560708+00 | 0 | NULL | NULL / 0 | 2026-11-23 13:41:47.626+00 |
| 95000 | Dyna-Hawk GX Black Special (Super XX Chassis) | 2026-10-24 13:43:09.991465+00 | 0 | NULL | 10.95 / 3 | 2026-11-23 13:43:10.079+00 |
| 94717 | Dyna-Hawk GX Super XX Special | 2026-10-24 13:44:25.63927+00 | 0 | NULL | NULL / 0 | 2026-11-23 13:44:25.708+00 |
| 19201 | Dyna-Hawk GX | 2026-10-24 13:45:06.389541+00 | 0 | NULL | NULL / 0 | 2026-11-23 13:45:06.471+00 |

Before batch all six had0current offers/MVNULL.95508 retained existing SOLD17.21/3 and95000 existing SOLD10.95/3; these anchors/units unchanged after.95508 now4accepted exact new-complete in-stock marketplace offers, last_checked24Oct13:40:45.905Z:70.79,73.20,76.23,87.11EUR. Browser confirmed canonical family https://trackdash.it/catalog/neo-tridagger-zmc shows **74.72EUR median of4independent sellers,24Oct,non-EU,shipping excluded**, alongside the separately retained3SOLD/reference17.21. Earlier unauthenticated HTTP snapshot temporarily showed the old69.99EUR/1Oct historical quote; fresh rendered browser correctly showed today's projection. No code fix or valuation override applied. Do not call69.99→74.72 a market trend: different age/sample/statistic.

Other five returned no eligible accepted current new-complete offer; successful empty scan is meaningful and does not invent a price or a sale. No new confirmed SOLD or MarketValue movement demonstrated in this batch.95508 and19201 recomputed on material changes; no-change scans can legitimately retain an older computed_at, so use last_success_at to establish a new check. Existing worker assigned7days to95508 and30days to the otherfive; dates preserved from worker, not manually reset.

## Values / telemetry limits

Offer-history read found actual EUR quote changes since19Oct (e.g.19409 at24Oct08:25CEST;95474/95060 at23Oct). A EUR conversion change alone does not prove a seller changed native currency price or a real sale occurred. New listings, availability updates, MV and SOLD are separate.

market_scan_runs.valuations_changed/trends_changed are all0in sampled day buckets; code inspection on actual Production ebay-worker.ts shows run completion does **not populate these fields**. Therefore they cannot establish that no MV/trend ever moved. market_value_history currently has0rows, so it also cannot supply a historical before/after audit. Current canonical MV/SOLD persisted signals and explicit six-row pre/post were used; historical global MV movement cannot be proved from these counters. Do not claim the entire market is unchanged. External automatic completed-SOLD source remains unavailable, as previously documented; no synthetic transactions created.

## Final state and minimum next intervention

Same strict coverage cohort193:10MV,53SOLD,27freshASK (26→27),72any-evidence,121empty. Executable overdue24h **87→81**,oldest due259.0h,failures0,stuck0. This is partial oldest-first backlog recovery, not full drain. Last checked scan15:45:06CEST. No plan/CPU/egress reduction measured or promised.

Priority: establish why GitHub creates roughly5 scheduled runs/day despite hourly YAML, and make the **existing single dispatcher** reliable before adding many Releases. Preserve per-Release adaptive cadence, matching, TTL, canonical prices and source readiness. A conservative batch-size increase is a separate measured fallback if clock reliability cannot be recovered, not applied here. Do not enable Vercel cron in parallel or recommend daily whole-catalog scans. Telemetry counters/history need a separate scoped correction before using0as a no-change claim. Remaining next due starts Avante Mk.II95061, then94592/95525/94626/94716, based on queue at preflight; re-read before execution.


## Hourly dispatcher resynchronization — 24 October 2026, 16:10 CEST

User authorized proceeding while keeping Vercel Hobby usage bounded. PR #435 (https://github.com/mercseba-afk/trackdash/pull/435) merged as ae635b85961a55ce34b897950dc4ac700467ff65. Existing main workflow now uses `17 * * * *` instead of `41 * * * *`; this is a minimal resynchronization attempt, not proof that GitHub's unexplained dispatch gaps are resolved. One scheduler, one scan HTTP call per invocation, no scan retries, unchanged OIDC and concurrency; deployed batches and per-Release intervals unchanged. Main and fix/hourly-market-clock-20261024 automatic Vercel deployments disabled explicitly; Production stays on recovery/frankfurt-migration at 780c9a4 / dpl_GsY4yewurDC8Dazv8E2sKGLkXM9R. Dashboard deployment list still shows 21 October as latest deployment; no new build observed.

Validation: isolated checkout of exact main plus four changed files; full pnpm verify passed locally and GitHub Typecheck / TrackDash branch verify both succeeded. All 13 cron reliability tests passed. Existing protected push smoke run 40101307449 / job 120893843676 succeeded: HTTP200, applicationStatus=success, attempted1, succeeded1, failed0. This is a PUSH run, not evidence of repaired natural hourly scheduling. DB confirms scan 14:10:28–14:10:34 UTC, 22 candidates and 3 accepted; Release item95061 last_success_at 14:10:34 UTC, next_scan_at 31 October14:10:34 UTC, failures0/errorNULL. Accepted candidates are not proof of sales or Market Value movement. No bulk catch-up loop or paid service introduced.

Vercel Usage dashboard snapshot, displayed period ending 24 October08:00: Fluid Active CPU17m22s/4h (~7.24%); Fluid Provisioned Memory1.4GB-hours; Function Invocations28K; Fast Data Transfer326.16MB/100GB, Fast Origin Transfer217.08MB/10GB; build CPU48min. These are dashboard totals, not endpoint-only consumption and not a monthly forecast. Nominal hourly dispatch implies roughly720 endpoint calls per30days plus the push smoke; CPU, memory and Supabase egress cannot be inferred from invocation count or HTTP elapsed time. No guarantee of future quota compliance claimed. Confirm natural schedule events and remaining runnable overdue backlog before claiming the cadence repaired. Underlying GitHub-side cause remains unproven.


## Bounded catch-up prepared — 24 October 2026, 19:47 Europe/Rome

User authorized trying the four-Release/24-attempt proposal. PR436 merged into recovery at 5ed3ebdfb482296ae29de406201f384e31c0e879. SQL supabase/migrations/20261024173544_bounded_ebay_daily_allowance.sql was applied FIRST to uhojhqxnzrolmnopwgpy, following an isolated PostgreSQL/WASM fixture and a live service_role dry-run ending ROLLBACK. New internal daily budget table uses RLS and no anon/authenticated claim rights; existing internal callers preserved. Advisory transaction lock serializes claim reservations; failed/abandoned claims are not refunded and cannot be reclaimed the same Rome day. Cutover refuses active eBay locks and seeds ALL recorded market-lane attempts conservatively:12 used/12 remaining. Original database unchanged. Advisor WARN counts unchanged; new RLS/no-policy INFO is intentional for the internal budget table.

Code adds authenticated ?lane=ebay and catchupVersion=1; extra requests skip retail/recompute. Up to4 total requests per workflow invocation, each still one eBay Release/maxDuration60. Existing first shell scan/diagnostics retained; extra requests are never retries, fail closed on protocol mismatch, stop at idle eBay or time budget, and cannot redirect a token to another host. SQL budget counts automatic job claims, not HTTP calls, and does not instrument separately authorized targeted operator probes. Vercel daily cron remains disabled; GitHub stays the sole clock.

Validation: full recovery verify passed;18 route/shell tests and11 driver tests; SQL fixture covered seed, oldest-first, ceiling, abandoned claims, shared allowance, duplicate avoidance, permissions, empty queue, day reset and DST. WASM connection serializes calls, so no multi-connection PostgreSQL stress test is claimed. Main-side PR437 is DRAFT, based on ae635b8, head bcd5fa2f7ec680f19fc00ee02f39cb9a8cbd4d6f; full verify exited0 locally and GitHub40117597014/40117597093 succeeded.

BLOCKER: automatic approval review rejected opening the Vercel deployment menu, citing earlier no-premature-Production-deployment instruction and missing explicit deployment confirmation. Do not bypass or deploy through another tool. Current Production remains dpl_6QDqHd6QzNH9LM2mDyfJjAwbnW6D /815634e (homepage section removed). Four-Release catch-up IS NOT ACTIVATED. Next: receive explicit approval for Production deploy of5ed3ebd and activation ofPR437; deploy exact recovery commit once, verify version/protocol without unauthorized writes, then merge437 and observe its one protected push run (at most4 real Releases), confirm queue/budget deltas and record results. Do not reset the12 used allowance or remove the daily cap to force a test.

Vercel Usage shown before activation: last30days ending24October11:00, CPU18m52s/4h(~7.86%), provisioned memory1.5GBh, function invocations31K, build CPU54min. Reporting lag and project-wide aggregation prevent endpoint-only before/after CPU attribution; never use HTTP duration as CPU or guarantee future free-tier usage. No paid services added.
