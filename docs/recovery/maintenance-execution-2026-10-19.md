# Maintenance execution, 19 October 2026

User authorized maintenance phase; final public reopening is not authorized yet.

## Source freeze

- Source connector reauthorization verified at 16:33 UTC.
- All 83 table counts and whole-row fingerprints equal the 14:45 UTC checkpoint.
- Native Vercel pause initially returned 503 DEPLOYMENT_PAUSED for canonical URL, immutable old deployment, cron and eBay endpoint. Native pause also blocked new builds, so it was replaced with an explicit project routing rule.
- No preexisting project routing rules. Added maintenance rule db0cafae-20c3-4678-b282-fddd29acdafb, live version 06d4b837-b204-4cf9-83f7-3db17fb508e4. Regex ^/(?!api/version/?$).* returns 503, Retry-After 600, Cache-Control no-store, X-TrackDash-Maintenance 1. Rules apply to all project environments/deployments. Read-only version metadata remains reachable.
- Unpaused backend only after publishing maintenance rule; immediately disabled automatic domain assignment again. Independently verified canonical cron, canonical eBay endpoint and old immutable Dashboard return the new maintenance 503, while canonical version remains old d8690f7.
- At 16:40 UTC source had zero running scans and zero active application connections. Final 16:41:04 UTC snapshot has no differences in any of 83 tables. Original database remains unmodified.

## Production preparation

- Original Production DATABASE_URL binding hvf2QSRChRhyVxOv and SUPABASE_SECRET_KEY binding bdQYxqiKjeJ4szpf preserved unchanged on reviewed PR432 branch with automatic deployment disabled. No secret value read or exported.
- Frankfurt DATABASE_URL dmcbOmfYjKC2HiJl and SUPABASE_SERVICE_ROLE_KEY AitiiCXssMSvZUAg moved from PR434 Preview to Production, without reading values. Existing immutable Preview deployments retain their tested snapshots; do not rebuild Preview until its bindings are restored deliberately.
- Existing shared public URL/key retained on development/preview. New Production public URL/key use Frankfurt; verified TLS root bundled and NODE_EXTRA_CA_CERTS configured.
- Staged Production dpl_D336vo2RqeiWX4b3dndJq49rBGkA READY, no canonical domain switch. Code base PR434 exact 3db96bd plus public source overlay 9395ff4d154e2c9fc932c254ac55e20f32c845eb904f3bed4d3ad535d35f2506, including password/MFA recovery fix. Scans disabled in that immutable build.
- First guarded build dpl_FF4aBPf7BnkoNwBT4TvkhUeHdftf intentionally failed closed on incompatible eBay staging configuration. Corrected configuration before next build. No scanner ran there.
- Native pause rejected attempted canary build dpl_BdLhh1SCqPiJoYkZJ4cHMhhZsd8V before build execution.
- Single persisted scanner test submitted as dpl_9QFQraN38TxuxrYsK2NiJLmdrJAX using overlay f63007a3ce62404a9665f5816fadddfd8e10543fe787499ddfba5f824fa2b7d7, source freeze at 16:38 UTC. Its runtime/build flags permit one scan against Frankfurt only, limit network destinations, reject a stale window and reject repeat execution after a scan in the window. Four unsafe guard cases passed locally. Actual outcome must be inspected before claiming success or retrying.
- Project-level TRACKDASH_CUTOVER_RUN_ONE_SCAN disarmed to no immediately after deployment creation. New deployment snapshots do not inherit further configuration edits.
- Canonical domain remains old Production dpl_7WCRZaU3a1yz2ft7uKnUknySeQvd behind maintenance. No GitHub push/merge.

## Remaining gates

### End-of-turn observations

The controlled build dpl_9QFQraN38TxuxrYsK2NiJLmdrJAX is READY. Its final build message reports the controlled scan phase completed, but the inspected bounded log window did not contain the helper's aggregate PASS event. Therefore persisted scan success is NOT confirmed; inspect target market_scan_runs and related changes before retrying or claiming success. The one-scan flag remains disarmed. No canonical deployment promotion has occurred.

Maintenance routing was narrowly updated to permit only immutable validation host trackdash-49jcpk6kf-mercseba-8773.vercel.app using a missing-host condition. Current live routing version is 6a84ec06-388e-4091-9099-5dadeb11f2df, same maintenance rule ID. Actual validation Catalog and login returned 200 without application exception signatures. Canonical Catalog and original immutable Catalog both independently returned maintenance 503 with X-TrackDash-Maintenance 1. Thus public reopening has not occurred.

Source connector access succeeds; target connector access now explicitly returns permission denied after the org switch. A user reauthorization to TrackDash New is indispensable for final target database inspection. No need to reset database passwords or re-create either project.

Restore target connector authorization to TrackDash New, inspect persisted scan state and all relevant counts, set target Auth Site URL to https://trackdash.it while preserving callback allowlist, verify signed actual eBay provider test and delivery retry state. Public reopening still needs separate user confirmation. Never remove maintenance rule to test a single endpoint: use narrowly scoped temporary exceptions only after new canonical routing is verified. Keep old immutable deployments under maintenance after reopening, so they cannot mutate the old database.
