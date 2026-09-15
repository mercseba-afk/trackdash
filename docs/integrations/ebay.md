# eBay Browse integration

Browse supplies ACTIVE ASKING listings only. Marketplace Insights is not implemented.
Verified SOLD observations continue through the existing manual Product Research flow.
R3 formulas and database schema are unchanged by this integration preparation.

## Environment and credentials

Use server-side variables `EBAY_ENV`, `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` and
`EBAY_MARKET_WRITES_ENABLED`. `EBAY_ENV` accepts only `sandbox` and `production`;
missing means sandbox. `EBAY_MARKET_WRITES_ENABLED` is fail-closed: only the exact
value `true` arms persistence, and only while `EBAY_ENV=production`.

Production also requires eBay Marketplace Account Deletion compliance. Configure
`EBAY_MARKETPLACE_DELETION_ENDPOINT` with the exact HTTPS callback URL and keep its
32–80 character `EBAY_MARKETPLACE_DELETION_TOKEN` server-side only. The callback
validates eBay's challenge, verifies signed notifications against eBay's public-key
API, removes matching eBay user identifiers from source evidence, and recomputes
only affected Release signals. It never enables market writes.
Processing a real deletion notification also requires the existing server-only
`SUPABASE_SECRET_KEY` (preferred) or `SUPABASE_SERVICE_ROLE_KEY`; the public anon key
is intentionally insufficient for this trusted backend operation.
Never prefix these variables with NEXT_PUBLIC.

| Environment | OAuth host | Browse host | Market worker |
| --- | --- | --- | --- |
| sandbox | api.sandbox.ebay.com | api.sandbox.ebay.com | Blocked before database access |
| production + writes false/unset | api.ebay.com | api.ebay.com | Blocked before database access |
| production + writes true | api.ebay.com | api.ebay.com | Existing active-offer pipeline |

OAuth uses `/identity/v1/oauth2/token`, Client Credentials and only
`https://api.ebay.com/oauth/api_scope`. Browse uses `/buy/browse/v1/item_summary/search`.
Token cache is keyed by environment and credentials. Redirects are refused. Error
bodies, authorization headers and token responses must never be logged.

Keep Sandbox credentials in a local environment or Vercel Development only. Do not
add them to all Preview branches: older branches may use different endpoint behavior.
Do not put any secrets into source control, command arguments, reports or screenshots.
Enter them directly in the destination's secure environment-variable UI.

Production onboarding is deliberately two-stage:
1. Configure Production App ID/Client ID and Cert ID/Client Secret with
   `EBAY_ENV=production` while keeping `EBAY_MARKET_WRITES_ENABLED=false`.
2. Run and manually inspect the standalone real-Browse check. Only after the returned
   listings are judged safe may `EBAY_MARKET_WRITES_ENABLED=true` be set and a new
   Production deployment created.

This separation prevents an existing cron schedule from beginning eBay persistence
merely because Production credentials have been added.

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

TrackDash Sandbox and Production keysets were confirmed in the Developer portal.
App ID and Cert ID labels are present in both environments. The Production keyset
is currently marked `Non Compliant` and remains disabled until the Marketplace
Account Deletion endpoint is registered and validated. Production Browse is
therefore not yet verified.

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
