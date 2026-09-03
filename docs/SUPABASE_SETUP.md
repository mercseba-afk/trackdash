# Connecting TrackDash to a real Supabase project

Step-by-step procedure to take a brand-new Supabase project from empty to
fully wired up and verified against TrackDash. Follow it in order — each
step depends on the one before it.

Everything here runs against **your own** Supabase project. Nothing in
this repository can do any of this for you automatically; there is no
live project connected in the development/CI environment this app was
built in, so none of the steps below have been executed for real — only
verified statically (types, generated SQL, config wiring). Section 9 below
is the checklist for you to run them for real.

---

## 1. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Pick a strong database password when prompted — save it somewhere safe. You'll need it in step 3.
3. Wait for provisioning to finish (a couple of minutes).

## 2. Retrieve URL, keys, and connection strings

From **Project Settings**:

- **API Keys** tab → copy:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **Publishable key** (or, on older projects, the **anon** key under "Legacy API Keys") → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **Secret key** (or the legacy **service_role** key) → `SUPABASE_SERVICE_ROLE_KEY` (not used by any code yet — see `.env.example`, keep it out of the browser regardless)
- **Database** tab → **Connection string** → copy the **Transaction pooler** string (recommended for serverless/Next.js). This is your privileged `postgres`-role connection — use it for `MIGRATION_DATABASE_URL` in step 3, and temporarily for `DATABASE_URL` too, until step 5 swaps it out.

