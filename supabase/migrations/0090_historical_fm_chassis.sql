-- Vintage 100 Pilot — historical FM chassis vocabulary alignment.
--
-- 0089 intentionally left Crimson Glory (18032) and Dash-02 Neo Burning Sun
-- (18034) chassis NULL because TrackDash's TypeScript chassis vocabulary did
-- not yet include the historical "FM" platform. The app vocabulary now models
-- FM explicitly and distinctly from the later FM-A chassis, so these verified
-- catalog facts can be persisted without coercion.
--
-- No market observations, values, trends, liquidity or release identities are
-- changed by this migration.

update product_releases
set chassis = 'FM',
    notes = 'Tamiya identifies ITEM 18032 as an FM-chassis machine. Official release-month evidence places it in November 1990; exact day remains unset.',
    updated_at = now()
where id = '5132b078-5f0d-55bd-9673-d73efb7a601c'
  and item_number = '18032';

update products
set chassis = 'FM',
    updated_at = now()
where id = 'fb1e4d46-96e6-52e9-9017-baa3799ae060'
  and canonical_release_id = '5132b078-5f0d-55bd-9673-d73efb7a601c';

update release_sources
set verified_fields = array['itemNumber','editionName','chassis']::text[],
    notes = 'Official Tamiya product page identifies ITEM 18032 Crimson Glory on the historical FM chassis.'
where id = 'd7712d90-af26-5a74-957d-5be39dab0b97';

update product_releases
set chassis = 'FM',
    notes = 'Tamiya identifies ITEM 18034 as an FM-chassis machine. Official release-month evidence places it in June 1991; exact day remains unset.',
    updated_at = now()
where id = 'b6d59af9-6b3c-51be-8046-02faa28e7d97'
  and item_number = '18034';

update products
set chassis = 'FM',
    updated_at = now()
where id = '2a6f40df-f87d-5184-82b7-578c4ee857fc'
  and canonical_release_id = 'b6d59af9-6b3c-51be-8046-02faa28e7d97';

update release_sources
set verified_fields = array['itemNumber','editionName','chassis']::text[],
    notes = 'Official Tamiya product page identifies ITEM 18034 Dash-02 Neo Burning Sun on the historical FM chassis.'
where id = '2dddfb00-2327-59fc-89e3-e9d5c18014cd';
