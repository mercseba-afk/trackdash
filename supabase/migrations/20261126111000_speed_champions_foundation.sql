-- Dormant Speed Champions taxonomy and release extension.
-- No catalog releases are seeded by this migration. Production readers must
-- handle the LEGO category explicitly before releases enter the shared tables.
begin;

insert into public.brands (slug, name)
values ('lego', 'LEGO')
on conflict (slug) do nothing;

insert into public.categories (slug, name)
values ('speed-champions', 'LEGO Speed Champions')
on conflict (slug) do nothing;

create table public.lego_release_details (
  release_id uuid primary key references public.product_releases(id) on delete cascade,
  set_number text not null unique check (set_number ~ '^[0-9]{5}$'),
  piece_count integer not null check (piece_count > 0),
  car_count integer not null check (car_count > 0),
  car_brand text not null,
  subtheme text not null,
  official_catalog_status text not null
    check (official_catalog_status in ('available', 'retiring_soon', 'retired', 'unknown')),
  official_source_url text not null,
  status_checked_at date not null
);

alter table public.lego_release_details enable row level security;
revoke all on public.lego_release_details from public, anon, authenticated, trackdash_app, service_role;
grant select on public.lego_release_details to service_role;

commit;
