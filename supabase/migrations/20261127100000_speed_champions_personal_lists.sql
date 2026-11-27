create table public.lego_personal_list_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  set_number text not null check (set_number ~ '^[0-9]{5}$'),
  list_kind text not null check (list_kind in ('collection', 'wishlist')),
  quantity smallint not null default 1 check (quantity between 1 and 99),
  condition text check (condition in ('sealed', 'opened_complete', 'incomplete')),
  primary key (user_id, list_kind, set_number),
  check (
    (list_kind = 'collection' and condition is not null)
    or (list_kind = 'wishlist' and condition is null and quantity = 1)
  )
);

alter table public.lego_personal_list_items enable row level security;
revoke all on public.lego_personal_list_items from public, anon, authenticated;
grant select, insert, update, delete on public.lego_personal_list_items to authenticated;

create policy lego_personal_list_owner on public.lego_personal_list_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
