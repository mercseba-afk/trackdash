# Frankfurt recovery checkpoint — 2026-10-18

Status: database migration rehearsal committed on the new project; no Production cutover.
This is not a completed restoration or a final write-consistent cutover snapshot.

## Later local authentication test preparation

- User added the Frankfurt callback to the existing Google OAuth client, created a client secret, and entered it directly in the new Supabase dashboard. Management config and the real Auth settings endpoint now confirm Google enabled; no successful Google sign-in claimed yet.
- Remote terminal Windows Forms prompts did not appear on the user's desktop. Both pending prompt processes were terminated. Use the user's ordinary Chrome dashboard for secret entry; do not reopen those invisible prompts.
- Exact PR434 source archive downloaded to the authorized PC; pnpm 11.25.0 frozen dependency installation passed. Local Next server listens only on 127.0.0.1:3000, with new-project credentials loaded into process environment, restricted runtime role and verified TLS using the official Supabase CA.
- No Vercel settings, environments, deployments or Production resources changed. Vercel project and environment metadata inspected read-only, without secret values.
- New Supabase Site URL temporarily set to http://localhost:3000 for real signup confirmation testing; original redirect allowlist retained and localhost test URLs added. Previous target config protected locally. Restore the final approved site URL before cutover.
- No cron/eBay credentials supplied to the local app; eBay market writes false. No new scanner activated.
- Local /login HTTP 200. Local /api/dev/health HTTP 200: actual DB connected, catalog accessible (61 product families), Auth reachable. Browser login, signup/recovery/email/MFA and authenticated UI remain unpassed gates until tested.
- Local private application logs may contain one-time callback codes or private diagnostics. Do not print them or publish them; retain under restricted local access and protect them after the test session.

## Project boundaries

- Source: piwogtdkfozbiakyjnvk; read-only export and comparisons. Existing data and administrator password unchanged. Authorized temporary CLI read-only login, TTL 300 seconds.
- Target: uhojhqxnzrolmnopwgpy, TrackDash New, Frankfurt eu-central-1, Free. Do not recreate in Ireland.
- No merge, GitHub push, Vercel environment update/deployment, scheduler change, or scanner start performed in this recovery checkpoint.
- Final Production switch requires user confirmation after real end-to-end tests.

## Completed and observed

- Native PG17 custom archive from an exported repeatable-read snapshot, roles without database-role password hashes, DPAPI encryption and verified archive digest on the authorized Windows device. Auth password hashes are preserved inside the encrypted database archive.
- Native pg_restore-generated SQL imported atomically into the initially empty target, under postgres with triggers temporarily suppressed only inside that transaction.
- 83 restored table-data blocks: all table row-content digests and counts match the current source. 10,804 rows compared. No row contents, hashes, credentials, identities or personal details printed.
- Counts: 281 product_releases, 209 market_release_signals, 463 market_offer_states, 84 price_points. Auth users/identities/password hashes/MFA, application data and Storage metadata included in row comparison.
- private schema, application functions/triggers, both custom Auth triggers, four Storage policies, RLS and five Realtime publication memberships restored.
- Platform auth/storage schemas and versions compared before import. Nonempty platform migration histories retained from the provisioned target. Omitted vector Storage tables and other omitted non-version tables were empty in the source.
- Three protected supabase_admin default ACL entries were already identical on both projects; retained on target.
- Target creation defaults added grants beyond source ACLs. Applied a source-generated atomic 512-statement privilege alignment to existing application relations/functions. P0.8 additions retained their own restricted grants.
- Metadata comparison checks 536 objects. After canonicalizing default/explicit owner ACL representations, 533 match; three CHECK constraint deparses differ in nested AND parenthesization after native dump/restore. These must remain explicitly accounted for; do not claim an entirely identical metadata hash.
- P0.8 applied in required order: helpers transaction, five CREATE INDEX CONCURRENTLY outside any outer transaction, RPC/grant transaction. All five indexes ready/valid. Both erasure RPCs executable by service_role, denied to anon/authenticated.
- Code contains exact stacked Draft PR #432 head 7c3564324f3a3c5871d95d5fa82ddd1b988da8d8 and #434 head 3db96bd67a706fb507b41ce6d743296521782206. No PR merged.
- Real postgres.js 3.4.9 target probe using the exact P0.9 connection-options.ts and a direct restricted trackdash_app login: text[]/uuid[] round trips PASS, fetch_types false, zero pg_type discovery queries, 281 visible releases, zero unscoped profiles. This does not measure end-to-end traffic savings or prove authenticated UI.
- Real new-project HTTP probe: Auth settings respond; anonymous profile access denied; service Data API returns expected four market/catalog counts.
- Existing Resend sending domain verified. Created a sending-only domain-restricted credential, configured new-project SMTP with original nonsecret sender/transport fields, stored credential DPAPI-encrypted locally. No credential displayed.
- Source Auth config read endpoint returned protected representations for SMTP/Google secrets, not reusable credentials. An earlier attempt to copy those representations was rejected by comparison and cleared on target. SMTP now uses the new real credential. Google remains disabled until a real client secret and provider callback are configured.
- Other Auth configuration compared across 243 fields. Site URL, redirect allowlist and email rate limit copied and verified on target. Add a specifically isolated test callback before clicking test emails; the production URL currently belongs to the unchanged old application.
- Windows script syntax parsed successfully. Prior repository pnpm verify passed; no application-code changes since that verification.

