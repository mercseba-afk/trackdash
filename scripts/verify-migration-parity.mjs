// Read-only, pre-test data parity gate. Never print credentials, rows or digests.
// Supply connection URLs through a protected environment, never CLI arguments.
import postgres from 'postgres';

const sourceRef = 'piwogtdkfozbiakyjnvk';
const targetRef = 'uhojhqxnzrolmnopwgpy';
const schemas = ['public', 'private', 'auth', 'storage', 'drizzle', 'supabase_migrations'];
const platformVersions = new Set([
  'auth.schema_migrations', 'storage.migrations',
]);

function connect(name, ref) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing protected environment variable: ${name}`);
  const url = new URL(value);
  const isDirect = url.hostname === `db.${ref}.supabase.co`;
  const isPooler = url.hostname.endsWith('.pooler.supabase.com') &&
    decodeURIComponent(url.username) === `postgres.${ref}`;
  if (!isDirect && !isPooler) throw new Error(`Wrong project endpoint in ${name}`);
  return postgres(value, {
    max: 1, prepare: false, fetch_types: false, ssl: 'verify-full',
    connect_timeout: 15, idle_timeout: 5,
    connection: { application_name: 'trackdash-migration-parity',
      default_transaction_read_only: 'on', statement_timeout: 60000 },
    onnotice: () => {},
  });
}

async function inventory(db) {
  return db.begin('isolation level repeatable read read only', async tx => {
    const tables = await tx`
      select n.nspname as schema, c.relname as name
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = any(${tx.array(schemas, 25)}::text[])
        and c.relkind in ('r', 'p') and not c.relispartition
      order by 1, 2`;
    const result = new Map();
    for (const table of tables) {
      const key = `${table.schema}.${table.name}`;
      if (platformVersions.has(key)) continue;
      const [data] = await tx`
        select count(*)::text as rows,
          md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text)::text, '[]')) as digest
        from ${tx(table.schema)}.${tx(table.name)} as t`;
      const columns = await tx`
        select a.attname, format_type(a.atttypid,a.atttypmod) as type,
          a.attnotnull, a.attidentity, a.attgenerated
        from pg_attribute a
        where a.attrelid = ${key}::regclass and a.attnum > 0 and not a.attisdropped
        order by a.attnum`;
      result.set(key, { ...data, columns: JSON.stringify(columns) });
    }
    const invalid = await tx`
      select count(*)::text as total from pg_index i
      join pg_class c on c.oid=i.indrelid
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname = any(${tx.array(schemas, 25)}::text[])
        and (not i.indisvalid or not i.indisready)`;
    return { tables: result, invalidIndexes: Number(invalid[0].total) };
  });
}

let source, target;
try {
  source = connect('TRACKDASH_SOURCE_DB_URL', sourceRef);
  target = connect('TRACKDASH_TARGET_DB_URL', targetRef);
  const [before, after] = await Promise.all([inventory(source), inventory(target)]);
  const failures = [];
  for (const key of new Set([...before.tables.keys(), ...after.tables.keys()])) {
    const a = before.tables.get(key), b = after.tables.get(key);
    if (!a || !b) failures.push({ table: key, reason: 'table missing' });
    else if (a.columns !== b.columns) failures.push({ table: key, reason: 'column definitions differ' });
    else if (a.rows !== b.rows || a.digest !== b.digest)
      failures.push({ table: key, reason: 'row contents differ' });
  }
  if (before.invalidIndexes || after.invalidIndexes)
    failures.push({ reason: 'invalid or unfinished indexes exist' });
  console.log(JSON.stringify({
    gate: 'database-row-parity-only', status: failures.length ? 'FAIL' : 'PASS',
    checkedTables: before.tables.size, failures,
    exclusions: [...platformVersions],
    limitations: 'Requires quiescent source and destination; separate snapshots are not a write freeze. Does not prove ACL/RLS/function/trigger/sequence/Storage-byte/configuration parity, decryptability or real Auth/email operation.',
  }, null, 2));
  process.exitCode = failures.length ? 1 : 0;
} catch (error) {
  // Driver errors can contain SQL, connection strings or private row contents.
  const safe = error instanceof Error && /^(Missing protected environment variable:|Wrong project endpoint in )/.test(error.message);
  console.error(safe ? error.message : 'Parity gate failed; private connection/query details suppressed.');
  process.exitCode = 1;
} finally {
  await Promise.allSettled([source?.end({ timeout: 5 }), target?.end({ timeout: 5 })]);
}
