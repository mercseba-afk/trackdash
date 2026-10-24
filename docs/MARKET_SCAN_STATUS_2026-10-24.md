# TrackDash scans and backlog — 24 October 2026

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
