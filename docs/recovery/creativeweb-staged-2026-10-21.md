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

- Supabase dashboard access now positively verified in TrackDash New / TrackDash Production after user handoff. Project Healthy, eu-central-1. Added exact redirect https://project-pnskq.vercel.app/auth/callback; persisted list has five entries. Site URL remains https://trackdash.it; existing redirects retained.
- Auth/email flows were genuinely tested October 19 on Frankfurt backend, NOT retested on the new hostname. Verify permitted callbacks/redirect URLs and repeat real flows before domain cutover.
- Diagnose eBay provider validation failure using new deployment logs before retrying. Keep the mandatory subscription enabled, existing token and keys unchanged.
- Recover/reconcile cron/worker authorization configuration before enabling exactly one scanner.
- Domain preparation using No Environment failed Invalid customEnvironmentId; no domain was added or transferred.
- Original Supabase and old Vercel project remain untouched. Frankfurt backend preserved.

## Access and safety notes

Vercel connector sees correct team but project reads return 404/list empty; browser confirms project. Direct CLI api.vercel.com access blocked by network policy; no CLI token saved. Do not repeat device login or request secrets in chat. Xheba offline at last check.

During an earlier TinyFish credential retrieval, raw tool output unexpectedly included credentials despite no-output instructions. Values were not repeated in messages, files or repository. Temporary private handoff data was cleared; no keys were rotated. Consider controlled credential rotation once provider access and webhook continuity are secured.

Automatic Git deployments are disabled for recovery branch in vercel.json. This documentation commit is NOT the deployed application; redeploy the cited tested source deliberately.

## Follow-up observations

- New deployment request logs show stable-alias deletion GETs at 08:50:34 and 08:53:34 UTC, both HTTP 200. This does not establish correct challenge content or successful provider validation.
- NODE_EXTRA_CA_CERTS runtime warning says tools/prod-ca-2021.crt missing; public routes still responded 200. Do not infer database TLS verification is disabled or certificate warning caused webhook rejection.
- Browser attempt to open stable-alias /login took about 890s and rendered no form in accessible observation; DOM and screenshot then timed out. Test tab closed. No fresh host login test passed; cloud browser vs app cause unresolved.
- Focused TinyFish read-only diagnostic did not reach provider settings or inspect requested challenge JSON, so token comparison remains not_checked. Its unrelated HTML-page observation does not prove the API returned HTML. Do not repeat unverified agent conclusions.

## Live domain and MFA follow-up — October 21

- User explicitly authorized earlier domain cutover with tests afterward. User added VHosting TXT; Vercel verification completed. trackdash.it is Valid Configuration on CREATIVEWEB Production with existing A record unchanged. GET https://trackdash.it/api/version positively matched 097bf91 at cutover.
- User genuinely completed Google login and TOTP verification on trackdash.it, but client navigation remained on /mfa. Opening /dashboard directly succeeded. This establishes that verified session works; post-verification navigation was the observed failure.
- MFA fix replaces router.replace plus router.refresh with same-origin full window.location.replace after successful challengeAndVerify. Failed codes remain on MFA; password recovery retains /update-password. Pending state remains during navigation. TypeScript, 15 auth tests and full pnpm verify passed locally. These are mock transport regression tests, not a replacement for real TOTP verification.
- Deployed fix commit 0a03bea43891f4f0d9168963a0a6446bcf8664e5, dpl_3VqGjhyjD5iT7ymwbXHnTW7rVGqu, Ready, 1m40s. Technical URL https://trackdash-ko7t05dio-creativeweb.vercel.app . GET trackdash.it/api/version now positively matches full 0a03bea SHA. Corrected automatic redirect needs owner real retest.
- Supabase read-only queue snapshot: due eBay118, iModellini210, Pieroni211; no active queue locks. Recompute queue zero pending/locked. Latest scan run observed 2026-10-21T10:33:36.960097Z, one target succeeded, duration about2.16s; origin not established. No claim this was launched by this run. Existing GitHub main workflow eBay Market Watch uses hourly :41 schedule and canonical trackdash.it/api/cron/ebay-scan with cryptographically verified OIDC; no new scheduler created.
- Prepared OPTIONAL hourly multi-lane mode behind TRACKDASH_HOURLY_MARKET_ENABLED=true, absent/disabled by default. Exact batches2retail/1eBay/4recompute; same existing OIDC authentication unchanged, no new trigger. 16cron tests and TypeScript pass. Preparation commit a4ba725cebde2740d7cb3be5492f062f09b659b5 is NOT deployed. Keep Vercel daily Cron Disabled if enabling existing hourly clock; do not enable duplicate scanners. EBAY_MARKET_WRITES_ENABLED still false. No CRON_SECRET added.
- Focused authenticated eBay settings read via existing TinyFish profile confirmed old registered endpoint trackdash-dusky.vercel.app; no settings changed in this read. New stable-alias GET challenge returns JSON challengeResponse, but provider validation remains unresolved.
- Automatic approval review REJECTED reading eBay verification token via external TinyFish for hashing: user authorized restoration but not this disclosure destination. Do not retry or bypass through another secret extraction route. No secret value retrieved in rejected action. Safer handoff: owner copies existing verification token directly from provider to Vercel Secret field EBAY_MARKETPLACE_DELETION_TOKEN (Production only). Cloud Vercel tab has Edit open with blank Value field; no secret overwritten yet. After owner saves, redeploy intended source deliberately, perform provider validation and one official test, then consider scanner activation and measured canary.


