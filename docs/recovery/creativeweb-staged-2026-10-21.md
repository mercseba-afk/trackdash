# CREATIVEWEB restoration checkpoint — 2026-10-21

User authorized the new hosting setup and proceeding toward going online. No purchases, destructive changes, old database changes, or duplicate scanners.

## Ready deployment

- Team CREATIVEWEB (creativeweb), Hobby; project trackdash.
- GitHub mercseba-afk/trackdash, Production branch recovery/frankfurt-migration.
- Exact deployed source: 097bf91089bc7a7d6b8e153e44d7b42f969e7669; complete verified recovery tree fe3c39f9ec56d10e819b89258e16db6f04bccf60, incorporating P0.8/P0.9 and prior recovery fixes. pnpm verify passed before source publication.
- Latest deployment dpl_F3QZaPcP5ah4u99bixsFJnhaT4zT is Ready, Production, build duration 1m23s. Same source redeployed using existing build cache.
- Stable technical alias https://project-pnskq.vercel.app . Deployment URL https://trackdash-a9pekaowi-creativeweb.vercel.app . trackdash.it has NOT moved.
- Functions configured solely fra1. Cron Jobs Disabled, EBAY_MARKET_WRITES_ENABLED=false, TRACKDASH_CUTOVER_RUN_ONE_SCAN=no.
- New Vercel has twelve Production-only variables. DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY and the three eBay credential/token variables are Secret. No secret values recorded here.
- EBAY_MARKETPLACE_DELETION_ENDPOINT updated to https://project-pnskq.vercel.app/api/ebay/marketplace-account-deletion and deployed.

## Observed verification

- First deployment GET /api/version matched full source SHA.
- Independent browser observation of public Release #95467 showed Stima TrackDash 14.92 EUR and ASK 46.36 EUR excluding shipping, without permission/TLS errors. This is not a claim that every release was retested.
- After adding eBay secrets, previous deployment GET challenge returned challengeResponse, replacing ENDPOINT_NOT_CONFIGURED. A local challenge response is not provider validation.
- After endpoint configuration deployment, the authenticated eBay provider workflow attempted saving the new stable endpoint. Provider validation FAILED, and the workflow reported reversion to the previous registered URL https://trackdash-dusky.vercel.app/api/ebay/marketplace-account-deletion. Official notification test was NOT successful. Cause not established; do not claim the webhook restored.

## Remaining gates

- Supabase dashboard sign-in through ChatGPT returned OAuth state has expired. A fresh canonical project check still redirected to sign-in. No Auth URL configuration changed. Manual handoff of existing Supabase sign-in tab requested; do not assume user saying done proves success.
- Auth/email flows were genuinely tested October 19 on Frankfurt backend, NOT retested on the new hostname. Verify permitted callbacks/redirect URLs and repeat real flows before domain cutover.
- Diagnose eBay provider validation failure using new deployment logs before retrying. Keep the mandatory subscription enabled, existing token and keys unchanged.
- Recover/reconcile cron/worker authorization configuration before enabling exactly one scanner.
- Domain preparation using No Environment failed Invalid customEnvironmentId; no domain was added or transferred.
- Original Supabase and old Vercel project remain untouched. Frankfurt backend preserved.

## Access and safety notes

Vercel connector sees correct team but project reads return 404/list empty; browser confirms project. Direct CLI api.vercel.com access blocked by network policy; no CLI token saved. Do not repeat device login or request secrets in chat. Xheba offline at last check.

During an earlier TinyFish credential retrieval, raw tool output unexpectedly included credentials despite no-output instructions. Values were not repeated in messages, files or repository. Temporary private handoff data was cleared; no keys were rotated. Consider controlled credential rotation once provider access and webhook continuity are secured.

Automatic Git deployments are disabled for recovery branch in vercel.json. This documentation commit is NOT the deployed application; redeploy the cited tested source deliberately.