## 3. Configure `.env.local`

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable or anon key>
SUPABASE_SERVICE_ROLE_KEY=<secret or service_role key>
DATABASE_URL=<the Transaction pooler connection string, postgres role — temporary, swapped in step 5>
MIGRATION_DATABASE_URL=<the same Transaction pooler connection string>
```

`.env.local` is git-ignored — never commit it.

## 4. Apply migrations

```bash
pnpm install
pnpm db:migrate
```

This applies, in order, everything under `supabase/migrations/`:

| # | File | Creates |
|---|---|---|
| 0000 | `silly_gressill` | All 14 core tables (brands, categories, products, product_releases, profiles, collection_items, wishlist_items, price_points, market_estimates, ...), foreign keys, indexes |
| 0001 | `left_quentin_quire` | RLS policies + `ENABLE ROW LEVEL SECURITY` on every table |
| 0002 | `profile_auto_provision_trigger` | The `handle_new_user()` trigger on `auth.users` that creates a matching `profiles` row on sign-up |
| 0003 | `seed_initial_catalog` | The 36-model Tamiya Mini 4WD catalog (1 brand, 1 category, 36 products, 60 releases) |
| 0004 | `app_runtime_role` | The restricted `trackdash_app` Postgres role (see step 5) |
| 0005 | `step5b_runtime_grants_hardening` | Table-level GRANTs for `trackdash_app`/`anon`/`authenticated` (narrower than 0004's blanket CRUD, and with Supabase's own broader project-bootstrap defaults — including TRUNCATE — explicitly revoked first, not just left in place under new GRANTs on top), EXECUTE hardening on `handle_new_user`/`rls_auto_enable`, and the `ensure_rls` event trigger that auto-enables RLS on every new `public` table. Written after production testing surfaced first a `permission denied for table profiles (42501)` (RLS policies are not a substitute for the underlying GRANT), then separately confirmed live that `authenticated`/`anon` still held TRUNCATE despite the GRANT fix (RLS does not protect TRUNCATE at all). See `lib/db/rls.ts`'s header comment and this migration's own comments for the full story. |

All of them are safe to re-run (every statement is `ON CONFLICT ... DO NOTHING`,
`CREATE ... IF NOT EXISTS`, or `CREATE OR REPLACE`) — re-running
`pnpm db:migrate` against a project that already has some of these applied
won't duplicate or corrupt anything. None of them are destructive; there is
no `DROP TABLE`/`DROP COLUMN` anywhere in this set.

**Dependencies on Supabase-managed things**, in case any of this needs
troubleshooting:
- `auth.users` — referenced by `profiles.id` (0000) and the trigger (0002). Managed entirely by Supabase Auth; these migrations never modify it.
- `auth.uid()` — read by every RLS policy that scopes rows to `auth.uid() = user_id`. Supabase provides this function; it reads session context that `lib/db/rls.ts`'s `withUserContext()` sets manually for direct Postgres connections (see step 5 and section 9 of the Step 5 report).
- `anon` / `authenticated` roles — Supabase-predefined; referenced by RLS policies (0001) and granted to `trackdash_app` (0004). Never created by these migrations.

## 5. Provision the app-runtime role and switch `DATABASE_URL`

Migration 0004 created the `trackdash_app` role, but a role created via
`CREATE ROLE ... LOGIN` with no password can't actually log in yet. Set one
via the Supabase SQL Editor (**not** as a migration — never hardcode a
password in a checked-in file):

```sql
alter role trackdash_app with password '<generate a strong random password>';
```

Then update `.env.local`:

```env
# Same host/port/dbname as before, different user/password
DATABASE_URL=postgresql://trackdash_app:<password-you-just-set>@<host>:<port>/postgres
```

Leave `MIGRATION_DATABASE_URL` as the original privileged `postgres`
connection — future migrations (`pnpm db:migrate`) need it, and
`trackdash_app` deliberately cannot run DDL.

Restart the dev server after changing `.env.local`.

### Why `authenticated` needs its own GRANTs even though RLS is enabled

This tripped up the first production deploy, so it's worth stating
plainly: **RLS policies and PostgreSQL's ordinary GRANT system are two
separate gates, checked in order.** A `GRANT SELECT/INSERT/UPDATE/DELETE`
decides whether a role may touch a table *at all*; RLS policies then
decide which *rows* it may see or affect within whatever the GRANT
allows. Having correct RLS policies (migration 0001) does not, by itself,
let `authenticated` touch a table — that role also needs its own direct
GRANT (migration 0005), independent of any policy.

This matters specifically because of how `lib/db/rls.ts`'s
`withUserContext()` works: it runs `SET LOCAL ROLE authenticated` so RLS
policies scoped `TO authenticated` apply — but `SET ROLE` doesn't just
help satisfy a policy's `TO` clause, it *switches which role's grants are
checked* for the rest of the transaction. `trackdash_app`'s own grants
stop applying the moment the role switches; `authenticated`'s own grants
are what's checked from that point on. Migration 0004 only granted
privileges to `trackdash_app` — the first real request that went through
`withUserContext()` in production failed with `permission denied for
table profiles (42501)` as a direct result. Migration 0005 fixes this by
giving `authenticated` (and `anon`, for public reads) their own explicit,
table-by-table grants.

### RLS does not protect TRUNCATE — and why 0005 revokes before it grants

A second, separate issue surfaced during production verification, after
the GRANT fix above: `authenticated` could still run `TRUNCATE` on
`public.profiles`, and `anon` could `TRUNCATE` on `public.products`. This
is not a bug in this project's RLS policies — **PostgreSQL's Row-Level
Security simply does not apply to `TRUNCATE`** (or `REFERENCES` or
`TRIGGER`, or `MAINTAIN` on newer Postgres). Those are separate
privileges, checked purely by the ordinary GRANT system, with no policy
evaluation involved at all. A role holding `TRUNCATE` on a table can
empty it completely no matter how restrictive that table's RLS policies
are.

The reason `authenticated`/`anon` held it in the first place: every new
Supabase project sets up its own default-privilege rules (for the
`postgres` role) that automatically hand those roles broad privileges —
historically including `TRUNCATE`/`REFERENCES`/`TRIGGER` — on anything
`postgres` creates, which is exactly the role this project's migrations
run as. Simply adding new, narrower `GRANT`s on top (as migration 0005's
first draft did) doesn't remove what was already there. Migration 0005
now `REVOKE ALL` from `anon`/`authenticated` (tables and sequences,
including the default-privilege rule for future tables) *before*
granting back only the specific SELECT/INSERT/UPDATE/DELETE privileges
each one actually needs. `trackdash_app` inherits nothing dangerous as a
side effect: it's a member of both roles, so once they no longer hold
`TRUNCATE`, there's nothing left for it to inherit either.

**The result is fail-closed on two independent levels, not one:** a
brand-new table created by some future migration starts with (a) no
`anon`/`authenticated` privileges at all — see `ensure_rls` below for the
other half — and (b) RLS enabled with no policies, which denies all
access outright. Whichever migration introduces that table has to
explicitly `GRANT` the privileges it needs *and* define its own RLS
policies; neither happens automatically, on purpose.

### `ensure_rls` — RLS is enabled automatically on every new `public` table

Migration 0005 also versions an event trigger, `ensure_rls` (backed by
`public.rls_auto_enable()`), that fires on `ddl_command_end` and runs
`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on any table just created in
the `public` schema (`CREATE TABLE`, `CREATE TABLE AS`, or `SELECT
INTO` — nothing outside `public` is ever touched). This was originally
applied directly against production and is now captured as a proper,
re-creatable migration.

