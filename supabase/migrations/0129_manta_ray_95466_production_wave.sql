-- Keep ITEM 95466 as one collector Release with two production waves.
-- Tamiya documents the original March 2019 release and a later 2023-08-26
-- production/release wave under the same Item Number, JAN and specification.
-- With no reliable physical discriminator, TrackDash intentionally does not
-- split these waves into separate collector Releases.

update public.product_releases
set edition_name='Manta Ray Mk.II Black Special',
    notes='Single collector Release under ITEM 95466 / JAN 4950344954667. First released in March 2019 (exact date 2019-03-02 from contemporary retail metadata). Tamiya later records a new production/release wave on 2023-08-26 under the same Item Number, JAN and specification. No reliable physical discriminator between the 2019 and 2023 waves is currently documented, so TrackDash intentionally keeps one Release and treats 2023 as production history rather than a separate collector Release.',
    description='Manta Ray Mk.II Black Special ITEM 95466, first released in 2019 and produced again in an identical 2023 wave. TrackDash keeps both production waves under one collector Release.',
    description_it='Manta Ray Mk.II Black Special ITEM 95466, uscita inizialmente nel 2019 e prodotta nuovamente con una wave identica nel 2023. TrackDash mantiene entrambe le wave produttive sotto un’unica Release collezionistica.',
    updated_at=now()
where id='b2805fb7-cdd3-5dbf-a724-f73d54702844'::uuid;

update public.release_sources
set notes='Official Tamiya page confirms ITEM 95466, Black Special specification, MS chassis, first release in March 2019 and a later 2023-08-26 production/release wave under the same product identity.',
    checked_at=date '2026-09-21'
where release_id='b2805fb7-cdd3-5dbf-a724-f73d54702844'::uuid
  and source_url='https://www.tamiya.com/japan/products/95466/index.html';
