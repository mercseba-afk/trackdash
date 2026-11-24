# Amazon Italy affiliate expansion — 2026-11-24

Scope: 13 additional Mini 4WD release mappings; 8 existing mappings retained (21 total).
Final parent-family gate check: 10 new mappings are publicly visible (18 total
public links). Great Emperor18075, Hurricane Sonic19415 and Vanguard Sonic19435
still have parent launch_status=coming_soon; their 3 mappings are prepared but
not displayed. No family launch state was changed.
Owner-approved affiliate ID trackdash-21. Direct product links use the existing
IT/EN disclosure and sponsored link attributes. No prices, availability promises,
images or reviews are copied into the catalog. Existing market calculations,
Amazon daily 2-ASIN allowlist, queues and cron schedules are unchanged.

Discovery: ScraperAPI Amazon Search v1, country_code=it,tld=it, four queries:
Tamiya Mini 4wd; Tamiya Magnum; Tamiya DCR; Tamiya Sonic. Dedicated Product v1
checks for Mach Frame and Magnum Saber. Each request displayed base5 credits;
six requests => maximum30 discovery credits (no premium/render flags).
Dashboard displayed4945 credits remaining after reload; counters may settle later.
No recurring jobs were created by this expansion.

All added release rows were confirmed catalog_visibility=public and matched by exact
Tamiya code + edition/chassis name. Product number reused across distinct
editions is insufficient by itself. Existing release IDs were used without
creating or publishing families.

| Release | Item | ASIN | Identity evidence |
|---|---|---|---|
| Dash-1 Emperor Premium | 18069 | B086CFGY15 | search exact title |
| Dash-1 Emperor (MS Chassis) | 18625 | B086CJVCSJ | search exact title |
| Dash-3 Shooting Star — 2008 MS Chassis | 18630 | B086CDXNCZ | search exact title |
| Dash-2 Burning Sun — 2008 MS Chassis | 18628 | B086CJG31D | search exact title |
| Great Emperor Premium | 18075 | B086CDY3C3 | search exact title |
| Hotshot Jr. — MS Chassis | 18624 | B086CDX4T6 | search exact title |
| Aero Thunder Shot (AR Chassis) | 18702 | B086CDYQ2Z | search exact title |
| Mach Frame | 18714 | B07MM3WLBB | search + product title exact |
| Hurricane Sonic | 19415 | B014W8VPJU | search exact title |
| Cyclone Magnum Premium | 19440 | B07YV48TMG | search exact title |
| Victory Magnum Premium | 19434 | B07YV3Y9WZ | search exact title |
| Vanguard Sonic (Super II) | 19435 | B085RZDQ7B | search exact title |
| Magnum Saber Premium | 19431 | B0044BCLDK | product manufacturer_part_number 19431, model_number 19431-000 |

Excluded: DCR-01 B0DDPLY4PZ described as Compatible with; body-only DCR result;
18025 ambiguous original/reissue; 18074 search title lacking code and reuse
across standard/Sanfrecce; generic compatible listings; kits absent from catalog;
secondary ASINs for already-linked editions. No negative market evidence inferred.
Magnum Saber product metadata contained obvious unrelated specification noise;
only explicit manufacturer_part_number19431/model_number19431-000 was used.
Catalog specifications were not overwritten.

Validation: TypeScript, 21 unique valid ASIN mappings, exact trackdash-21 tags,
unmapped DCR remains unlinked. Full repository verification passed. Deployed5a233ae9c7aef281166a6f53f91701475243b8d0
was verified on /api/version and Vercel Ready. Public Mach Frame page shows the
exact B07MM3WLBB URL with trackdash-21 and disclosure. Final HTTP checks cover
all10 publicly available releases and preserve all3 coming-soon family gates.
