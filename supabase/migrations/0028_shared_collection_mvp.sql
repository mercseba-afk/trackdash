-- Shared Collection MVP
--
-- Privacy boundary:
--   collection_items remains owner-only and keeps purchase price/source/notes.
--   collector_profiles + collection_shares expose only the explicit, safe
--   projection needed for collector discovery and "open to offers".
--
-- New public-schema tables are explicitly GRANTed because Supabase no longer
-- guarantees automatic Data API exposure for newly-created tables.

create table if not exists public.collector_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  username text not null,
  country text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists collector_profiles_username_unique
  on public.collector_profiles(username);

create table if not exists public.collection_shares (
  id uuid primary key default gen_random_uuid(),
  collection_item_id uuid not null references public.collection_items(id) on delete cascade,
  user_id uuid not null references public.collector_profiles(user_id) on delete cascade,
  product_id uuid not null references public.products(id),
  release_id uuid not null references public.product_releases(id),
  condition text not null,
  share_mode text not null default 'showcase',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collection_shares_mode_check
    check (share_mode in ('showcase', 'open_to_offers')),
  constraint collection_shares_condition_check
    check (condition in ('Sealed', 'New / Opened', 'Built', 'Used', 'Incomplete'))
);

create unique index if not exists collection_shares_collection_item_unique
  on public.collection_shares(collection_item_id);
create index if not exists idx_collection_shares_user
  on public.collection_shares(user_id);
create index if not exists idx_collection_shares_product
  on public.collection_shares(product_id);
create index if not exists idx_collection_shares_release
  on public.collection_shares(release_id);

alter table public.collector_profiles enable row level security;
alter table public.collection_shares enable row level security;

-- Explicit Data API grants. No anon access: collector discovery is available
-- only to signed-in TrackDash users in this MVP.
grant select, insert, update, delete on table public.collector_profiles to authenticated;
grant select, insert, update, delete on table public.collection_shares to authenticated;

-- Public-safe profile projection. This table deliberately contains no email,
-- preferred currency or any other private profile field.
drop policy if exists collector_profiles_authenticated_read on public.collector_profiles;
create policy collector_profiles_authenticated_read
  on public.collector_profiles
  for select
  to authenticated
  using (true);

drop policy if exists collector_profiles_owner_insert on public.collector_profiles;
create policy collector_profiles_owner_insert
  on public.collector_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists collector_profiles_owner_update on public.collector_profiles;
create policy collector_profiles_owner_update
  on public.collector_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists collector_profiles_owner_delete on public.collector_profiles;
create policy collector_profiles_owner_delete
  on public.collector_profiles
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Shared rows are readable by any authenticated collector, but only the owner
-- can create/change/delete one. INSERT/UPDATE additionally prove that the
-- public snapshot exactly matches an owner-visible private collection item.
drop policy if exists collection_shares_authenticated_read on public.collection_shares;
create policy collection_shares_authenticated_read
  on public.collection_shares
  for select
  to authenticated
  using (true);

drop policy if exists collection_shares_owner_insert on public.collection_shares;
create policy collection_shares_owner_insert
  on public.collection_shares
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.collection_items ci
      where ci.id = collection_item_id
        and ci.user_id = (select auth.uid())
        and ci.product_id = product_id
        and ci.release_id = release_id
        and ci.condition = condition
    )
  );

drop policy if exists collection_shares_owner_update on public.collection_shares;
create policy collection_shares_owner_update
  on public.collection_shares
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.collection_items ci
      where ci.id = collection_item_id
        and ci.user_id = (select auth.uid())
        and ci.product_id = product_id
        and ci.release_id = release_id
        and ci.condition = condition
    )
  );

drop policy if exists collection_shares_owner_delete on public.collection_shares;
create policy collection_shares_owner_delete
  on public.collection_shares
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
