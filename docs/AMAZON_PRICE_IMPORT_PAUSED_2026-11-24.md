# Amazon price import — suspended by owner, 2026-11-24

## Decision

Sebastiano approved pausing Amazon price imports and requested that the reason
and resumption path be retained for future work. Keep affiliate purchase buttons
active. This is a data-use/affiliate-program review hold, not a technical inability
to retrieve Amazon or an exhausted free quota.

## Applied operational state

- amazon_it_public source is_active=false.
- Its two market_scan_queue rows enabled=false.
- Its market_scan_endpoints rows enabled=false with operatorPause audit metadata.
- market_source_policies.include_by_default=false prevents default enrollment.
- Existing ASIN mappings, scanner adapter, saved observations and job history are
  retained; no catalog releases, other sources, quotes or user records deleted.
- Historical observations were not rewritten. Normal evidence expiry still applies;
  pausing collection is not a claim that old observations are new checks.
- Affiliate tag trackdash-21 and 18 public purchase buttons remain unchanged;
  three further mappings belong to coming-soon families and remain gated.
- No cron, deployment, paid subscription or additional provider request is needed
  for this pause. eBay and other retail scanners are unaffected.

## Before any future resumption

Require a new owner instruction; do not auto-enable the source when publishing
families or adding affiliate buttons. Review current Amazon Associates data-use
rules, official API eligibility and permissions for aggregated valuations; reading
prices technically through ScraperAPI does not itself establish publication rights.
Do not assert official API access or permission for aggregation without verification.
Reference official current documentation:
https://programma-affiliazione.amazon.it/help/operating/linking
https://programma-affiliazione.amazon.it/help/operating/policies
https://programma-affiliazione.amazon.it/creatorsapi/docs/en-us/introduction

At pause time the official Creators API documentation stated10 qualifying sales
in the past30 days for product API access; aggregation/analysis has additional
permission requirements. Recheck these conditions rather than relying on this
snapshot.

The existing proven pilot binds18094/B083JYP59Y and95598/B08KR2LXCV.
If resuming, verify exact kit/edition, live new offers, EUR, actual shipping and
seller origin; never convert an asking price into a completed sale. Preserve
other release values and test the effect before publication.
Review the recurring free budget before expanding: the old2-ASIN daily pilot
was up to310 standard credits/31days at5/request. A weekly rotation was proposed
but NEVER implemented or enabled. Do not describe all affiliate-linked ASINs as
scanned. Keep no new cron and no paid plan without authorization.
