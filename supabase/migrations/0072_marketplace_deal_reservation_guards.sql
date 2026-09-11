-- A single physical collection share can have multiple conversations, but only
-- one accepted deal at a time. Lock the share row during acceptance to make the
-- reservation atomic across all interested buyers. A confirmed sale closes the
-- public offer while keeping the seller's private collection row untouched.

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
    select 1
    from public.marketplace_offers o
    join public.conversations c on c.id = o.conversation_id
    where c.collection_share_id = v_conversation.collection_share_id
      and o.status = 'accepted'
      and o.deal_status <> 'cancelled'
  ) then raise exception 'This item already has an accepted deal'; end if;

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
  v_share_id uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_decision not in ('accepted','rejected') then raise exception 'Invalid decision'; end if;

  select * into v_offer
  from public.marketplace_offers
  where id = p_offer_id
  for update;
  if not found or v_offer.status <> 'pending' then raise exception 'Offer is no longer pending'; end if;

  select * into v_conversation
  from public.conversations
  where id = v_offer.conversation_id
  for update;
  if not found or (v_conversation.owner_id <> v_uid and v_conversation.requester_id <> v_uid) then
    raise exception 'Conversation not found';
  end if;
  if v_offer.creator_id = v_uid then raise exception 'You cannot respond to your own offer'; end if;

  if p_decision = 'accepted' then
    if v_conversation.status <> 'accepted' then raise exception 'Conversation is not open'; end if;

    select s.id into v_share_id
    from public.collection_shares s
    where s.id = v_conversation.collection_share_id
      and s.user_id = v_conversation.owner_id
      and s.release_id = v_conversation.release_id
      and s.share_mode = 'open_to_offers'
    for update;
    if v_share_id is null then raise exception 'This item is no longer open to offers'; end if;

    if exists (
      select 1 from public.collector_blocks b
      where (b.blocker_id = v_conversation.owner_id and b.blocked_id = v_conversation.requester_id)
         or (b.blocker_id = v_conversation.requester_id and b.blocked_id = v_conversation.owner_id)
    ) then raise exception 'Messaging is blocked between these collectors'; end if;

    if exists (
      select 1
      from public.marketplace_offers o
      join public.conversations c on c.id = o.conversation_id
      where c.collection_share_id = v_share_id
        and o.id <> p_offer_id
        and o.status = 'accepted'
        and o.deal_status <> 'cancelled'
    ) then raise exception 'This item already has an accepted deal'; end if;

    update public.marketplace_offers
    set status = 'accepted', responded_at = now(), accepted_at = now(),
        followup_due_at = now() + interval '3 days', updated_at = now()
    where id = p_offer_id;

    update public.marketplace_offers
    set status = 'superseded', responded_at = now(), updated_at = now()
    where conversation_id = v_offer.conversation_id
      and id <> p_offer_id
      and status = 'pending';
  else
    update public.marketplace_offers
    set status = 'rejected', responded_at = now(), updated_at = now()
    where id = p_offer_id;
  end if;

  update public.conversations set updated_at = now() where id = v_offer.conversation_id;
  return p_offer_id;
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
  v_share_id uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_decision not in ('confirmed','disputed') then raise exception 'Invalid decision'; end if;

  select * into v_sale
  from public.marketplace_sales
  where id = p_sale_id
  for update;
  if not found or v_sale.buyer_id <> v_uid then raise exception 'Sale not found'; end if;
  if v_sale.status <> 'pending_confirmation' then raise exception 'Sale no longer awaits confirmation'; end if;

  if p_decision = 'confirmed' then
    update public.marketplace_sales
    set status = 'confirmed', buyer_responded_at = now(), confirmed_at = now(), updated_at = now()
    where id = p_sale_id;

    update public.marketplace_offers
    set deal_status = 'confirmed', updated_at = now()
    where id = v_sale.offer_id;

    select collection_share_id into v_share_id
    from public.conversations
    where id = v_sale.conversation_id;

    if v_share_id is not null then
      update public.collection_shares
      set share_mode = 'showcase', asking_price = null, asking_currency = null, updated_at = now()
      where id = v_share_id and user_id = v_sale.seller_id;
    end if;
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