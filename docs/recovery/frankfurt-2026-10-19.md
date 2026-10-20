# Frankfurt recovery checkpoint — 2026-10-19

Production remains unchanged. Source data has not been modified. No merge,
deployment, additional scanner, paid service or subscription was activated.

## Market permission correction applied

The initial source ACL alignment omitted column ACLs. PostgreSQL table-level
REVOKE removed those privileges, while the previous metadata comparison did not
include pg_attribute.attacl. This caused the user's real market query to fail.

Restored SELECT on exactly the 11 market_offer_states columns already specified
in repository migrations 0130, 0144 and 0214, on Frankfurt only. The successful
live DCL transaction is recorded in scripts/recovery/restore-market-offer-column-permissions.sql.
No blanket table SELECT, data write or RLS change was used.

Live post-change checks:

- All 11 required column SELECT privileges: true.
- Full-table SELECT for trackdash_app: false.
- seller_fingerprint SELECT for trackdash_app: false.
- INSERT/UPDATE/DELETE for trackdash_app: false.
- Existing RLS and condition/availability-limited runtime policy: preserved.
- price_sources SELECT: already present.

Fixed windows-prepare-acl.ps1 to restore all source column grants after its
table revokes/grants. Fixed windows-compare-metadata.ps1 to compare column ACLs.
The revised source-plan SQL was parsed/executed read-only against the target
catalog, yielding 11 column grant statements. The plan itself was not reapplied.
The revised scripts still need syncing to the Windows device and a complete
source/target column ACL comparison there.

The connector session cannot SET ROLE trackdash_app, and runtime credentials are
protected on the offline device. Actual app query/UI recheck is therefore pending;
the permission metadata checks alone are not reported as a passed browser test.

## Actual Auth evidence

User confirmed Google sign-in and Dashboard access on the local test app.
Live target evidence now confirms:

- One already-existing Google-linked user signed in after the test began.
- Three users and four identities remain; no new user was created by the test.
- One new session reached AAL2.
- One MFA challenge was verified against a factor created before migration;
  the original single factor remains present.

The earlier PC-side report incorrectly found no login because it used the
Windows clock for the time boundary. The PC clock was ahead of database time.
Use database-side timestamps or compare source/target state; do not derive the
Auth evidence cutoff from the device process StartTime.

## Current access and remaining work

Desktop Commander device Xheba is offline (last seen the previous evening).
The local app and protected source access are unavailable until it reconnects.
Frankfurt remains accessible through the authorized Supabase connector.

After reconnection: sync corrected scripts, recheck the failing app query and
market values in the UI, then complete real registration/email confirmation,
existing password access and recovery/delivery tests. Do not claim those passed.
Storage bytes remain blocked by source HTTP 402; no quota bypass is authorized.
The local target Site URL was set to localhost for tests and must be restored
to the approved final URL before cutover. Final source-write/erasure reconciliation,
scanner/Health Watch/eBay handoff and explicit Production approval remain required.

## Cloud dashboard resumed; online Preview blocked by Vercel

Authenticated cloud dashboard access is now confirmed for both organizations.
Frankfurt reports Healthy in the dashboard and ACTIVE_HEALTHY through the
connector. Live counts remain 281 releases, 209 market signals, 463 offers,
84 price points, 3 users, 4 identities, 1 MFA factor and 2 Storage metadata rows.
All five P0.8 indexes remain ready and valid.

Prepared a separate restricted Preview login, trackdash_preview_20261019,
inheriting trackdash_app without superuser, BYPASSRLS, role/database creation
or replication privileges. Maximum connections 4; initial expiry 26 October.
Generated a random credential and submitted only its SCRAM verifier to SQL.
The existing trackdash_app credential was not changed.

Attempted to save seven environment variables ONLY for Preview and the existing
PR #434 branch perf/p09-pooler-egress-20261018. Vercel rejected the request with
HTTP 402 resource_creation_blocked: the team has an overdue balance. No Preview
variables were created (subsequent metadata read confirmed none for that branch).
No deployment was attempted, and Production variables were not targeted.
No Vercel CLI is available in this environment for the mapped fallback.

Immediately disabled the unused Preview role with NOLOGIN PASSWORD NULL;
verified rolcanlogin=false and cleared its generated plaintext from orchestration
state. The disabled role remains, owns no recovery data and has no usable login.
Do not reactivate it unless a runnable isolated test environment is available.

The old organization's Usage/Billing dashboard explicitly confirms a Fair Use
egress restriction: 15.56 GB used of 5 GB; cycle 2 October–2 November 2026.
The displayed no-upgrade route is the next cycle reset, with possible delay.
No Storage access was routed around this enforcement. Earlier 402 Storage
download result remains unresolved; originals or a provider-authorized export
are needed to complete those two files before reset.

Security advisor was run. Fifteen no-policy tables are protected internal tables,
not an instruction to add public policies. Four anonymous SECURITY DEFINER
warnings concern functions whose verified return type is trigger, not ordinary
callable business RPCs. Authenticated business RPC warnings still require their
ownership guards to be reviewed; no blanket revokes or policy changes made.
The immutable sale-condition CASE helper has an unset search_path, and leaked
password protection is disabled. These notices are not reported as full security
clearance or as a passed end-to-end test.

