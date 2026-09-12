-- TrackDash platform foundations: per-copy photos, generic notifications and support requests.

-- ---------------------------------------------------------------------------
-- Per-copy photo storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'collection-item-photos',
  'collection-item-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.trackdash_owns_collection_item(p_collection_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.collection_items ci
    where ci.id = p_collection_item_id
      and ci.user_id = auth.uid()
  );
$$;

create or replace function public.trackdash_can_view_collection_photo(p_collection_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.trackdash_owns_collection_item(p_collection_item_id)
    or exists (
      select 1
      from public.collection_shares cs
      where cs.collection_item_id = p_collection_item_id
        and cs.share_mode = 'open_to_offers'
    );
$$;

revoke all on function public.trackdash_owns_collection_item(uuid) from public;
revoke all on function public.trackdash_can_view_collection_photo(uuid) from public;
grant execute on function public.trackdash_owns_collection_item(uuid) to authenticated;
grant execute on function public.trackdash_can_view_collection_photo(uuid) to authenticated;

alter table public.collection_item_photos
  drop constraint if exists collection_item_photos_position_check;
alter table public.collection_item_photos
  add constraint collection_item_photos_position_check check (position between 0 and 4);

create index if not exists idx_collection_item_photos_item_position
  on public.collection_item_photos(collection_item_id, position, created_at);

create or replace function public.trackdash_enforce_collection_photo_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  if new.position < 0 or new.position > 4 then
    raise exception 'A collection item photo position must be between 0 and 4';
  end if;

  if tg_op = 'INSERT' then
    select count(*)::int
      into v_count
      from public.collection_item_photos p
      where p.collection_item_id = new.collection_item_id;

    if v_count >= 5 then
      raise exception 'A collection item can have at most 5 photos';
    end if;
  elsif new.collection_item_id is distinct from old.collection_item_id then
    select count(*)::int
      into v_count
      from public.collection_item_photos p
      where p.collection_item_id = new.collection_item_id
        and p.id <> old.id;

    if v_count >= 5 then
      raise exception 'A collection item can have at most 5 photos';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_collection_photo_limit on public.collection_item_photos;
create trigger trg_collection_photo_limit
before insert or update of collection_item_id, position
on public.collection_item_photos
for each row execute function public.trackdash_enforce_collection_photo_limit();

-- Existing owner policy remains the write boundary. This additional SELECT
-- policy makes photos readable only when the exact physical copy is explicitly
-- open to offers. Showcase-only copies do not expose private photos.
drop policy if exists collection_item_photos_open_offer_read on public.collection_item_photos;
create policy collection_item_photos_open_offer_read
on public.collection_item_photos
for select
to authenticated
using (public.trackdash_can_view_collection_photo(collection_item_id));

-- Storage object path: <user_id>/<collection_item_id>/<random>.webp
-- Owners can manage their own files. Other authenticated collectors can only
-- read files belonging to a copy that is currently open_to_offers.
drop policy if exists collection_item_photos_storage_select on storage.objects;
create policy collection_item_photos_storage_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'collection-item-photos'
  and (
    ((storage.foldername(name))[1] = auth.uid()::text)
    or (
      array_length(storage.foldername(name), 1) >= 2
      and public.trackdash_can_view_collection_photo(((storage.foldername(name))[2])::uuid)
    )
  )
);

drop policy if exists collection_item_photos_storage_insert on storage.objects;
create policy collection_item_photos_storage_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'collection-item-photos'
  and array_length(storage.foldername(name), 1) >= 2
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.trackdash_owns_collection_item(((storage.foldername(name))[2])::uuid)
);

drop policy if exists collection_item_photos_storage_update on storage.objects;
create policy collection_item_photos_storage_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'collection-item-photos'
  and array_length(storage.foldername(name), 1) >= 2
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.trackdash_owns_collection_item(((storage.foldername(name))[2])::uuid)
)
with check (
  bucket_id = 'collection-item-photos'
  and array_length(storage.foldername(name), 1) >= 2
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.trackdash_owns_collection_item(((storage.foldername(name))[2])::uuid)
);

