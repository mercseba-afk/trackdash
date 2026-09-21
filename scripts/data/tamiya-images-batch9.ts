import type { TamiyaImageEntry } from "./tamiya-images"

const officialImage = (item: string) =>
  `https://www.tamiya.com/japan_contents/img/usr/item/${item.startsWith("9") ? "9" : "1"}/${item}/${item}_1.jpg`

const officialRelease = (
  releaseSeedKey: string,
  item: string,
  note: string,
): TamiyaImageEntry => ({
  productSeedKey: "avante-mk3",
  releaseSeedKey,
  imageUrl: officialImage(item),
  tamiyaItemNumber: item,
  sourcePageUrl: `https://www.tamiya.com/japan/products/${item}/index.html`,
  sourceDomain: "tamiya.com",
  sourceType: "official_manufacturer",
  note,
})

// Avante Mk.III exact-image master audit. These mappings mirror the exact
// Release image set applied by migration 0132. Releases not listed here keep
// the intentional placeholder; no sibling/reissue image is substituted.
export const TAMIYA_IMAGES_BATCH9: TamiyaImageEntry[] = [
  officialRelease("8", "94673", "Exact Tamiya asset for the Azure Finished Model."),
  officialRelease("9", "94674", "Exact Tamiya asset for the Nero Finished Model."),
  officialRelease("10", "94692", "Exact Tamiya asset for the original 2009 Red Special; distinct from ITEM 95425."),
  officialRelease("12", "94715", "Exact Tamiya asset for the original 2010 White Special."),
  officialRelease("16", "94777", "Exact Tamiya asset for the Azure Clear Blue Special."),
  officialRelease("6", "94741", "Exact Tamiya asset for the 2010 Azure Clear Special (Polycarbonate Body)."),
  officialRelease("17", "94772", "Exact Tamiya asset for the 2010 Competition Pack / Race Ready Set."),
  officialRelease("18", "94951", "Exact Tamiya asset for the Nero Clear Violet Special."),
  officialRelease("23", "18662", "Exact Tamiya asset for the Nero Advanced Pack."),
  {
    productSeedKey: "avante-mk3",
    releaseSeedKey: "20",
    imageUrl: "https://hongta.co.kr/web/product/big/202012/3f6f72c83b663c53646d8faa2966c8ed.jpg",
    tamiyaItemNumber: "92422",
    sourcePageUrl: "https://compensation.tistory.com/entry/%ED%83%80%EB%AF%B8%EC%95%BC-92422-%EC%95%84%EB%B0%98%EB%96%BC-MK%E2%85%A2-%ED%95%9C%EA%B5%AD%ED%83%80%EB%AF%B8%EC%95%BC-25%EC%A3%BC%EB%85%84-%EA%B8%B0%EB%85%90-%EC%8A%A4%ED%8E%98%EC%85%9C-%EA%B5%AC%EC%84%B1-%EB%A6%AC%EB%B7%B0",
    sourceDomain: "hongta.co.kr",
    sourceType: "other",
    note: "Exact product photograph for Korea 25th Anniversary ITEM 92422; identity is independently corroborated by catalog provenance.",
  },
  {
    productSeedKey: "avante-mk3",
    releaseSeedKey: "21",
    imageUrl: "https://hongta.co.kr/web/product/big/202107/86f8189d1fb3e647fa150f3fa7512456.jpg",
    tamiyaItemNumber: "92428",
    sourcePageUrl: "https://www.modellismogandolfi.com/prodotto/avante-mk-iii-25th-anniversary-special-version-2-telaio-ms-edizione-limitata/",
    sourceDomain: "hongta.co.kr",
    sourceType: "other",
    note: "Exact product photograph for Korea 25th Anniversary Ver.2 ITEM 92428; identity is independently corroborated by catalog provenance.",
  },
  {
    productSeedKey: "avante-mk3",
    releaseSeedKey: "22",
    imageUrl: "https://i0.wp.com/m4dtang.com/wp-content/uploads/2021/11/92430_7.jpg?fit=624%2C378&ssl=1",
    tamiyaItemNumber: "92430",
    sourcePageUrl: "https://tamiyablog.com/2021/08/tamiya-92429-thunder-shot-mk-ii-waigo-hobby-45th-anniversary-special-92430-avante-mk-iii-azure-tamiya-plamodel-factory-hong-kong-special/",
    sourceDomain: "m4dtang.com",
    sourceType: "other",
    note: "Exact product photograph for the Hong Kong Plamodel Factory ITEM 92430; identity is independently corroborated by catalog provenance.",
  },
]