## Current blockers and unpassed gates

1. Storage file download from the original project's normal authenticated Storage API returns HTTP 402. Zero file bytes copied. Two objects / 196,022 bytes have metadata in target; they are not functional migrated files. Need provider-authorized free unrestriction/export or independent original copies. Do not route around provider quota enforcement.
2. Google OAuth needs a valid original/new client secret and the Frankfurt Supabase callback added to the existing Google client while retaining the old callback. Secret must be entered locally, never in chat or repository.
3. Need an explicitly designated real test inbox/account and isolated application test endpoint. Signup confirmation, existing-password login, Google login with preserved UUID, password recovery, actual delivered emails, MFA decryption/challenge, sessions and onboarding have NOT passed.
4. No app/browser end-to-end checks of Catalog/Release MV/SOLD/ASK, collections, messaging or marketplace completed yet. Database/Data API counts are not a substitute.
5. Scanners/Health Watch/cron/eBay callbacks have not been activated/tested against the new environment. Preserve exactly one active scheduler.
6. Before cutover, reconcile all intervening writes and eBay erasure requests. This archive is a rehearsal snapshot; PR #432 itself does not supply an independent lossless intake journal. Do not resurrect erased identifiers from this snapshot.
7. Final Vercel Production preparation/approval remains pending. Keep source intact and retain rollback material.

## Operational material

Recovery data and protected credentials remain under the authorized device's restricted
%LOCALAPPDATA%\TrackDashRecovery directory. latest-backup-location.txt identifies the backup;
never guess a timestamp or print/decrypt backup contents into chat.

Scripts under scripts/recovery are source copies of the executed Windows scripts. Their target
paths retain the short Windows names (without windows- prefix). They require the pinned
Supabase CLI, PG17 clients and verified official Supabase CA provisioned in that directory.
The source backup now includes private in its count query; use the COPY-count verifier for
authoritative archive table counts.

Do not rerun the initial restore against this populated target. Its empty-target guard is
intentional. Do not blindly rerun P0.8 after partial application. Refresh short-lived login
credentials only when needed. Do not delete shared CLI login roles to revoke one temporary login.

The runtime probe imports an exact copy of lib/db/connection-options.ts alongside probe.mjs,
with postgres@3.4.9 installed in its isolated local runtime-probe directory. Runtime credentials
are generated on the device and saved protected; the original administrator passwords are not
needed and must not be reset.
