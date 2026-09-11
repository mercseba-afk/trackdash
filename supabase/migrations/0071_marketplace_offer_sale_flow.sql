-- TrackDash structured marketplace deal flow.
-- Payment/shipping remain off-platform for now, but offers and bilateral sale
-- confirmations are first-class, auditable data. Only the item price contributes
-- to market evidence; shipping stays separate.

create table if not exists public.marketplace_offers (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  release_id uuid not null references public.product_releases(id) on delete restrict,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  condition text not null,
  amount numeric(10,2) not null,
  currency text not null,
  status text not null default 'pending',
  deal_status text not null default 'open',
  responded_at timestamptz,
  accepted_at timestamptz,
  followup_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_offers_amount_check check (amount > 0),
  constraint marketplace_offers_currency_check check (currency in ('EUR','USD','JPY','GBP')),
  constraint marketplace_offers_status_check check (status in ('pending','accepted','rejected','superseded','withdrawn')),
  constraint marketplace_offers_deal_status_check check (deal_status in ('open','cancelled','sale_reported','confirmed')),
  constraint marketplace_offers_condition_check check (condition in ('Sealed','New / Opened','Built','Used','Incomplete')),
  constraint marketplace_offers_acceptance_check check (
    (status = 'accepted' and accepted_at is not null)
    or (status <> 'accepted' and accepted_at is null)
  )
);

create index if not exists idx_marketplace_offers_conversation_created
  on public.marketplace_offers(conversation_id, created_at desc);
create index if not exists idx_marketplace_offers_release_created
  on public.marketplace_offers(release_id, created_at desc);
create unique index if not exists marketplace_offers_one_pending_per_conversation
  on public.marketplace_offers(conversation_id)
  where status = 'pending';
create unique index if not exists marketplace_offers_one_live_accepted_deal
  on public.marketplace_offers(conversation_id)
  where status = 'accepted' and deal_status <> 'cancelled';

create table if not exists public.marketplace_sales (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations(id) on delete cascade,
  offer_id uuid not null unique references public.marketplace_offers(id) on delete restrict,
  release_id uuid not null references public.product_releases(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  condition text not null,
  item_price numeric(10,2) not null,
  shipping_price numeric(10,2),
  currency text not null,
  item_price_eur numeric(10,2),
  fx_rate_to_eur numeric(18,8),
  fx_rate_date date,
  sale_date date not null,
  status text not null default 'pending_confirmation',
  reported_at timestamptz not null default now(),
  buyer_responded_at timestamptz,
  confirmed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint marketplace_sales_participants_check check (seller_id <> buyer_id),
  constraint marketplace_sales_item_price_check check (item_price > 0),
  constraint marketplace_sales_shipping_check check (shipping_price is null or shipping_price >= 0),
  constraint marketplace_sales_currency_check check (currency in ('EUR','USD','JPY','GBP')),
  constraint marketplace_sales_condition_check check (condition in ('Sealed','New / Opened','Built','Used','Incomplete')),
  constraint marketplace_sales_status_check check (status in ('pending_confirmation','confirmed','disputed')),
  constraint marketplace_sales_date_check check (sale_date <= current_date),
  constraint marketplace_sales_eur_check check (
    (currency = 'EUR' and item_price_eur = round(item_price, 2) and fx_rate_to_eur is null and fx_rate_date is null)
    or (currency <> 'EUR' and (
      (item_price_eur is null and fx_rate_to_eur is null and fx_rate_date is null)
      or (item_price_eur is not null and fx_rate_to_eur is not null and fx_rate_to_eur > 0 and fx_rate_date is not null
        and item_price_eur = round(item_price * fx_rate_to_eur, 2))
    ))
  ),
  constraint marketplace_sales_confirmation_check check (
    (status = 'confirmed' and confirmed_at is not null and buyer_responded_at is not null)
    or (status <> 'confirmed' and confirmed_at is null)
  )
);

create index if not exists idx_marketplace_sales_release_date
  on public.marketplace_sales(release_id, sale_date desc);
create index if not exists idx_marketplace_sales_buyer_status
  on public.marketplace_sales(buyer_id, status, reported_at desc);
create index if not exists idx_marketplace_sales_seller_status
  on public.marketplace_sales(seller_id, status, reported_at desc);

alter table public.marketplace_offers enable row level security;
alter table public.marketplace_sales enable row level security;

-- Participants may read their own deal history. All writes go through the
-- SECURITY DEFINER functions below, so clients cannot mutate amount/status fields
-- directly through PostgREST.
drop policy if exists marketplace_offers_participant_read on public.marketplace_offers;
create policy marketplace_offers_participant_read on public.marketplace_offers
  for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = marketplace_offers.conversation_id
      and (c.owner_id = auth.uid() or c.requester_id = auth.uid())
  ));

