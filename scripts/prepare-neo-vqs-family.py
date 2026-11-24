"""Generate the reviewed Neo-VQS data-only import; never executes SQL."""
import json
from pathlib import Path
from uuid import uuid5, NAMESPACE_URL

ROOT = Path(__file__).resolve().parents[1]
FAMILY = str(uuid5(NAMESPACE_URL, 'https://trackdash.it/catalog/neo-vqs'))
def rid(code):
    return str(uuid5(NAMESPACE_URL, f'https://trackdash.it/catalog/neo-vqs/item/{code}'))
def photo(code, suffix='1'):
    return f'https://d7z22c0gz59ng.cloudfront.net/cms/img/usr/item/{code[0]}/{code}/{code}_{suffix}.jpg'
def official(code):
    return f'https://www.tamiya.com/japan/products/{code}/index.html'

releases = [
 dict(code='18094',name='Neo-VQS (VZ Chassis)',year=2020,date='2020-03-28',chassis='VZ',color='Black / red wheels',market='International',kind='original',status='active',rarity='Common',jan='4950344180943',jan_source='https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',source=official('18094'),images=[photo('18094'),photo('18094','4c2'),photo('18094','4c3')],
 en='The original Neo-VQS introduced the VZ chassis in March 2020. Its angular black ABS body reinterprets the Vanquish Jr., with red five-spoke wheels, low-profile tires and 3.5:1 gears.',
 it='La Neo-VQS originale introduce il telaio VZ nel marzo 2020. La carrozzeria angolare in ABS nero riprende la Vanquish Jr., con cerchi rossi a cinque razze, gomme a basso profilo e rapporto 3,5:1.'),
 dict(code='95130',name='Neo-VQS Japan Cup 2020 (Polycarbonate Body)',year=2020,date='2020-08-01',chassis='VZ',color='Clear polycarbonate / fluorescent yellow chassis',market='International',kind='japan_cup',status='discontinued',rarity='Uncommon',jan=None,source=official('95130'),images=[photo('95130'), 'https://www.tamiya.com/cms/img/usr/item/9/95130/95130_p.jpg','https://www.tamiya.com/cms/img/usr/item/9/95130/95130_4c2.jpg'],
 en='Japan Cup 2020 commemorative complete kit with a clear polycarbonate body, fluorescent-yellow VZ chassis, carbon-reinforced Y-spoke wheels and super-hard low-profile tires with event lettering. The official assembled photo shows the body painted.',
 it='Kit completo commemorativo Japan Cup 2020, con carrozzeria in policarbonato trasparente, telaio VZ giallo fluorescente, cerchi a Y rinforzati al carbonio e gomme super hard a basso profilo con scritte dedicate. La foto ufficiale del modello montato mostra la carrozzeria verniciata.'),
 dict(code='95598',name='Neo-VQS Advanced Pack (2020)',year=2020,date=None,chassis='VZ',color='Smoke / black chassis / yellow wheels',market='International',kind='special',status='discontinued',rarity='Common',jan='4950344955985',jan_source='https://iltempiodellemini4wd.it/prodotto/mini4wd-neo-vqs-advanced-pack-vz-chassis/',source=official('95598'),images=[photo('95598'),'https://www.tamiya.com/cms/img/usr/item/9/95598/95598_main3.jpg','https://www.tamiya.com/cms/img/usr/item/9/95598/95598_main4_03.jpg'],
 en='Advanced Pack first introduced in December 2020, with a smoke ABS body, black VZ chassis, clear-yellow A parts and yellow wheels. Includes a Light-Dash motor, FRP stays, brakes, side mass dampers and 3.7:1 gears. The July 2023 production is retained within this edition; the later item #18106 has its own catalog record.',
 it='Advanced Pack introdotto nel dicembre 2020, con carrozzeria ABS fumé, telaio VZ nero, parti A giallo trasparente e cerchi gialli. Include motore Light-Dash, supporti FRP, freni, mass damper laterali e rapporto 3,7:1. La produzione del luglio 2023 appartiene a questa edizione; il successivo articolo #18106 ha una scheda distinta.'),
 dict(code='95617',name='Neo-VQS Asia Challenge 2021 Special',year=2021,date=None,chassis='VZ',color='Clear blue / periwinkle chassis / maroon tires',market='Asia',kind='limited',status='unknown',rarity='Uncommon',jan='4950344956173',jan_source='https://www.tamiyausa.com/media/files/map-feb-2026-1239-08db.pdf',source='https://tamiyablog.com/2021/02/tamiya-95617-neo-vqs-asia-challenge-2021-special-vz-chassis/',images=['https://www.omnimodellismo.it/cdn/shop/products/IMG20211204123836_2048x2048.jpg?v=1638618510','https://myrcstation.com/cdn/shop/products/b436b0bb857d5338caeed83e7ed2a951_1024x1024.jpg?v=1650798770'],
 en='Asia Challenge 2021 complete kit on the VZ chassis. Clear-blue body, periwinkle-colored frame, carbon-reinforced five-spoke wheels and maroon super-hard low-profile tires distinguish it from the standard and Japan Cup editions.',
 it='Kit completo Asia Challenge 2021 su telaio VZ. La carrozzeria blu trasparente, il telaio color pervinca, i cerchi a cinque razze rinforzati al carbonio e le gomme super hard color bordeaux lo distinguono dalla standard e dalla Japan Cup.'),
 dict(code='95633',name='Neo-VQS Polycarbonate Body Special (VS Chassis)',year=2021,date=None,chassis='VS',color='Clear polycarbonate / turquoise chassis / white tires',market='Japan / International',kind='special',status='discontinued',rarity='Uncommon',jan='4950344956333',jan_source='https://www.rcjaz.com/tamiya-95633-132-neo-vqs-polycarbonate-body-special-vs-chassis-model-kit-p-25976.html',source=official('95633'),images=[photo('95633')],
 en='Complete kit on the compact VS chassis, with a clear polycarbonate body, carbon-reinforced Y-spoke wheels and white hard low-profile tires. Initially an event item associated with Japan Cup 2021; wider Japanese Mini 4WD Station distribution followed on 31 March 2022. Both distributions remain one edition.',
 it='Kit completo su telaio VS compatto, con carrozzeria in policarbonato trasparente, cerchi a Y rinforzati al carbonio e gomme hard bianche a basso profilo. Inizialmente legato agli eventi Japan Cup 2021, arriva nella distribuzione giapponese Mini 4WD Station il 31 marzo 2022. Le due distribuzioni restano una sola edizione.'),
 dict(code='92447',name='Neo-VQS Tokyo Yakult Swallows Collaboration Model',year=2024,date=None,chassis='VZ',color='White / navy chassis / red wheels',market='Japan',kind='limited',status='unknown',rarity='Uncommon',jan=None,source='https://shop.yakult-swallows.co.jp/products/19162',images=['https://shop.yakult-swallows.co.jp/contents/products/19162/sub_01.jpg','https://shop.yakult-swallows.co.jp/contents/products/19162/main.jpg'],
 en='2024 collaboration with the Tokyo Yakult Swallows baseball team, distributed through its official shops. White body with team graphics, navy VZ chassis, red five-spoke wheels and super-hard tires with printed logos. Dedicated team packaging identifies this complete kit.',
 it='Collaborazione del 2024 con la squadra di baseball Tokyo Yakult Swallows, distribuita nei suoi negozi ufficiali. Carrozzeria bianca con grafiche della squadra, telaio VZ blu navy, cerchi rossi a cinque razze e gomme super hard con loghi stampati. Il kit completo ha una confezione dedicata.'),
 dict(code='18106',name='Neo-VQS Advanced Pack (2026)',year=2026,date='2026-12-19',chassis='VZ',color='Smoke / black chassis / yellow wheels',market='Japan / International',kind='special',status='announced',rarity=None,jan=None,source=official('18106'),images=[photo('95598'),'https://www.tamiya.com/cms/img/usr/item/9/95598/95598_main3.jpg'],
 en='The Advanced Pack under the new item number #18106. Tamiya Japan schedules release for 19 December 2026; availability dates can differ by country. Smoke body, VZ chassis and Light-Dash motor with FRP stays, brakes and mass dampers.',
 it='Advanced Pack con il nuovo codice articolo #18106. Tamiya Japan annuncia l’uscita per il 19 dicembre 2026; la disponibilità può variare per Paese. Carrozzeria fumé, telaio VZ e motore Light-Dash con supporti FRP, freni e mass damper.'),
]

