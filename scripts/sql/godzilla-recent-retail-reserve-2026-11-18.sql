-- Verified exact shop price, OUT OF STOCK. No active offer or SOLD evidence.
-- https://www.1999.co.jp/11470628: item 95731, JAN 4950344957316, JPY 1584.
-- ECB 2026-11-17: 1 EUR = 175.05 JPY. Item only; shipping/import costs unknown.
-- Existing source, scanner schedule, canonical signals and engine unchanged.
begin;
insert into market_candidates (
  source_id,source_record_key,original_source,original_record_id,listing_url,
  title_raw,item_number_observed,possible_release_ids,resolved_release_id,
  price,currency,shipping_basis,observation_type,condition_raw,condition,
  is_complete,is_lot,quantity,match_confidence,match_evidence,seller_fingerprint,
  evidence_group_key,decision,review_notes,raw_payload
) values (
  'f8c710d0-b418-4136-ba7b-a4b1ff99dcc7','hobbysearch:11470628',
  'hobby_search_1999_public','11470628','https://www.1999.co.jp/11470628',
  'Brocken Gigant Godzilla Minus Zero Version (FM-A Chassis) 95731',
  '95731',array['bc878a2c-9f7b-5ba3-91c5-81774ae1abdc']::uuid[],
  'bc878a2c-9f7b-5ba3-91c5-81774ae1abdc',1584,'JPY','excluded',
  'retail_out_of_stock','New complete assembly kit, shop out of stock',
  'new_complete_unbuilt',true,false,1,'exact',
  array['item_number_exact','edition_name_exact','chassis_stated','verified_endpoint_match'],
  'hobby_search_1999','hobbysearch:11470628','accepted',
  'Reserve only for recent release. Page says out of stock; no confirmed sale inferred. Item 95731 and JAN 4950344957316 verified 2026-11-18.',
  jsonb_build_object('itemLocationCountry','JP','verified_at','2026-11-18',
    'jan','4950344957316','availability','out_of_stock',
    'fx_source','https://www.ecb.europa.eu/stats/exchange/eurofxref/shared/pdf/2026/11/20261117.pdf',
    'eur_jpy',175.05,'reserve_only',true)
) on conflict(source_id,source_record_key) do nothing;

insert into market_offer_states (
  candidate_id,release_id,source_id,condition,channel,availability,seller_fingerprint,
  item_price,currency,item_price_eur,cost_basis,fx_rate_to_eur,fx_rate_date,
  first_seen_at,last_checked_at,changed_at
)
select id,resolved_release_id,source_id,'new_complete_unbuilt','retail','out_of_stock',
  seller_fingerprint,price,'JPY',round(1584 / 175.05,2),'item_only',
  round(1 / 175.05,8),date '2026-11-17',observed_at,observed_at,observed_at
from market_candidates where source_id='f8c710d0-b418-4136-ba7b-a4b1ff99dcc7'
  and source_record_key='hobbysearch:11470628' and decision='accepted'
  and observation_type='retail_out_of_stock'
on conflict(candidate_id) do nothing;

insert into market_offer_history (
  offer_state_id,candidate_id,release_id,source_id,condition,channel,availability,
  item_price_eur,shipping_eur,effective_cost_eur,cost_basis,change_kind,observed_at
)
select o.id,o.candidate_id,o.release_id,o.source_id,o.condition,o.channel,o.availability,
  o.item_price_eur,o.shipping_eur,o.effective_cost_eur,o.cost_basis,'initial',o.last_checked_at
from market_offer_states o join market_candidates c on c.id=o.candidate_id
where c.source_id='f8c710d0-b418-4136-ba7b-a4b1ff99dcc7'
  and c.source_record_key='hobbysearch:11470628'
  and not exists(select 1 from market_offer_history h where h.offer_state_id=o.id);
commit;
