-- Correct the legacy RCJAZ Red Special endpoint identity.
-- The URL and catalog provenance are ITEM 94692 (2009), not ITEM 95425 (2018).
-- No market candidate has ever been created from this endpoint, so moving it
-- cannot detach or rewrite existing market evidence.

update public.market_scan_endpoints
set release_id='e07a5f39-d476-54c5-a509-4fb3ffb1a0ec'::uuid,
    exact_release_verified=true,
    updated_at=now()
where id='1adea652-29c0-4f8c-bf22-08b6bc8e3dab'::uuid
  and source_id='c19c7599-69b4-4211-9ef0-f620845a689c'::uuid
  and endpoint_url='https://www.rcjaz.com/tamiya-94692-avante-mkiii-red-special-p-90012922.html';

update public.market_scan_queue q
set next_scan_at=now(), locked_until=null, updated_at=now()
where q.release_id in (
  'e07a5f39-d476-54c5-a509-4fb3ffb1a0ec'::uuid,
  '3ba49f54-21c9-532d-a34a-7b9e38668a6d'::uuid
)
and q.source_id='c19c7599-69b4-4211-9ef0-f620845a689c'::uuid;
