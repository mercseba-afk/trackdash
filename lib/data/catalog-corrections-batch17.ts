import type { Product, ProductRelease, ReleaseSource } from "@/lib/types"
import { stableUuid } from "./stable-id"

const PRODUCT_ID = "de719716-e50a-5811-b99d-18bbb153b166"

function source(
  releaseId: string,
  sourceType: ReleaseSource["sourceType"],
  sourceUrl: string,
  verifiedFields: string[],
  notes: string,
): ReleaseSource {
  return {
    id: stableUuid(`source:avante-mk3:${releaseId}:${sourceUrl}`),
    releaseId,
    sourceType,
    sourceUrl,
    verifiedFields,
    checkedAt: "2026-09-21",
    notes,
  }
}

function release(input: Omit<ProductRelease, "productId">): ProductRelease {
  return { ...input, productId: PRODUCT_ID }
}

const RELEASES: ProductRelease[] = [
    release({
      id:"497455cb-838d-5430-97dd-ae0be52e69e4", itemNumber:"18626", releaseType:"Original", editionName:"Avante Mk.III Azure",
      editionType:"original", releaseYear:2008, releaseDate:"2008-09-06",
      chassis:"MS",  color:"Light Blue",
       images:["https://www.tamiya.com/japan_contents/img/usr/item/1/18626/18626_1.jpg"],
      notes:"Original Azure regular release.", discontinued:false, isOriginal:true,
      rarity:"Uncommon", verificationStatus:"verified", productionStatus:"unknown",
      
      sources:[source("497455cb-838d-5430-97dd-ae0be52e69e4","official_manufacturer","https://www.tamiya.com/japan/products/18626/index.html",["itemNumber","chassis","releaseDate","releaseYear","editionName"],"Official Tamiya product page.")]
    }),
    release({
      id:"86763fe4-bfc0-551e-8541-c3fc9c2442b7", itemNumber:"18627", releaseType:"Original", editionName:"Avante Mk.III Nero",
      editionType:"other", releaseYear:2008, releaseDate:"2008-09-27",
      chassis:"MS",  color:"Black",
       images:["https://www.tamiya.com/japan_contents/img/usr/item/1/18627/18627_1.jpg"],
      notes:"Original Nero launch colourway.", discontinued:false, isOriginal:false,
      rarity:"Uncommon", verificationStatus:"verified", productionStatus:"unknown",
      
      sources:[source("86763fe4-bfc0-551e-8541-c3fc9c2442b7","official_manufacturer","https://www.tamiya.com/japan/products/18627/index.html",["itemNumber","chassis","releaseDate","releaseYear","editionName","color"],"Official Tamiya product page.")]
    }),
    release({
      id:"921c4346-c48a-5a36-9438-65c9e4781107", itemNumber:"94673", releaseType:"Special Edition", editionName:"Avante Mk.III Azure Finished Model",
      editionType:"special", releaseYear:2008, releaseDate:"2008-12-20",
      chassis:"MS",  color:"Light Blue",
      countryMarket:"Japan", images:[],
      notes:"Factory-finished Azure edition. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Rare", verificationStatus:"partial", productionStatus:"unknown",
      
      sources:[source("921c4346-c48a-5a36-9438-65c9e4781107","trusted_secondary","https://tamiyablog.com/2008/09/new-releases-at-the-all-japan-plamodel-radicon-show-updated-sept-28/",["itemNumber","editionName","releaseYear"],"Contemporary release announcement attributed to Tamiya."),
        source("921c4346-c48a-5a36-9438-65c9e4781107","trusted_secondary","https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf",["itemNumber","releaseDate","releaseYear"],"Historical Avante reference corroborates 2008-12-20.")]
    }),
    release({
      id:"f66b9e6e-f7e5-57f2-8395-10125a0ae96c", itemNumber:"94674", releaseType:"Special Edition", editionName:"Avante Mk.III Nero Finished Model",
      editionType:"special", releaseYear:2008, releaseDate:"2008-12-20",
      chassis:"MS",  color:"Black",
      countryMarket:"Japan", images:[],
      notes:"Factory-finished Nero edition. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Rare", verificationStatus:"partial", productionStatus:"unknown",
      
      sources:[source("f66b9e6e-f7e5-57f2-8395-10125a0ae96c","trusted_secondary","https://tamiyablog.com/2008/09/new-releases-at-the-all-japan-plamodel-radicon-show-updated-sept-28/",["itemNumber","editionName","releaseYear"],"Contemporary release announcement attributed to Tamiya."),
        source("f66b9e6e-f7e5-57f2-8395-10125a0ae96c","trusted_secondary","https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf",["itemNumber","releaseDate","releaseYear"],"Historical Avante reference corroborates 2008-12-20.")]
    }),
    release({
      id:"e07a5f39-d476-54c5-a509-4fb3ffb1a0ec", itemNumber:"94692", releaseType:"Color Special", editionName:"Avante Mk.III Red Special",
      editionType:"color_special", releaseYear:2009, releaseDate:"2009-06-27",
      chassis:"MS", barcodeJAN:"4950344946921", color:"Red",
      countryMarket:"Japan", images:[],
      notes:"Original Red Special. Distinct collector Release from ITEM 95425 because Tamiya assigned a new Item Number to the later re-release. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:true, isOriginal:false,
      rarity:"Rare", verificationStatus:"verified", productionStatus:"discontinued",
      statusCheckedAt:"2026-09-21",
      sources:[source("e07a5f39-d476-54c5-a509-4fb3ffb1a0ec","trusted_secondary","https://www.tea-league.com/mt/tea/archives/2009/06/mkiii_5.html",["itemNumber","releaseDate","releaseYear","chassis","editionName"],"Contemporary report links the original Tamiya 94692 catalog page and states 2009-06-27."),
        source("e07a5f39-d476-54c5-a509-4fb3ffb1a0ec","trusted_secondary","https://hs-tamtam.co.jp/product/detail/31159/",["itemNumber","barcodeJAN","editionName"],"Japanese retailer corroborates JAN 4950344946921."),
        source("e07a5f39-d476-54c5-a509-4fb3ffb1a0ec","trusted_secondary","https://www.hlj.com/avante-mk-iii-red-special-tam94692",["itemNumber","productionStatus"],"HLJ identifies ITEM 94692 and marks it discontinued.")]
    }),
    release({
      id:"ee0c66c6-0d58-5ee5-ae20-942966da8129", itemNumber:"92207", releaseType:"Limited Edition", editionName:"Avante Mk.III Azure Evangelion Unit-01 Special",
      editionType:"limited", releaseYear:2009, 
      chassis:"MS",  color:"Purple / EVA-01",
      countryMarket:"Japan", images:[],
      notes:"Evangelion collaboration; release window September 2009, exact day intentionally unset. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Very Rare", verificationStatus:"partial", productionStatus:"unknown",
      
      sources:[source("ee0c66c6-0d58-5ee5-ae20-942966da8129","trusted_secondary","https://www.tea-league.com/mt/tea/archives/2009/05/special_5.html",["editionName","releaseYear","chassis","color"],"Contemporary collaboration report documents the Evangelion Unit-01 Special and 2009 release window."),
        source("ee0c66c6-0d58-5ee5-ae20-942966da8129","trusted_secondary","https://mini-4wd.fandom.com/wiki/Avante_Mk.III",["itemNumber","releaseYear"],"Structured family matrix identifies ITEM 92207.")]
    }),
    release({
      id:"8e01ee97-26ad-5c82-a569-b74332d59617", itemNumber:"94715", releaseType:"Color Special", editionName:"Avante Mk.III White Special",
      editionType:"color_special", releaseYear:2010, releaseDate:"2010-01-30",
      chassis:"MS",  color:"White / Fluorescent Green",
      countryMarket:"Japan", images:[],
      notes:"Original White Special. Distinct from ITEM 95469 re-release. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Rare", verificationStatus:"partial", productionStatus:"unknown",
      
      sources:[source("8e01ee97-26ad-5c82-a569-b74332d59617","trusted_secondary","https://tamiyablog.com/2009/11/future-release-list-for-tamiya-fair-2009-tamiya-sand-scorcher-re-release/",["itemNumber","editionName"],"Contemporary future-release list from Tamiya Fair."),
        source("8e01ee97-26ad-5c82-a569-b74332d59617","trusted_secondary","https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf",["releaseDate","releaseYear"],"Historical family reference corroborates 2010-01-30.")]
    }),
    release({
      id:"0a386324-1815-5d3e-addb-7e583d3489d6", itemNumber:"92218", releaseType:"Limited Edition", editionName:"Avante Mk.III Azure Evangelion Unit-01 Awakening Special",
      editionType:"limited", releaseYear:2010, releaseDate:"2010-01-30",
      chassis:"MS",  
      countryMarket:"Japan", images:[],
      notes:"Evangelion Unit-01 Awakening collaboration edition. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Very Rare", verificationStatus:"partial", productionStatus:"unknown",
      
      sources:[source("0a386324-1815-5d3e-addb-7e583d3489d6","trusted_secondary","https://www.tea-league.com/mt/tea/archives/2009/11/index.php?page=all",["editionName","releaseYear"],"Contemporary 2010 release coverage."),
        source("0a386324-1815-5d3e-addb-7e583d3489d6","trusted_secondary","https://mini-4wd.fandom.com/wiki/Avante_Mk.III",["itemNumber","releaseDate","releaseYear"],"Structured family matrix identifies ITEM 92218 and date.")]
    }),
    release({
      id:"5fdf8efd-46c1-5cff-9a61-6b8ee2b2b2af", itemNumber:"92219", releaseType:"Limited Edition", editionName:"Avante Mk.III Azure Tohoku Rakuten Golden Eagles Home Color",
      editionType:"limited", releaseYear:2010, releaseDate:"2010-01-30",
      chassis:"MS",  
      countryMarket:"Japan", images:[],
      notes:"Tohoku Rakuten Golden Eagles collaboration. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Very Rare", verificationStatus:"partial", productionStatus:"unknown",
      
      sources:[source("5fdf8efd-46c1-5cff-9a61-6b8ee2b2b2af","trusted_secondary","https://mini-4wd.fandom.com/wiki/Avante_Mk.III",["itemNumber","releaseDate","releaseYear","editionName"],"Structured family matrix documents this collaboration release.")]
    }),
    release({
      id:"f308c6fb-af67-5f03-b87b-7c3b947d9dfb", itemNumber:"92221", releaseType:"Limited Edition", editionName:"Avante Mk.III Azure Tohoku Rakuten Golden Eagles Mr. Carrasco",
      editionType:"limited", releaseYear:2010, releaseDate:"2010-01-30",
      chassis:"MS",  
      countryMarket:"Japan", images:[],
      notes:"Tohoku Rakuten Golden Eagles Mr. Carrasco collaboration. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Very Rare", verificationStatus:"partial", productionStatus:"unknown",
      
      sources:[source("f308c6fb-af67-5f03-b87b-7c3b947d9dfb","trusted_secondary","https://mini-4wd.fandom.com/wiki/Avante_Mk.III",["itemNumber","releaseDate","releaseYear","editionName"],"Structured family matrix documents this collaboration release.")]
    }),
    release({
      id:"3495bf78-89ab-57c4-84fc-f6f300c85a4e", itemNumber:"94777", releaseType:"Color Special", editionName:"Avante Mk.III Azure Clear Blue Special",
      editionType:"color_special", releaseYear:2010, releaseDate:"2010-07-31",
      chassis:"MS",  color:"Clear Blue",
      countryMarket:"Japan", images:[],
      notes:"Clear Blue ABS special. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Rare", verificationStatus:"verified", productionStatus:"unknown",
      
      sources:[source("3495bf78-89ab-57c4-84fc-f6f300c85a4e","trusted_secondary","https://www.tea-league.com/mt/tea/archives/2010/07/index.php?page=all",["itemNumber","editionName","releaseYear","color"],"Contemporary release coverage."),
        source("3495bf78-89ab-57c4-84fc-f6f300c85a4e","trusted_secondary","https://www.rcjaz.com/tamiya-94777-avante-iii-azure-clear-blue-sp-p-90022364.html",["itemNumber","editionName","chassis","color"],"Specialist retailer corroborates exact kit identity.")]
    }),
    release({
      id:"9d9d9015-81e5-5388-9d36-3e8b3b223b54", itemNumber:"94741", releaseType:"Clear Body", editionName:"Avante Mk.III Azure Clear Special (Polycarbonate Body)",
      editionType:"color_special", releaseYear:2010, releaseDate:"2010-10-02",
      chassis:"MS",  color:"Clear/Azure",
      countryMarket:"Japan", images:[],
      notes:"Original ITEM 94741. TrackDash intentionally does not reuse the later 95464 image as if it were exact. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Rare", verificationStatus:"verified", productionStatus:"unknown",
      
      sources:[source("9d9d9015-81e5-5388-9d36-3e8b3b223b54","trusted_secondary","https://www.rcjaz.com/tamiya-94741-132-avante-mkiii-azure-clear-special-polycarbonate-body-p-90022521.html",["itemNumber","editionName","chassis"],"Specialist retailer identifies original ITEM 94741."),
        source("9d9d9015-81e5-5388-9d36-3e8b3b223b54","trusted_secondary","https://mini-4wd.fandom.com/wiki/Avante_Mk.III",["itemNumber","releaseDate","releaseYear"],"Structured family matrix corroborates 2010-10-02.")]
    }),
    release({
      id:"fe19ba66-afdf-579b-97b1-0056f354271a", itemNumber:"94772", releaseType:"Special Edition", editionName:"Avante Mk.III Race Ready Set",
      editionType:"special", releaseYear:2010, 
      chassis:"MS",  
      countryMarket:"Japan", images:[],
      notes:"Race Ready Set with factory-bundled tuning parts; exact release day remains unverified. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Rare", verificationStatus:"partial", productionStatus:"unknown",
      
      sources:[source("fe19ba66-afdf-579b-97b1-0056f354271a","official_catalog_pdf","https://www.fantasyland.it/wordpress/wp-content/themes/fantasyland/documenti/tamiya/volantini/TA_2010-10.pdf",["itemNumber","editionName","chassis"],"Tamiya Italy flyer lists ITEM 94772 Avante Mk.III Race Ready Set."),
        source("fe19ba66-afdf-579b-97b1-0056f354271a","trusted_secondary","https://mini-4wd.fandom.com/wiki/Avante_Mk.III",["itemNumber","releaseYear"],"Family matrix corroborates the 2010 release year.")]
    }),
    release({
      id:"03b51f02-a25d-5b8c-9e5e-0da79a34acfc", itemNumber:"94951", releaseType:"Color Special", editionName:"Avante Mk.III Nero Clear Violet Special",
      editionType:"color_special", releaseYear:2013, releaseDate:"2013-06-15",
      chassis:"MS",  color:"Clear Violet",
      countryMarket:"Japan", images:[],
      notes:"Limited Clear Violet special. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Rare", verificationStatus:"verified", productionStatus:"unknown",
      
      sources:[source("03b51f02-a25d-5b8c-9e5e-0da79a34acfc","trusted_secondary","https://myrcstation.com/products/tamiya-94951-1-32-jr-avante-mkiii-nero-clear-violet-special-ms-chassis-94951",["itemNumber","editionName","chassis","color"],"Specialist retailer exact product record."),
        source("03b51f02-a25d-5b8c-9e5e-0da79a34acfc","trusted_secondary","https://www.jokerteam.it/wp-content/uploads/2018/01/Mini-4wd-Avante-History.pdf",["releaseDate","releaseYear"],"Historical family reference corroborates 2013-06-15.")]
    }),
    release({
      id:"805c2619-0c0c-5aa1-adc5-df25cafe5c8f", itemNumber:"92284", releaseType:"Limited Edition", editionName:"Avante Mk.III Nero STARGEK 10th Anniversary Special",
      editionType:"limited", releaseYear:2014, 
      chassis:"MA",  color:"Smoke / STARGEK",
      countryMarket:"Singapore", images:[],
      notes:"STARGEK 10th Anniversary regional edition; exact release day remains unverified. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Very Rare", verificationStatus:"verified", productionStatus:"unknown",
      
      sources:[source("805c2619-0c0c-5aa1-adc5-df25cafe5c8f","trusted_secondary","https://www.rcjaz.com/tamiya-92284-132-avante-mkiii-nero-ma-chassis-model-kit-p-90067482.html",["itemNumber","editionName","chassis"],"Specialist retailer identifies STARGEK 10th Anniversary edition on MA chassis.")]
    }),
    release({
      id:"68be3b41-30a7-55be-8cd9-f741193ce595", itemNumber:"95087", releaseType:"Japan Cup Edition", editionName:"Avante Mk.III Japan Cup 2015 Limited Edition",
      editionType:"japan_cup", releaseYear:2015, releaseDate:"2015-07-11",
      chassis:"MA",  color:"Magenta",
      countryMarket:"Japan", images:["https://www.tamiya.com/japan_contents/img/usr/item/9/95087/95087_1.jpg"],
      notes:"Japan Cup 2015 limited edition.", discontinued:false, isOriginal:false,
      rarity:"Rare", verificationStatus:"verified", productionStatus:"unknown",
      
      sources:[source("68be3b41-30a7-55be-8cd9-f741193ce595","official_manufacturer","https://www.tamiya.com/japan/products/95087/index.html",["itemNumber","chassis","releaseDate","releaseYear","editionName"],"Official Tamiya product page.")]
    }),
    release({
      id:"3ba49f54-21c9-532d-a34a-7b9e38668a6d", itemNumber:"95425", releaseType:"Reissue", editionName:"Avante Mk.III Red Special (2018 Re-release)",
      editionType:"reissue", releaseYear:2018, releaseDate:"2018-12-01",
      chassis:"MS",  color:"Red",
       images:["https://d7z22c0gz59ng.cloudfront.net/cms/img/usr/item/9/95425/95425_1.jpg"],
      notes:"New Item Number re-release of 94692; collector-distinct because the physical box/item identity is distinguishable.", discontinued:false, isOriginal:false,
      rarity:"Uncommon", verificationStatus:"verified", productionStatus:"unknown",
      
      sources:[source("3ba49f54-21c9-532d-a34a-7b9e38668a6d","official_manufacturer","https://www.tamiya.com/japan/products/95425/index.html",["itemNumber","chassis","releaseDate","releaseYear","editionName"],"Official Tamiya product page."),
        source("3ba49f54-21c9-532d-a34a-7b9e38668a6d","official_catalog_pdf","https://www.fantasyland.it/wordpress/wp-content/themes/fantasyland/documenti/tamiya/volantini/TA_2018-09.pdf",["editionName","releaseYear"],"Tamiya Italy flyer explicitly describes this as the return of the 2009 Red Special.")]
    }),
    release({
      id:"cc1fb7fa-67db-5303-9514-80b9705fe732", itemNumber:"95464", releaseType:"Reissue", editionName:"Avante Mk.III Azure Clear Special (2018 Re-release)",
      editionType:"reissue", releaseYear:2018, releaseDate:"2018-12-22",
      chassis:"MS", barcodeJAN:"4950344954643", color:"Clear/Azure",
       images:["https://www.tamiya.com/japan_contents/img/usr/item/9/95464/95464_1.jpg"],
      notes:"Single collector Release for ITEM 95464. First released 2018-12-22; Tamiya later records a 2023-11-11 production/on-sale wave under the same Item identity. No reliable physical discriminator is documented, so TrackDash keeps one Release.", discontinued:false, isOriginal:false,
      rarity:"Uncommon", verificationStatus:"verified", productionStatus:"unknown",
      
      sources:[source("cc1fb7fa-67db-5303-9514-80b9705fe732","official_manufacturer","https://www.tamiya.com/japan/products/95464/index.html",["itemNumber","chassis","releaseYear","editionName"],"Official page states initial 2010 model history and a later 2023-11-11 on-sale wave; TrackDash keeps ITEM 95464 as one collector Release beginning in 2018."),
        source("cc1fb7fa-67db-5303-9514-80b9705fe732","trusted_secondary","https://product.rakuten.co.jp/product/-/726ba4f4958649aded5caff160afb326/?l2-id=pdt_ranking",["itemNumber","releaseDate","barcodeJAN"],"Retail product record corroborates 2018-12-22 and JAN 4950344954643.")]
    }),
    release({
      id:"e31c9f48-a776-564a-a496-63771e4a4f9d", itemNumber:"95469", releaseType:"Reissue", editionName:"Avante Mk.III White Special (2019 Re-release)",
      editionType:"reissue", releaseYear:2019, releaseDate:"2019-03-23",
      chassis:"MS",  color:"White",
       images:["https://d7z22c0gz59ng.cloudfront.net/cms/img/usr/item/9/95469/95469_4c2.jpg"],
      notes:"New Item Number re-release of 94715.", discontinued:false, isOriginal:false,
      rarity:"Uncommon", verificationStatus:"verified", productionStatus:"unknown",
      
      sources:[source("e31c9f48-a776-564a-a496-63771e4a4f9d","official_manufacturer","https://www.tamiya.com/japan/products/95469/index.html",["itemNumber","chassis","releaseDate","releaseYear","editionName"],"Official Tamiya product page.")]
    }),
    release({
      id:"7fbd00c9-2226-5d71-bca6-8fe9d6e4949b", itemNumber:"92422", releaseType:"Limited Edition", editionName:"Avante Mk.III Tamiya Korea 25th Anniversary Special",
      editionType:"limited", releaseYear:2020, releaseDate:"2020-12-09",
      chassis:"MS",  
      countryMarket:"Korea", images:[],
      notes:"Tamiya Korea 25th Anniversary regional limited edition. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Rare", verificationStatus:"partial", productionStatus:"unknown",
      
      sources:[source("7fbd00c9-2226-5d71-bca6-8fe9d6e4949b","trusted_secondary","https://compensation.tistory.com/entry/%ED%83%80%EB%AF%B8%EC%95%BC-92422-%EC%95%84%EB%B0%98%EB%96%BC-MK%E2%85%A2-%ED%95%9C%EA%B5%AD%ED%83%80%EB%AF%B8%EC%95%BC-25%EC%A3%BC%EB%85%84-%EA%B8%B0%EB%85%90-%EC%8A%A4%ED%8F%90%EC%85%9C-%EA%B5%AC%EC%84%B1-%EB%A6%AC%EB%B7%B0",["itemNumber","editionName","chassis"],"Korean specialist review documents ITEM 92422 and 25th Anniversary specification."),
        source("7fbd00c9-2226-5d71-bca6-8fe9d6e4949b","trusted_secondary","https://mini-4wd.fandom.com/wiki/Avante_Mk.III",["releaseDate","releaseYear"],"Structured family matrix supplies release date.")]
    }),
    release({
      id:"65d43c3e-a25b-5d0b-9c16-7b19ae23cac0", itemNumber:"92428", releaseType:"Limited Edition", editionName:"Avante Mk.III Tamiya Korea 25th Anniversary Special Ver.2",
      editionType:"limited", releaseYear:2021, releaseDate:"2021-07-14",
      chassis:"MS",  
      countryMarket:"Korea", images:[],
      notes:"Tamiya Korea 25th Anniversary regional limited edition Ver.2. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Rare", verificationStatus:"partial", productionStatus:"unknown",
      
      sources:[source("65d43c3e-a25b-5d0b-9c16-7b19ae23cac0","trusted_secondary","https://www.modellismogandolfi.com/prodotto/avante-mk-iii-25th-anniversary-special-version-2-telaio-ms-edizione-limitata/",["itemNumber","editionName","chassis"],"Specialist retailer exact product record."),
        source("65d43c3e-a25b-5d0b-9c16-7b19ae23cac0","trusted_secondary","https://mini-4wd.fandom.com/wiki/Avante_Mk.III",["releaseDate","releaseYear"],"Structured family matrix supplies release date.")]
    }),
    release({
      id:"97902a92-3b57-5052-a417-ef6eb734652c", itemNumber:"92430", releaseType:"Limited Edition", editionName:"Avante Mk.III Azure Tamiya Plamodel Factory Hong Kong Special",
      editionType:"limited", releaseYear:2021, 
      chassis:"MS", barcodeJAN:"4950344924301", 
      countryMarket:"Hong Kong", images:[],
      notes:"Tamiya Plamodel Factory Hong Kong regional special, released August 2021; exact day remains unverified. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Very Rare", verificationStatus:"verified", productionStatus:"unknown",
      
      sources:[source("97902a92-3b57-5052-a417-ef6eb734652c","trusted_secondary","https://tamiyablog.com/2021/08/tamiya-92429-thunder-shot-mk-ii-waigo-hobby-45th-anniversary-special-92430-avante-mk-iii-azure-tamiya-plamodel-factory-hong-kong-special/",["itemNumber","editionName","releaseYear"],"Contemporary report reproduces Tamiya HK announcement."),
        source("97902a92-3b57-5052-a417-ef6eb734652c","trusted_secondary","https://www.rcjaz.com/tamiya-92430-132-avante-mkiii-azure-ms-chassis-model-kit-p-26964.html",["itemNumber","barcodeJAN","chassis"],"Specialist retailer corroborates GTIN/JAN 4950344924301.")]
    }),
    release({
      id:"c91957f4-907f-5f1a-9a49-faeddc3abd8d", itemNumber:"18662", releaseType:"Special Edition", editionName:"Avante Mk.III Nero Advanced Pack (MS Chassis)",
      editionType:"special", releaseYear:2025, releaseDate:"2025-10-11",
      chassis:"MS",  color:"Smoke / Red / White",
       images:[],
      notes:"Current Advanced Pack pairing the Avante Mk.III Nero base with race-spec tune-up parts. Exact release image is not attached after the 2026-09-21 audit; the placeholder is intentional until a directly verifiable asset is found.", discontinued:false, isOriginal:false,
      rarity:"Common", verificationStatus:"verified", productionStatus:"active",
      statusCheckedAt:"2026-09-21",
      sources:[source("c91957f4-907f-5f1a-9a49-faeddc3abd8d","official_manufacturer","https://www.tamiya.com/japan/products/18662/index.html",["itemNumber","editionName","releaseDate","releaseYear","chassis","productionStatus"],"Current official Tamiya Japan product page."),
        source("c91957f4-907f-5f1a-9a49-faeddc3abd8d","official_manufacturer","https://www.tamiyausa.com/shop/132-pro/jr-avante-mkiii-nero-3/",["itemNumber","editionName","productionStatus"],"Official Tamiya USA page currently offers the kit for sale.")]
    })
]

export function applyCatalogCorrectionsBatch17(products: Product[]): Product[] {
  return products.map((product) => {
    if (product.id !== PRODUCT_ID) return product
    return {
      ...product,
      itemNumber: "18626",
      name: "Avante Mk.III",
      japaneseName: "アバンテMk.III",
      series: "Avante",
      chassis: "MS",
      originalReleaseYear: 2008,
      rarity: "Uncommon",
      description:
        "The Avante Mk.III family: Azure and Nero regular releases plus finished models, color specials, collaborations, regional editions, Japan Cup releases, re-releases and the modern Nero Advanced Pack.",
      canonicalReleaseId: "497455cb-838d-5430-97dd-ae0be52e69e4",
      hasMultipleReleases: true,
      releases: RELEASES,
    }
  })
}
