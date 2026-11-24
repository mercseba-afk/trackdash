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
}

// Public tracking identifier supplied by the TrackDash account owner.
export const amazonItalyAssociateTag = "trackdash-21"

export function amazonItalyUrlForRelease(releaseId: string): string | undefined {
  const asin = amazonItalyAsinByRelease[releaseId]
  return asin ? `https://www.amazon.it/dp/${asin}?tag=${amazonItalyAssociateTag}` : undefined
}