Next external prerequisite: resolve or clarify Vercel's account-level billing
block with the account owner/provider. Do not pay, subscribe, change a plan or
weaken account restrictions automatically. Real signup/password/recovery/email
delivery and market UI tests remain pending, as does lossless final reconciliation.

## Vercel retry after owner intervention

The retry accepted a branch-scoped Preview variable, followed by the remaining
six variables (bulk response: six created, failed=[]). All seven are restricted
to Preview / perf/p09-pooler-egress-20261018. No Production variable was changed.
Reactivated the temporary restricted Preview login with a fresh random credential,
SCRAM verifier and the same expiry; DATABASE_URL is stored as a Vercel Secret.
No deployment has been started.

The NODE_EXTRA_CA_CERTS value currently points to tools/prod-ca-2021.crt;
that public CA file is NOT in the PR source tree. Resolve and verify CA bundling
before deployment. Do not weaken certificate or hostname verification to fix it.

Cloud Vercel sign-in is now verified on the correct team and TrackDash project.
The optional consent to consume ChatGPT plan quota was turned off before sign-in.
Production is still READY at d8690f7adb349c74bea38b1c115039ebf57a888d.

Automatic approval review rejected exporting the Supabase server key through a
browser-shared temporary file because it would persist a privileged credential.
The rejected operation did not execute; the proposed temporary file is absent.
Do not retry that route or expose the key in outputs.

Prepared the direct Vercel UI form for SUPABASE_SECRET_KEY, type Secret,
scoped ONLY to perf/p09-pooler-egress-20261018 (Production deselected).
Value remains empty and Save has NOT been clicked. Per browser confirmation
policy, request action-time approval before granting this Preview backend
privileged API access to the new Supabase. If approved, use direct in-memory
browser clipboard transfer into the scoped Vercel Secret; no intermediate file.
Verify final branch/environment metadata before any build.

## Approved key transfer and first online Preview deployed

Owner explicitly approved direct server-key transfer. Modern key reveal/copy
controls did not return a usable value after bounded attempts. The official
Legacy page exposed the existing compatible service_role key. Transferred it
directly in browser memory to SUPABASE_SERVICE_ROLE_KEY, type Secret, ONLY for
Preview / perf/p09-pooler-egress-20261018; no file and no credential output.
Vercel success toast and connector environment metadata independently verified
the saved key name, Secret type, Preview target and exact branch scope.

Downloaded the public Supabase Root 2021 CA from the dashboard's certificate
download. SHA256 certificate fingerprint:
80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA.
Expires 26 April 2031. No private key is involved.

Added reviewed deployment-local bootstrap (scripts/recovery/preview-build-bootstrap.cjs)
and public CA as two branch-scoped nonsecret configuration values. Bootstrap
rejects non-Preview, wrong target and Production scanner credentials, verifies
the CA fingerprint, writes the public CA and includes it in Next.js server traces.
The build command override belongs to this deployment request. It runs the
existing pnpm build (including pnpm verify). No GitHub push or merge occurred.
Database URL keeps sslmode=verify-full; no TLS validation was disabled.

Preview dpl_Dxnn7KggsTp3VgKxLLL8EQxYkPAC reached READY at exact PR #434 SHA
3db96bd67a706fb507b41ce6d743296521782206 (stacked #432), target=null/Preview.
URL: https://trackdash-3c8fb8ei3-mercseba-8773.vercel.app
Runtime region reported iad1; Supabase remains Frankfurt, not recreated.

New Supabase Site URL saved to that immutable Preview origin for real email
tests. Added its /** redirect via UI; Save URLs was submitted, but the final
list verification did not complete because Cloud Browser later timed out.
Verify the allowlist before declaring Google/recovery Preview tests passed.
Original allowlist entries were retained; old project untouched.

Actual HTTP checks through the Vercel connector:
- Catalog and login: HTTP 200, no application exception in returned HTML.
- Dyna-Hawk GX, Manta Ray Mk.II and DASH-X1 Proto-Emperor family pages: HTTP 200.
- Server-rendered Dyna #95467: estimate 14.92 EUR, asking 46.36 EUR, 5 sold.
- Server-rendered Proto #95450: estimate 12.72 EUR, asking 14.09 EUR, 7 sold.
- Preview returns X-Robots-Tag: noindex.
- No error/fatal runtime logs found for this deployment in the checked window.
These are real HTTP/runtime checks, NOT hydrated browser or authentication tests.

Two Cloud Browser attempts timed out for a prolonged period; its subsequent
tab inventory was empty. Do not retry slow cloud UI in a loop. Owner can use
the independently HTTP-verified Preview in ordinary Chrome without the home PC.
Next indispensable action is an actual existing-account password sign-in.
Before that test, live DB baseline was 2026-10-19 10:28:05.961388+00, users=3,
identities=4, MFA factors=1, latest session created 2026-10-18 20:30:13.7052+00.
Use DB-side evidence to verify the later session; do not trust client clocks.

Full signup/confirmation, existing password, recovery/email delivery, hydrated
market UI, collections/messaging/scanner/Health Watch/eBay and Storage bytes
remain outstanding. No target scanner, Production cutover or data deletion.
