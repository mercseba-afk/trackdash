-- Direct offer entry for items explicitly marked open_to_offers.
--
-- Opening an item to offers is treated as consent to receive structured offers,
-- so the buyer no longer has to send an empty chat request first. This RPC
-- atomically opens/reuses the conversation and creates the pending offer.

create or replace function public.trackdash_start_marketplace_offer(
  p_collection_share_id uuid,
  p_amount numeric,
  p_currency text
) returns table(conversation_id uuid, offer_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_currency text := upper(btrim(p_currency));
  v_share public.collection_shares%rowtype;
  v_requester_username text;
  v_owner_username text;
  v_conversation public.conversations%rowtype;
  v_conversation_id uuid;
  v_offer_id uuid;
  v_request_message text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Offer amount must be positive';
  end if;

  if v_currency not in ('EUR', 'USD', 'JPY', 'GBP') then
    raise exception 'Unsupported currency';
  end if;

  select s.* into v_share
  from public.collection_shares s
  where s.id = p_collection_share_id
    and s.share_mode = 'open_to_offers'
  for update;

  if not found then
    raise exception 'This item is no longer open to offers';
  end if;

  if v_share.user_id = v_uid then
    raise exception 'You cannot make an offer on your own item';
  end if;

  if exists (
    select 1
    from public.collector_blocks b
    where (b.blocker_id = v_uid and b.blocked_id = v_share.user_id)
       or (b.blocker_id = v_share.user_id and b.blocked_id = v_uid)
  ) then
    raise exception 'Messaging is unavailable between these collectors';
  end if;

  if exists (
    select 1
    from public.marketplace_offers o
    join public.conversations c on c.id = o.conversation_id
    where c.collection_share_id = v_share.id
      and o.status = 'accepted'
      and o.deal_status <> 'cancelled'
  ) then
    raise exception 'This item already has an accepted deal';
  end if;

  select p.username into v_requester_username
  from public.profiles p
  where p.id = v_uid;

  select cp.username into v_owner_username
  from public.collector_profiles cp
  where cp.user_id = v_share.user_id;

  if v_requester_username is null then
    raise exception 'Your collector profile is unavailable';
  end if;
  if v_owner_username is null then
    raise exception 'Seller collector profile is unavailable';
  end if;

  v_request_message := 'Offerta iniziale · ' || v_currency || ' ' || round(p_amount, 2)::text;

  select c.* into v_conversation
  from public.conversations c
  where c.collection_share_id = v_share.id
    and c.requester_id = v_uid
  for update;

  if found then
    if v_conversation.status = 'declined' then
      raise exception 'A previous request for this item was declined';
    end if;

    v_conversation_id := v_conversation.id;

    -- Keep the original request text immutable. A legacy pending request can
    -- be opened automatically because the item is explicitly open to offers.
    if v_conversation.status = 'pending' then
      update public.conversations
      set status = 'accepted'
      where id = v_conversation_id;
    else
      update public.conversations
      set updated_at = now()
      where id = v_conversation_id;
    end if;
  else
    insert into public.conversations(
      collection_share_id,
      product_id,
      release_id,
      owner_id,
      requester_id,
      owner_username,
      requester_username,
      request_message,
      status,
      responded_at
    ) values (
      v_share.id,
      v_share.product_id,
      v_share.release_id,
      v_share.user_id,
      v_uid,
      v_owner_username,
      v_requester_username,
      v_request_message,
      'accepted',
      now()
    )
    returning id into v_conversation_id;
  end if;

  update public.marketplace_offers
  set status = 'superseded',
      responded_at = now(),
      updated_at = now()
  where conversation_id = v_conversation_id
    and status = 'pending';

  insert into public.marketplace_offers(
    conversation_id,
    release_id,
    creator_id,
    condition,
    amount,
    currency
  ) values (
    v_conversation_id,
    v_share.release_id,
    v_uid,
    v_share.condition,
    case when v_currency = 'JPY' then round(p_amount, 0) else round(p_amount, 2) end,
    v_currency
  ) returning id into v_offer_id;

  update public.conversations
  set updated_at = now()
  where id = v_conversation_id;

  return query select v_conversation_id, v_offer_id;
end;
$$;

revoke all on function public.trackdash_start_marketplace_offer(uuid, numeric, text) from public;
grant execute on function public.trackdash_start_marketplace_offer(uuid, numeric, text) to authenticated;

comment on function public.trackdash_start_marketplace_offer(uuid, numeric, text) is
  'Starts or reuses an accepted conversation for an open-to-offers item and creates a structured pending marketplace offer in one atomic action.';