drop policy if exists marketplace_sales_participant_read on public.marketplace_sales;
create policy marketplace_sales_participant_read on public.marketplace_sales
  for select to authenticated
  using (seller_id = auth.uid() or buyer_id = auth.uid());

revoke all on public.marketplace_offers from anon, authenticated;
revoke all on public.marketplace_sales from anon, authenticated;
grant select on public.marketplace_offers to authenticated;
grant select on public.marketplace_sales to authenticated;

create or replace function public.trackdash_create_marketplace_offer(
  p_conversation_id uuid,
  p_amount numeric,
  p_currency text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_condition text;
  v_offer_id uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Offer amount must be positive'; end if;
  p_currency := upper(btrim(p_currency));
  if p_currency not in ('EUR','USD','JPY','GBP') then raise exception 'Unsupported currency'; end if;

  select * into v_conversation
  from public.conversations
  where id = p_conversation_id
  for update;

  if not found or (v_conversation.owner_id <> v_uid and v_conversation.requester_id <> v_uid) then
    raise exception 'Conversation not found';
  end if;
  if v_conversation.status <> 'accepted' then raise exception 'Conversation is not open'; end if;
  if exists (
    select 1 from public.collector_blocks b
    where (b.blocker_id = v_conversation.owner_id and b.blocked_id = v_conversation.requester_id)
       or (b.blocker_id = v_conversation.requester_id and b.blocked_id = v_conversation.owner_id)
  ) then raise exception 'Messaging is blocked between these collectors'; end if;

  select s.condition into v_condition
  from public.collection_shares s
  where s.id = v_conversation.collection_share_id
    and s.user_id = v_conversation.owner_id
    and s.release_id = v_conversation.release_id
    and s.share_mode = 'open_to_offers';
  if v_condition is null then raise exception 'This item is no longer open to offers'; end if;

  if exists (
    select 1 from public.marketplace_offers o
    where o.conversation_id = p_conversation_id
      and o.status = 'accepted'
      and o.deal_status <> 'cancelled'
  ) then raise exception 'This conversation already has an accepted deal'; end if;

  update public.marketplace_offers
    set status = 'superseded', responded_at = now(), updated_at = now()
  where conversation_id = p_conversation_id and status = 'pending';

  insert into public.marketplace_offers(
    conversation_id, release_id, creator_id, condition, amount, currency
  ) values (
    p_conversation_id, v_conversation.release_id, v_uid, v_condition, round(p_amount, 2), p_currency
  ) returning id into v_offer_id;

  update public.conversations set updated_at = now() where id = p_conversation_id;
  return v_offer_id;
end;
$$;

create or replace function public.trackdash_respond_marketplace_offer(
  p_offer_id uuid,
  p_decision text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_offer public.marketplace_offers%rowtype;
  v_conversation public.conversations%rowtype;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_decision not in ('accepted','rejected') then raise exception 'Invalid decision'; end if;

  select * into v_offer from public.marketplace_offers where id = p_offer_id for update;
  if not found or v_offer.status <> 'pending' then raise exception 'Offer is no longer pending'; end if;
  select * into v_conversation from public.conversations where id = v_offer.conversation_id for update;
  if not found or (v_conversation.owner_id <> v_uid and v_conversation.requester_id <> v_uid) then
    raise exception 'Conversation not found';
  end if;
  if v_offer.creator_id = v_uid then raise exception 'You cannot respond to your own offer'; end if;

  if p_decision = 'accepted' then
    if v_conversation.status <> 'accepted' then raise exception 'Conversation is not open'; end if;
    if not exists (
      select 1 from public.collection_shares s
      where s.id = v_conversation.collection_share_id
        and s.user_id = v_conversation.owner_id
        and s.release_id = v_conversation.release_id
        and s.share_mode = 'open_to_offers'
    ) then raise exception 'This item is no longer open to offers'; end if;
    if exists (
      select 1 from public.collector_blocks b
      where (b.blocker_id = v_conversation.owner_id and b.blocked_id = v_conversation.requester_id)
         or (b.blocker_id = v_conversation.requester_id and b.blocked_id = v_conversation.owner_id)
    ) then raise exception 'Messaging is blocked between these collectors'; end if;

    update public.marketplace_offers
      set status = 'accepted', responded_at = now(), accepted_at = now(),
          followup_due_at = now() + interval '3 days', updated_at = now()
    where id = p_offer_id;
    update public.marketplace_offers
      set status = 'superseded', responded_at = now(), updated_at = now()
    where conversation_id = v_offer.conversation_id and id <> p_offer_id and status = 'pending';
  else
    update public.marketplace_offers
      set status = 'rejected', responded_at = now(), updated_at = now()
    where id = p_offer_id;
  end if;

  update public.conversations set updated_at = now() where id = v_offer.conversation_id;
  return p_offer_id;
end;
$$;

create or replace function public.trackdash_snooze_marketplace_followup(
  p_offer_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_offer public.marketplace_offers%rowtype;
  v_owner uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select o.*, c.owner_id into v_offer, v_owner
  from public.marketplace_offers o join public.conversations c on c.id = o.conversation_id
  where o.id = p_offer_id
  for update of o;
  if not found or v_owner <> v_uid then raise exception 'Only the seller can update this follow-up'; end if;
  if v_offer.status <> 'accepted' or v_offer.deal_status <> 'open' then raise exception 'Deal is not awaiting follow-up'; end if;
  update public.marketplace_offers
    set followup_due_at = now() + interval '4 days', updated_at = now()
    where id = p_offer_id;
  update public.conversations set updated_at = now() where id = v_offer.conversation_id;
  return p_offer_id;
end;
$$;

create or replace function public.trackdash_cancel_marketplace_deal(
  p_offer_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_offer public.marketplace_offers%rowtype;
  v_conversation public.conversations%rowtype;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_offer from public.marketplace_offers where id = p_offer_id for update;
  if not found then raise exception 'Offer not found'; end if;
  select * into v_conversation from public.conversations where id = v_offer.conversation_id;
  if v_conversation.owner_id <> v_uid and v_conversation.requester_id <> v_uid then raise exception 'Offer not found'; end if;
  if v_offer.status <> 'accepted' or v_offer.deal_status <> 'open' then raise exception 'Deal can no longer be cancelled here'; end if;
  update public.marketplace_offers
    set deal_status = 'cancelled', followup_due_at = null, updated_at = now()
    where id = p_offer_id;
  update public.conversations set updated_at = now() where id = v_offer.conversation_id;
  return p_offer_id;
end;
$$;

create or replace function public.trackdash_report_marketplace_sale(
  p_offer_id uuid,
  p_item_price numeric,
  p_shipping_price numeric,
  p_currency text,
  p_sale_date date,
  p_item_price_eur numeric,
  p_fx_rate_to_eur numeric,
  p_fx_rate_date date
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_offer public.marketplace_offers%rowtype;
  v_conversation public.conversations%rowtype;
  v_sale_id uuid;
  v_existing public.marketplace_sales%rowtype;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_item_price is null or p_item_price <= 0 then raise exception 'Final item price must be positive'; end if;
  if p_shipping_price is not null and p_shipping_price < 0 then raise exception 'Shipping cannot be negative'; end if;
  if p_sale_date is null or p_sale_date > current_date then raise exception 'Invalid sale date'; end if;
  p_currency := upper(btrim(p_currency));
  if p_currency not in ('EUR','USD','JPY','GBP') then raise exception 'Unsupported currency'; end if;

  select * into v_offer from public.marketplace_offers where id = p_offer_id for update;
  if not found or v_offer.status <> 'accepted' or v_offer.deal_status not in ('open','sale_reported') then
    raise exception 'Accepted deal not found';
  end if;
  select * into v_conversation from public.conversations where id = v_offer.conversation_id for update;
  if not found or v_conversation.owner_id <> v_uid then raise exception 'Only the seller can report the sale'; end if;

  select * into v_existing from public.marketplace_sales where conversation_id = v_offer.conversation_id for update;
  if found and v_existing.status not in ('disputed','pending_confirmation') then
    raise exception 'Sale is already confirmed';
  end if;

  if found then
    update public.marketplace_sales
      set offer_id = p_offer_id, release_id = v_offer.release_id,
          seller_id = v_conversation.owner_id, buyer_id = v_conversation.requester_id,
          condition = v_offer.condition, item_price = round(p_item_price, 2),
          shipping_price = case when p_shipping_price is null then null else round(p_shipping_price, 2) end,
          currency = p_currency, item_price_eur = p_item_price_eur,
          fx_rate_to_eur = p_fx_rate_to_eur, fx_rate_date = p_fx_rate_date,
          sale_date = p_sale_date, status = 'pending_confirmation',
          reported_at = now(), buyer_responded_at = null, confirmed_at = null, updated_at = now()
      where id = v_existing.id
      returning id into v_sale_id;
  else
    insert into public.marketplace_sales(
      conversation_id, offer_id, release_id, seller_id, buyer_id, condition,
      item_price, shipping_price, currency, item_price_eur, fx_rate_to_eur,
      fx_rate_date, sale_date
    ) values (
      v_offer.conversation_id, p_offer_id, v_offer.release_id,
      v_conversation.owner_id, v_conversation.requester_id, v_offer.condition,
      round(p_item_price, 2),
      case when p_shipping_price is null then null else round(p_shipping_price, 2) end,
      p_currency, p_item_price_eur, p_fx_rate_to_eur, p_fx_rate_date, p_sale_date
    ) returning id into v_sale_id;
  end if;

  update public.marketplace_offers
    set deal_status = 'sale_reported', followup_due_at = null, updated_at = now()
    where id = p_offer_id;
  update public.conversations set updated_at = now() where id = v_offer.conversation_id;
  return v_sale_id;
end;
$$;

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
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_decision not in ('confirmed','disputed') then raise exception 'Invalid decision'; end if;
  select * into v_sale from public.marketplace_sales where id = p_sale_id for update;
  if not found or v_sale.buyer_id <> v_uid then raise exception 'Sale not found'; end if;
  if v_sale.status <> 'pending_confirmation' then raise exception 'Sale no longer awaits confirmation'; end if;

  if p_decision = 'confirmed' then
    update public.marketplace_sales
      set status = 'confirmed', buyer_responded_at = now(), confirmed_at = now(), updated_at = now()
      where id = p_sale_id;
    update public.marketplace_offers
      set deal_status = 'confirmed', updated_at = now()
      where id = v_sale.offer_id;
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

revoke all on function public.trackdash_create_marketplace_offer(uuid,numeric,text) from public;
revoke all on function public.trackdash_respond_marketplace_offer(uuid,text) from public;
revoke all on function public.trackdash_snooze_marketplace_followup(uuid) from public;
revoke all on function public.trackdash_cancel_marketplace_deal(uuid) from public;
revoke all on function public.trackdash_report_marketplace_sale(uuid,numeric,numeric,text,date,numeric,numeric,date) from public;
revoke all on function public.trackdash_respond_marketplace_sale(uuid,text) from public;
grant execute on function public.trackdash_create_marketplace_offer(uuid,numeric,text) to authenticated;
grant execute on function public.trackdash_respond_marketplace_offer(uuid,text) to authenticated;
grant execute on function public.trackdash_snooze_marketplace_followup(uuid) to authenticated;
grant execute on function public.trackdash_cancel_marketplace_deal(uuid) to authenticated;
grant execute on function public.trackdash_report_marketplace_sale(uuid,numeric,numeric,text,date,numeric,numeric,date) to authenticated;
grant execute on function public.trackdash_respond_marketplace_sale(uuid,text) to authenticated;

insert into public.price_sources(slug, name, source_type, is_active, origin, ingestion_mode)
values ('trackdash_confirmed_sales', 'TrackDash confirmed sales', 'marketplace', true, 'trackdash_transaction', 'internal')
on conflict (slug) do update set
  name = excluded.name,
  source_type = excluded.source_type,
  is_active = excluded.is_active,
  origin = excluded.origin,
  ingestion_mode = excluded.ingestion_mode;

-- Best-effort realtime support so the counterpart sees offers/sale state changes
-- without having to reload the messages screen.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'marketplace_offers'
    ) then
      execute 'alter publication supabase_realtime add table public.marketplace_offers';
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'marketplace_sales'
    ) then
      execute 'alter publication supabase_realtime add table public.marketplace_sales';
    end if;
  end if;
end $$;
