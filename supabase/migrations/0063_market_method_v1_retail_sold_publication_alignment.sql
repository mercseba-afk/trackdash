-- Align existing public R3 signals with the frozen Market Method v1.
-- Two independent fresh retail sources may define the headline Market Value.
-- Otherwise completed sales define the headline; asks remain separate evidence.

update public.market_release_signals mrs
set market_value_eur = mrs.retail_anchor_eur,
    low_eur = mrs.retail_anchor_eur,
    high_eur = mrs.retail_anchor_eur,
    confidence_score = case
      when pr.item_number = '18069' and pr.release_year = 2012 then 69
      when pr.item_number = '18625' and pr.release_year = 2008 then 50
      when pr.item_number = '18025' and pr.release_year = 2026 then 50
      else mrs.confidence_score
    end,
    confidence_label = case
      when (pr.item_number = '18069' and pr.release_year = 2012)
        or (pr.item_number = '18625' and pr.release_year = 2008)
        or (pr.item_number = '18025' and pr.release_year = 2026)
      then 'medium'
      else mrs.confidence_label
    end,
    computed_at = now()
from public.product_releases pr
where pr.id = mrs.release_id
  and mrs.condition = 'new_complete_unbuilt'
  and mrs.retail_source_count >= 2
  and mrs.retail_anchor_eur is not null;

-- Without two independent retail sources or completed-sale evidence, current
-- retail/marketplace observations remain visible evidence but do not manufacture
-- a public Market Value.
update public.market_release_signals
set market_value_eur = null,
    low_eur = null,
    high_eur = null,
    computed_at = now()
where condition = 'new_complete_unbuilt'
  and retail_source_count < 2
  and sold_evidence_count = 0;

-- Recalibrate the two existing sold-based benchmark signals after fixing their
-- true last-sale freshness dates in migration 0061.
update public.market_release_signals mrs
set confidence_score = case
      when pr.item_number = '95087' and pr.release_year = 2015 then 64
      when pr.item_number = '94717' and pr.release_year = 2010 then 41
      else mrs.confidence_score
    end,
    confidence_label = case
      when pr.item_number = '95087' and pr.release_year = 2015 then 'medium'
      when pr.item_number = '94717' and pr.release_year = 2010 then 'low'
      else mrs.confidence_label
    end,
    market_value_eur = case
      when mrs.sold_anchor_eur is not null and mrs.retail_source_count < 2 then mrs.sold_anchor_eur
      else mrs.market_value_eur
    end,
    low_eur = case
      when mrs.sold_anchor_eur is not null and mrs.retail_source_count < 2 then mrs.sold_anchor_eur
      else mrs.low_eur
    end,
    high_eur = case
      when mrs.sold_anchor_eur is not null and mrs.retail_source_count < 2 then mrs.sold_anchor_eur
      else mrs.high_eur
    end,
    computed_at = now()
from public.product_releases pr
where pr.id = mrs.release_id
  and mrs.condition = 'new_complete_unbuilt'
  and ((pr.item_number = '95087' and pr.release_year = 2015)
    or (pr.item_number = '94717' and pr.release_year = 2010));