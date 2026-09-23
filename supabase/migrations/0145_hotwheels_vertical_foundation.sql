-- Hot Wheels vertical foundation.
--
-- Adds only dormant reference identities. No Hot Wheels products/releases are
-- inserted here, so existing Mini 4WD catalog behaviour remains unchanged.
--
-- IDs are deterministic UUIDv5 values derived from TrackDash stable keys:
-- brand:mattel / category:hotwheels.

insert into public.brands (id, slug, name)
values ('6f100164-74bd-56bd-9dd1-221ea269ed8a', 'mattel', 'Mattel')
on conflict do nothing;

insert into public.categories (id, slug, name)
values ('cdaaff01-f4f9-52ff-951a-ddbbba542d5c', 'hotwheels', 'Hot Wheels')
on conflict do nothing;
