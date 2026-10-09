-- Wishlist monitoring: when a collector explicitly opens a copy to offers,
-- notify other users who saved that exact Release in Desideri.
-- This is a collector-to-collector availability signal only; it never changes
-- Market Value, ASK aggregation, sold evidence, or Price Engine inputs.

create or replace function private.trackdash_notify_wishlist_release_open_to_offers()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product_name text;
  v_edition_name text;
  v_item_number text;
begin
  if new.share_mode <> 'open_to_offers' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.share_mode = 'open_to_offers' then
    return new;
  end if;

  select p.name, r.edition_name, r.item_number
    into v_product_name, v_edition_name, v_item_number
  from public.product_releases r
  join public.products p on p.id = r.product_id
  where r.id = new.release_id;

  insert into public.notifications(
    user_id,
    type,
    title,
    body,
    href,
    entity_type,
    entity_id,
    dedupe_key,
    metadata
  )
  select
    wi.user_id,
    'wishlist_release_available',
    null,
    null,
    '/catalog/' || new.product_id::text || '/releases/' || new.release_id::text,
    'collection_share',
    new.id,
    'wishlist-open-to-offers:' || new.id::text,
    jsonb_build_object(
      'product_name', v_product_name,
      'edition_name', v_edition_name,
      'item_number', v_item_number
    )
  from public.wishlist_items wi
  where wi.release_id = new.release_id
    and wi.user_id <> new.user_id
  on conflict (user_id,dedupe_key) where dedupe_key is not null do nothing;

  return new;
end;
$$;

drop trigger if exists trg_trackdash_wishlist_release_open_to_offers
  on public.collection_shares;

create trigger trg_trackdash_wishlist_release_open_to_offers
after insert or update of share_mode
on public.collection_shares
for each row
execute function private.trackdash_notify_wishlist_release_open_to_offers();
