### Release checkpoint — 2026-10-13, Production HTTP smoke automation (candidate PR)

- 2026-10-12 Production quota cleared: Deployment `dpl_7DN2CXyb7DFVNJd4B5jYT7hJULRm` READY and `trackdash.it` aligned with merged main `3d510320240f1308105c901a8c0182e07bd48469`. End-user browser tested `/api/version` plus seven HTML routes: all eight returned HTTP 200 / marker OK. Collection and Wishlist were **only** HTTP-reachable; authenticated data/UX were not validated by the script.
- A PR (pending CI/Preview/merge, **not yet live**) adds `.github/workflows/production-smoke.yml`, `scripts/smoke-production.mjs` and local negative-path unit cases included in `pnpm verify`.
- After **every push to `main`**, GitHub Actions waits up to 12m for an exact `/api/version` SHA, then GET-checks homepage, Catalog, Market, Manta Ray 95466, Neo-Tridagger 92280, Collection and Wishlist. Fails on stale code, 404 or invalid public content, never requests authenticated data, scans or prices. GitHub Actions may need workflow-run permission; do not interpret pending PR as deployed.
- Roadmap remains Stage 1 notification delivery/dry-run, Stage 2 authorised retailer access (403 blocked), Stage 3 audited eBay discovery, then identity/SOLD gates; **no changes to Market Method v4, source READY states, scan cadence, enrollment or Supabase**.

# TrackDash — Market Coverage & Automation Roadmap

> Authoritative cross-chat implementation plan — 2026-10-12.  
> Status: **IMPLEMENTATION IN PROGRESS — Stage 0 SQL audited; Stage 1 Health Watch rule update applied, delivery/Preview pending.**  
> Read this file together with `docs/TRACKDASH_STATE.md`, `docs/TRACKDASH_METHOD_MASTER.md`, `docs/TRACKDASH_OPERATIONS.md` and `docs/FAMILY_COMPLETION_MASTER.md` before changing code, cron, source policies or Supabase.
>
> Repository: `mercseba-afk/trackdash`; production `https://trackdash.it`; Supabase project `piwogtdkfozbiakyjnvk`. Always rediscover GitHub main / live Vercel Production SHA rather than assuming the baseline below is still deployed.

## User-approved objective

**Increase the number of AVAILABLE Mini 4WD Releases with real, automatically refreshed market evidence**, without inflating or fabricating SOLD/Market Value, mixing the wrong editions or over-scanning a slow collectibles market. Use and finish existing work before adding speculative providers. Health Watch must report coverage deterioration, truly actionable pipeline defects and genuinely blocked sources—not count parked queue rows as errors.

**Out of scope without separate validation:** bulk activation of all manual/planned adapters, arbitrary SOLD reconstruction from disappearing listings, unlicensed scraping / platform ToS bypass, relaxation of edition/JAN matching, overriding Market Method v4, forced full daily per-Release scans, synthetic MV/price points, and private-access bypass.

## Observed baseline, 2026-10-12 (read-only Supabase; dynamic metrics may change)

| Metric | Observed | Definition |
|---|---:|---|
| Available, verified public Mini 4WD Releases | **164** | Categories `mini4wd`, product `metadata.launch_status='available'`, Release public and verified |
| At least one of MV, SOLD evidence or current ASK | **75** (45.7%) | Union, not sum |
| Without MV/SOLD/current ASK | **89** | Evidence coverage opportunity |
| Canonical published MV | **10** | Subset of 75 |
| Any documented selected SOLD | **50** | Overlaps MV and ASK |
| Any canonical current ASK snapshots | **50** | Overlaps SOLD and MV |
| Available with enabled eBay Active queue | **138/164** | Of 89 empty Releases, **74** already eBay-enabled |
| Available without enabled eBay Active queue | **26/164** | Mostly shared Item Number / unreliable distinction: not mass-eligible |
| RCJaz verified endpoint on available Release | **22** | Of 89 empty, **10** have an endpoint |
| Hobby Search / 1999 verified endpoint on available Release | **7** | Of 89 empty, **3** have an endpoint |
| Source adapter statuses | **4 ready, 10 planned, 9 manual, 1 internal** | Other registered sources may have no policy. `price_sources.is_active` alone **does not** mean runnable |
| eBay Active markets scanned | **IT, DE, GB, US** | Via official Browse API, existing 1-Release bounded cron |
| Existing SOLD collection | Yahoo Japan closed, eBay Product Research, Mercari, Mandarake and curated manual history | These are **not** continuously running automated SOLD workers |

