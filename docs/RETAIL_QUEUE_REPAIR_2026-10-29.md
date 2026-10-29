# Retail queue repair — 2026-10-29

## Diagnosis and production correction

The ready exact-page worker correctly requires enabled, independently verified
release endpoints. The default enrollment function nevertheless enabled retail
rows without endpoints, creating a misleading overdue backlog. There were no
stuck locks or accumulated failures: the nine configured iModellini/Pieroni jobs
were successful and scheduled for future checks.

Baseline across all verticals: iModellini 226 enabled rows without endpoints,
Pieroni 225. Mini4WD subset: 220 and 219 respectively. These were discovery gaps,
not 451 executable scans awaiting worker capacity.

Applied migration `20261029111838_require_verified_retail_endpoints_for_scan_enrollment`:

- New default retail target/queue rows are enabled only when an enabled,
  exact-release-verified endpoint exists for the same source and release.
- Existing endpointless rows are disabled and parked at the existing 2099
  sentinel. This does not record a scan failure or a false successful check.
- Re-enrollment cannot activate those placeholders. Valid schedules and manual
  pauses are preserved. Existing verified-endpoint registration explicitly
  enables its exact queue row once the page is approved.
- The eBay identity, eligibility, cadence, budget and conflict branches are
  preserved. A guarded patch verifies the full prior function hash and exact
  replacement counts, rather than replacing an unexpected function version.
- No public fields, prices, rarity labels, endpoint identity or source permissions
  are relaxed by the migration. Compatibility scan targets are parked as well.

The source-policy `include_by_default` setting is retained, so new releases keep
their pending discovery records rather than losing retailer coverage tracking.

## New verified endpoint and real worker scan

Added Pieroni ITEM 18625, exact Dash-1 Emperor MS kit, using the unique current
catalog identity and the full product-page title/specification. The exact page
parser returned structured EUR 18, in stock, no warnings, auto-publishable.

https://www.pieronimodellismo.it/tamiya-18625-dash-1-emperor-telaio-ms-mini-4wd-5565.html

Reused the existing GitHub Actions workflow: run 40853254505, job 123431499965,
success. Canonical worker accepted the EUR 18 retail observation at
2026-10-29 12:55:57 Europe/Rome, updated the retail anchor to 18 and retail source
count to 1, and completed the queue successfully. Next scheduled check:
2026-11-26 12:55:59 Europe/Rome. Existing current starting quote remains EUR 17.49;
the new retailer observation is not a completed sale or an artificial value rise.

The newly linked job reduces the pending Mini4WD Pieroni endpoint count to 218.
Final configured jobs: iModellini 4, Pieroni 6; runnable overdue jobs 0. All-vertical
pending endpoint rows become 226 + 224; Mini4WD pending rows 220 + 218.

## Verification and limits

- Rollback-only SQL integration checks passed for new endpointless enrollment,
  repeated enrollment, preservation of valid future cadence and manual pauses.
  All fixture writes were rolled back. See `scripts/sql/test-retail-enrollment-regression.sql`.
- Production queries verified the migration, parked/enabled counts, successful
  canonical worker telemetry, accepted retail offer and updated retail signal.
- Security advisor categories/counts are unchanged from the pre-change baseline;
  enrollment execution grants/search path are unchanged.
- Existing automation, exact-page adapter and cron reliability tests were run.
- eBay reserved attempts remained 16/24. No additional scheduler, increased
  batch size, recurring request rate or Vercel deployment was introduced.

Catalog discovery fetched two public category pages outside Vercel. iModellini
had 72 cards and three purchasable-card candidates; Copperfang's exact endpoint
was already configured. Pieroni discovery shipping text is not reliable stock
proof; individual product pages are always checked before enrollment.

Proto-Emperor Premium 18074 is held for further identity review: its product
page reports regional GTIN 4950344063888 while the catalog stores
4950344180745, and another collector edition shares the item number. No price
was assigned to either sibling on the strength of item number alone.

The 438 remaining Mini4WD pending retailer links require product discovery and
exact identity verification. Parking the rows does not assert those shops stock
all releases, nor does it turn unavailable products into current prices.
