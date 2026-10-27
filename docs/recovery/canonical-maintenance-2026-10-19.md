# Canonical Frankfurt environment, public maintenance retained

Target connector reauthorized. Database independently confirms the real controlled scan started 16:41:19 UTC and completed 16:41:22 UTC: attempted 1, succeeded 1, accepted/review/rejected 0. Exactly one queue job has a successful scan in the window, no new job errors, no active leases, no running scans. This resolves the prior missing-log-evidence gate; no repeat scan executed.

Target at 19:01 UTC: 4 users, 5 identities, 1 verified MFA factor, 281 Releases, 209 signals, 463 offers, 84 price_points. All 83 tables re-fingerprinted. Differences versus frozen source are the known real Auth/signup/password/MFA activity, one new profile/subscription, a traffic metric, and the one successful queue/scan run. All other application/market/collection/message/Storage metadata tables match. Detailed fingerprints are in target-final-checkpoint-2026-10-19.json. No source mutation or destructive cleanup.

Promoted the already built Production deployment dpl_9QFQraN38TxuxrYsK2NiJLmdrJAX under the previously authorized maintenance window. No rebuild. Independently confirmed trackdash.it resolves to this exact deployment and /api/version reports PR434 base 3db96bd67a706fb507b41ce6d743296521782206. This is the reviewed public overlay build including both PRs and the password/MFA fix, not unmodified base code. Public Catalog remains 503; this is not public reopening authorization.

Current live routing version 20cee527-1152-4a95-959f-a3b24638f023 contains two rules:

- Maintenance rule db0cafae-20c3-4678-b282-fddd29acdafb returns 503 for every path except version metadata and eBay account deletion, with only exact immutable validation host trackdash-49jcpk6kf-mercseba-8773.vercel.app exempted.
- Rule 3cab2877-f51f-45f3-a1be-4023d82fb04e returns 503 for account deletion on any host except trackdash.it. Old immutable callbacks remain closed.

Actual canonical eBay verification challenge returned 200 and a valid 64-hex challengeResponse. This proves endpoint/token configuration only, not signed POST delivery. Actual canonical Catalog and cron remain 503 with maintenance header, and old immutable callback remains 503. Target erasure plan/apply RPC permissions independently verified service_role yes, anon/authenticated no. No successful signed notification log yet in the inspected 15-minute window. Provider delivery/replay status still requires inspection; never claim a test notification establishes historical replay.

Future explicit recovery build package updated to normal no-scan behavior with current writes=true, one-scan flag remains no. Package SHA256 f0d43a69aadcff1eb1c8c24ba31e3c34e05c75618d2d54685b969a6beab478ca. Existing live deployment unchanged. A local VM verification checks exact base/file hashes and verify-before-build with no scanner invocation; no network or remote writes in that test.

Remaining indispensable user dashboard actions: set/verify target Auth Site URL https://trackdash.it without deleting callback allowlist, and use existing production eBay Notifications Send Test Notification while canonical endpoint is open. No management Auth configuration tool and remote home device is offline. Do not read secrets or ask for database passwords. After signed test and final checks, obtain separate public-opening approval. Keep old immutable URLs closed after opening. Do not blindly restore old DB once new target writes or deletions have occurred.