drop policy if exists collection_item_photos_storage_delete on storage.objects;
create policy collection_item_photos_storage_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'collection-item-photos'
  and array_length(storage.foldername(name), 1) >= 2
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.trackdash_owns_collection_item(((storage.foldername(name))[2])::uuid)
);

-- ---------------------------------------------------------------------------
-- Generic notification center
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text,
  body text,
  href text,
  entity_type text,
  entity_id uuid,
  dedupe_key text,
  metadata jsonb not null default '{}'::jsonb,
  available_at timestamptz not null default now(),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, available_at, created_at desc)
  where read_at is null;
create unique index if not exists uq_notifications_user_dedupe
  on public.notifications(user_id, dedupe_key)
  where dedupe_key is not null;

alter table public.notifications enable row level security;

drop policy if exists notifications_owner_read on public.notifications;
create policy notifications_owner_read
on public.notifications
for select
to authenticated
using (user_id = auth.uid() and available_at <= now());

drop policy if exists notifications_owner_mark_read on public.notifications;
create policy notifications_owner_mark_read
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;

create or replace function public.trackdash_emit_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_href text,
  p_entity_type text,
  p_entity_id uuid,
  p_dedupe_key text,
  p_metadata jsonb default '{}'::jsonb,
  p_available_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (
    user_id, type, title, body, href, entity_type, entity_id,
    dedupe_key, metadata, available_at
  ) values (
    p_user_id, p_type, p_title, p_body, p_href, p_entity_type, p_entity_id,
    p_dedupe_key, coalesce(p_metadata, '{}'::jsonb), coalesce(p_available_at, now())
  )
  on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.trackdash_emit_notification(uuid,text,text,text,text,text,uuid,text,jsonb,timestamptz) from public;

create or replace function public.trackdash_notify_marketplace_offer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_requester uuid;
  v_recipient uuid;
  v_is_counter boolean;
