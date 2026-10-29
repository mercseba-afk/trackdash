# Market highlights freshness — 29 October 2026

The dashboard kept highlighting #95525 and #95467 because they were the only
positive persistent collector trends with a canonical Market Value. Their
confirmation dates were 11 and 10 September; later recomputations preserved
those historical events. Recent scans updated asking quotes, not SOLD growth.

The read-only editorial layer now requires collector growth to have a valid
confirmation date within 30 days. The persistent engine and release history
remain intact. Dashboard, public-home previews and Market use the same freshness
helper; recalculating a signal cannot renew its growth confirmation date.

The dashboard has a separate Latest price checks block. It selects current
representative asking quotes (15 days) or current canonical quotes under the
existing marketplace/retail freshness windows (15/31 days), respecting snapshot
expiry, real observation dates, provenance and shipping qualifiers. Rows rank by
observation date and keep distinct families. Historical asks and future/invalid
dates are excluded. These are checks, not claims of price increases or sales.
The public-home carousel prioritizes the same recently checked quotes and labels
their price basis and observation date explicitly.

Validation: full repository verify, TypeScript, and nine targeted regression and
React rendering checks across Italian and English. They cover preserved history,
stale growth despite a fresh computedAt, missing/future/invalid dates, current
extra-EU quotes, snapshot expiry, historical-only asks, retail/marketplace TTLs,
chronological selection, distinct families and all three presentation surfaces.
No schema, valuation thresholds, scanner schedule or daily limits change.

## Highest asking prices and product copy

The Highest asks block previously sorted the Europe-first canonical purchasing
quote and excluded families already in Growth. This could omit higher asking
quotes available on the Release page. It now ranks the same fresh representative
asking projection used by Latest price checks, with canonical fallback, by price
descending. Dates, seller-sample labels and origin remain attached to the selected
quote. Independent blocks keep their own rankings and one row per family.

Regression coverage checks ordering by the displayed quote, reordered results
after a price change, expired offers, distinct families and a Growth family
remaining eligible for Highest asks. Market subtitles use concise positive copy,
such as “Quotazioni verificate di recente e movimenti confermati.” Evidence type,
provenance and dates remain in the row labels.
