# eBay Browse integration

Browse supplies ACTIVE ASKING listings only. Marketplace Insights is not implemented.
Verified SOLD observations continue through the existing manual Product Research flow.
R3 formulas and database schema are unchanged by this integration preparation.

## Environment and credentials

Use server-side variables `EBAY_ENV`, `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`.
`EBAY_ENV` accepts only `sandbox` and `production`; missing means sandbox.
Existing Production installations must explicitly set `EBAY_ENV=production` with
Production keys before the worker can run. Never prefix these variables with NEXT_PUBLIC.

| Environment | OAuth host | Browse host | Market worker |
| --- | --- | --- | --- |
| sandbox | api.sandbox.ebay.com | api.sandbox.ebay.com | Blocked before database access |
| production | api.ebay.com | api.ebay.com | Existing active-offer pipeline |

OAuth uses `/identity/v1/oauth2/token`, Client Credentials and only
`https://api.ebay.com/oauth/api_scope`. Browse uses `/buy/browse/v1/item_summary/search`.
Token cache is keyed by environment and credentials. Redirects are refused. Error
bodies, authorization headers and token responses must never be logged.

Keep Sandbox credentials in a local environment or Vercel Development only. Do not
add them to all Preview branches: older branches still use Production-only endpoints.
Do not put any secrets into source control, command arguments, reports or screenshots.
Enter them directly in the destination's secure environment-variable UI.

The first API test must use the standalone script, not the cron or market worker.
The worker writes candidates and offer states and invokes the existing R3 recomputation.
The test script imports only the adapter, never Supabase or R3, and cannot persist data.

## One Release technical check

After securely setting the environment in the process, run:

```
node --experimental-strip-types scripts/check-ebay-browse.mjs
```

The script searches only 95467, up to five parsed listings per marketplace (IT, DE,
GB, US), without pagination or retries. The existing catalog must still identify this
Item Number as unique before using it for a real Production test. Classification
counts are preliminary adapter decisions; they do not imply approval by the worker's
independent price guard. No results are imported. Sandbox results are synthetic.

Shipping zero is retained as zero. Missing or mismatched shipping currency is unknown.
The requested marketplace is not the seller's country. Deduplication uses eBay itemId;
when the same item occurs on multiple marketplaces the first observation is retained.
Shared Item Numbers are quarantined by the worker's database sibling lookup, even if
a title mentions an edition. Parts filtering remains a conservative English-term
heuristic and matching must be manually inspected before enabling real ingestion.

## Account verification on 2026-09-15

TrackDash Sandbox keyset creation was confirmed in the Developer portal. App ID and
Cert ID labels are present. No Production keyset was present; the portal offered to
create one. Production Browse is not verified.

The Sandbox scopes dialog grants base public-data scope and several Buy scopes,
including `buy.item.feed`, `buy.marketing`, `buy.product.feed`, `buy.item.bulk`,
`buy.deal`, and `buy.marketplace.insights`, plus order-related scopes that this adapter
must not request. eBay explicitly warns Sandbox scopes do not imply Production access.

The public support table calls Marketplace Insights restricted and not open to new
users. Its overview returned 404 for this authenticated account. The Sandbox scope
alone does not establish working Insights endpoints, live SOLD access, account rate
limits or history windows. These remain unverified; do not implement Insights or
claim a three-year API history based on manual Product Research capabilities.

References:
- https://developer.ebay.com/develop/guides/sell/authorization
- https://developer.ebay.com/api-docs/buy/static/ref-marketplace-supported.html