def q(value):
    if value is None: return 'null'
    if isinstance(value, bool): return 'true' if value else 'false'
    if isinstance(value, (int,float)): return str(value)
    return "'" + str(value).replace("'", "''") + "'"

sql = ["begin;", "do $guard$ begin if exists(select 1 from products where slug='neo-vqs' and id<>"+q(FAMILY)+"::uuid) then raise exception 'NEO_VQS_PRODUCT_COLLISION'; end if; if exists(select 1 from product_releases where item_number in ('18094','95130','95598','95617','95633','92447','18106') and product_id<>"+q(FAMILY)+"::uuid) then raise exception 'NEO_VQS_ITEM_COLLISION'; end if; end $guard$;",
 'insert into products(id,category_id,brand_id,slug,name,japanese_name,series,description,description_it,metadata) values('+','.join(map(q,[FAMILY,'cd755fcb-2bc5-5975-8ec0-f45e7df891cc','382feca9-48e9-5144-a92d-41f77fb7e438','neo-vqs','Neo-VQS','ネオVQS','Racing Mini 4WD','The Neo-VQS family reinterprets the Vanquish Jr. across VZ and VS chassis, from the 2020 standard kit to event specials, collaboration models and Advanced Packs.','La famiglia Neo-VQS riprende la Vanquish Jr. attraverso telai VZ e VS, dal kit standard del 2020 alle speciali per eventi, alle collaborazioni e agli Advanced Pack.',json.dumps({'launch_status':'coming_soon','family_audit':{'checked_at':'2026-11-24','kit_release_count':7,'status':'staged_initial_market_audit'}})]))+') on conflict(id) do nothing;']