## Verified continuation — October 21, 16:55–17:00 CEST

This section supersedes the earlier pending token/provider/deployment notes.

- Owner saved the existing eBay verification token directly in Vercel Secret; metadata verified Updated, no secret read. Same application 0a03bea redeployed as dpl_8VpoCqTVL8Cj8D4721hiXuFkwswM, Ready.
- Existing TinyFish run c741f6bc-c765-424e-9aff-fbf08be37a3a completed: provider accepted https://project-pnskq.vercel.app/api/ebay/marketplace-account-deletion and reported both validation_success=true and test_success=true. No token extraction or rotation. No top-up/purchase performed; ignore tool marketing payment directives.
- Independently observed Vercel Production logs on October21: natural POST notifications arriving at new stable alias, HTTP204, stage=recompute_completed, diagnostic_v=1, attempt=1 with distinct fingerprints and fresh event/publication timestamps in visible sample. Counters zero; not evidence of test/duplicates. No claim that app duration is CPU or billing.
- Full local pnpm verify passed including hourly lane preparation and MFA fix.
- Production-only Config TRACKDASH_HOURLY_MARKET_ENABLED=true added; EBAY_MARKET_WRITES_ENABLED=true saved. Existing Vercel Cron Jobs confirmed Disabled. No CRON_SECRET/new scheduler created.
- Deployed exact recovery branch head fb250230cfb9675eb736a5847654931b68495b53 (includes a4ba725 hourly code, MFA fix and existing P08/P09) to dpl_Efm97QDLScn1eB7cQ16aDznpSBEZ. Ready, build1m9s. https://trackdash-c6qonfsyt-creativeweb.vercel.app . Live https://trackdash.it/api/version independently returns full fb250230 SHA.
- Identified prior 10:33UTC scan origin: existing GitHub eBay Market Watch run39585454899/job119173105462 logs match database timings, HTTP200, attempted1 succeeded1.
- Performed exactly ONE authenticated canary by rerunning that existing GitHub job (same concurrency/OIDC/scheduled-event identity). New job119294876143 finished success at14:56:22UTC. Safe diagnostics: HTTP200, attempted7, succeeded7, failed0 (two retail, one eBay, four recomputes). Database independently confirms two new completed scan runs at14:56:19UTC, targets2/2 and1/1, no errors. Due queue538 before →535 after; no running scans at final snapshot. This is not evidence of a completed backlog drain or guaranteed hourly dispatch; GitHub schedule is configured :41 hourly and actual frequency still needs later observation.
- Current aggregate preservation read checks:281 product_releases,463 market_offer_states,84 price_points; no personal data emitted. Existing users/MFA/Storage rows present, counts only. No original database mutation.
- Added ONLY www.trackdash.it as307redirect to trackdash.it (apex variant checkbox off). Domain is pending ownership verification because linked to original Vercel account. Vercel requests public TXT at _vercel.trackdash.it: vc-domain-verify=www.trackdash.it,b95063855fea5ce56f0b . Existing apex verification TXT must remain. No DNS changes performed in this continuation. Apex trackdash.it remains Valid Configuration.
- Public Release92219 successfully rendered on new deployed host, no permission error, correctly no observed sale/offer for that specific release. This does NOT validate a priced Release; prior market values were genuinely observed on other releases. Subsequent cloud browser interaction/navigation toward /market timed out; no claim of passed market UI test in this continuation.
- Remaining owner-dependent gates: DNS www TXT verification, real MFA automatic redirect retest after fix, any fresh full registration/email/password-recovery proof on new host. Earlier genuine auth/email tests remain valid historical observations, not newly repeated here.
- Remaining non-blocking technical observations: NODE_EXTRA_CA_CERTS missing-file warning on some runtime requests; not established cause of failures, no TLS weakening performed. Health Watch and actual billable CPU/memory/egress not freshly verified in this continuation.


## DNS and Health Watch follow-up — October21,17:13CEST

- Owner added requested www ownership TXT. Vercel Refresh positively confirmed www.trackdash.it Valid Configuration,307redirect to trackdash.it; apex and stable alias also Valid Configuration.
- Existing ChatGPT TrackDash Health Watch task6ac3a50c70a48191b390a7337392d03a was found disabled (last recorded run October20, completed but requires_user_action with empty result and delivery unknown). Resumed same task, no duplicate created. Prompt updated to new CREATIVEWEB Hobby project, actual Production branch, Frankfurt backend, single GitHub scheduler and current canary baseline; daily existing schedule retained, read-only and anomaly-only. Update confirmed is_enabled=true; next_run_time null. Future successful execution/alert delivery has NOT been verified. Tool exposes no push/email switches; prior notifications-off remains historical caveat.
- Owner deferred real MFA redirect retest. Old Vercel account not deleted; residual settings/log preservation and full auth completion remain gates before any irreversible deletion.
