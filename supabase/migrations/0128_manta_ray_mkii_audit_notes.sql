-- Preserve the single intentional image gap discovered during the
-- end-to-end Manta Ray Mk.II family audit.

update public.product_releases
set notes = 'Exact image intentionally unresolved after the 2026-09-21 audit: contemporary sources verify this event-only Silver Metallic semi-finished Release, but no attributable product photo was found. TrackDash shows the explicit placeholder rather than another Manta Ray variant.'
where id='9a231f02-7a7e-5489-b44d-b4eb10b60a78'::uuid;
