-- Dash-3 Shooting Star image-audit note correction — 2026-09-28
--
-- 0191 successfully raised exact/high-confidence stored coverage to 7/8.
-- This migration refreshes the explanatory metadata so it no longer describes
-- the pre-backfill 2/8 state.

update public.products
set metadata=jsonb_set(
      coalesce(metadata,'{}'::jsonb),
      '{image_audit,notes}',
      to_jsonb(
        'Second-pass external-source recovery completed 2026-09-28. Exact Suruga CDN heroes were accepted for ITEM 94820 and Dragontail ITEMs 92338-92341 using the same stable management-ID pattern already used by TrackDash across completed Mini 4WD families. Coverage is now 7/8. Only the 1989 Ondawara original remains intentionally without a hero because its image must discriminate the vintage packaging generation from the later ITEM 18019 reissue.'::text
      ),
      true
    ),
    updated_at=now()
where slug='dash-3-shooting-star-18703';
