-- Dash-1 Emperor status refresh — 2026-09-28
--
-- Persists the verified current production status for ITEM 95622 after the
-- family re-audit. The live row was already corrected during close-out; this
-- migration keeps repository history reproducible and is idempotent.

update public.product_releases r
set production_status='discontinued',
    discontinued=true,
    status_checked_at=now(),
    notes=case
      when coalesce(notes,'') like '%Status refresh 2026-09-28:%' then notes
      else concat_ws(
        ' ',
        nullif(notes,''),
        'Status refresh 2026-09-28: official Tamiya USA currently marks ITEM 95622 Discontinued True.'
      )
    end,
    updated_at=now()
from public.products p
where r.product_id=p.id
  and p.slug='dash-1-emperor-18025'
  and r.item_number='95622'
  and r.release_year=2021;
