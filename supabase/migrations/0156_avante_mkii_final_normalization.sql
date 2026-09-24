-- Avante Mk.II final catalog normalization — 2026-09-24
-- Keeps the commercial identity "Finished Model" in edition_name/description,
-- while normalizing release_type to TrackDash's controlled UI vocabulary.

begin;

update public.product_releases
set release_type='Other',
    notes=case
      when coalesce(notes,'') like '%release_type normalized to Other%' then notes
      else concat_ws(' ',nullif(notes,''),
        'TrackDash final QA 2026-09-24: commercial identity remains Finished Model; release_type normalized to Other because Finished Model is not part of the controlled ReleaseType UI vocabulary.')
    end,
    updated_at=now()
where id='6d4a4979-c006-5d28-a26c-448fa19d1dcf'::uuid
  and item_number='94592';

commit;
