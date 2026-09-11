-- Collector UX: keep purchase history private while allowing an explicit
-- public asking price only for copies that are open to offers.

alter table public.collection_shares
  add column if not exists asking_price numeric(10,2),
  add column if not exists asking_currency text;

alter table public.collection_shares
  drop constraint if exists collection_shares_asking_price_check;

alter table public.collection_shares
  add constraint collection_shares_asking_price_check
  check (
    (asking_price is null and asking_currency is null)
    or (
      share_mode = 'open_to_offers'
      and asking_price > 0
      and asking_currency in ('EUR', 'USD', 'JPY', 'GBP')
    )
  );

comment on column public.collection_shares.asking_price is
  'Optional public asking price for a copy explicitly marked open_to_offers. Asking evidence is not a completed sale or Market Value.';

comment on column public.collection_shares.asking_currency is
  'Currency for asking_price; null when no asking price is published.';