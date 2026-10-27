import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
// Optional PostgreSQL WASM test runtime lives outside the application dependency
// tree. Production credentials are never accepted by this isolated fixture.
if (!process.env.PGLITE_TEST_MODULE) throw Error('Set PGLITE_TEST_MODULE to the isolated PostgreSQL test runtime')
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_TEST_MODULE).href)
const db = new PGlite()
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls; create role trackdash_app;
    create table public.price_sources(id uuid primary key, slug text);
    create table public.market_source_policies(source_id uuid, adapter_status text);
    create table public.market_scan_runs(started_at timestamptz, targets_attempted integer);
    create table public.market_scan_queue(id uuid primary key, release_id uuid, source_id uuid, scan_scope text, activity_tier text, priority integer, enabled boolean, next_scan_at timestamptz, locked_until timestamptz, last_attempt_at timestamptz, updated_at timestamptz);
    insert into public.price_sources values ('00000000-0000-0000-0000-000000000001','ebay_active_public');
    insert into public.market_source_policies values ('00000000-0000-0000-0000-000000000001','ready');
    insert into public.market_scan_runs values (now(),3);
    insert into public.market_scan_queue
    select md5(g::text)::uuid,md5(('r'||g)::text)::uuid,'00000000-0000-0000-0000-000000000001','active_marketplace','normal',100-g,true,now()-make_interval(days=>g),null,null,now()
    from generate_series(1,50) g;
  `)
  const migration = readdirSync(new URL('../supabase/migrations/', import.meta.url)).find(x => x.endsWith('_bounded_ebay_daily_allowance.sql'))
  await db.exec(readFileSync(new URL('../supabase/migrations/'+migration, import.meta.url),'utf8'))
  const q = async sql => (await db.query(sql)).rows
  assert.equal((await q('select attempts_reserved from market_ebay_scan_daily_budget'))[0].attempts_reserved,3)
  const first = await q('select * from trackdash_claim_ebay_active_jobs(4,10)')
  assert.equal(first.length,4)
  const expected = await q("select md5(g::text)::uuid as id from generate_series(47,50) g order by g desc")
  assert.deepEqual(first.map(x=>x.job_id), expected.map(x=>x.id))
  // A failed/abandoned claim consumes allowance even if no scan run was saved.
  assert.equal((await q('select attempts_reserved from market_ebay_scan_daily_budget'))[0].attempts_reserved,7)
  await db.exec("update market_scan_queue set locked_until=null where last_attempt_at is not null")
  const groups = await Promise.all(Array.from({length:10},()=>q('select * from trackdash_claim_ebay_active_jobs(4,10)')))
  const claimed = [...first,...groups.flat()]
  assert.equal(claimed.length,21)
  assert.equal(new Set(claimed.map(x=>x.job_id)).size,21)
  assert.equal((await q('select attempts_reserved from market_ebay_scan_daily_budget'))[0].attempts_reserved,24)
  assert.equal((await q('select * from trackdash_claim_ebay_active_jobs(999,10)')).length,0)
  assert.equal((await q("select has_function_privilege('anon','trackdash_claim_ebay_active_jobs(integer,integer)','EXECUTE') as allowed"))[0].allowed,false)
  assert.equal((await q("select has_function_privilege('authenticated','trackdash_claim_ebay_active_jobs(integer,integer)','EXECUTE') as allowed"))[0].allowed,false)
  assert.equal((await q("select has_function_privilege('service_role','trackdash_claim_ebay_active_jobs(integer,integer)','EXECUTE') as allowed"))[0].allowed,true)
  assert.equal((await q("select has_table_privilege('anon','market_ebay_scan_daily_budget','SELECT') as allowed"))[0].allowed,false)
  assert.equal((await q("select relrowsecurity as enabled from pg_class where oid='market_ebay_scan_daily_budget'::regclass"))[0].enabled,true)
  // No due job consumes no allowance; a fresh Rome date gets a fresh budget.
  await db.exec("update market_ebay_scan_daily_budget set budget_day=budget_day-1; update market_scan_queue set next_scan_at=now()+interval '7 days',locked_until=null;")
  assert.equal((await q('select * from trackdash_claim_ebay_active_jobs(4,10)')).length,0)
  assert.equal((await q("select attempts_reserved from market_ebay_scan_daily_budget where budget_day=(now() at time zone 'Europe/Rome')::date"))[0].attempts_reserved,0)
  const dst=await q("select ('2026-10-25 00:30:00+00'::timestamptz at time zone 'Europe/Rome')::date::text as a, ('2026-10-25 01:30:00+00'::timestamptz at time zone 'Europe/Rome')::date::text as b")
  assert.equal(dst[0].a,dst[0].b)
  console.log('PASS: conservative seed, oldest-first, 24-attempt ceiling, abandoned claims charged, shared allowance, no duplicate jobs, RLS/ACL, empty queue, new day and DST')
} finally { await db.close() }
