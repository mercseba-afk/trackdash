-- Thunder Shot Jr. controlled family re-audit — 2026-09-26
--
-- Canonical researched family: 16 identities.
-- Public: 15. Research-only: Mazda promotional identity until its conflicting
-- ITEM 92006 / 92008 evidence is resolved and an exact image/market gate is met.
-- Shared ITEM 18009 generations remain fail-closed for unattended eBay attribution.

begin;

update public.products
set slug='thunder-shot-jr-18009',
    canonical_item_number='18009',
    canonical_release_id='dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087'::uuid,
    original_release_year=1988,
    series='Racing Mini 4WD',
    chassis='Type 1',
    description='Thunder Shot Jr. is Tamiya Racing Mini 4WD No.9, first released in 1988. The collector family spans the original and Black Special, rare Shonen Jump and TKC promotional variants, the 1998 Memorial reissue, RS and later reissues, the Open Top, four Excalibur prize colors and two Legend Style plated editions.',
    description_it='Thunder Shot Jr. è la Racing Mini 4WD No.9 di Tamiya, nata nel 1988. La famiglia collezionistica comprende originale e Black Special, rare promozionali Shonen Jump e TKC, la Memorial 1998, RS e ristampe successive, Open Top, quattro Excalibur e due Legend Style.',
    metadata='{"catalog_audit":"2026-09-26","canonical_release_count":16,"catalog_publication_gate":{"version":"2026-09-26","public_release_count":15,"market_value_required":false,"research_only_release_count":1}}'::jsonb,
    updated_at=now()
