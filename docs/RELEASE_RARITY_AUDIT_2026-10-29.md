# Release rarity audit — first pass, 2026-10-29

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
