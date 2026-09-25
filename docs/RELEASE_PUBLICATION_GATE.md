# TrackDash — Release Publication Gate

Date: 2026-09-25

This is a permanent catalog rule for Mini 4WD and future collectible verticals.

## Core rule

A Release may exist in the canonical research database/master without being ready for the public catalog.

Public publication requires:

1. the Release identity is sufficiently verified; and
2. at least one of:
   - an EXACT VERIFIED or HIGH-CONFIDENCE MATCHED Release-specific image;
   - credible market evidence attributable to that exact Release.

A consolidated Market Value is **not** required for publication.

## Decision matrix

| Release identity | Exact/high-confidence image | Credible exact-release market evidence | Public catalog |
| --- | --- | --- | --- |
| verified | yes | yes | PUBLIC |
| verified | no | yes | PUBLIC — image remains a research target |
| verified | yes | no | PUBLIC — market remains under verification |
| verified | no | no | RESEARCH_ONLY |
| partial/unverified | any | any | do not publish until identity is sufficiently resolved |

`RESEARCH_ONLY` means:
- keep the row, sources, notes and research history;
- do not delete evidence;
- do not show the Release in public Catalog/Product/Release surfaces;
- keep it available for future audit and user-requested insertion;
- promote to `public` only after the missing publication evidence is verified.

## What counts as market evidence

A random or ambiguous listing is not sufficient.

Evidence must be attributable to the exact Release using defensible discriminants such as:
- Item Number/JAN;
- exact edition name;
- explicit reissue/anniversary/collaboration wording;
- packaging generation;
- chassis/color specification;
- reviewed exact-product imagery;
- another documented manual discriminator.

Accepted evidence can be:
- confirmed SOLD / awarded auction;
- credible exact-product retail sale or sold-out observation;
- valid current ASK clearly tied to the Release.

Market Value convergence is a separate, stricter requirement.

## Images

A missing image does not force a verified Release out of the catalog if credible market evidence exists.

A missing market signal does not force a verified Release out of the catalog if an exact/high-confidence Release image exists.

No sibling image may be used merely to pass this gate.

## Promotion / demotion

Publication visibility is stored independently from factual verification:

- `catalog_visibility = public`
- `catalog_visibility = research_only`

`verification_status` continues to describe factual identity confidence and must not be overloaded for publication readiness.

Do not automatically promote a research-only Release merely because an unattended matcher finds a listing. Promotion requires an audit that the new image/evidence really belongs to the exact Release.

## Family completion

A family audit may contain research-only candidate/verified Releases. They remain in the persistent audit/master but do not count as public Release cards until they pass this gate.

Completion reporting must distinguish:
- canonical/researched Release count;
- public Release count;
- research-only count;
- image gaps;
- market gaps.
