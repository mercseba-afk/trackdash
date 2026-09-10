-- Freeze v1 public semantics for secondary-market signals.
-- Completed sales define Market Value; active asks remain separate market activity.
-- Secondary asks without release-specific sold evidence never publish Market Value.

update public.market_release_signals
set market_regime = case
      when sold_anchor_eur is not null and sold_evidence_count > 0 then 'secondary_market_driven'
      else 'insufficient'
    end,
    market_value_eur = case
      when sold_anchor_eur is not null and sold_evidence_count > 0 then sold_anchor_eur
      else null
    end,
    low_eur = case
      when sold_anchor_eur is not null and sold_evidence_count > 0 then sold_anchor_eur
      else null
    end,
    high_eur = case
      when sold_anchor_eur is not null and sold_evidence_count > 0 then sold_anchor_eur
      else null
    end,
    computed_at = now()
where condition = 'new_complete_unbuilt'
  and retail_source_count = 0;

-- Recalibrate the Product Research pilot signals whose sold freshness changed
-- in migration 0061. These scores are the current R3 confidence formula applied
-- to the evidence snapshot captured on 2026-09-09/10.
update public.market_release_signals mrs
set confidence_score = 46,
    confidence_label = 'low',
    computed_at = now()
from public.product_releases pr
where mrs.release_id = pr.id
  and mrs.condition = 'new_complete_unbuilt'
  and pr.item_number = '95087'
  and pr.release_year = 2015;

update public.market_release_signals mrs
set confidence_score = 17,
    confidence_label = 'low',
    computed_at = now()
from public.product_releases pr
where mrs.release_id = pr.id
  and mrs.condition = 'new_complete_unbuilt'
  and pr.item_number = '94717'
  and pr.release_year = 2010;