where id='059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid;

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  'dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'18009','Original','Thunder Shot Jr. — 1988 Original',
  1988,'1988-03-24'::date,'Type 1',null,'White body / black Type 1 chassis / white wheels / black spike tires',
  'Global / Japan',600,null,'Controlled re-audit 2026-09-26. Original Ooshika-era collector Release. Current ITEM 18009 manufacturer imagery belongs to the later reissue line and is not reused as the 1988 hero. Contemporary collector/buyback references explicitly distinguish Ooshika original packaging from reissues.',true,true,
  'Rare','master_reaudit_20260926','original','verified','discontinued',now(),
  'Original 1988 Thunder Shot Jr. on Type 1 chassis, ITEM 18009.','Thunder Shot Jr. originale del 1988 su telaio Type 1, ITEM 18009.','public','publication_gate:credible_exact_release_market_identity_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  '120cc63c-a356-46f3-ac03-c6c249ec9ad9'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,null,'Promotional','Thunder Shot Jr. — Mazda Promotional Version',
  1988,null,'Type 1',null,'Mazda promotional markings; exact item identifier unresolved',
  'Japan',null,null,'Controlled re-audit 2026-09-26. The Mazda promotional identity is corroborated by collector references, but the item number conflicts between 92006 and 92008. Identity is retained for research without inventing a canonical Item Number. No stable exact image or sufficiently discriminated exact market evidence is persisted yet.',true,false,
  'Very Rare','master_reaudit_20260926','special','partial','discontinued',now(),
  'Historical Mazda promotional Thunder Shot Jr.; exact Item Number remains unresolved.','Thunder Shot Jr. promozionale Mazda storica; Item Number esatto ancora irrisolto.','research_only','publication_gate:missing_exact_image_and_resolved_identifier_market_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  '69c722a6-0b67-4f37-b056-14dbb47d570c'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'18009','Prize Promotional','Thunder Shot Jr. — Shonen Jump 20th Anniversary Prize Version',
  1988,null,'Type 1',null,'White base kit / Shonen Jump–Dragon Ball promotional sticker specification',
  'Japan',null,null,'Controlled re-audit 2026-09-26. Exact Mandarake auction identity: Thunder Shot Jr. Shonen Jump Version (Ooshika 18009). The 1988 Weekly Shonen Jump / Dragon Ball anniversary contest documentation corroborates the prize context. Shared ITEM 18009 remains fail-closed for unattended matching.',true,false,
  'Very Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  'Rare 1988 Shonen Jump anniversary prize Thunder Shot Jr., based on Ooshika ITEM 18009 with special promotional graphics.','Rara Thunder Shot Jr. premio Shonen Jump del 1988, basata sulla Ooshika ITEM 18009 con grafica promozionale dedicata.','public','publication_gate:credible_exact_release_market_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  'f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'18013','Color Special','Thunder Shot Jr. Black Special — 1988',
  1988,'1988-11-09'::date,'Type 1','4950344180134','Smoke body / red Type 1 chassis / dark-silver wheels / red spike tires',
  'Global / Japan',600,null,'Controlled re-audit 2026-09-26. First-era Black Special. Later availability with the same ITEM/JAN/spec is treated as production/restock history, not a second collector Release. The 2005 Memorial Box Vol.4 copy belongs to a five-car set and is not split into a standalone Release.',false,false,
  'Rare','master_reaudit_20260926','color_special','verified','active',now(),
  'Thunder Shot Jr. Black Special with smoke body and red Type 1 chassis, ITEM 18013.','Thunder Shot Jr. Black Special con carrozzeria smoke e telaio Type 1 rosso, ITEM 18013.','public','publication_gate:exact_official_release_image_and_market_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  '2b0a5772-f849-4b0e-87b9-0b271f75b2d7'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'92078','Promotional','Thunder Shot Jr. — TKC Version 1992',
  1992,null,'Type 1',null,'Gray body / TKC-DATEV special decals',
  'Japan / Germany',null,null,'Controlled re-audit 2026-09-26. Mandarake identifies ITEM 92078, issue 1992, unassembled, and documents distribution at the DATEV/TKC Nuremberg business show on 1992-09-17/18. Distinct from the later 1999 TKC custom ITEM 18009.',true,false,
  'Very Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  '1992 TKC / DATEV promotional Thunder Shot Jr., ITEM 92078.','Thunder Shot Jr. promozionale TKC / DATEV del 1992, ITEM 92078.','public','publication_gate:credible_exact_release_market_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  '73963651-b010-45ce-a5fe-2c1530a7eb1c'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'18009','Limited Reissue','Thunder Shot Jr. — 1998 Memorial Edition (Limited Reissue)',
  1998,null,'Type 1',null,'White body / Memorial original-spec limited-reissue packaging',
  'Japan',600,null,'Controlled re-audit 2026-09-26. Exact Suruga record identifies the original-spec limited reissue. Recent Yahoo completed sales explicitly identify the 1998 / limited-reissue packaging.',true,false,
  'Rare','master_reaudit_20260926','reissue','verified','discontinued',now(),
  '1998 Memorial / original-spec limited reissue of Thunder Shot Jr., retaining ITEM 18009.','Memorial / ristampa limitata 1998 in specifica originale della Thunder Shot Jr., ancora ITEM 18009.','public','publication_gate:exact_high_confidence_release_image_and_sold_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  '441a89cb-8e21-4616-ae6a-62c047ad26c5'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'18009','Promotional','Thunder Shot Jr. — TKC Nuremberg 1999 Custom',
  1999,null,'Type 1',null,'TKC 1999 Nuremberg business-show commemorative markings',
  'Japan / Germany',null,null,'Controlled re-audit 2026-09-26. Suruga identifies a distinct 1999 Nuremberg Business Show commemorative TKC custom based on ITEM 18009. It is not the 1992 ITEM 92078 TKC Version.',true,false,
  'Very Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  'Distinct 1999 TKC Nuremberg commemorative Thunder Shot Jr. custom based on ITEM 18009.','Distinta Thunder Shot Jr. TKC commemorativa Norimberga 1999 basata su ITEM 18009.','public','publication_gate:exact_high_confidence_release_image_and_market_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  'ba9bceb4-d1b8-4826-90ea-68aa88479391'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'18059','RS','Thunder Shot RS — VS Chassis',
  2005,'2005-02-14'::date,'VS','4950344180592','White body / black VS chassis / silver-plated large mesh wheels / black slick tires',
  'Global / Japan',800,null,'Controlled re-audit 2026-09-26. Official Tamiya confirms ITEM 18059 / VS. HLJ records release 2005-02-14 and JAN 4950344180592. Recent exact unassembled Yahoo completed-sale evidence is persisted separately.',true,false,
  'Uncommon','master_reaudit_20260926','reissue','verified','discontinued',now(),
  '2005 Thunder Shot RS reinterpretation on VS chassis, ITEM 18059.','Thunder Shot RS 2005 reinterpretata su telaio VS, ITEM 18059.','public','publication_gate:exact_high_confidence_release_image_and_sold_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  '104354b5-0c00-440f-aaa4-ba8e11f56a74'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'18009','Reissue','Thunder Shot Jr. — 2006 Reissue',
  2006,'2006-06-23'::date,'Type 1','4950344992065','White body / black Type 1 chassis / white wheels / black spike tires',
  'Global / Japan',700,null,'Controlled re-audit 2026-09-26. HLJ records JAN 4950344992065 and release 2006-06-23. A September 2007 re-release is treated as a production wave of this same collector Release because no separate JAN/spec discriminator is established. Current Tamiya catalog imagery belongs to this reissue line.',false,false,
  'Uncommon','master_reaudit_20260926','reissue','verified','active',now(),
  'Modern ITEM 18009 reissue line first documented in 2006, with 2007 production wave.','Linea moderna di ristampa ITEM 18009 documentata dal 2006, con wave produttiva nel 2007.','public','publication_gate:exact_official_release_image',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  'c4a65d32-d9e6-430a-9aef-23fd876d260a'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'94814','Limited','Thunder Shot Open Top — Super XX Chassis',
  2011,null,'Super XX','4950344948147','White open-top body / black Super XX chassis / purple A-parts / black wheels',
  'Global / Japan',1200,null,'Controlled re-audit 2026-09-26. Suruga confirms ITEM 94814, JAN 4950344948147, Super XX and JPY 1,320 tax-included MSRP. Historical sources conflict on the exact 2011 on-sale date (July vs October), so release_date remains NULL.',true,false,
  'Rare','master_reaudit_20260926','limited','verified','discontinued',now(),
  'Limited Thunder Shot Open Top on Super XX chassis, ITEM 94814.','Thunder Shot Open Top limitata su telaio Super XX, ITEM 94814.','public','publication_gate:exact_high_confidence_release_image_and_market_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  'c3d5dcbe-dcd7-4478-9713-7fed9632aacb'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'92253','Prize Limited','Thunder Shot Excalibur — Black',
  2013,null,'VS',null,'Black body / cyan VS chassis / silver-plated mesh wheels / white tires',
  'Japan',null,null,'Controlled re-audit 2026-09-26. Exact Suruga Tamiya/SK Japan record identifies ITEM 92253 Black. Prize-series sources place the Excalibur wave in July 2013.',true,false,
  'Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  '2013 SK Japan amusement-prize Thunder Shot Excalibur, Black, ITEM 92253.','Thunder Shot Excalibur premio amusement SK Japan 2013, Black, ITEM 92253.','public','publication_gate:exact_high_confidence_release_image',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  'cc365db8-7d04-4ba0-8aa7-f3f4251f30e0'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'92255','Prize Limited','Thunder Shot Excalibur — Clear Blue',
  2013,null,'VS',null,'Clear-blue body / cyan VS chassis / silver-plated mesh wheels / white tires',
  'Japan',null,null,'Controlled re-audit 2026-09-26. Family genealogy and SK Japan prize-series documentation identify ITEM 92255 Clear Blue on VS chassis. No stable exact hero asset is persisted yet.',true,false,
  'Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  '2013 SK Japan amusement-prize Thunder Shot Excalibur, Clear Blue, ITEM 92255.','Thunder Shot Excalibur premio amusement SK Japan 2013, Clear Blue, ITEM 92255.','public','publication_gate:credible_exact_current_market_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  '6e160808-24c4-4d03-8ac3-61c96ad29980'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'92254','Prize Limited','Thunder Shot Excalibur — Red',
  2013,null,'VS',null,'Red body / deep-blue VS chassis / silver-plated mesh wheels / cyan tires',
  'Japan',null,null,'Controlled re-audit 2026-09-26. Family genealogy and SK Japan prize-series documentation identify ITEM 92254 Red. An exact current/sold-out specialist marketplace page independently identifies ITEM 92254.',true,false,
  'Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  '2013 SK Japan amusement-prize Thunder Shot Excalibur, Red, ITEM 92254.','Thunder Shot Excalibur premio amusement SK Japan 2013, Red, ITEM 92254.','public','publication_gate:credible_exact_release_market_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  'b3d31445-fe5f-4128-ae07-262179e0f56f'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'92252','Prize Limited','Thunder Shot Excalibur — White',
  2013,null,'VS',null,'White body / deep-blue VS chassis / silver-plated mesh wheels / cyan tires',
  'Japan',null,null,'Controlled re-audit 2026-09-26. Exact Suruga Tamiya/SK Japan record identifies ITEM 92252 White as an amusement-prize original Mini 4WD on VS chassis. Prize-series sources place the Excalibur wave in July 2013.',true,false,
  'Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  '2013 SK Japan amusement-prize Thunder Shot Excalibur, White, ITEM 92252.','Thunder Shot Excalibur premio amusement SK Japan 2013, White, ITEM 92252.','public','publication_gate:exact_high_confidence_release_image',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  '7c183356-2414-43e3-a214-7416a26955c8'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'92314','Prize Limited','Thunder Shot Legend Style — Gold',
  2015,null,'VS',null,'Gold-plated body / black VS chassis / black wheels / gray tires',
  'Japan',null,null,'Controlled re-audit 2026-09-26. SK Japan prize announcement places Legend Style around 2015-06-24. RCJAZ independently identifies ITEM 92314 Gold plated on VS chassis.',true,false,
  'Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  '2015 SK Japan amusement-prize Thunder Shot Legend Style, Gold, ITEM 92314.','Thunder Shot Legend Style premio amusement SK Japan 2015, Gold, ITEM 92314.','public','publication_gate:credible_exact_release_market_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.product_releases(
  id,product_id,item_number,release_type,edition_name,release_year,release_date,chassis,barcode_jan,color,
  country_market,msrp_jpy,msrp_eur,notes,discontinued,is_original,rarity,data_source,edition_type,
  verification_status,production_status,status_checked_at,description,description_it,
  catalog_visibility,catalog_visibility_reason,catalog_visibility_updated_at
) values (
  'f6bc9832-bcb3-444a-9ec6-4d20b818d3d5'::uuid,'059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid,'92315','Prize Limited','Thunder Shot Legend Style — Silver',
  2015,null,'VS',null,'Silver-plated body / black VS chassis / white wheels / black tires',
  'Japan',null,null,'Controlled re-audit 2026-09-26. SK Japan prize announcement places Legend Style around 2015-06-24. RCJAZ independently identifies ITEM 92315 Silver plated on VS chassis.',true,false,
  'Rare','master_reaudit_20260926','special','verified','discontinued',now(),
  '2015 SK Japan amusement-prize Thunder Shot Legend Style, Silver, ITEM 92315.','Thunder Shot Legend Style premio amusement SK Japan 2015, Silver, ITEM 92315.','public','publication_gate:credible_exact_release_market_evidence',now()
)
on conflict(id) do update set
  item_number=excluded.item_number,release_type=excluded.release_type,edition_name=excluded.edition_name,
  release_year=excluded.release_year,release_date=excluded.release_date,chassis=excluded.chassis,
  barcode_jan=excluded.barcode_jan,color=excluded.color,country_market=excluded.country_market,
  msrp_jpy=excluded.msrp_jpy,msrp_eur=excluded.msrp_eur,notes=excluded.notes,
  discontinued=excluded.discontinued,is_original=excluded.is_original,rarity=excluded.rarity,
  data_source=excluded.data_source,edition_type=excluded.edition_type,
  verification_status=excluded.verification_status,production_status=excluded.production_status,
  status_checked_at=excluded.status_checked_at,description=excluded.description,description_it=excluded.description_it,
  catalog_visibility=excluded.catalog_visibility,catalog_visibility_reason=excluded.catalog_visibility_reason,
  catalog_visibility_updated_at=excluded.catalog_visibility_updated_at,updated_at=now();

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('ec4dba03-eab3-40cd-83c8-2d45e8e8e3f9'::uuid,'104354b5-0c00-440f-aaa4-ba8e11f56a74'::uuid,'trusted_secondary','https://www.hlj.com/thunder-shot-jr-tam18009',ARRAY['itemNumber','barcodeJAN','releaseDate']::text[],'2026-09-26'::date,'HLJ records JAN 4950344992065 and release 2006-06-23.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('7254cdb3-7d19-44ce-ab77-13a2d2d0c580'::uuid,'104354b5-0c00-440f-aaa4-ba8e11f56a74'::uuid,'official_manufacturer','https://www.tamiya.com/japan/products/18009/index.html',ARRAY['itemNumber','chassis','image']::text[],'2026-09-26'::date,'Current official ITEM 18009 product image/specification used for the modern reissue line.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('52878677-8156-4b16-ad21-f2420a7445db'::uuid,'120cc63c-a356-46f3-ac03-c6c249ec9ad9'::uuid,'trusted_secondary','https://mini-4wd.fandom.com/wiki/Thunder_Shot_Jr.',ARRAY['editionName','releaseYear']::text[],'2026-09-26'::date,'Corroborates Mazda promotional variant but reports ITEM 92008.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('e067eddb-c0a4-4805-8f57-d89c57026c74'::uuid,'120cc63c-a356-46f3-ac03-c6c249ec9ad9'::uuid,'trusted_secondary','https://w.atwiki.jp/mini_4wd/pages/153.html',ARRAY['editionName']::text[],'2026-09-26'::date,'Corroborates Mazda promotional variant but reports ITEM 92006; conflict intentionally unresolved.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('7846fee2-6319-4bf8-a6ca-9845120c8926'::uuid,'2b0a5772-f849-4b0e-87b9-0b271f75b2d7'::uuid,'trusted_secondary','https://k.mandarake.co.jp/auction/item/itemInfoEn.html?index=769477',ARRAY['itemNumber','editionName','releaseYear','marketContext']::text[],'2026-09-26'::date,'Mandarake exact 92078 / 1992 TKC version; unassembled, Nuremberg DATEV/TKC distribution context.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('cb809bae-f2d4-4a13-a81f-a9ed8c5ab80e'::uuid,'441a89cb-8e21-4616-ae6a-62c047ad26c5'::uuid,'trusted_secondary','https://www.suruga-ya.jp/product/detail/603092650',ARRAY['itemNumber','editionName','releaseYear','image','marketContext']::text[],'2026-09-26'::date,'Distinct 1999 Nuremberg Business Show TKC custom based on ITEM 18009.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('0981d6e3-8500-4d41-9752-9297da6232c4'::uuid,'69c722a6-0b67-4f37-b056-14dbb47d570c'::uuid,'trusted_secondary','https://ekizo.mandarake.co.jp/auction/item/itemsListEn.html?c=24&category=norimono&end=1&from=googlebot%28at%29googlebot.com&l=2&q=130&s=14&sort=3&time=0&type=-1',ARRAY['editionName','itemNumber','marketContext']::text[],'2026-09-26'::date,'Mandarake closed auction lists Thunder Shot Jr. Shonen Jump Version (Ooshika 18009), JPY 150,000.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('92f480ae-3d53-41c8-a92d-5c9c2d332e3a'::uuid,'69c722a6-0b67-4f37-b056-14dbb47d570c'::uuid,'trusted_secondary','https://thedaoofdragonball.com/blog/history/goku-lost-uniform-discovered/',ARRAY['releaseYear','editionName']::text[],'2026-09-26'::date,'Documents the 1988 Weekly Shonen Jump / Dragon Ball contest prize Thunder Shot Jr. with Toriyama-designed graphics.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('400c9c61-249c-4c87-8a5d-8fb857cbc636'::uuid,'6e160808-24c4-4d03-8ac3-61c96ad29980'::uuid,'trusted_secondary','https://shopee.ph/Tamiya-Thunder-Shot-EXCALIBUR-LIMITED-COLOR-RED-Item-No-92254-i.657693448.12370641771',ARRAY['itemNumber','editionName','color','marketContext']::text[],'2026-09-26'::date,'Exact ITEM 92254 Red specialist marketplace record.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('7c504d54-aa07-4e1c-88a4-bbab4da446cd'::uuid,'6e160808-24c4-4d03-8ac3-61c96ad29980'::uuid,'trusted_secondary','https://sonic.w-museum.com/rmono/ctmini4wd.htm',ARRAY['releaseYear']::text[],'2026-09-26'::date,'Prize-series chronology places Thunder Shot Excalibur in July 2013.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('f692d29b-8543-4624-b78a-e82612e94536'::uuid,'73963651-b010-45ce-a5fe-2c1530a7eb1c'::uuid,'trusted_secondary','https://www.suruga-ya.jp/product/detail/603071582',ARRAY['itemNumber','editionName','image']::text[],'2026-09-26'::date,'Exact Suruga original-spec limited-reissue record.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('4278c49f-d4fb-4cdd-ad27-0792384d5ab5'::uuid,'7c183356-2414-43e3-a214-7416a26955c8'::uuid,'trusted_secondary','https://tamiyablog.com/2015/06/gold-and-silver-plated-tamiya-thunder-shot-jr-93214-93215/',ARRAY['editionName','releaseYear','chassis','color']::text[],'2026-09-26'::date,'SK Japan announcement context: Gold/Silver Legend Style around 2015-06-24, VS chassis.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('9701d3b6-81cb-42ea-85f1-e6b91cd7043f'::uuid,'7c183356-2414-43e3-a214-7416a26955c8'::uuid,'trusted_secondary','https://www.rcjaz.com/mini-4wd-kids-racing-t-24_308_309.html?PageSpeed=noscript&page=5&sort=1a',ARRAY['itemNumber','editionName','marketContext']::text[],'2026-09-26'::date,'RCJAZ exact ITEM 92314 Gold plated archived retail listing.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('29a0e98e-492a-4b88-9c5c-e7cb0384bd02'::uuid,'b3d31445-fe5f-4128-ae07-262179e0f56f'::uuid,'trusted_secondary','https://sonic.w-museum.com/rmono/ctmini4wd.htm',ARRAY['releaseYear']::text[],'2026-09-26'::date,'Prize-series chronology places Thunder Shot Excalibur in July 2013.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('103b1679-4baf-465a-bc7a-27f69a4e4550'::uuid,'b3d31445-fe5f-4128-ae07-262179e0f56f'::uuid,'trusted_secondary','https://www.suruga-ya.jp/product/detail/603036346',ARRAY['itemNumber','editionName','chassis','color','image']::text[],'2026-09-26'::date,'Exact Tamiya/SK Japan ITEM 92252 White amusement-prize record.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('58e93264-c783-44aa-9830-76c123b1d347'::uuid,'ba9bceb4-d1b8-4826-90ea-68aa88479391'::uuid,'trusted_secondary','https://www.hlj.com/product/TAM18059/',ARRAY['itemNumber','barcodeJAN','releaseDate']::text[],'2026-09-26'::date,'HLJ records JAN 4950344180592 and release 2005-02-14.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('8ef008d3-1cbc-4ed1-b625-d5b3b3b13685'::uuid,'ba9bceb4-d1b8-4826-90ea-68aa88479391'::uuid,'official_manufacturer','https://www.tamiya.com/japan/products/18059/index.html',ARRAY['itemNumber','editionName','chassis']::text[],'2026-09-26'::date,'Official Tamiya ITEM 18059 / VS chassis.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('f495db20-67bf-43f9-909d-282f7ede1ab7'::uuid,'c3d5dcbe-dcd7-4478-9713-7fed9632aacb'::uuid,'trusted_secondary','https://sonic.w-museum.com/rmono/ctmini4wd.htm',ARRAY['releaseYear']::text[],'2026-09-26'::date,'Prize-series chronology places Thunder Shot Excalibur in July 2013.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('4b727bfe-5628-4d5f-8d15-eddfed8fc2f7'::uuid,'c3d5dcbe-dcd7-4478-9713-7fed9632aacb'::uuid,'trusted_secondary','https://www.suruga-ya.jp/product/other/603036347',ARRAY['itemNumber','editionName','color','image']::text[],'2026-09-26'::date,'Exact Tamiya/SK Japan ITEM 92253 Black record.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('c1836097-0cbe-4be4-ade0-d1ca4852af0b'::uuid,'c4a65d32-d9e6-430a-9aef-23fd876d260a'::uuid,'trusted_secondary','https://www.suruga-ya.jp/kaitori/kaitori_detail/603013113',ARRAY['itemNumber','barcodeJAN','chassis','image','msrp']::text[],'2026-09-26'::date,'Suruga exact ITEM 94814 / JAN 4950344948147 / Super XX record.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('b9e45c0b-d4cc-44f0-a63f-2b496b630bc6'::uuid,'cc365db8-7d04-4ba0-8aa7-f3f4251f30e0'::uuid,'trusted_secondary','https://jp.mercari.com/search?keyword=%E3%83%9F%E3%83%8B%E3%83%BB%E3%82%A8%E3%82%AF%E3%82%B9%E3%82%AB%E3%83%AA%E3%83%90%E3%83%BC',ARRAY['itemNumber','editionName','marketContext']::text[],'2026-09-26'::date,'Mercari search snapshot contains an exact Tamiya/SK Japan Thunder Shot Excalibur Clear Blue ITEM 92255 listing at JPY 4,070; retained as publication-gate market evidence, not as Europe-delivered ASK.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('11007f53-84f8-46d4-9a96-bc7f04205057'::uuid,'cc365db8-7d04-4ba0-8aa7-f3f4251f30e0'::uuid,'trusted_secondary','https://mini4wdjunkies.wordpress.com/2013/11/01/92255-thunder-shot-excalibur/',ARRAY['itemNumber','editionName','chassis']::text[],'2026-09-26'::date,'Exact ITEM 92255 Thunder Shot Excalibur / VS specialist record.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('d9e28be4-a525-4f7e-83bb-37256d2d745e'::uuid,'cc365db8-7d04-4ba0-8aa7-f3f4251f30e0'::uuid,'trusted_secondary','https://sonic.w-museum.com/rmono/ctmini4wd.htm',ARRAY['releaseYear']::text[],'2026-09-26'::date,'Prize-series chronology places Thunder Shot Excalibur in July 2013.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('7d673822-9b33-4dce-9b90-b0a13188afb8'::uuid,'dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087'::uuid,'trusted_secondary','https://mini4wdbench.net/keitou/thundershot/',ARRAY['editionName','itemNumber','marketContext']::text[],'2026-09-26'::date,'2026 collector-market summary distinguishes original-era ITEM 18009 from reissues and reports a current original-era buyback reference.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('ab60e05a-8448-4391-9352-d726e0267311'::uuid,'dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087'::uuid,'trusted_secondary','https://www.chibakan-yachiyo.net/mini4/mini-4wd-main-body/',ARRAY['editionName','marketContext']::text[],'2026-09-26'::date,'Current collector buyback reference explicitly distinguishes original-era Thunder Shot Jr. from reissue packaging.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('c5976118-d051-5a9a-a86d-fbfd0cb7137a'::uuid,'dcaa9d00-fe3f-5bc4-9bfa-5bc1078e2087'::uuid,'official_manufacturer','https://www.tamiya.com/japan/products/18009/index.html',ARRAY['itemNumber','chassis','editionName']::text[],'2026-09-07'::date,null)
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('9aad45da-0f52-44e5-8630-e74f7b2cec79'::uuid,'f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a'::uuid,'trusted_secondary','https://www.1999.co.jp/10087248',ARRAY['itemNumber','barcodeJAN','color']::text[],'2026-09-26'::date,'Hobby Search corroborates JAN 4950344180134 and exact Black Special identity.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('8fab8cff-2fdc-596c-8ed9-769dce8fe124'::uuid,'f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a'::uuid,'official_manufacturer','https://www.tamiya.com/japan/products/18013/index.html',ARRAY['itemNumber','editionName','color']::text[],'2026-09-07'::date,null)
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('20f9fea5-e868-41dc-8a54-817dc7184ba0'::uuid,'f6bc9832-bcb3-444a-9ec6-4d20b818d3d5'::uuid,'trusted_secondary','https://tamiyablog.com/2015/06/gold-and-silver-plated-tamiya-thunder-shot-jr-93214-93215/',ARRAY['editionName','releaseYear','chassis','color']::text[],'2026-09-26'::date,'SK Japan announcement context: Gold/Silver Legend Style around 2015-06-24, VS chassis.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

insert into public.release_sources(id,release_id,source_type,source_url,verified_fields,checked_at,notes)
values ('cc056984-6dfd-4fed-8958-0a8517245599'::uuid,'f6bc9832-bcb3-444a-9ec6-4d20b818d3d5'::uuid,'trusted_secondary','https://www.rcjaz.com/mini-4wd-kids-racing-t-24_308_309.html?PageSpeed=noscript&page=5&sort=1a',ARRAY['itemNumber','editionName','marketContext']::text[],'2026-09-26'::date,'RCJAZ exact ITEM 92315 Silver plated archived retail listing.')
on conflict(id) do update set source_type=excluded.source_type,source_url=excluded.source_url,
  verified_fields=excluded.verified_fields,checked_at=excluded.checked_at,notes=excluded.notes;

delete from public.release_images
where release_id in (
  select id from public.product_releases
  where product_id='059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid
);

insert into public.release_images(id,release_id,url,position)
values ('04cf179e-70e5-4dd6-bac5-28ae88b175ca'::uuid,'104354b5-0c00-440f-aaa4-ba8e11f56a74'::uuid,'https://www.tamiya.com/japan_contents/img/usr/item/1/18009/18009_1.jpg',0)
on conflict(id) do update set release_id=excluded.release_id,url=excluded.url,position=excluded.position;

insert into public.release_images(id,release_id,url,position)
values ('87c56dc0-e422-4365-9549-90cdc6260e1f'::uuid,'441a89cb-8e21-4616-ae6a-62c047ad26c5'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603092650.jpg.webp',0)
on conflict(id) do update set release_id=excluded.release_id,url=excluded.url,position=excluded.position;

insert into public.release_images(id,release_id,url,position)
values ('a347db4e-5372-451e-889f-e6480ae0f782'::uuid,'73963651-b010-45ce-a5fe-2c1530a7eb1c'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603071582.jpg.webp',0)
on conflict(id) do update set release_id=excluded.release_id,url=excluded.url,position=excluded.position;

insert into public.release_images(id,release_id,url,position)
values ('4f4ae59b-daa6-4dab-a1b8-c3591999e588'::uuid,'b3d31445-fe5f-4128-ae07-262179e0f56f'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603036346.jpg.webp',0)
on conflict(id) do update set release_id=excluded.release_id,url=excluded.url,position=excluded.position;

insert into public.release_images(id,release_id,url,position)
values ('083ba3ca-a404-4f04-af64-44bd0c29f8d9'::uuid,'ba9bceb4-d1b8-4826-90ea-68aa88479391'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603021931.jpg.webp',0)
on conflict(id) do update set release_id=excluded.release_id,url=excluded.url,position=excluded.position;

insert into public.release_images(id,release_id,url,position)
values ('04540808-3a42-4b9d-b3aa-f24cdcbc309c'::uuid,'c3d5dcbe-dcd7-4478-9713-7fed9632aacb'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603036347.jpg.webp',0)
on conflict(id) do update set release_id=excluded.release_id,url=excluded.url,position=excluded.position;

insert into public.release_images(id,release_id,url,position)
values ('faa28e07-1d5d-4af3-a8dd-49297f7d7bee'::uuid,'c4a65d32-d9e6-430a-9aef-23fd876d260a'::uuid,'https://cdn.suruga-ya.jp/database/pics_webp/game/603013113.jpg.webp',0)
on conflict(id) do update set release_id=excluded.release_id,url=excluded.url,position=excluded.position;

insert into public.release_images(id,release_id,url,position)
values ('7c34a42a-8171-5cd8-b065-74f328e9299d'::uuid,'f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a'::uuid,'https://www.tamiya.com/japan_contents/img/usr/item/1/18013/18013_1.jpg',0)
on conflict(id) do update set release_id=excluded.release_id,url=excluded.url,position=excluded.position;

insert into public.release_identifiers(id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
values ('4d347184-7ff1-4b2e-9b33-b8d18078cada'::uuid,'104354b5-0c00-440f-aaa4-ba8e11f56a74'::uuid,'JAN','4950344992065','JP',true,'verified','https://www.hlj.com/thunder-shot-jr-tam18009',now())
on conflict(id) do update set release_id=excluded.release_id,scheme=excluded.scheme,value=excluded.value,
  market=excluded.market,is_primary=excluded.is_primary,verification_status=excluded.verification_status,
  source_url=excluded.source_url,checked_at=excluded.checked_at;

insert into public.release_identifiers(id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
values ('43e7f528-b03a-4679-a7da-c422232549dc'::uuid,'ba9bceb4-d1b8-4826-90ea-68aa88479391'::uuid,'JAN','4950344180592','JP',true,'verified','https://www.hlj.com/product/TAM18059/',now())
on conflict(id) do update set release_id=excluded.release_id,scheme=excluded.scheme,value=excluded.value,
  market=excluded.market,is_primary=excluded.is_primary,verification_status=excluded.verification_status,
  source_url=excluded.source_url,checked_at=excluded.checked_at;

insert into public.release_identifiers(id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
values ('b53ba9b2-b136-4502-bc08-1036b6009c1a'::uuid,'c4a65d32-d9e6-430a-9aef-23fd876d260a'::uuid,'JAN','4950344948147','JP',true,'verified','https://www.suruga-ya.jp/kaitori/kaitori_detail/603013113',now())
on conflict(id) do update set release_id=excluded.release_id,scheme=excluded.scheme,value=excluded.value,
  market=excluded.market,is_primary=excluded.is_primary,verification_status=excluded.verification_status,
  source_url=excluded.source_url,checked_at=excluded.checked_at;

insert into public.release_identifiers(id,release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at)
values ('bd78f0f0-064f-4125-9008-4229739909d2'::uuid,'f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a'::uuid,'JAN','4950344180134','JP',true,'verified','https://www.1999.co.jp/10087248',now())
on conflict(id) do update set release_id=excluded.release_id,scheme=excluded.scheme,value=excluded.value,
  market=excluded.market,is_primary=excluded.is_primary,verification_status=excluded.verification_status,
  source_url=excluded.source_url,checked_at=excluded.checked_at;

insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_at,sold_on,listing_date,observed_at,decision,reason_codes,review_notes,
  state_hash,needs_revalidation,raw_payload,first_observed_at,last_observed_at,updated_at
) values (
  '7ac1c2e7-a0c1-4e29-a10b-53fb80fc9a4c'::uuid,'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,'yahoo-auctions:thunder-shot-black:2026-06-07:9075','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%82%B5%E3%83%B3%E3%83%80%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88jr/0/','未組立品 当時物 タミヤ ミニ四駆 サンダーショットJr. ブラックスペシャル 現状渡し','18013',ARRAY['f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a'::uuid]::uuid[],'f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a'::uuid,
  9075,'JPY',null,'unknown','auction_awarded',
  '未組立品','new_complete_unbuilt','unknown','unknown',true,false,
  1,'strong',ARRAY['edition_name_exact','manual_override']::text[],'yahoo-auctions:thunder-shot-black:2026-06-07:9075',null,'2026-06-07'::date,null,
  now(),'accepted',array[]::text[],'Exact Black Special unassembled completed sale; JPY 9,075.',null,false,'{"adapter":"manual-sold-audit-v1","sale_date":"2026-06-07","market_region":"japan"}'::jsonb,
  now(),now(),now()
)
on conflict(source_id,source_record_key) do update set
  title_raw=excluded.title_raw,item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,condition=excluded.condition,inner_bags_sealed=excluded.inner_bags_sealed,
  box_condition=excluded.box_condition,is_complete=excluded.is_complete,is_lot=excluded.is_lot,quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,sold_on=excluded.sold_on,listing_date=excluded.listing_date,
  observed_at=excluded.observed_at,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=excluded.needs_revalidation,
  raw_payload=excluded.raw_payload,last_observed_at=excluded.last_observed_at,updated_at=now();

insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_at,sold_on,listing_date,observed_at,decision,reason_codes,review_notes,
  state_hash,needs_revalidation,raw_payload,first_observed_at,last_observed_at,updated_at
) values (
  '375fc3fb-2202-495c-b71d-dea5ff37730b'::uuid,'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,'yahoo-auctions:thunder-shot-memorial-1998:2026-06-04:4400','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%82%B5%E3%83%B3%E3%83%80%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88jr/0/','1円～ タミヤ レーサーミニ四駆 1/32 サンダーショットJr. 初期レーサーミニ四駆オリジナル仕様 限定復刻版','18009',ARRAY['73963651-b010-45ce-a5fe-2c1530a7eb1c'::uuid]::uuid[],'73963651-b010-45ce-a5fe-2c1530a7eb1c'::uuid,
  4400,'JPY',null,'unknown','auction_awarded',
  '限定復刻版','new_complete_unbuilt','unknown','unknown',true,false,
  1,'strong',ARRAY['item_number_exact','edition_name_exact','reissue_stated','manual_override']::text[],'yahoo-auctions:thunder-shot-memorial-1998:2026-06-04:4400',null,'2026-06-04'::date,null,
  now(),'accepted',array[]::text[],'Exact original-spec limited-reissue completed sale; JPY 4,400.',null,false,'{"adapter":"manual-sold-audit-v1","sale_date":"2026-06-04","market_region":"japan"}'::jsonb,
  now(),now(),now()
)
on conflict(source_id,source_record_key) do update set
  title_raw=excluded.title_raw,item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,condition=excluded.condition,inner_bags_sealed=excluded.inner_bags_sealed,
  box_condition=excluded.box_condition,is_complete=excluded.is_complete,is_lot=excluded.is_lot,quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,sold_on=excluded.sold_on,listing_date=excluded.listing_date,
  observed_at=excluded.observed_at,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=excluded.needs_revalidation,
  raw_payload=excluded.raw_payload,last_observed_at=excluded.last_observed_at,updated_at=now();

insert into public.market_candidates(
  id,source_id,source_record_key,original_source,original_record_id,listing_url,title_raw,item_number_observed,
  possible_release_ids,resolved_release_id,price,currency,shipping_cost,shipping_basis,observation_type,
  condition_raw,condition,inner_bags_sealed,box_condition,is_complete,is_lot,quantity,match_confidence,
  match_evidence,evidence_group_key,sold_at,sold_on,listing_date,observed_at,decision,reason_codes,review_notes,
  state_hash,needs_revalidation,raw_payload,first_observed_at,last_observed_at,updated_at
) values (
  'c4c61d1e-5d4a-4ee8-9cca-015d4ec97fa0'::uuid,'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,'yahoo-auctions:thunder-shot-rs-18059:2026-05-31:7750','YAHOO_AUCTIONS_JP',null,
  'https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%9F%E3%83%8B%E5%9B%9B%E9%A7%86%20%E3%82%B5%E3%83%B3%E3%83%80%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88jr/0/','未組立 タミヤ 1/32 サンダーショット RS レーサーミニ四駆 VSシャーシ TAMIYA MINI 4WD Thunder Shot RS','18059',ARRAY['ba9bceb4-d1b8-4826-90ea-68aa88479391'::uuid]::uuid[],'ba9bceb4-d1b8-4826-90ea-68aa88479391'::uuid,
  7750,'JPY',null,'unknown','auction_awarded',
  '未組立','new_complete_unbuilt','unknown','unknown',true,false,
  1,'strong',ARRAY['edition_name_exact','chassis_stated','manual_override']::text[],'yahoo-auctions:thunder-shot-rs-18059:2026-05-31:7750',null,'2026-05-31'::date,null,
  now(),'accepted',array[]::text[],'Exact Thunder Shot RS unassembled completed sale; JPY 7,750.',null,false,'{"adapter":"manual-sold-audit-v1","sale_date":"2026-05-31","market_region":"japan"}'::jsonb,
  now(),now(),now()
)
on conflict(source_id,source_record_key) do update set
  title_raw=excluded.title_raw,item_number_observed=excluded.item_number_observed,
  possible_release_ids=excluded.possible_release_ids,resolved_release_id=excluded.resolved_release_id,
  price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,observation_type=excluded.observation_type,
  condition_raw=excluded.condition_raw,condition=excluded.condition,inner_bags_sealed=excluded.inner_bags_sealed,
  box_condition=excluded.box_condition,is_complete=excluded.is_complete,is_lot=excluded.is_lot,quantity=excluded.quantity,
  match_confidence=excluded.match_confidence,match_evidence=excluded.match_evidence,
  evidence_group_key=excluded.evidence_group_key,sold_on=excluded.sold_on,listing_date=excluded.listing_date,
  observed_at=excluded.observed_at,decision=excluded.decision,reason_codes=excluded.reason_codes,
  review_notes=excluded.review_notes,needs_revalidation=excluded.needs_revalidation,
  raw_payload=excluded.raw_payload,last_observed_at=excluded.last_observed_at,updated_at=now();

insert into public.price_points(
  id,candidate_id,release_id,source_id,observation_type,condition,price,currency,shipping_cost,shipping_basis,
  valuation_price,normalized_price_eur,fx_rate_to_eur,fx_rate_date,inner_bags_sealed,box_condition,is_complete,
  is_lot,quantity,match_confidence,match_evidence,evidence_group_key,valuation_eligible,status,needs_revalidation,
  sold_at,sold_on,observed_at,evidence_grade,quality_flags,market_price_eur,market_price_basis
) values (
  'e4f1f4c7-153c-4b72-baf3-f225f88ec2c2'::uuid,'375fc3fb-2202-495c-b71d-dea5ff37730b'::uuid,'73963651-b010-45ce-a5fe-2c1530a7eb1c'::uuid,'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,'auction_awarded','new_complete_unbuilt',
  4400,'JPY',null,'unknown',null,null,
  0.00537606,'2026-06-04'::date,'unknown','unknown',true,false,
  1,'strong',ARRAY['item_number_exact','edition_name_exact','reissue_stated','manual_override']::text[],'yahoo-auctions:thunder-shot-memorial-1998:2026-06-04:4400',true,
  'active',false,null,'2026-06-04'::date,now(),'indicative',ARRAY['shipping_unknown','seller_unknown']::text[],
  23.65,'raw_sale'
)
on conflict(candidate_id) do update set
  release_id=excluded.release_id,source_id=excluded.source_id,observation_type=excluded.observation_type,
  condition=excluded.condition,price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,valuation_price=excluded.valuation_price,
  normalized_price_eur=excluded.normalized_price_eur,fx_rate_to_eur=excluded.fx_rate_to_eur,fx_rate_date=excluded.fx_rate_date,
  inner_bags_sealed=excluded.inner_bags_sealed,box_condition=excluded.box_condition,is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,evidence_group_key=excluded.evidence_group_key,
  valuation_eligible=excluded.valuation_eligible,status=excluded.status,needs_revalidation=excluded.needs_revalidation,
  sold_on=excluded.sold_on,observed_at=excluded.observed_at,evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,updated_at=now();

insert into public.price_points(
  id,candidate_id,release_id,source_id,observation_type,condition,price,currency,shipping_cost,shipping_basis,
  valuation_price,normalized_price_eur,fx_rate_to_eur,fx_rate_date,inner_bags_sealed,box_condition,is_complete,
  is_lot,quantity,match_confidence,match_evidence,evidence_group_key,valuation_eligible,status,needs_revalidation,
  sold_at,sold_on,observed_at,evidence_grade,quality_flags,market_price_eur,market_price_basis
) values (
  'fdf5ff9b-3f53-4e7b-bcd2-1a4599b69386'::uuid,'7ac1c2e7-a0c1-4e29-a10b-53fb80fc9a4c'::uuid,'f4e3f6b8-8ce6-5b87-9d94-5f64a24c031a'::uuid,'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,'auction_awarded','new_complete_unbuilt',
  9075,'JPY',null,'unknown',null,null,
  0.00537403,'2026-06-05'::date,'unknown','unknown',true,false,
  1,'strong',ARRAY['edition_name_exact','manual_override']::text[],'yahoo-auctions:thunder-shot-black:2026-06-07:9075',true,
  'active',false,null,'2026-06-07'::date,now(),'indicative',ARRAY['shipping_unknown','seller_unknown']::text[],
  48.77,'raw_sale'
)
on conflict(candidate_id) do update set
  release_id=excluded.release_id,source_id=excluded.source_id,observation_type=excluded.observation_type,
  condition=excluded.condition,price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,valuation_price=excluded.valuation_price,
  normalized_price_eur=excluded.normalized_price_eur,fx_rate_to_eur=excluded.fx_rate_to_eur,fx_rate_date=excluded.fx_rate_date,
  inner_bags_sealed=excluded.inner_bags_sealed,box_condition=excluded.box_condition,is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,evidence_group_key=excluded.evidence_group_key,
  valuation_eligible=excluded.valuation_eligible,status=excluded.status,needs_revalidation=excluded.needs_revalidation,
  sold_on=excluded.sold_on,observed_at=excluded.observed_at,evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,updated_at=now();

insert into public.price_points(
  id,candidate_id,release_id,source_id,observation_type,condition,price,currency,shipping_cost,shipping_basis,
  valuation_price,normalized_price_eur,fx_rate_to_eur,fx_rate_date,inner_bags_sealed,box_condition,is_complete,
  is_lot,quantity,match_confidence,match_evidence,evidence_group_key,valuation_eligible,status,needs_revalidation,
  sold_at,sold_on,observed_at,evidence_grade,quality_flags,market_price_eur,market_price_basis
) values (
  '25f394dd-aefa-4388-b311-a13e63832e4c'::uuid,'c4c61d1e-5d4a-4ee8-9cca-015d4ec97fa0'::uuid,'ba9bceb4-d1b8-4826-90ea-68aa88479391'::uuid,'d75d5b49-d9e5-58d0-bd2a-3d82f44fda53'::uuid,'auction_awarded','new_complete_unbuilt',
  7750,'JPY',null,'unknown',null,null,
  0.00539229,'2026-05-29'::date,'unknown','unknown',true,false,
  1,'strong',ARRAY['edition_name_exact','chassis_stated','manual_override']::text[],'yahoo-auctions:thunder-shot-rs-18059:2026-05-31:7750',true,
  'active',false,null,'2026-05-31'::date,now(),'indicative',ARRAY['shipping_unknown','seller_unknown']::text[],
  41.79,'raw_sale'
)
on conflict(candidate_id) do update set
  release_id=excluded.release_id,source_id=excluded.source_id,observation_type=excluded.observation_type,
  condition=excluded.condition,price=excluded.price,currency=excluded.currency,shipping_cost=excluded.shipping_cost,
  shipping_basis=excluded.shipping_basis,valuation_price=excluded.valuation_price,
  normalized_price_eur=excluded.normalized_price_eur,fx_rate_to_eur=excluded.fx_rate_to_eur,fx_rate_date=excluded.fx_rate_date,
  inner_bags_sealed=excluded.inner_bags_sealed,box_condition=excluded.box_condition,is_complete=excluded.is_complete,
  is_lot=excluded.is_lot,quantity=excluded.quantity,match_confidence=excluded.match_confidence,
  match_evidence=excluded.match_evidence,evidence_group_key=excluded.evidence_group_key,
  valuation_eligible=excluded.valuation_eligible,status=excluded.status,needs_revalidation=excluded.needs_revalidation,
  sold_on=excluded.sold_on,observed_at=excluded.observed_at,evidence_grade=excluded.evidence_grade,
  quality_flags=excluded.quality_flags,market_price_eur=excluded.market_price_eur,
  market_price_basis=excluded.market_price_basis,updated_at=now();

select public.trackdash_enqueue_market_recompute(r.id,'new_complete_unbuilt')
from public.product_releases r
where r.product_id='059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid
  and r.edition_name in (
    'Thunder Shot Jr. Black Special — 1988',
    'Thunder Shot Jr. — 1998 Memorial Edition (Limited Reissue)',
    'Thunder Shot RS — VS Chassis'
  );

select public.trackdash_enroll_release_market_scans(r.id)
from public.product_releases r
where r.product_id='059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid
  and r.item_number is not null
  and r.catalog_visibility='public';

update public.market_scan_queue q
set enabled=false,next_scan_at=timestamptz '2099-01-01 00:00:00+00',
    last_error='DISABLED_SHARED_ITEM_NUMBER_18009',locked_until=null,updated_at=now()
from public.price_sources ps
where q.source_id=ps.id
  and ps.slug='ebay_active_public'
  and q.release_id in (
    select id from public.product_releases
    where product_id='059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid and item_number='18009'
  );

update public.market_scan_queue q
set enabled=true,priority=130,next_scan_at=timestamptz '2000-01-01 00:00:00+00',
    consecutive_failures=0,last_error=null,locked_until=null,updated_at=now()
from public.price_sources ps
where q.source_id=ps.id
  and ps.slug='ebay_active_public'
  and q.release_id in (
    select id from public.product_releases
    where product_id='059b5b3f-9ee9-5932-b39f-879642b9414c'::uuid
      and item_number in ('18013','92078','18059','94814','92252','92253','92254','92255','92314','92315')
  );

commit;
