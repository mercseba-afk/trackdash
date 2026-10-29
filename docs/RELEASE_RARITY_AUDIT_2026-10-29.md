# Release rarity audit — first pass, 2026-10-29

## Published follow-up batch

At 2026-10-29 10:58:03 Europe/Rome, applied 24 individually reviewed labels to
previously unassigned exact releases: 7 Common and 17 Uncommon. Evidence and
per-release reasons are in `RELEASE_RARITY_ASSESSMENTS_2026-10-29.json`; guarded
DML is in `scripts/sql/release-rarity-reviewed-2026-10-29.sql`.

The baseline inventory below is preserved as the pre-change audit. Current
coverage is 144/205 (70.2%): Common 17, Uncommon 48, Rare 63, Very Rare 16,
unassigned 61. The 120 pre-existing labels were not re-certified by this batch.
The remaining 61 are listed in the assessment file; no generic Common fallback
was introduced, and no new Rare/Very Rare labels were inferred from missing data.

Validation: rollback-only dry run passed, then production transaction updated
24/24 exact natural-key matches. It asserted that all non-rarity release fields
(except `updated_at`) and every pre-existing rarity label stayed unchanged.
Independent post-write query verified 24/24 classifications. No scanner calls,
budget increases, deployment or UI additions were needed.

The exact manufacturer product pages plus Tamiya's product-category definition
support special/intermittent distribution, not a manufacturer-certified rarity
grade. The editorial Common assessment for special item 95336 explicitly gives
weight to broad current supply (12 distinct verified sellers) rather than
automatically calling all special or discontinued products scarce.

Additional primary findings retained for further review: Urawa Reds' own launch
announcement documents 800 Hotshot units; Gakken's launch announcement documents
5,000 Hornet Tanahashi units. These do not by themselves satisfy the currently
agreed sustained-scarcity policy for a new Rare/Very Rare label. Likewise the
2019 Modelers Gallery planned sale allocation of 1,440 Avante Black Special kits
must not be misreported as global lifetime production, or attributed to the
2021 commercial reissue sharing item 95501.

Primary references:

- https://www.tamiya.com/japan/products/definition/index.html
- https://www.urawa-reds.co.jp/clubinfo/203696.html
- https://prtimes.jp/main/html/rd/p/000001951.000002535.html
- https://www.tamiya.com/japan/newstopics/2019/06/gallery2019.html

---

Read-only inventory against Frankfurt production. No rarity labels, price data,
scan queues or scanner budgets were changed. Scope: public Tamiya releases,
excluding research-only releases, archived families and coming-soon families.

## Inventory

| Stored rarity | Releases | With offer-history rows | With catalog sources |
| --- | ---: | ---: | ---: |
| Common | 10 | 10 | 10 |
| Uncommon | 31 | 23 | 31 |
| Rare | 63 | 8 | 63 |
| Very Rare | 16 | 1 | 16 |
| Unassigned | 85 | 32 | 85 |

All 205 releases have catalog sources. None has `rarity` explicitly listed in a
source's `verified_fields`. This is a provenance gap, not proof that every label
is wrong or that source notes contain no useful distribution evidence.

None meets even the preliminary offer-history screen of three distinct dates,
two source IDs and a 90-day span. That screen alone would not establish scarcity:
coverage, exact edition, condition, independent sellers and historical
distribution documentation must also be checked. Offer-history rows record
changes/observations and must not be interpreted as a complete stock census.

## First review batch: the 16 Very Rare releases

| Item | Edition | Individual sale points | Attributed sale aggregates |
| --- | --- | ---: | ---: |
| 18009 | Thunder Shot Jr. TKC Nuremberg 1999 Custom | 0 | 0 |
| 18009 | Thunder Shot Jr. Shonen Jump 20th Anniversary Prize Version | 0 | 0 |
| 18014 | Avante Jr. original | 1 | 0 |
| 19201 | Dyna-Hawk GX | 0 | 1 |
| 19401 | Magnum Saber original | 2 | 0 |
| 19402 | Sonic Saber 1994 Original | 0 | 0 |
| 92078 | Thunder Shot Jr. TKC Version 1992 | 0 | 0 |
| 92207 | Avante Mk.III Azure Evangelion Unit-01 | 1 | 0 |
| 92218 | Avante Mk.III Azure Evangelion Awakening | 1 | 0 |
| 92219 | Avante Mk.III Azure Rakuten Home Color | 0 | 0 |
| 92221 | Avante Mk.III Azure Mr. Carrasco | 0 | 0 |
| 92284 | Avante Mk.III Nero STARGEK 10th Anniversary | 0 | 0 |
| 92430 | Avante Mk.III Azure Plamodel Factory Hong Kong | 0 | 1 |
| 93001 | Avante Jr. Champion's Gold | 0 | 1 |
| — | Manta Ray Mk.II Black Metallic Special | 0 | 0 |
| — | Manta Ray Mk.II Pink Metallic Special | 0 | 0 |

Sale points are rows in `price_points`; aggregates have attribution
`release_exact` or `release_matched`. These are evidence-row counts, not summed
sales volumes, and neither measure independently establishes rarity.

## Source review completed for four priority originals

- **Avante Jr. 18014:** existing Tamiya sources establish original 1988 identity
  and Type 2 chassis. A current 2024 reissue page provides historical context;
  it cannot establish the original edition's current scarcity.
- **Dyna-Hawk GX 19201:** existing Tamiya/HLJ sources establish identity, JAN,
  discontinued status and a later 2003 availability wave. Offer history has five
  observations on five dates, 2026-09-21 through 2026-10-24, from one source.
  This is insufficient for the new sustained-scarcity requirements.
- **Magnum Saber 19401:** four existing sources establish original identity,
  chassis, historical packaging and release date context. Current product
  imagery is explicitly unsuitable for proving 1994 packaging. None of the
  reviewed source records documents production quantity or sustained scarcity.
- **Sonic Saber 19402:** four existing sources establish original 1994 identity,
  chassis and JAN. Those identity facts do not substantiate Very Rare alone.

Outcome: these four labels need further evidence under the new policy. Do not
automatically retain them as certified, downgrade them to Rare, or clear them
just because the scanner has few results. Existing labels remain unchanged
pending individual decisions.

## Next work

1. Inspect distribution/production documentation for the remaining 12 special
   editions, prioritising prizes, event exclusives and physical variants.
2. Review existing sale evidence for exact original/reissue attribution and
   comparable condition, rather than using its price as a rarity proxy.
3. Make targeted research requests only where these source reviews leave gaps;
   preserve existing scanner limits and avoid a full-catalog rescan.
4. Record a per-release decision and supporting evidence before changing labels.

## UI release

Production UI commit `d0c519a134191a5b710165d97015139b09e3063a` includes the new
market headings/background and removal of both desktop-header Facebook icons.
Footer and sidebar social links remain. Vercel deployment:
`dpl_5x86KMDbz6nzyPHUSgAqiScDv9P5`. Local TypeScript and 19 market render/logic
checks passed. Check deployment status and public version before calling it live.