Previous Catalog UI phase is **already complete**: published MV first, else honest weaker SOLD-only reference with count; asking price is separate one-seller/current-median estimate of sellers' demands. **Do not rework those cards** unless a measured defect is found.

## Execution order — finish each stage before advancing

### Stage 0 — Baseline, boundaries and observability (FIRST)

- [ ] Re-check live GitHub main, Production deployment `READY`, `/api/version`, relevant master docs and open PRs. No blind release.
- [ ] Run a **read-only** dynamic Supabase baseline across available/public/verified Mini 4WD Releases: one canonical `new_complete_unbuilt` signal per Release; count MV, SOLD, current ASK, stale/historical ASK, no evidence, recent accepted candidates, source counts, editions with shared Item Number/JAN, due eBay and *actually runnable* retail.
- [ ] Reconcile 164/75/89 snapshot with current data. Do not mistake `coming_soon`/archived for available.
- [ ] Create/test reusable KPI query/service definition: `coverage_total`, `coverage_with_any_evidence`, `coverage_sold`, `coverage_current_ask`, `coverage_mv`, `coverage_empty`, `ebay_enabled`, `ebay_parked_identity`, `retail_runnable`, `retail_validated_but_inactive`, `due_over_24h`, `oldest_due_age`, `run_failures`, `needs_review`, `source_last_success`. Counts must be scoped and mutually comparable.
- [ ] Establish a stable before/after snapshot for each stage so we can prove new, **correct** coverage—not just higher candidate counts. No PII/seller identities in Health Watch reports.

**Gate:** baseline rerunnable, no side effects, no accidental price-method changes; visible report clearly distinguishes zero results from missing scanner support.

### Stage 1 — Upgrade existing TrackDash Health Watch (EARLY)

- [ ] Extend the existing daily **TrackDash Health Watch** condition-watch automation (Europe/Rome ~07:00) to check market coverage alongside cron/run/lock/recompute. Check execution after actual cron; don't fire on normal schedules.
- [ ] Alert on **real regressions**: coverage drop without documented staleness/expiry, newly published available Releases lacking market signal/enrollment after a reasonable grace period, eligible eBay due jobs older than 24h, stagnant due backlog across successive successful crons, jobs `running` too long, repeated 60s timeout, actual runnable retail blocked, unexpectedly failed configured READY adapter, source canaries failing, persistent identity reviews requiring action, Production/main code divergence, recompute blocked after a successful dispatch.
- [ ] Keep automatic de-duplication of repetitive alerts and identify sources/Releases impacted. Record counts and delta since previous measurement. Never alert for manual/planned/parked jobs as though runnable, old canonical ASK when public TTL projection hides it, or shared-Item-Number scans intentionally disabled.
- [ ] Price Guard remains a **separate** quality monitor for MV/ASK/SOLD corruption, misclassification, double-counting, FX, geographic confusion; Health Watch must not modify prices or security grants.
- [ ] Verify notification delivery. At the 2026-10-12 automation audit the existing Health Watch showed `notifications_enabled=false` / `email_enabled=false`, despite being `is_enabled=true`; user may need to turn on alerts in app settings. Do not claim users receive alerts unless delivery is actually enabled.
- [ ] Optional weekly **coverage progress** report can be added once measurement is stable, without spamming daily no-change notifications.

**Gate:** dry-run reports are accurate; one real failure and one deliberately parked source are classified correctly; no repetitive false alarm.

### Stage 2 — Promote existing exact-retail adapters, first RCJaz

- [ ] Audit **RCJaz `rcjaz_public`**: source `adapter_status='planned'` even though exact endpoint and parser/enrollment groundwork exists. There are **22** verified endpoints for available Releases, **10** currently without market evidence. Overall source inventory has ~36 verified endpoint rows, but some are non-available.
- [ ] Check live Vercel canary with safely selected exact URLs: real HTTP status, Cloudflare/403 behaviour, currency, exact Release Item Number/JAN/edition, stock/price/sold-out, parser determinism, cross-region shipping caveats. **Respect access restrictions; do not bypass anti-bot.**
- [ ] Validate that a successful parser stores the correct candidate/offer and triggers canonical recompute. No fabricated SOLD when retail stock changes; retail out-of-stock is not a completed-sale transaction by itself.
- [ ] Only if canary passes, use reviewed minimal Supabase migration/source policy change to `ready` with tightly-scoped matching enabled endpoint-backed jobs, bounded batch size and timeouts. Run 1–3 canaries, inspect before/after signals, then expand gradually to previously verified endpoints.
- [ ] If RCJaz cannot be reliably accessed in Vercel, **do not mark ready**. Document actual blocker and proceed with other sources; keep user informed.
- [ ] Repeat for **Hobby Search / 1999** (7 available verified endpoints, 3 from empty cohort) **only after implementing a dedicated reliable parser if generic parser is insufficient**. Other planned/manual retailers follow by verified achievable yield and stable ToS-compliant access, not by row count.
- [ ] Audit enabled `pieroni_public`, `imodellini_public`, `modellismo_gandolfi_public` source output and source-level yield. Do not mistake generic queue placeholders for runnable endpoint URLs.

