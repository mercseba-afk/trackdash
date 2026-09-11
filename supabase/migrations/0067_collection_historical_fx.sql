-- 0067_collection_historical_fx.sql
-- Persist a trustworthy EUR purchase basis without overwriting the collector's
-- original amount/currency. Foreign purchases use the ECB reference rate from
-- the latest published business day on or before acquisition_date.

alter table public.collection_items
  add column if not exists acquisition_price_eur numeric(12,2),
  add column if not exists acquisition_fx_rate_to_eur numeric(18,8),
  add column if not exists acquisition_fx_rate_date date,
  add column if not exists acquisition_fx_source text;

-- Existing native-EUR purchases are losslessly normalizable immediately and do
-- not need an external FX lookup.
update public.collection_items
set
  acquisition_price_eur = round(acquisition_price, 2),
  acquisition_fx_rate_to_eur = null,
  acquisition_fx_rate_date = null,
  acquisition_fx_source = null
where acquisition_currency = 'EUR'
  and acquisition_price is not null
  and acquisition_price > 0;

alter table public.collection_items
  drop constraint if exists collection_items_acquisition_fx_check;

alter table public.collection_items
  add constraint collection_items_acquisition_fx_check
  check (
    (
      acquisition_price_eur is null
      and acquisition_fx_rate_to_eur is null
      and acquisition_fx_rate_date is null
      and acquisition_fx_source is null
    )
    or (
      acquisition_currency = 'EUR'
      and acquisition_price is not null
      and acquisition_price_eur = round(acquisition_price, 2)
      and acquisition_fx_rate_to_eur is null
      and acquisition_fx_rate_date is null
      and acquisition_fx_source is null
    )
    or (
      acquisition_currency <> 'EUR'
      and acquisition_price is not null
      and acquisition_fx_rate_to_eur is not null
      and acquisition_fx_rate_to_eur > 0
      and acquisition_fx_rate_date is not null
      and acquisition_fx_source = 'ecb_reference'
      and acquisition_price_eur = round(acquisition_price * acquisition_fx_rate_to_eur, 2)
    )
  );

comment on column public.collection_items.acquisition_price_eur is
  'Historical EUR purchase basis. Native EUR copies directly; foreign amounts use dated ECB reference FX.';
comment on column public.collection_items.acquisition_fx_rate_to_eur is
  'Multiplier from acquisition_currency to EUR used for acquisition_price_eur.';
comment on column public.collection_items.acquisition_fx_rate_date is
  'ECB reference-rate date actually used; may precede acquisition_date on weekends/holidays.';
comment on column public.collection_items.acquisition_fx_source is
  'FX provenance; currently ecb_reference for foreign-currency conversions.';
