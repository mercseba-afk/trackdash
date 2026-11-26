import { readFileSync } from "node:fs"

const sets = JSON.parse(
  readFileSync(new URL("../lib/lego/pilot-data.json", import.meta.url), "utf8"),
)

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const statuses = new Set(["available", "retiring_soon", "retired", "unknown"])
const numbers = new Set()
const identities = new Set()

for (const set of sets) {
  if (!/^[0-9]{5}$/.test(set.setNumber) || numbers.has(set.setNumber)) {
    throw new Error(`Invalid or duplicate LEGO set number: ${set.setNumber}`)
  }
  numbers.add(set.setNumber)
  for (const id of [set.productId, set.releaseId]) {
    if (!uuid.test(id) || identities.has(id)) throw new Error(`Invalid or duplicate identity for ${set.setNumber}`)
    identities.add(id)
  }
  if (!statuses.has(set.status) || !Number.isInteger(set.pieces) || set.pieces < 1 ||
      !Number.isInteger(set.carCount) || set.carCount < 1 || !Number.isInteger(set.year) ||
      new URL(set.sourceUrl).hostname !== "www.lego.com") {
    throw new Error(`Invalid catalog metadata for ${set.setNumber}`)
  }
}
if (numbers.size === 0) throw new Error("The LEGO pilot manifest is empty")

const literal = (value) => "'" + String(value).replaceAll("'", "''") + "'"

console.log(`-- Generated from lib/lego/pilot-data.json. Run only on the disposable preview DB.
begin;
do $$ begin
  if current_database() <> 'trackdash_speed_preview' then
    raise exception 'The Speed Champions seed requires trackdash_speed_preview';
  end if;
  if not exists (select 1 from public.categories where slug='speed-champions')
    or not exists (select 1 from public.brands where slug='lego') then
    raise exception 'Apply the Speed Champions foundation first';
  end if;
end $$;

create temp table speed_seed on commit drop as
select (entry->>'productId')::uuid as product_id, (entry->>'releaseId')::uuid as release_id,
       entry->>'setNumber' as set_number, entry->>'name' as name,
       (entry->>'year')::integer as release_year, entry->>'carBrand' as car_brand,
       (entry->>'carCount')::integer as car_count, (entry->>'pieces')::integer as pieces,
       entry->>'series' as subtheme, entry->>'status' as status,
       (entry->>'statusCheckedAt')::date as checked_at, entry->>'sourceUrl' as source_url,
       entry->>'yearSourceUrl' as year_source_url,
       entry->>'boxImage' as box_image_url, entry->>'modelImage' as model_image_url,
       entry->>'boxImageKind' as box_image_kind
from jsonb_array_elements(${literal(JSON.stringify(sets))}::jsonb) as entry;

do $$ begin
  if exists (
    select 1 from speed_seed s
    join public.products p on p.id=s.product_id or p.slug='lego-speed-champions-' || s.set_number
    join public.categories c on c.id=p.category_id
    where c.slug <> 'speed-champions' or p.id <> s.product_id
      or p.slug <> 'lego-speed-champions-' || s.set_number
  ) or exists (
    select 1 from speed_seed s
    join public.product_releases r on r.id=s.release_id
    where r.product_id <> s.product_id or r.item_number is not null
  ) then
    raise exception 'LEGO seed identity collides with an existing product or release';
  end if;
end $$;

insert into public.products (id,category_id,brand_id,slug,name,series,metadata)
select s.product_id,c.id,b.id,'lego-speed-champions-' || s.set_number,s.name,'Speed Champions',
       jsonb_build_object('launch_status','coming_soon','catalog_import','speed_champions_pilot')
from speed_seed s
cross join (select id from public.categories where slug='speed-champions') c
cross join (select id from public.brands where slug='lego') b
on conflict (id) do nothing;

insert into public.product_releases
  (id,product_id,release_type,edition_type,edition_name,release_year,is_original,
   data_source,verification_status,production_status,discontinued,status_checked_at,
   catalog_visibility,catalog_visibility_reason)
select release_id,product_id,'Original','original',name,release_year,true,
       'lego_pilot_manifest','verified',case when status='retired' then 'discontinued' else 'unknown' end,
       status='retired',checked_at::timestamp at time zone 'UTC',
       'research_only','speed_champions_private_preview'
from speed_seed
on conflict (id) do nothing;

insert into public.lego_release_details
  (release_id,set_number,piece_count,car_count,car_brand,subtheme,
   official_catalog_status,official_source_url,status_checked_at)
select release_id,set_number,pieces,car_count,car_brand,subtheme,status,source_url,checked_at
from speed_seed
on conflict (release_id) do nothing;

insert into public.release_identifiers
  (release_id,scheme,value,is_primary,verification_status,source_url,checked_at)
select release_id,'lego_set_number',set_number,true,'verified',source_url,checked_at
from speed_seed on conflict do nothing;

insert into public.release_sources
  (release_id,source_type,source_url,verified_fields,checked_at,notes)
select s.release_id,v.source_type,v.url,v.fields,s.checked_at,v.notes
from speed_seed s cross join lateral (values
  ('official_manufacturer',s.source_url,array['setNumber','name','pieces','officialCatalogStatus'],
   'Official image references (' || s.box_image_kind || '): ' || s.box_image_url || ' · ' || s.model_image_url),
  ('trusted_secondary',s.year_source_url,array['releaseYear'],'Set-specific catalog year')
) v(source_type,url,fields,notes)
where not exists (select 1 from public.release_sources x where x.release_id=s.release_id and x.source_url=v.url);

insert into public.release_images (release_id,url,position)
select s.release_id, '/speed-champions/images/' || s.set_number || '-' || v.kind || '.jpg',v.position
from speed_seed s cross join (values ('box',0),('model',1)) v(kind,position)
where not exists (select 1 from public.release_images i where i.release_id=s.release_id and i.position=v.position);

update public.products p set canonical_release_id=s.release_id,updated_at=now()
from speed_seed s where p.id=s.product_id and p.canonical_release_id is null;

select count(*) as preview_sets
from speed_seed s join public.lego_release_details d
on d.release_id=s.release_id and d.set_number=s.set_number;
commit;`)