**Gate per source:** reproducible canary + tests, source READY only after functioning in **Production runtime**, no incorrect Release matches, no false availability/SOLD, scans finish under runtime limits, database/recompute remains healthy, and measurable useful evidence uplift.

### Stage 3 — Improve official eBay Browse discovery **without increasing per-Release cadence**

- [ ] Read existing four-market `ebay-worker.ts` and `ebay-browse-adapter.ts`. Baseline search is `Tamiya ITEM_NUMBER + edition_name`; it sometimes misses Japanese/local title variants despite correct item numbers. Look at real high-frequency rejection reasons (`ITEM_NUMBER_NOT_IN_TITLE` alone appears many times) and distinguish broad false-positive search from true missing offers.
- [ ] Benchmark a **small audited set**: both popular and 10–20 empty Releases, different vintages and duplicate Item Numbers. In preview/dry-run test alternate queries: exact Item Number, normalized model/edition terms, verified JAN where usable, selective Japanese/English edition synonyms, direct known listing ID refresh. Never accept by query term alone: the exact-Release classifier always decides.
- [ ] Measure incremental unique correct offers / accepted Releas​es per API call; log per-query source and overlap. Dedup by stable eBay listing ID and seller without reintroducing `ebay:undefined` or inflated median samples.
- [ ] Consider more official Browse marketplace IDs (FR/ES/NL etc.) **only if API support, credentials, delivery context and measured marginal yield are adequate**. Do not multiply API calls by number of variants × markets without strict budgets/rate limits and a hard 60s execution limit.
- [ ] Keep one Release per worker invocation, hourly dispatcher for due work, adaptive 7–45-day Release cadence, exact-JAN quarantine for shared item numbers, and source error isolation. Preserve TTL and completed-run/lock recovery.
- [ ] Prefer **selective discovery escalation** for the 74 already eBay-enabled empty Releases after baseline search yields no matching results, versus repeatedly deep scanning every populated Release. Never auto-retry a timed-out HTTP request that may already have claimed a job.

**Gate:** measured accepted/verified incremental offers on benchmark, low wrong-edition rate, no new 60s timeouts or API exhaustion, both zero-offer and established Release behaviour regressed.

### Stage 4 — Handle the 26 identity-parked available Releases safely

- [ ] Inventory each identity issue: shared Item Number with multiple editions; missing/duplicate JAN; year/packaging/production wave confusion; not enough exact evidence.
- [ ] Verify independently usable identifiers from reliable catalog/official documentation and physical packaging where available. Sibling JAN must fail closed; ambiguous listings remain `needs_review`.
- [ ] Enable automatic eBay jobs **only** for Releases whose exact target can be distinguished by structured JAN/item details using existing gate or improved audited matching. Create persistent provenance and negative tests for wrong reissues.
- [ ] For cases with no independent identifier, retain quarantine and pursue exact retail pages or independent SOLD research; do not silently merge distinct editions or manufacture prices.

**Gate:** zero newly accepted sibling contamination and safe enrollment only of truly disambiguated Releases.

### Stage 5 — Add **legal, reliable and actually automatic** SOLD acquisition

- [ ] Main blocker for robust canonical Market Value: current automated eBay Browse obtains **ASK not SOLD**. Existing Yahoo closed, eBay Product Research, Mercari, Mandarake records are mainly from prior captured research and not ongoing automated adapters.
- [ ] Evaluate usable official/contractually licensed APIs, data exports or authorised sources for actual completed transactions. For each assess permissions, cost, availability, stable sale ID, sold timestamp, final paid price vs an unsold ask, conditions, seller dedup, country, shipping and exact Release/JAN evidence.
- [ ] Proof-of-concept **one source + a small audited Release set** in read-only mode; reject unverifiable "disappeared listing = sold", auctions without award evidence, reused item-number ambiguity and resold duplicate records.
- [ ] Integrate source into existing canonical evidence ingestion `market_candidates` / `price_points` / aggregate pipeline with idempotent keys, automatic recompute queue and Market Method v4 unmodified. Respect rate limits and evidence retention.
- [ ] If no legitimate machine-readable SOLD source is accessible, document this limitation explicitly. Keep the existing **SOLD-only visual reference** from legitimate manual/captured sales; don't promise zero-manual automatic SOLD otherwise.

