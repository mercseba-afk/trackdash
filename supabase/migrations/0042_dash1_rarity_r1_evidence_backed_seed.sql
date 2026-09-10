-- Dash-1 Emperor Rarity R1 seed.
--
-- Rarity is RELEASE-specific and is only materialized when the available
-- evidence is strong enough. `production_status = discontinued` is a
-- positive scarcity signal, never an automatic Rare label.
--
-- These three releases are currently supported as Common because Tamiya
-- still has current production/sale evidence and TrackDash observes real
-- current availability. 18069 additionally has strong completed-sale
-- liquidity. All other Dash-1 releases remain NULL / "Rarity to verify"
-- until release-exact sold evidence is available.

update public.product_releases
set rarity = 'Common', updated_at = now()
where id in (
  '0306bc1a-cdb6-5b9c-9461-91cd2a39e07c', -- 18625: active + two current retail sources
  'f576fa21-8e57-5fa0-953e-f468653e3767', -- 18069: active + four current offers + 54 sold units
  '79e32904-fe5d-5d30-bf54-8643ce4b42d3'  -- 18025 (2026): active official current reissue
);

update public.product_releases
set rarity = null, updated_at = now()
where product_id = '2972e27d-7c75-5534-9ed4-1603ef4a6655'
  and id not in (
    '0306bc1a-cdb6-5b9c-9461-91cd2a39e07c',
    'f576fa21-8e57-5fa0-953e-f468653e3767',
    '79e32904-fe5d-5d30-bf54-8643ce4b42d3'
  );
