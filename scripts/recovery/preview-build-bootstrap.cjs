// Deployment-local TLS packaging only. Does not edit GitHub or Production.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

if (process.env.VERCEL_ENV !== 'preview') throw new Error('Preview required');
if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://uhojhqxnzrolmnopwgpy.supabase.co') throw new Error('Unexpected target');
if (process.env.EBAY_MARKET_WRITES_ENABLED !== 'false') throw new Error('Scanner must remain disabled');
for (const name of ['CRON_SECRET', 'EBAY_CLIENT_SECRET', 'EBAY_CLIENT_ID', 'EBAY_MICROBATCH_SECRET', 'EBAY_MARKETPLACE_DELETION_TOKEN']) {
  if (process.env[name]) throw new Error('Production automation credential present: ' + name);
}
const pem = Buffer.from(process.env.TRACKDASH_PREVIEW_CA_B64 || '', 'base64');
const cert = new crypto.X509Certificate(pem);
if (cert.fingerprint256 !== '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA') throw new Error('Unexpected CA');
fs.mkdirSync('tools', { recursive: true });
fs.writeFileSync('tools/prod-ca-2021.crt', pem);
const config = fs.readFileSync('next.config.mjs', 'utf8');
const marker = 'const nextConfig = {';
if (config.split(marker).length !== 2 || config.includes('outputFileTracingIncludes')) throw new Error('Review tracing configuration');
fs.writeFileSync('next.config.mjs', config.replace(marker, marker + "\n  outputFileTracingIncludes: { '/*': ['./tools/prod-ca-2021.crt'] },"));
console.log('Preview TLS CA verified and included in server traces; scanners remain disabled.');
const result = spawnSync('pnpm', ['build'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_EXTRA_CA_CERTS: require('node:path').resolve('tools/prod-ca-2021.crt') },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