**Gate:** demonstrated legally obtainable genuine completed sales, idempotent daily/periodic refresh, safe provenance, precise currency/edition filters and no false Market Value.

### Stage 6 — Operational finish / repeatable measurement

- [ ] After each source/stage, update this plan's per-step status, `docs/TRACKDASH_STATE.md`, `docs/TRACKDASH_OPERATIONS.md`, `docs/TRACKDASH_METHOD_MASTER.md`, source/Release completion masters as applicable. Leave exact GitHub PR, commit and Production version in the checkpoint.
- [ ] Run full `pnpm verify` in isolated environment; Preview on **final branch SHA** must be READY; only then PR merge and Production deploy. Verify live `/api/version`, Catalog/Manta #95466 and sold-only Neo-Tridagger #92280, Collection/Wishlist semantics, source workers and no runtime errors.
- [ ] Dynamic coverage report after each release: **baseline 75/164 → new count** with verifiable new Release IDs and source, sold evidence separately, missing 89 trending down. Value remains truthful even if no genuine price exists for some rare Releases.
- [ ] Recheck queue health over multiple natural cron cycles; only mark a source `stable` after successful repeated automatic runs. One successful manual trial does not certify automation.
- [ ] Do not claim all sources fully automated while manual/planned policies remain; report outstanding legal/technical source blockers by name.

## Implementation control / progress ledger

| Stage | Status on 2026-10-12 | Merge/Production proof | Next action |
|---|---|---|---|
| 0 Baseline/KPI | Read-only KPI SQL added on feature branch, re-run against live Supabase 2026-10-12; Preview/merge pending | Feature commit `7dff9d5`; no Production release | Run verify, Preview gate, then merge |
| 1 Health Watch | Existing daily automation updated 2026-10-12 with scoped TTL-aware coverage, safe due queues and failure gates; notification delivery still disabled | Automation ID `6ac3a50c70a48191b390a7337392d03a`; no app deploy | Check next dry-run/delivery; enable notifications in app |
| 2 Retail canaries | **Blocked by live 403 anti-bot** in Vercel iad1 canary for RCJaz and Hobby; both remain NOT READY | Four read-only HTTP canaries 2026-10-12; no DB/source policy writes | Seek authorised access or alternate exact public provider; never bypass protections |
| 3 eBay discovery | Existing active worker 4 markets, fixed matching/timeout behaviour | Existing Production | Safe query benchmark and dry-run |
| 4 Shared identity | 26 available Releases not eBay-enabled, rightly protected | None | Evidence-led identity audit |
| 5 Automated SOLD | Not implemented; no proven runnable connector | None | Legitimate source feasibility and POC |
| 6 Monitoring/QA | Existing full verify + manual audits | Reassess each stage | Publish coverage deltas after each stage |

**Next-chat start:** Continue TrackDash. Read this roadmap and all four master files, inspect latest GitHub main and Production version, start Stage 0 then Stage 1; proceed sequentially, with automatic cross-checkpoint updates, no skipping failed gates or unsafe bulk activation.

### Implementation checkpoint — 2026-10-12 evening, Stage 0/1

