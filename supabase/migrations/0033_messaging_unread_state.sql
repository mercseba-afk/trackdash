-- Per-user read cursors for message/request notification badges.
-- A row exists only for a conversation the authenticated participant has opened.

create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists idx_conversation_reads_user
  on public.conversation_reads (user_id, last_read_at);

alter table public.conversation_reads enable row level security;

revoke all on table public.conversation_reads from public, anon;
grant select, insert, update on table public.conversation_reads to authenticated;

create policy conversation_reads_owner_select
  on public.conversation_reads
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = (select auth.uid()) or c.requester_id = (select auth.uid()))
    )
  );

create policy conversation_reads_owner_insert
  on public.conversation_reads
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = (select auth.uid()) or c.requester_id = (select auth.uid()))
    )
  );

create policy conversation_reads_owner_update
  on public.conversation_reads
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = (select auth.uid()) or c.requester_id = (select auth.uid()))
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = (select auth.uid()) or c.requester_id = (select auth.uid()))
    )
  );

-- Pending requests should update the Messages badge immediately too. Keep this
-- limited to the public application table; do not modify Supabase's realtime schema.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end
$$;
