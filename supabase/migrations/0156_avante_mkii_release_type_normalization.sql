-- Avante Mk.II final catalog normalization — 2026-09-24
-- "Finished Model" is an exact commercial identity, but not a member of the
-- application's controlled ReleaseType vocabulary. Preserve the identity in
-- edition_name/description/notes and use the canonical technical fallback.

begin;

update public.product_releases
set release_type='Other',
    notes=case
      when coalesce(notes,'') like '%controlled ReleaseType normalization%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash 2026-09-24 controlled ReleaseType normalization: the exact commercial identity remains Finished Model in edition_name/description; release_type uses the application-supported Other fallback.')
    end,
    updated_at=now()
where id='6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid
  and release_type is distinct from 'Other';

commit;
