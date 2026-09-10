-- Product Research freshness must follow the last actual sale, not the end of
-- the query window. Query coverage is retained separately in raw_payload.

update public.market_aggregate_observations mao
set raw_payload = coalesce(mao.raw_payload, '{}'::jsonb)
  || jsonb_build_object(
       'query_period_end', mao.period_end::text,
       'last_sold_date', case mao.item_number
         when '18069' then '2026-09-09'
         when '94717' then '2025-11-19'
         when '95087' then '2026-04-05'
         when '95464' then '2026-09-01'
         when '95508' then '2026-08-31'
         else null
       end
     ),
    updated_at = now()
where mao.source_id = (select id from public.price_sources where slug='ebay_product_research')
  and mao.item_number in ('18069','94717','95087','95464','95508')
  and mao.grain='full_history';

update public.market_aggregate_observations mao
set period_end = case mao.item_number
      when '18069' then date '2026-09-09'
      when '94717' then date '2025-11-19'
      when '95087' then date '2026-04-05'
      else mao.period_end
    end,
    updated_at = now()
where mao.source_id = (select id from public.price_sources where slug='ebay_product_research')
  and mao.item_number in ('18069','94717','95087')
  and mao.grain='full_history'
  and mao.attribution_status in ('release_exact','release_matched');
