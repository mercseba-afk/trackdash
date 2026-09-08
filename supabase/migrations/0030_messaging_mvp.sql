-- Messaging MVP
-- Flow: open_to_offers share -> pending request -> owner accepts/declines -> messages only when accepted.
-- Private collection_items are never read by the messaging surface.

create table public.collector_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint collector_blocks_pair_unique unique (blocker_id, blocked_id),
  constraint collector_blocks_not_self_check check (blocker_id <> blocked_id)
);

create index idx_collector_blocks_blocked on public.collector_blocks(blocked_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  collection_share_id uuid references public.collection_shares(id) on delete set null,
  product_id uuid not null references public.products(id),
  release_id uuid not null references public.product_releases(id),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  owner_username text not null,
  requester_username text not null,
  request_message text not null,
  status text not null default 'pending',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_participants_distinct_check check (owner_id <> requester_id),
  constraint conversations_status_check check (status in ('pending', 'accepted', 'declined')),
  constraint conversations_request_message_check check (char_length(btrim(request_message)) between 1 and 1000)
);

create unique index conversations_share_requester_unique
  on public.conversations(collection_share_id, requester_id)
  where collection_share_id is not null;
create index idx_conversations_owner_status on public.conversations(owner_id, status, updated_at desc);
create index idx_conversations_requester_status on public.conversations(requester_id, status, updated_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_body_check check (char_length(btrim(body)) between 1 and 2000)
);

create index idx_messages_conversation_created on public.messages(conversation_id, created_at);

alter table public.collector_blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on table public.collector_blocks from anon, authenticated;
revoke all on table public.conversations from anon, authenticated;
revoke all on table public.messages from anon, authenticated;

grant select, insert, delete on table public.collector_blocks to authenticated;
grant select, insert on table public.conversations to authenticated;
grant update (status, responded_at, updated_at) on table public.conversations to authenticated;
grant select, insert on table public.messages to authenticated;

create policy collector_blocks_participant_read
on public.collector_blocks for select to authenticated
using (blocker_id = (select auth.uid()) or blocked_id = (select auth.uid()));

create policy collector_blocks_owner_insert
on public.collector_blocks for insert to authenticated
with check (blocker_id = (select auth.uid()) and blocked_id <> (select auth.uid()));

create policy collector_blocks_owner_delete
on public.collector_blocks for delete to authenticated
using (blocker_id = (select auth.uid()));

create policy conversations_participant_read
on public.conversations for select to authenticated
using (owner_id = (select auth.uid()) or requester_id = (select auth.uid()));

create policy conversations_requester_insert
on public.conversations for insert to authenticated
with check (
  requester_id = (select auth.uid())
  and owner_id <> (select auth.uid())
  and status = 'pending'
  and responded_at is null
  and collection_share_id is not null
  and exists (
    select 1 from public.collection_shares s
    where s.id = conversations.collection_share_id
      and s.user_id = conversations.owner_id
      and s.product_id = conversations.product_id
      and s.release_id = conversations.release_id
      and s.share_mode = 'open_to_offers'
  )
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.username = conversations.requester_username
  )
  and exists (
    select 1 from public.collector_profiles cp
    where cp.user_id = conversations.owner_id
      and cp.username = conversations.owner_username
  )
  and not exists (
    select 1 from public.collector_blocks b
    where (b.blocker_id = conversations.requester_id and b.blocked_id = conversations.owner_id)
       or (b.blocker_id = conversations.owner_id and b.blocked_id = conversations.requester_id)
  )
);

create policy conversations_owner_update
on public.conversations for update to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and (
    status <> 'accepted'
    or (
      collection_share_id is not null
      and exists (
        select 1 from public.collection_shares s
        where s.id = conversations.collection_share_id
          and s.user_id = conversations.owner_id
          and s.product_id = conversations.product_id
          and s.release_id = conversations.release_id
          and s.share_mode = 'open_to_offers'
      )
      and not exists (
        select 1 from public.collector_blocks b
        where (b.blocker_id = conversations.requester_id and b.blocked_id = conversations.owner_id)
           or (b.blocker_id = conversations.owner_id and b.blocked_id = conversations.requester_id)
      )
    )
  )
);

create policy messages_participant_read
on public.messages for select to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.owner_id = (select auth.uid()) or c.requester_id = (select auth.uid()))
  )
);

create policy messages_participant_insert
on public.messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and c.status = 'accepted'
      and (c.owner_id = (select auth.uid()) or c.requester_id = (select auth.uid()))
      and not exists (
        select 1 from public.collector_blocks b
        where (b.blocker_id = c.requester_id and b.blocked_id = c.owner_id)
           or (b.blocker_id = c.owner_id and b.blocked_id = c.requester_id)
      )
  )
);

-- Conversation identity/context is immutable. Only the owner-controlled status
-- transition and timestamps may change after creation.
create or replace function public.guard_conversation_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.collection_share_id is distinct from old.collection_share_id
     or new.product_id is distinct from old.product_id
     or new.release_id is distinct from old.release_id
     or new.owner_id is distinct from old.owner_id
     or new.requester_id is distinct from old.requester_id
     or new.owner_username is distinct from old.owner_username
     or new.requester_username is distinct from old.requester_username
     or new.request_message is distinct from old.request_message
     or new.created_at is distinct from old.created_at then
    raise exception 'Conversation identity and request context are immutable';
  end if;

  if old.status <> 'pending' and new.status is distinct from old.status then
    raise exception 'Conversation status is final once answered';
  end if;

  if old.status = 'pending' and new.status not in ('pending', 'accepted', 'declined') then
    raise exception 'Invalid conversation status transition';
  end if;

  if new.status is distinct from old.status and new.status in ('accepted', 'declined') then
    new.responded_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.guard_conversation_update() from public;
grant execute on function public.guard_conversation_update() to authenticated;

create trigger conversations_guard_update
before update on public.conversations
for each row execute function public.guard_conversation_update();

-- Realtime only publishes the public.messages table. We do not touch the
-- internal Supabase `realtime` schema.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;