- GitHub `main` and Vercel Production `READY` both point to `479faf8ec43f5a462bef6358469e97c2ef044963`; `/api/version` could not be independently fetched from the external audit environment. Do not claim version route verified.
- New audit in branch `feat/market-coverage-health-baseline-20261012`: `scripts/market-coverage-health.sql`. SQL file **was fetched back from that GitHub branch and executed unchanged read-only in production Supabase**, results: **164 available verified public Releases; MV 10; SOLD 50; TTL-valid accepted ASK 48; union 74 (45.1%); empty 90; eBay eligible/enabled 138; deliberately parked 26; retail runnable 7 distinct Releases; verified but inactive retail 28 distinct Releases; due >24h 0; oldest currently due ~15.1h; failed scan runs in 24h 5; stuck running >20m 1**. Source-level last successes are included. Total retail *queue rows* may be 8 even when distinct runnable Releases are 7. The earlier 75/164 snapshot used a different ASK definition/time: 74 is a fresh stricter TTL/accepted-offer baseline, not proof of market coverage loss.
- Five completed failures correspond to previous 60-second eBay timeout jobs recovered at 2026-10-12 06:51 UTC. A later `running` row began 17:01 UTC and remained unfinished during the audit; check lock/worker recovery before manual intervention. Successful scans at 03:41, 06:59 and 07:40 UTC demonstrate not all lanes are broken.
- Daily TrackDash Health Watch automation edited **in place**, retains Europe/Rome ~07:05, detects confirmed evidence loss, backlog/locks and false positives. `notifications_enabled=false`, `email_enabled=false` at audit: this service cannot force-deliver notification until the user enables notifications. Price Guard unmodified.
- No source policies, scan enrollment, Market Method, SOLD, MV, ASK, user data, secrets or cron settings were changed. No RCJaz/Hobby Search promotion before verified exact-source canaries.
- **Stage 0 gate remains open** until full `pnpm verify` and Preview/Production verification where relevant. **Stage 1 gate remains open** until one parked case and one real incident are confirmed in a dry-run and notification delivery is enabled/verified.


### Stage 2 factual block — 2026-10-12 Vercel canary

A minimal **read-only Vercel Node 24 sandbox in `iad1`**, without credentials or bypass, requested actual verified endpoint URLs with the same TrackDash user agent. Four HTTPS GETs all returned `HTTP 403`, content type HTML, title `Just a moment...` and Cloudflare challenge markup:

- `rcjaz_public`, #18074, `www.rcjaz.com/...90059083.html` — 403, challenge.
- `rcjaz_public`, #94692, `www.rcjaz.com/...90012922.html` — 403, challenge.
- `hobby_search_1999_public`, #95335, `www.1999.co.jp/10460640` — 403, challenge.
- `hobby_search_1999_public`, #94716, `www.1999.co.jp/10098463` — 403, challenge.

This is **NOT** a successful Production-Lambda parser test, and no `adapter_status` or queue configuration was changed. Source activation fails gate safely because pages were never accessible. No prices or SELL-THROUGH were extracted/invented. Follow up only via permitted access, a documented source API, authorised data feed or genuinely accessible other source. Repeated Cloudflare challenges should not trigger automated bypass attempts. RCJaz/Hobby Search remain `planned`.

### Stage 3 preliminary rejection baseline (no discovery code change)

Ebay current `market_candidates.original_source` is `EBAY_IT/DE/GB/US`, not `ebay_active_public`; review KPI was corrected accordingly after first read-only test. Last-30-day available-cohort `needs_review` candidates: **20**. Across all eBay markets 611 rejected candidate reason entries were `ITEM_NUMBER_NOT_IN_TITLE` (30 days). **These are broad-search rejections, not proof that 611 exact listings were lost.** Need an API-backed audited query benchmark before new production queries or additional markets.


### Final-branch Preview and identity/SOLD feasibility checks — 2026-10-12

- **Gate check on feature head `82c26f65db2e9bf10f6bb6cc47ae30e6a23c7545`:** GitHub Actions `Typecheck` and `TrackDash branch verify` both SUCCESS, Vercel Preview `dpl_xgsgKWCzVu3ZaJnyWjzFv83L2dAa` READY. Direct HTTPS from Vercel sandbox: Production `https://trackdash.it/api/version` 200 with `479faf8ec43f5a462bef6358469e97c2ef044963`; Preview `https://trackdash-1c6p2qfas-mercseba-8773.vercel.app/api/version` 200 with `82c26f65db2e9bf10f6bb6cc47ae30e6a23c7545`. Both homepage and `/market` returned HTTP 200. **This checkpoint update creates a newer branch SHA, requiring CI/Preview repeat before merge.** No authenticated Collection/Wishlist smoke was performed.
- **Stage 4 identity-parked audit:** 26 available Releases safely excluded from automatic eBay scanning break down as **19 shared Item Number missing JAN, 3 shared Item Number with duplicate JAN, 4 missing Item Number**. No supported identity evidence justifying activation yet.
- **Stage 5 licensed SOLD feasibility:** official eBay Buy Marketplace Insights API is explicitly `Limited Release` and the marketplace-support docs say it is **restricted and not open to new users at this time** (see `https://developer.ebay.com/api-docs/buy/ref-marketplace-supported.html`). The existing Browse API is active-listing discovery, not completed-sale access. No accessible authorised SOLD ingestion source has been proven; no fake DONE/SOLD inference from vanished listings.
