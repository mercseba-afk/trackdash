-- Avante Mk.II Cerezo Osaka exact granular SOLD evidence — 2026-09-24
-- Promotes the already-audited Yahoo Auctions candidate into the canonical
-- v4 granular SOLD input. One transaction remains indicative and is not, by
-- itself, sufficient to consolidate Market Value.
--
-- ECB 2026-06-16 reference: EUR 1 = JPY 185.94
-- JPY -> EUR factor = 1 / 185.94 = 0.005378078950198989.

begin;

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
  0.005378078950198989,date '2026-06-16','unknown','unknown',true,false,
  1,'exact',array['edition_name_exact','manual_override'],
  'yahoo-auctions:cerezo-avante-mkii:2026-06-16',true,
  'active',false,null,date '2026-06-16',c.observed_at,'indicative',
  array['shipping_unknown','inner_bags_unknown','box_condition_unknown','seller_unknown'],
  round(c.price * 0.005378078950198989,2),'raw_sale'
from public.market_candidates c
where c.source_id='d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid
  and c.source_record_key='yahoo-auctions:avante-mkii-cerezo:2026-06-16:3234'
  and c.resolved_release_id='1bd70c72-417e-5e20-a7e1-0247e38dc608'::uuid
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

select public.trackdash_enqueue_market_recompute(
  '1bd70c72-417e-5e20-a7e1-0247e38dc608'::uuid,
  'new_complete_unbuilt'
);

commit;
