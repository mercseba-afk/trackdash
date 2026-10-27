// Public source overlay only; credentials stay inside Vercel Secret bindings.
import fs from 'node:fs'
import crypto from 'node:crypto'
import zlib from 'node:zlib'
import { execFileSync } from 'node:child_process'

const base = '3db96bd67a706fb507b41ce6d743296521782206'
const paths = ['components/screens/update-password-screen.tsx', 'package.json',
  'scripts/test-password-recovery-mfa.mjs', 'next.config.mjs', 'tools/prod-ca-2021.crt',
  'scripts/recovery/ebay-worker-execute-canary.mjs', 'lib/ebay/account-deletion-diagnostics.ts',
  'app/api/ebay/marketplace-account-deletion/route.ts', 'scripts/test-ebay-account-deletion.mjs']
const hash = text => crypto.createHash('sha256').update(text).digest('hex')
const entries = paths.map(path => {
  let previous = null
  try { previous = execFileSync('git', ['show', `${base}:${path}`], {stdio:['ignore','pipe','ignore']}).toString() } catch {}
  return {path, expected:previous === null ? null : hash(previous), content:fs.readFileSync(path,'utf8')}
})
const script = `
const fs = require('node:fs'), crypto = require('node:crypto'), path = require('node:path');
const {spawnSync} = require('node:child_process');
if(process.env.VERCEL_ENV !== 'production') throw Error('PRODUCTION_REQUIRED');
if(process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://uhojhqxnzrolmnopwgpy.supabase.co') throw Error('TARGET_PROJECT_REQUIRED');
const db = new URL(process.env.DATABASE_URL || 'https://invalid');
if(db.hostname !== 'aws-1-eu-central-1.pooler.supabase.com' || db.port !== '6543' ||
 !decodeURIComponent(db.username).endsWith('.uhojhqxnzrolmnopwgpy') ||
 db.searchParams.get('sslmode') !== 'verify-full') throw Error('VERIFIED_FRANKFURT_POOLER_REQUIRED');
if(process.env.SUPABASE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw Error('TARGET_ADMIN_BINDING_REQUIRED');
for(const name of ['CRON_SECRET','EBAY_CLIENT_ID','EBAY_CLIENT_SECRET','EBAY_MARKETPLACE_DELETION_TOKEN'])
 if(!process.env[name]) throw Error('REQUIRED_SERVER_BINDING_MISSING');
const oneScan = process.env.TRACKDASH_CUTOVER_RUN_ONE_SCAN === 'yes';
if(process.env.EBAY_ENV !== 'production' || process.env.EBAY_MARKET_WRITES_ENABLED !== 'true') throw Error('CONTROLLED_EBAY_WRITES_REQUIRED');
if(process.env.EBAY_MARKETPLACE_DELETION_ENDPOINT !== 'https://trackdash-dusky.vercel.app/api/ebay/marketplace-account-deletion') throw Error('REGISTERED_WEBHOOK_REQUIRED');
for(const entry of ${JSON.stringify(entries)}) {
 const actual = fs.existsSync(entry.path) ? crypto.createHash('sha256').update(fs.readFileSync(entry.path)).digest('hex') : null;
 if(actual !== entry.expected) throw Error('REVIEWED_BASE_MISMATCH:' + entry.path);
 fs.mkdirSync(path.dirname(entry.path),{recursive:true}); fs.writeFileSync(entry.path,entry.content);
}
if(new crypto.X509Certificate(fs.readFileSync('tools/prod-ca-2021.crt')).fingerprint256 !==
 '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA') throw Error('CA_MISMATCH');
for(const command of ['verify', ...(oneScan ? ['recovery-one-scan'] : []), 'build']) {
 const executable = command === 'recovery-one-scan' ? 'node' : 'pnpm';
 const args = command === 'recovery-one-scan' ? ['scripts/recovery/ebay-worker-execute-canary.mjs'] : [command];
 const result = spawnSync(executable,args,{stdio:'inherit',env:{...process.env,NODE_EXTRA_CA_CERTS:path.resolve('tools/prod-ca-2021.crt')}});
 if(result.error || result.status !== 0) process.exit(result.status || 1);
}
console.log(oneScan ? 'Controlled single-scan recovery build completed; no recurring scheduler started.' : 'Verified Frankfurt build completed; no scanner was invoked by this build.');
`
console.log(JSON.stringify({
  buildCommand:"node -e \"eval(require('node:zlib').gunzipSync(Buffer.from(process.env.TRACKDASH_PRODUCTION_RECOVERY_GZIP_B64,'base64')).toString())\"",
  overlaySha256:hash(script),
  files:entries.map(e=>({path:e.path,sha256:hash(e.content)})),
  config:{key:'TRACKDASH_PRODUCTION_RECOVERY_GZIP_B64',value:zlib.gzipSync(script).toString('base64'),type:'plain',target:['production']}
}))
