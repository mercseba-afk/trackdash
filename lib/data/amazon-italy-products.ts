// Keyed by release ID so a listing never appears on another edition of the kit.
export const amazonItalyAsinByRelease: Partial<Record<string, string>> = {
  "a2baec17-32b5-5ca7-996b-4cdc2da725ba": "B086CJB4ZZ", // 18701 Aero Avante
  "5a123617-c84c-5012-ab20-1a9d493259e0": "B0859Y1TBQ", // 18614 Avante Mk.II
  "497455cb-838d-5430-97dd-ae0be52e69e4": "B09BFRS2ZG", // 18626 Avante Mk.III Azure
  "86763fe4-bfc0-551e-8541-c3fc9c2442b7": "B0BR9JMVTV", // 18627 Avante Mk.III Nero
  "cc1fb7fa-67db-5303-9514-80b9705fe732": "B07K4Q3NNQ", // 95464 Azure Clear Special
  "c91957f4-907f-5f1a-9a49-faeddc3abd8d": "B0FPQ45FYM", // 18662 Nero Advanced Pack
  "51267c3e-03cc-54c4-8b9b-1c4e413d75b8": "B08KR2LXCV", // 95598 Neo-VQS Advanced Pack; user-supplied exact product link
  "01e1ea1d-0513-5562-8e55-63c11f24fbe5": "B083JYP59Y", // 18094 Neo-VQS VZ; user-supplied exact product link
  "f576fa21-8e57-5fa0-953e-f468653e3767": "B086CFGY15", // 18069 Dash-1 Emperor Premium
  "0306bc1a-cdb6-5b9c-9461-91cd2a39e07c": "B086CJVCSJ", // 18625 Dash-1 Emperor (MS Chassis)
  "a743ba55-5883-4872-a4b5-5ab1134df426": "B086CDXNCZ", // 18630 Dash-3 Shooting Star — 2008 MS Chassis
  "4846e9d4-58be-4142-b8a6-a2cd72fea1db": "B086CJG31D", // 18628 Dash-2 Burning Sun — 2008 MS Chassis
  "532f8e3a-f55f-5936-abcd-58e0f8538785": "B086CDY3C3", // 18075 Great Emperor Premium
  "0e5addea-1d9e-4ec9-b29e-0a149ab0a889": "B086CDX4T6", // 18624 Hotshot Jr. — MS Chassis
  "035abf4d-65da-5b0c-855d-9e611798c4e4": "B086CDYQ2Z", // 18702 Aero Thunder Shot (AR Chassis)
  "01dbe92d-064a-4978-8e93-7aea7c601222": "B07MM3WLBB", // 18714 Mach Frame
  "71addadb-04b3-579f-96f2-c5e976cf1cd5": "B014W8VPJU", // 19415 Hurricane Sonic
  "dc47a724-7dce-4128-ba72-64a00aac6892": "B005AFAX7K", // 95603 Hurricane Sonic 30th Anniversary
  "85a3549a-d563-5dda-bc6d-bd1ac684601e": "B07YV48TMG", // 19440 Cyclone Magnum Premium
  "0bdb9bcd-e4aa-53ab-b004-984cae96fdca": "B07YV3Y9WZ", // 19434 Victory Magnum Premium
  "b3639c7d-581e-5da8-9ec4-ea1eb9d61193": "B085RZDQ7B", // 19435 Vanguard Sonic (Super II)
  "0fdbfd56-f257-5b84-b541-e08a7450cc34": "B0044BCLDK", // 19431 Magnum Saber Premium
  "fa1b971e-e49e-5b98-84b0-25f79c45ec38": "B07FP2KPXC", // LEGO 75890
  "fbd0bf92-2a92-55a1-9ece-c6b8b3f62eea": "B07W5PWLN3", // LEGO 76895
  "4183e7ae-2ca8-5d93-90c1-d966ceee5400": "B08WX2FV29", // LEGO 76899
  "b36ae9d5-0393-5539-8f94-bd440ab25b91": "B08W8W71HC", // LEGO 76900
  "0ec406c7-16f9-53cb-8ed6-51777b8adfbe": "B08W8T8LS4", // LEGO 76901
  "31557fbe-8986-5834-b01c-f02072ea21ed": "B08W8H6KCC", // LEGO 76902
  "df9d802a-111e-55a7-9629-43af13cbf74b": "B09BNWR3VR", // LEGO 76906
  "306202ae-35ec-53ce-aaab-934d921a1ef0": "B09BNTTYDL", // LEGO 76908
  "9b34872a-1aef-5f4c-9dc0-b9523641e862": "B09QFXX1DW", // LEGO 76912
  "dc416987-1f54-50c3-b31e-4e5ce3b6c4ed": "B0BBRXC9HN", // LEGO 76917
  "edac6eb1-03b9-58e7-bf7b-712bf6816e67": "B0BLJ3HSLH", // LEGO 76918
  "ebfe7d97-fe3e-5ab3-ac86-cf8700892475": "B0CFVZRN8W", // LEGO 76920
  "13084cd2-9315-5994-9477-6dc4e430679c": "B0CFVXTCWC", // LEGO 76922
  "eb559ff8-784e-56a8-b5b0-5e822d3bfea7": "B0CWH3J5D6", // LEGO 76924
  "f4b42582-9f01-5149-9d55-ba09dcaf7e8d": "B0CWH1Q8B4", // LEGO 76934
  "6fd1f663-94fd-5449-8646-3ed37481b462": "B0DWF1S7NT", // LEGO 77239
  "6ecbcd83-cba6-54f4-8940-b2dc46b567c0": "B0DHSBBV6R", // LEGO 77242
  "e667c02e-66d9-5b11-b75d-ce4a2f7ccd98": "B0DHSBYSRB", // LEGO 77247
}

// Public tracking identifier supplied by the TrackDash account owner.
export const amazonItalyAssociateTag = "trackdash-21"

export function amazonItalyUrlForRelease(releaseId: string): string | undefined {
  const asin = amazonItalyAsinByRelease[releaseId]
  return asin ? `https://www.amazon.it/dp/${asin}?tag=${amazonItalyAssociateTag}` : undefined
}
