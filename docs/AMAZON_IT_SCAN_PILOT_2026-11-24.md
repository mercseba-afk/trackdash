# Amazon Italy scanner pilot

## Evidence and consent

User supplied and confirmed exact product mappings: Neo-VQS 18094 → B083JYP59Y;
95598 → B08KR2LXCV. Direct cloud requests and the dedicated browser were rejected
by Amazon. ScraperAPI was then selected after reading its published Amazon Italy
endpoint, free plan and cost documentation. User created the account via GitHub.
User explicitly authorized transfer of its API credential to CREATIVEWEB /
TrackDash / Vercel Production as TRACKDASH_SCRAPERAPI_KEY. It is stored as a secret,
never NEXT_PUBLIC, never committed, never copied to candidate payloads or logs.

Actual provider playground checks, 24 November 2026:

| ASIN | Endpoint | Result |
|---|---|---|
| B083JYP59Y | Product | EUR30; 2 left; free shipping; RCECHO from Hong Kong |
| B083JYP59Y | Offers, new | EUR30 RCECHO, EUR38.14 Amazon US; both new, free shipping |
| B08KR2LXCV | Product | EUR408.36; BDG LLC IT; free shipping; dispatch 12–13 days |
| B08KR2LXCV | Offers, new | EUR408.36; new; BDG LLC IT; free shipping |

These are ASK, never completed sales. The product metadata contains demonstrably
inaccurate incidental attributes (e.g. remote controls/VS for18094). Never import
such specifications: catalog identity remains based on verified Tamiya records.

## Rollout and limits

Only these TWO exact release/ASIN endpoints can issue provider requests. They use
the existing protected exact-page worker, existing queue row locks and clock.
No extra cron, browser dependency, paid subscription or package dependency.

One chargeable async submission per ASIN per24h, with a persisted reservation
BEFORE submission; an ambiguous response never causes an immediate paid retry.
Base cost cap5/request: at most310 base credits/31days for the pilot, plus tests.
Provider accepts jobs quickly; later queue invocations poll the fixed provider
status endpoint, each with a10s deadline and750KB body limit, below Vercel's limit.
No remote statusURL is followed. The provider key is sent only to ScraperAPI over
HTTPS. Polls release queue locks and are due after15min, processed by the existing
clock. Successful/failed completed scans wait for the daily slot. Unknown schema,
identity mismatch or fetch failure preserves existing public evidence.

Parse only exact Tamiya Item Number + verified ASIN mapping, EUR and explicit new
condition; one offer per seller. Shipping remains null when unverified. Missing
sellers become unknown, not sold, and no raw customer reviews are persisted.
Amazon Italy is marketplace identity, not seller shipping origin: source region
is global and physical origin remains unknown unless independently verified.
The existing representative ASK and SOLD calculations remain unchanged.

Data enrollment script: scripts/sql/amazon-it-pilot-2026-11-24.sql. Enable it only
after deploying the worker with the Production secret. Public/worker live checks
are recorded separately after deployment; playground success alone is not proof
that the server scanner is active.

Validation: parser and real worker tests cover identity, used/non-EUR exclusion,
seller dedup, unknown shipping, daily cooldown, lost submission response, deferred
polling, credential redaction, stale evidence preservation and fixed endpoint
allowlist. New test is part of the repository verify gate.
