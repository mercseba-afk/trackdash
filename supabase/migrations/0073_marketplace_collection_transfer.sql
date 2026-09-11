-- A bilaterally confirmed TrackDash sale transfers one physical copy from the
-- seller's active collection to the buyer's active collection. The seller's
-- ownership period is preserved as an immutable transfer snapshot instead of
-- leaving a sold item inside the active collection.

create table if not exists public.collection_item_transfers (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null unique references public.marketplace_sales(id) on delete restrict,
  seller_collection_item_id uuid not null,
  buyer_collection_item_id uuid not null unique references public.collection_items(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_item_snapshot jsonb not null,
  seller_photo_urls jsonb not null default '[]'::jsonb,
  transferred_at timestamptz not null default now(),
  constraint collection_item_transfers_participants_check check (seller_id <> buyer_id)
);

create index if not exists idx_collection_item_transfers_seller
  on public.collection_item_transfers(seller_id, transferred_at desc);
create index if not exists idx_collection_item_transfers_buyer
  on public.collection_item_transfers(buyer_id, transferred_at desc);

alter table public.collection_item_transfers enable row level security;
drop policy if exists collection_item_transfers_participant_read on public.collection_item_transfers;
create policy collection_item_transfers_participant_read on public.collection_item_transfers
  for select to authenticated
  using (seller_id = auth.uid() or buyer_id = auth.uid());

revoke all on public.collection_item_transfers from anon, authenticated;
grant select on public.collection_item_transfers to authenticated;

-- Once one offer is accepted, the physical listing is reserved. Prevent the
-- seller from deleting/unsharing/editing the public share out from under the
-- pending deal. Cancelling the accepted deal releases the reservation.
create or replace function public.trackdash_guard_reserved_collection_share()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.conversations c
    join public.marketplace_offers o on o.conversation_id = c.id
    where c.collection_share_id = old.id
      and o.status = 'accepted'
      and o.deal_status in ('open', 'sale_reported')
  ) then
    raise exception 'This item has an active accepted deal. Cancel the deal before changing the listing.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_guard_reserved_collection_share on public.collection_shares;
create trigger trg_guard_reserved_collection_share
before update or delete on public.collection_shares
for each row execute function public.trackdash_guard_reserved_collection_share();

create or replace function public.trackdash_respond_marketplace_sale(
  p_sale_id uuid,
  p_decision text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_sale public.marketplace_sales%rowtype;
  v_conversation public.conversations%rowtype;
  v_item public.collection_items%rowtype;
  v_share_id uuid;
  v_seller_item_id uuid;
  v_buyer_item_id uuid;
  v_snapshot jsonb;
  v_photo_urls jsonb;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_decision not in ('confirmed','disputed') then raise exception 'Invalid decision'; end if;

  select * into v_sale
  from public.marketplace_sales
  where id = p_sale_id
  for update;
  if not found or v_sale.buyer_id <> v_uid then raise exception 'Sale not found'; end if;
  if v_sale.status <> 'pending_confirmation' then raise exception 'Sale no longer awaits confirmation'; end if;

  select * into v_conversation
  from public.conversations
  where id = v_sale.conversation_id
  for update;
  if not found then raise exception 'Conversation not found'; end if;

  if p_decision = 'confirmed' then
    v_share_id := v_conversation.collection_share_id;
    if v_share_id is null then raise exception 'The sold collection item is no longer available for transfer'; end if;

    select s.collection_item_id into v_seller_item_id
    from public.collection_shares s
    where s.id = v_share_id
      and s.user_id = v_sale.seller_id
      and s.release_id = v_sale.release_id
    for update;
    if v_seller_item_id is null then raise exception 'The sold collection item is no longer available for transfer'; end if;

    select * into v_item
    from public.collection_items ci
    where ci.id = v_seller_item_id
      and ci.user_id = v_sale.seller_id
      and ci.release_id = v_sale.release_id
    for update;
    if not found then raise exception 'The sold collection item is no longer available for transfer'; end if;
    if v_item.condition <> v_sale.condition then
      raise exception 'The collection item condition changed after the offer was accepted';
    end if;
    if v_item.quantity < 1 then raise exception 'Invalid collection quantity'; end if;

    select coalesce(jsonb_agg(p.url order by p.position, p.created_at), '[]'::jsonb)
      into v_photo_urls
    from public.collection_item_photos p
    where p.collection_item_id = v_item.id;

    v_snapshot := to_jsonb(v_item) || jsonb_build_object(
      'sold_quantity', 1,
      'remaining_quantity', greatest(v_item.quantity - 1, 0)
    );

    -- Mark the deal confirmed before removing the share. The reservation guard
    -- then allows the internal transfer while still blocking seller-side edits
    -- during every earlier state.
    update public.marketplace_sales
    set status = 'confirmed', buyer_responded_at = now(), confirmed_at = now(), updated_at = now()
    where id = p_sale_id;

    update public.marketplace_offers
    set deal_status = 'confirmed', updated_at = now()
    where id = v_sale.offer_id;

    if v_item.quantity = 1 then
      -- Deleting the seller's active row also removes its public share/photos.
      -- The immutable snapshot above preserves the seller ownership history.
      delete from public.collection_items where id = v_item.id;
    else
      update public.collection_items
      set quantity = quantity - 1, updated_at = now()
      where id = v_item.id;

      delete from public.collection_shares
      where id = v_share_id and user_id = v_sale.seller_id;
    end if;

    insert into public.collection_items(
      user_id, product_id, release_id, quantity, condition,
      acquisition_date, acquisition_price, acquisition_currency,
      acquisition_price_eur, acquisition_fx_rate_to_eur,
      acquisition_fx_rate_date, acquisition_fx_source,
      acquisition_source, release_year_override, notes
    ) values (
      v_sale.buyer_id, v_item.product_id, v_sale.release_id, 1, v_sale.condition,
      v_sale.sale_date, v_sale.item_price, v_sale.currency,
      v_sale.item_price_eur, v_sale.fx_rate_to_eur,
      v_sale.fx_rate_date,
      case when v_sale.currency <> 'EUR' and v_sale.item_price_eur is not null then 'ECB' else null end,
      'TrackDash', v_item.release_year_override, null
    ) returning id into v_buyer_item_id;

    insert into public.collection_item_transfers(
      sale_id, seller_collection_item_id, buyer_collection_item_id,
      seller_id, buyer_id, seller_item_snapshot, seller_photo_urls
    ) values (
      v_sale.id, v_seller_item_id, v_buyer_item_id,
      v_sale.seller_id, v_sale.buyer_id, v_snapshot, v_photo_urls
    );
  else
    update public.marketplace_sales
    set status = 'disputed', buyer_responded_at = now(), confirmed_at = null, updated_at = now()
    where id = p_sale_id;

    update public.marketplace_offers
    set deal_status = 'sale_reported', updated_at = now()
    where id = v_sale.offer_id;
  end if;

  update public.conversations set updated_at = now() where id = v_sale.conversation_id;
  return p_sale_id;
end;
$$;

revoke all on function public.trackdash_guard_reserved_collection_share() from public;
revoke all on function public.trackdash_respond_marketplace_sale(uuid,text) from public;
grant execute on function public.trackdash_respond_marketplace_sale(uuid,text) to authenticated;
