-- Neo-Tridagger ZMC Next Smoke granular SOLD FX normalization — 2026-09-24
-- Completes the exact Yahoo Auctions sale already persisted by migration 0158.
-- Sale date 2026-02-08 was a Sunday, so TrackDash uses the previous ECB
-- business-day reference rate: 2026-02-06 EUR 1 = JPY 185.27.
-- Source verification: Banca d'Italia official euro reference-rate page,
-- based on ECB daily reference rates.
--
-- JPY -> EUR factor = 1 / 185.27 = 0.005397527932207049
-- JPY 9,000 -> EUR 48.58.

begin;

update public.market_candidates
set review_notes='Exact Smoke Next closed Yahoo auction: unopened/unused, 21 bids. FX normalization completed with previous ECB business-day reference rate (2026-02-06 EUR 1 = JPY 185.27).',
    raw_payload=coalesce(raw_payload,'{}'::jsonb)
      || jsonb_build_object(
        'fx_pending',false,
        'fx_reference_date','2026-02-06',
        'eur_jpy_reference_rate',185.27,
        'fx_source','Banca d''Italia / ECB reference rate'
      ),
    updated_at=now()
where source_id='d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid
  and source_record_key='yahoo-auctions:neo-tridagger-92280:2026-02-08:9000'
  and resolved_release_id='19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid
  and decision='accepted';

insert into public.price_points (
  id,candidate_id,release_id,source_id,observation_type,condition,
  price,currency,shipping_cost,shipping_basis,valuation_price,normalized_price_eur,
  fx_rate_to_eur,fx_rate_date,inner_bags_sealed,box_condition,is_complete,is_lot,
  quantity,match_confidence,match_evidence,evidence_group_key,valuation_eligible,
  status,needs_revalidation,sold_at,sold_on,observed_at,evidence_grade,quality_flags,
  market_price_eur,market_price_basis
)
select
  gen_random_uuid(),c.id,c.resolved_release_id,c.source_id,'auction_awarded','new_complete_unbuilt',
  c.price,c.currency,null,'unknown',null,null,
  0.005397527932207049,date '2026-02-06',
  c.inner_bags_sealed,c.box_condition,true,false,
  1,c.match_confidence,c.match_evidence,c.evidence_group_key,true,
  'active',false,null,c.sold_on,c.observed_at,'indicative',
  array['shipping_unknown','box_condition_unknown','seller_unknown'],
  48.58,'raw_sale'
from public.market_candidates c
where c.source_id='d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid
  and c.source_record_key='yahoo-auctions:neo-tridagger-92280:2026-02-08:9000'
  and c.resolved_release_id='19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid
  and c.decision='accepted'
on conflict (candidate_id) do update set
  release_id=excluded.release_id,
  source_id=excluded.source_id,
  observation_type=excluded.observation_type,
  condition=excluded.condition,
  price=excluded.price,
  currency=excluded.currency,
  shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,
  valuation_price=excluded.valuation_price,
  normalized_price_eur=excluded.normalized_price_eur,
  fx_rate_to_eur=excluded.fx_rate_to_eur,
  fx_rate_date=excluded.fx_rate_date,
  inner_bags_sealed=excluded.inner_bags_sealed,
  box_condition=excluded.box_condition,
  is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,
  quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,
  valuation_eligible=excluded.valuation_eligible,
  status=excluded.status,
  needs_revalidation=excluded.needs_revalidation,
  sold_on=excluded.sold_on,
  observed_at=excluded.observed_at,
  evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,
  market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,
  updated_at=now();

update public.product_releases
set notes=regexp_replace(
      coalesce(notes,''),
      'Raw SOLD is persisted; EUR valuation conversion intentionally deferred pending exact historical FX normalization\.',
      'Granular SOLD normalized at EUR 48.58 using the previous ECB business-day reference rate (2026-02-06: EUR 1 = JPY 185.27).'
    ),
    updated_at=now()
where id='19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid;

select public.trackdash_enqueue_market_recompute(
  '19b89e91-ffe5-59d6-b213-dae1cdccfa9d'::uuid,
  'new_complete_unbuilt'
);

commit;
