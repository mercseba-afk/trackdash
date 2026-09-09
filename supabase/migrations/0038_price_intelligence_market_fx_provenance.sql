-- 0038_price_intelligence_market_fx_provenance.sql
-- R2 follow-up: market_price_eur may legitimately use a historical FX rate even
-- when shipping is unknown and the strict v1 valuation_price remains NULL.

alter table public.price_points
  drop constraint if exists price_points_shipping_value_check;

alter table public.price_points
  add constraint price_points_shipping_value_check
    check (
      (
        shipping_basis in ('included_unknown', 'unknown')
        and valuation_price is null
        and normalized_price_eur is null
      ) or (
        shipping_basis in ('excluded', 'buyer_paid')
        and valuation_price = price
      ) or (
        shipping_basis = 'included_exact'
        and shipping_cost is not null
        and price >= shipping_cost
        and valuation_price = price - shipping_cost
      )
    );

alter table public.price_points
  drop constraint if exists price_points_market_fx_check;

alter table public.price_points
  add constraint price_points_market_fx_check
    check (
      market_price_eur is null
      or (
        currency = 'EUR'
        and fx_rate_to_eur is null
        and fx_rate_date is null
        and market_price_eur = round(
          case
            when market_price_basis = 'shipping_adjusted' and shipping_basis = 'included_exact'
              then price - shipping_cost
            else price
          end,
          2
        )
      )
      or (
        currency <> 'EUR'
        and fx_rate_to_eur is not null
        and fx_rate_to_eur > 0
        and fx_rate_date is not null
        and market_price_eur = round(
          (
            case
              when market_price_basis = 'shipping_adjusted' and shipping_basis = 'included_exact'
                then price - shipping_cost
              else price
            end
          ) * fx_rate_to_eur,
          2
        )
      )
    );