**Important: this does not create a policy.** A table with RLS enabled
and zero policies denies every row to every role except its owner and
roles with `BYPASSRLS` (`trackdash_app` is neither — see migration 0004).
So a new table is safe-by-default the moment it's created, but genuinely
usable by the app only once a later migration adds both RLS policies and
the explicit `anon`/`authenticated` grants described above — this trigger
guarantees nobody can accidentally ship a `public` table with RLS left
off; it doesn't do the rest of that work for you.

## 6. Verify the seed and the connection

```bash
pnpm dev
```

In a second terminal:

```bash
curl -s http://localhost:3000/api/dev/health | python3 -m json.tool
```

Expect:
```json
{
  "checks": {
    "env": { "...": true },
    "database": { "connected": true },
    "catalog": { "accessible": true, "productCount": 36 },
    "supabaseAuth": { "reachable": true, "hasSession": false },
    "currentUser": null
  }
}
```

If `database.connected` is `false`, check `DATABASE_URL` (host/port/password,
and that `trackdash_app`'s password was actually set in step 5). If
`catalog.productCount` isn't `36`, migration 0003 didn't apply — re-run
`pnpm db:migrate`. This endpoint only exists in development (`NODE_ENV !==
"production"`) and never returns secrets — see `app/api/dev/health/route.ts`.

## 7. Register two test users

Open `http://localhost:3000/signup` in two different browser profiles (or
one normal + one incognito window, so sessions don't collide) and register:

- **User A** — any email/password you control, e.g. `a@example.com`
- **User B** — a second one, e.g. `b@example.com`

If your project has "Confirm email" enabled (Supabase's default), you'll
land on a "check your email" screen instead of being signed in immediately
— confirm via the email Supabase sends (check **Authentication → Users**
in the dashboard if using a test inbox you don't fully control) before
continuing.

After both are confirmed and signed in at least once, verify in the
dashboard under **Table Editor → profiles** that two rows exist, with
`username` matching what you entered at sign-up (or an auto-generated
fallback — see migration 0002's comments for when that happens).

## 8. Collection / wishlist functional test

As **User A**:

1. Go to `/catalog`, open any model, **Add to collection** — fill in
   condition, acquisition date/price/currency, notes, submit.
2. Go to `/collection` — the item should appear.
3. Edit it (condition, price, notes) via the pencil icon — confirm the
   change sticks after the dialog closes.
4. **Refresh the page** — the item and your edit must still be there
   (this is the real test: it's coming from Postgres, not `localStorage`).
5. Add a second item to **wishlist** from a different model's page.
6. Go to `/wishlist` — confirm it's there; try **"I got it"** to move it
   into the collection, and remove-from-wishlist on another item.
7. **Log out, log back in** — collection and wishlist must both still
   show exactly what you left them with.

Repeat with **User B**, adding *different* items than User A did.

## 9. Verify data isolation (RLS)

Two layers to check — the app should already enforce isolation via
explicit `userId` filters in every query (`lib/db/queries/collection.ts`,
`wishlist.ts`), but the point of RLS is that it protects the data even if
that application-level filter had a bug. Test both.

### 9a. Application-level

While signed in as **User A**, User A's `/collection` and `/wishlist`
pages must only ever show User A's items — confirm visually after step 8.
There is no UI path to view another user's collection (no such route
exists), so this is mostly confirmed by construction, but worth a look at
the Network tab: the `getMyCollectionAction`/`getMyWishlistAction` calls
should never include a `userId` in their request payload (there isn't one
to see — the server derives it from the session, not from anything the
client sends).

### 9b. RLS-level (the real test)

This is the important one: it proves the database itself refuses to leak
data, independent of the app's code. Run this in the Supabase **SQL
Editor** (which connects as the privileged `postgres` role by default —
these `set role`/`set_config` calls temporarily impersonate a specific
app user for the current session, the same mechanism `lib/db/rls.ts`'s
`withUserContext()` uses per-request).

First, find both users' ids: **Authentication → Users** in the dashboard,
or:

```sql
select id, email from auth.users order by created_at;
```

Then, impersonating **User A** (replace the uuid):

```sql
set role authenticated;
select set_config('request.jwt.claim.sub', '<user-a-id>', true);

-- Should return ONLY User A's rows:
select id, user_id, product_id from collection_items;
select id, user_id, product_id from wishlist_items;

-- Adversarial test: try to read/modify User B's row directly by id.
-- Replace <user-b-collection-item-id> with an id you saw in step 8 for
-- User B (find it as postgres first: reset role; select id, user_id from
-- collection_items;  -- then `set role authenticated` + impersonate A again).
select * from collection_items where id = '<user-b-collection-item-id>';
-- Expected: 0 rows — RLS hides it, even though the id is valid and exists.

update collection_items set notes = 'rls-test' where id = '<user-b-collection-item-id>';
-- Expected: UPDATE 0 — no row matched, because the USING clause hid it.

reset role;
```

If either adversarial query returns/affects a row, **stop** — that means
RLS is not actually protecting that table (most likely `DATABASE_URL` or
this SQL Editor session is running as a role with `BYPASSRLS`, or a policy
is missing/misconfigured) and it's worth treating as a real, architectural
problem rather than continuing to the next step.

Repeat the whole 9b block impersonating **User B**'s id, confirming the
mirror image (only B's rows, zero access to A's).

## 10. Deploying to Vercel

A few things that only surface once this runs on Vercel rather than
locally, learned from the real deploy:

**Use the Transaction pooler, not the Session pooler or the direct
connection, for `DATABASE_URL`.** Vercel's serverless functions open a
new database connection per invocation rather than holding one open like
a long-running `pnpm dev` process — the direct connection (IPv6-only on
most projects, and not meant for high connection churn) and the Session
pooler (one persistent server-side connection per client, quickly
exhausted by serverless) both work poorly under that pattern. Get the
right string from **Supabase Dashboard → Connect → Transaction pooler**
(port `6543`) — don't hand-construct it from a remembered host pattern;
the pooler hostname is project/region-specific and Supabase's own
infrastructure has changed pooler routing before. Copy it from the
dashboard every time, not from memory or an old note.

**Prepared statements must stay disabled** — already the case in
`lib/db/index.ts` (`postgres(connectionString, { prepare: false })`).
Transaction-mode pooling (Supavisor) doesn't guarantee the same backend
Postgres connection across statements, so server-side prepared statements
(which are backend-connection-scoped) silently break. Don't remove that
option when touching this file.

**Configure Supabase Auth's URL settings for the production domain** —
**Authentication → URL Configuration**:
- **Site URL**: the production domain (e.g. `https://trackdash.vercel.app`
  or a custom domain), not `localhost`. This is what's used to build
  links in confirmation/reset emails.
- **Redirect URLs**: add the production domain here too. Supabase Auth
  rejects redirects to any URL not on this list — sign-up confirmation
  links will otherwise fail after deployment even though they work
  locally.
- `http://localhost:3000` can stay in Redirect URLs alongside the
  production one — you don't need to remove it for local development to
  keep working.

## 11. What "done" looks like

- `/api/dev/health` shows `database.connected: true`, `catalog.productCount: 36`.
- Both test users can add/edit/remove collection and wishlist items, with
  changes surviving refresh and logout/login.
- Section 9b's adversarial queries return zero rows/zero affected rows in
  both directions.

At that point TrackDash is genuinely connected to a real, verified
Supabase backend — not just "correct by construction" as it was at the
end of Step 4B.

---

## Regenerating the catalog seed

If you add new entries to `SEEDS` in `lib/data/products.ts`:

```bash
pnpm db:seed:generate
pnpm db:migrate
```

The first command regenerates `supabase/migrations/0003_seed_initial_catalog.sql`
from the current `lib/data/products.ts` (see that script's own header
comment for how). Existing rows are untouched (`ON CONFLICT (id) DO
NOTHING`) — only genuinely new products/releases get inserted. Ids are
deterministic (`lib/data/stable-id.ts`), so re-running this never changes
an id that already exists in a live database.
