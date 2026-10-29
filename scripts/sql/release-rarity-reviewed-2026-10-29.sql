-- Reviewed editorial batch; evidence: docs/RELEASE_RARITY_ASSESSMENTS_2026-10-29.json
-- Expected baseline: all 24 exact editions have NULL rarity. Abort on drift.
-- No catalog identity, price, visibility, production status or scan changes.
begin;
do $review$
declare
  assessment jsonb := $data$[{"family":"aero-avante-18626","item":"18701","edition":"Aero Avante (AR Chassis)","year":2012,"rarity":"Common"},{"family":"aero-manta-ray-18703","item":"18703","edition":"Aero Manta Ray (AR Chassis)","year":2013,"rarity":"Common"},{"family":"aero-avante-18626","item":"18706","edition":"Mini 4WD Starter Pack AR Speed Type — Aero Avante","year":2017,"rarity":"Common"},{"family":"hotshot-jr-18001","item":"18624","edition":"Hotshot Jr. — MS Chassis","year":2008,"rarity":"Common"},{"family":"dash-2-burning-sun-18702","item":"18628","edition":"Dash-2 Burning Sun — 2008 MS Chassis","year":2008,"rarity":"Common"},{"family":"dash-3-shooting-star-18703","item":"18630","edition":"Dash-3 Shooting Star — 2008 MS Chassis","year":2008,"rarity":"Common"},{"family":"thunder-dragon-jr-18008","item":"95336","edition":"Thunder Dragon — Clear Special (Polycarbonate Body)","year":2017,"rarity":"Common"},{"family":"aero-avante-18626","item":"94944","edition":"Aero Avante Red Special (AR Chassis)","year":2013,"rarity":"Uncommon"},{"family":"aero-avante-18626","item":"95024","edition":"Aero Avante Clear Blue Special (AR Chassis)","year":2014,"rarity":"Uncommon"},{"family":"aero-avante-18626","item":"95038","edition":"Aero Avante Clear Red Special (AR Chassis)","year":2014,"rarity":"Uncommon"},{"family":"aero-avante-18626","item":"95058","edition":"Aero Avante Clear Pink Special (AR Chassis)","year":2014,"rarity":"Uncommon"},{"family":"aero-avante-18626","item":"95083","edition":"Aero Avante Clear Orange Special (AR Chassis)","year":2015,"rarity":"Uncommon"},{"family":"avante-jr-18014","item":"95060","edition":"Avante Jr. Yellow Special (Clear Body)","year":2015,"rarity":"Uncommon"},{"family":"aero-avante-18626","item":"95655","edition":"Aero Avante Asia Challenge 2024 Special (AR Chassis)","year":2024,"rarity":"Uncommon"},{"family":"hotshot-jr-18001","item":"92435","edition":"Hotshot Jr. — SMC Mall Limited Edition","year":2021,"rarity":"Uncommon"},{"family":"dash-1-emperor-18025","item":"95110","edition":"Dash-1 Emperor Memorial (MS Chassis) 30 Years of the Japan Cup","year":2018,"rarity":"Uncommon"},{"family":"dash-1-emperor-18025","item":"95622","edition":"Dash-1 Emperor (Type 3 Chassis) Special Kit (2021 Reissue)","year":2021,"rarity":"Uncommon"},{"family":"aero-manta-ray-18703","item":"95295","edition":"Aero Manta Ray White Special (2017 Reissue)","year":2017,"rarity":"Uncommon"},{"family":"aero-manta-ray-18703","item":"95419","edition":"Aero Manta Ray Black Special (AR Chassis)","year":2018,"rarity":"Uncommon"},{"family":"avante-jr-18014","item":"95501","edition":"Avante Jr. Black Special (2021 Reissue)","year":2021,"rarity":"Uncommon"},{"family":"aero-avante-18626","item":"92441","edition":"ADVAN Aero Avante Limited (AR Chassis)","year":2023,"rarity":"Uncommon"},{"family":"super-dragon-jr-18007","item":"18067","edition":"Super Dragon Premium — VS Chassis","year":2012,"rarity":"Uncommon"},{"family":"thunder-dragon-jr-18008","item":"18068","edition":"Thunder Dragon Premium — VS Chassis","year":2012,"rarity":"Uncommon"},{"family":"avante-jr-18014","item":"18058","edition":"Avante RS","year":2004,"rarity":"Uncommon"}]$data$::jsonb;
  matched integer;
  changed integer;
  before_other_fields jsonb;
  after_other_fields jsonb;
  before_existing_labels jsonb;
  after_existing_labels jsonb;
begin
  select jsonb_agg(to_jsonb(r) - 'rarity' - 'updated_at' order by r.id),
         jsonb_agg(jsonb_build_object('id',r.id,'rarity',r.rarity) order by r.id) filter(where r.rarity is not null)
  into before_other_fields,before_existing_labels from public.product_releases r;
  select count(*) into matched
  from jsonb_to_recordset(assessment) as e(family text,item text,edition text,year integer,rarity text)
  join public.products p on p.slug=e.family
  join public.brands b on b.id=p.brand_id and b.slug='tamiya'
  join public.product_releases r on r.product_id=p.id and r.item_number is not distinct from e.item
    and r.edition_name=e.edition and r.release_year=e.year
  where r.rarity is null and r.catalog_visibility <> 'research_only'
    and coalesce(p.metadata->>'catalog_visibility','') <> 'archived'
    and coalesce(p.metadata->>'launch_status','') <> 'coming_soon';
  if matched <> 24 then raise exception 'Rarity review baseline drift: expected 24 exact NULL releases, got %',matched; end if;
  update public.product_releases r set rarity=e.rarity,updated_at=now()
  from jsonb_to_recordset(assessment) as e(family text,item text,edition text,year integer,rarity text),
       public.products p,public.brands b
  where p.slug=e.family and b.id=p.brand_id and b.slug='tamiya' and r.product_id=p.id
    and r.item_number is not distinct from e.item and r.edition_name=e.edition and r.release_year=e.year
    and r.rarity is null and e.rarity in ('Common','Uncommon');
  get diagnostics changed=row_count;
  if changed <> 24 then raise exception 'Expected 24 rarity updates, got %',changed; end if;
  select jsonb_agg(to_jsonb(r) - 'rarity' - 'updated_at' order by r.id),
         jsonb_agg(jsonb_build_object('id',r.id,'rarity',r.rarity) order by r.id)
           filter(where r.id in (select (x->>'id')::uuid from jsonb_array_elements(before_existing_labels) x))
  into after_other_fields,after_existing_labels from public.product_releases r;
  if after_other_fields is distinct from before_other_fields then
    raise exception 'Unexpected change to a field other than rarity/updated_at';
  end if;
  if after_existing_labels is distinct from before_existing_labels then
    raise exception 'Unexpected change to an existing rarity label';
  end if;
end $review$;
commit;
select r.rarity,count(*) releases from public.product_releases r
join public.products p on p.id=r.product_id join public.brands b on b.id=p.brand_id
where b.slug='tamiya' and r.catalog_visibility <> 'research_only'
  and coalesce(p.metadata->>'catalog_visibility','') <> 'archived'
  and coalesce(p.metadata->>'launch_status','') <> 'coming_soon'
group by r.rarity order by r.rarity nulls last;