begin
  select c.owner_id, c.requester_id
    into v_owner, v_requester
    from public.conversations c
    where c.id = new.conversation_id;

  if v_owner is null or v_requester is null then
    return new;
  end if;

  v_recipient := case when new.creator_id = v_owner then v_requester else v_owner end;
  select exists (
    select 1 from public.marketplace_offers o
    where o.conversation_id = new.conversation_id
      and o.id <> new.id
  ) into v_is_counter;

  perform public.trackdash_emit_notification(
    v_recipient,
    case when v_is_counter then 'marketplace_counteroffer_received' else 'marketplace_offer_received' end,
    null,
    null,
    '/messages?conversation=' || new.conversation_id::text,
    'marketplace_offer',
    new.id,
    'offer:' || new.id::text || ':received',
    jsonb_build_object(
      'conversationId', new.conversation_id,
      'offerId', new.id,
      'amount', new.amount,
      'currency', new.currency
    ),
    now()
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_marketplace_offer on public.marketplace_offers;
create trigger trg_notify_marketplace_offer
after insert on public.marketplace_offers
for each row execute function public.trackdash_notify_marketplace_offer();

create or replace function public.trackdash_notify_marketplace_offer_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if new.status = 'accepted' and old.status is distinct from new.status then
    select c.owner_id into v_owner
    from public.conversations c
    where c.id = new.conversation_id;

    perform public.trackdash_emit_notification(
      new.creator_id,
      'marketplace_offer_accepted',
      null,
      null,
      '/messages?conversation=' || new.conversation_id::text,
      'marketplace_offer',
      new.id,
      'offer:' || new.id::text || ':accepted',
      jsonb_build_object(
        'conversationId', new.conversation_id,
        'offerId', new.id,
        'amount', new.amount,
        'currency', new.currency
      ),
      now()
    );

    if v_owner is not null and new.followup_due_at is not null then
      perform public.trackdash_emit_notification(
        v_owner,
        'marketplace_sale_followup_due',
        null,
        null,
        '/messages?conversation=' || new.conversation_id::text,
        'marketplace_offer',
        new.id,
        'offer:' || new.id::text || ':seller-followup',
        jsonb_build_object(
          'conversationId', new.conversation_id,
          'offerId', new.id
        ),
        new.followup_due_at
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_marketplace_offer_status on public.marketplace_offers;
create trigger trg_notify_marketplace_offer_status
after update of status, followup_due_at on public.marketplace_offers
for each row execute function public.trackdash_notify_marketplace_offer_status();

create or replace function public.trackdash_notify_marketplace_sale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending_confirmation' then
    perform public.trackdash_emit_notification(
      new.buyer_id,
      'marketplace_sale_confirmation_due',
      null,
      null,
      '/messages?conversation=' || new.conversation_id::text,
      'marketplace_sale',
      new.id,
      'sale:' || new.id::text || ':buyer-confirmation',
      jsonb_build_object(
        'conversationId', new.conversation_id,
        'saleId', new.id,
        'itemPrice', new.item_price,
        'shippingPrice', new.shipping_price,
        'currency', new.currency
      ),
      now()
    );
  elsif tg_op = 'UPDATE' and new.status = 'confirmed' and old.status is distinct from new.status then
    perform public.trackdash_emit_notification(
      new.seller_id,
      'marketplace_sale_confirmed',
      null,
      null,
      '/messages?conversation=' || new.conversation_id::text,
      'marketplace_sale',
      new.id,
      'sale:' || new.id::text || ':confirmed',
      jsonb_build_object(
        'conversationId', new.conversation_id,
        'saleId', new.id,
        'itemPrice', new.item_price,
        'shippingPrice', new.shipping_price,
        'currency', new.currency
      ),
      now()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_marketplace_sale on public.marketplace_sales;
create trigger trg_notify_marketplace_sale
after insert or update of status on public.marketplace_sales
for each row execute function public.trackdash_notify_marketplace_sale();

-- ---------------------------------------------------------------------------
-- Assistance / suggestions
-- ---------------------------------------------------------------------------

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('problem', 'feature_request', 'model_release_request', 'other')),
  subject text not null check (char_length(subject) between 1 and 160),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'open' check (status in ('open', 'in_review', 'planned', 'resolved', 'closed')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_requests_user_created
  on public.support_requests(user_id, created_at desc);
create index if not exists idx_support_requests_status_created
  on public.support_requests(status, created_at desc);

alter table public.support_requests enable row level security;

drop policy if exists support_requests_owner_read on public.support_requests;
create policy support_requests_owner_read
on public.support_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists support_requests_owner_insert on public.support_requests;
create policy support_requests_owner_insert
on public.support_requests
for insert
to authenticated
with check (user_id = auth.uid() and status = 'open');

revoke all on public.support_requests from anon, authenticated;
grant select, insert on public.support_requests to authenticated;

create or replace function public.trackdash_touch_support_request()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_support_request on public.support_requests;
create trigger trg_touch_support_request
before update on public.support_requests
for each row execute function public.trackdash_touch_support_request();

create or replace function public.trackdash_notify_support_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    perform public.trackdash_emit_notification(
      new.user_id,
      'support_status_changed',
      null,
      null,
      '/support?request=' || new.id::text,
      'support_request',
      new.id,
      null,
      jsonb_build_object(
        'requestId', new.id,
        'status', new.status,
        'subject', new.subject
      ),
      now()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_support_status on public.support_requests;
create trigger trg_notify_support_status
after update of status on public.support_requests
for each row execute function public.trackdash_notify_support_status();

-- Realtime is useful for the bell badge, but the table may already be in the
-- publication if a migration is replayed. Guard the publication mutation.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
