# eBay notification diagnostics — 19 October 2026

Scope authorized by the user: deploy privacy-safe diagnostics for the existing account-deletion handler. No deduplication, erasure behavior changes, database migration, endpoint change, scan invocation or GitHub merge.

The existing single completion/failure log now includes selected response status and elapsed wall-clock milliseconds. Only after signature verification and payload validation it includes a domain-separated SHA-256 notification ID fingerprint, validated publish attempt count, and normalized event/publish timestamps. Raw notification IDs, seller identifiers, payloads, signatures, IP addresses and credentials are excluded.

The fingerprint correlates repeated notifications across independent Vercel requests. A completed log and selected 204 do not prove eBay received the response; elapsed duration does not measure Active CPU. Unknown or missing metadata stays `unknown`. Signature verification authenticates signed content, not the sender's network origin or freshness.

Baseline: 88 POST / distinct Vercel request IDs during 19:35–20:35 UTC, each completed with zero affected records. Without notification fingerprints and publish metadata, retries versus independent events were not demonstrated. No claim of measured CPU, memory or monetary cost is supported by that baseline.

Validation: signed synthetic route tests cover success/no-match, rejection, safe failures, recompute failure, exactly one completion log, deterministic fingerprints, distinct attempts and metadata sanitization. TypeScript and the complete `pnpm verify` suite passed locally. Remote build repeats the suite before building.

Release uses reviewed PR #434 base `3db96bd67a706fb507b41ce6d743296521782206` with all prior MFA/TLS recovery files retained. Public source overlay SHA-256: `9762e99e170f14caa5a74b56a6598114b60058ae8f2c975267c389020e96eb46`. Candidate deployment: `dpl_6GzVKJUBcVKKubjtVMheB91i3acA`. Registered callback remains the existing `trackdash-dusky.vercel.app` endpoint. Final activation and observed natural traffic must be recorded after verification.

Activation confirmed at approximately 20:49 UTC / 22:49 Europe/Rome: both `trackdash.it` and the registered callback alias resolve to the new READY deployment. Home, Catalog and Market return 200 with no application/permission error signatures; registered callback challenge returns 200. Previous immutable Catalog remains closed with 503. Automatic domain assignment is disabled again. Build reports verification completed without invoking a scanner. No error/fatal logs in the initial check.

First three natural signed notifications observed between 20:49:26 and 20:49:35 UTC had three different fingerprints, each attempt 1, event/publication timestamps contemporaneous with receipt, selected response 204 and zero affected records. Elapsed times: 500, 893 and 1247 milliseconds. These three are distinct first-attempt fresh events according to authenticated provider metadata, not demonstrated retries/backlog. This small sample does not establish the composition of the earlier 88 requests or future traffic. No notification IDs, payloads or seller data are recorded in this report.

The existing one-time morning check (20 October, around 08:00 Europe/Rome; automation `6ad680c1a84c8191b148e6f4d34168ff`) was updated in place with the released diagnostics and initial observations. It will compare unique fingerprints, attempt counts and event age against frequency and outcomes. Inspect CPU/memory only if real endpoint metrics are accessible. All follow-up inspection remains read-only. No duplicate task created.
