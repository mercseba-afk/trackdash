# P0.4 navigation review — local candidate, 15 October 2026

Baseline: GitHub main / Production READY `ae6f8e8bb14917067610580b11c246481c3a999f`, tree `b19de18bf30ef7e6c2fe6e07e5d420c1632a39f0`. An isolated checkout reproduces the existing signed GitHub commit; no new commit, push, merge, build or deployment was created. P0.3 is separate and unchanged.

## Two changes

1. Dashboard, Collection and Wishlist now use existing `releasePublicPath` / `productPublicPath` with the current IT/EN locale. Seven construction sites are covered, including Wishlist without an exact Release. Previously UUID links reached a route that permanently redirected to the same canonical destination. Controlled execution of the real route reproduces two route passes via UUID versus one with the canonical path. This is a structural count, not a browser HTTP, millisecond or Production CPU measurement; router cache/prefetch may affect actual requests. Markup, labels, pricing and data associations are unchanged; legacy deep-link redirects remain supported.
2. Family detail performs the existing editorial-copy and related-catalog reads concurrently after product lookup, not-found checks, canonical redirect and the coming-soon exit. For available families, query count is unchanged and the independent wait becomes approximately `max(Tcopy, Tcatalog)` instead of their sum. Coming-soon previously issued one unused editorial query; it now issues neither supplemental query. Missing/redirected routes also issue neither. Per-read error fallbacks and resulting content are preserved. A small concurrency increase from one to two overlapping reads is the main server resource tradeoff; no extra queries, cache or service is added.

## Findings left unchanged

- Root layout already uses P0.2's shared public market cache and provider expiry rules. A cold/recovering load can still block initial rendering; changing this without a browser trace risks market-state regressions. Do not assume the shared layout reboots on every client transition.
- Dashboard needs the public catalog for the market overview as well as owned items. Replacing it with an owned-only catalog would remove behavior.
- Collection/Wishlist first read private items to derive catalog IDs. Those two steps have a genuine dependency; blindly parallelizing them is incorrect.
- Store bootstrap reads profile, Collection and Wishlist on initial identity resolution. The Collection/Wishlist page can also read the same private list on the server. This is structural duplication at some cold entries, not evidence that every navigation repeats bootstrap: the shared StoreProvider persists. Removing it needs authenticated request traces and account-switch/logout race tests. AuthGate already permits progressive rendering once a user is resolved; bundling all reads into one response could delay that point.
- Navigation already uses Next Link. There are no route loading files. Dynamic prefetch/streaming/loading changes require measurements and a cost budget; aggressive prefetch can add unused invocations. No loading UI or graphic change is included.
- Existing useMemo and PWA navigation network-first/offline fallback remain unchanged. No private shared cache, Auth/RLS/schema, market rules, polling, scanner, cron or Health Watch changes.

## Validation and limits

`pnpm navigation:performance:test` covers real TSX href expressions and real family/Release route functions with isolated dependencies: IT/EN, UUID redirect vs canonical resolution, all seven construction sites, any-edition fallback, concurrent query start, missing family/Release, redirect, coming-soon and independent failures. Unexpected DB/network imports fail. Query mocks and product fixtures never touch live catalog/prices. A hook/route harness is not browser rendering or authenticated end-to-end testing.

Before changing source, the original test run reproduced canonical-link failures in both locales and the sequential query start. A further test reproduced the unused coming-soon query before moving the early exit. Final validation passed: full `pnpm verify` (exit 0), separate Typecheck (exit 0), all 14 navigation tests covering both locales, 13 market-cache tests and 13 cron tests. Existing market method, collection valuation, cross-surface, localization, efficiency and offline/polling guards passed in the same chain. The final review also removed a redundant coming-soon comparison rejected by TypeScript after the early return.

The first restricted-sandbox verify could not complete the existing subprocess workflow fixture; repeating with subprocess-capable execution passed without test or workflow changes. Cron HTTP clients remain mocked and no real scans were run. Catalog checks retain 13 non-fatal stable-ID manifest warnings; live Collection/Wishlist foreign-key checks were skipped without a database connection. These are not authenticated Production validation. `git diff --check` passed, the index is unstaged, and no `work/` path is tracked or part of the candidate.

No Production navigation latency, TTFB, Supabase wall time, RSC/JS transfer size, React profiler timings or deployed bundle sizes were measured. No new Vercel build was authorized. Generic web access to live `/api/version` was unavailable in this environment. Do not quote test-run durations as app timings or promise percentage savings.

Before publication: authenticated desktop/mobile cold and warm navigation traces; verify seven link sites and IT/EN URLs, back/forward and legacy links; same-account Dashboard/Collection parity and ASK expiry; logout/account switch; PWA hidden/resume/offline/reconnect; compare p50/p95 navigation, redirects, requests and bytes with the current Production baseline. Measure invocation/CPU effects rather than infer a monthly dollar saving. Existing P0.3 read-only work and billing gates remain separate.

## Review scope

Four runtime TSX files, one test script, package scripts and this document only. Temporary manifests, logs and patches live outside this checkout. In particular `/workspace/work/p04-tree.json` and `/workspace/work/p04-base-commit.json` must never be staged or committed. No dependencies added.
