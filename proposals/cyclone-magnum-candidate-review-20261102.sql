-- Applied 2026-11-02 after initial scans; ambiguous two-product title.
begin;
update market_candidates set decision='needs_review',review_notes=concat_ws(E'\n',review_notes,'2026-11-02 Cyclone family audit: title includes both Hurricane Sonic 19441 and Cyclone Magnum 19440; exact single-kit price not verified. Exclude pending manual validation.'),needs_revalidation=true where id='5dd3d860-0eaf-4719-8053-a0383014aaa7' and decision='accepted';
select trackdash_enqueue_market_recompute('85a3549a-d563-5dda-bc6d-bd1ac684601e','new_complete_unbuilt');
commit;