for r in releases:
    r['id']=rid(r['code'])
    notes='Audited 2026-11-24. Exact complete-kit identity and dedicated images reviewed. No guessed sale prices, Italian delivered cost, barcode or rarity. Same-SKU restocks retained as production waves.'
    if r['code']=='95633': notes+=' First event distribution in 2021 supported by contemporary genealogy; 2022-03-31 is wider distribution, not a separate kit.'
    fields=['id','product_id','item_number','release_type','edition_name','release_year','release_date','chassis','barcode_jan','color','country_market','rarity','edition_type','description','description_it','notes','production_status','verification_status','catalog_visibility','is_original','data_source','status_checked_at']
    values=[r['id'],FAMILY,r['code'],{'original':'Original','japan_cup':'Japan Cup Edition','limited':'Limited Edition','special':'Special Edition'}[r['kind']],r['name'],r['year'],r['date'],r['chassis'],r['jan'],r['color'],r['market'],r['rarity'],r['kind'],r['en'],r['it'],notes,r['status'],'verified','public',r['kind']=='original','neo_vqs_audit_20261124']
    sql.append('insert into product_releases('+','.join(fields)+') values('+','.join(map(q,values))+',now()) on conflict(id) do nothing;')
    for pos,img in enumerate(r['images']):
        sql.append('insert into release_images(release_id,url,position) select '+','.join(map(q,[r['id'],img,pos]))+' where not exists(select 1 from release_images where release_id='+q(r['id'])+' and url='+q(img)+');')
    stype='official_manufacturer' if 'www.tamiya.com' in r['source'] else 'trusted_secondary'
    sql.append('insert into release_sources(release_id,source_type,source_url,verified_fields,checked_at,notes) select '+','.join(map(q,[r['id'],stype,r['source']]))+",array['itemNumber','editionName','chassis','color','images'],now(),'Reviewed exact edition; image rights remain with their respective owners.' where not exists(select 1 from release_sources where release_id="+q(r['id'])+' and source_url='+q(r['source'])+');')
    if r['jan']:
        sql.append('insert into release_identifiers(release_id,scheme,value,market,is_primary,verification_status,source_url,checked_at) values('+','.join(map(q,[r['id'],'JAN',r['jan'],'JP',True,'verified',r['jan_source']]))+',now()) on conflict(release_id,scheme,value,market) do nothing;')
    sql.append('select trackdash_enroll_release_market_scans('+q(r['id'])+'::uuid);')
    sql.append('select trackdash_enqueue_market_recompute('+q(r['id'])+"::uuid,'new_complete_unbuilt');")
sql += ['update products set canonical_release_id='+q(rid('18094'))+'::uuid where id='+q(FAMILY)+'::uuid;', 'insert into product_images(product_id,url,position) select '+q(FAMILY)+','+q(photo('18094'))+',0 where not exists(select 1 from product_images where product_id='+q(FAMILY)+');', 'commit;']
out = ROOT/'scripts/sql/neo-vqs-family-foundation-2026-11-24.sql'
out.write_text('\n'.join(sql)+'\n')
(ROOT/'docs/NEO_VQS_RELEASES_2026-11-24.json').write_text(json.dumps({'product_id':FAMILY,'releases':releases},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'product_id':FAMILY,'releases':[{k:r[k] for k in ['code','id','year','status']} for r in releases],'images':sum(len(r['images']) for r in releases)},indent=2))
