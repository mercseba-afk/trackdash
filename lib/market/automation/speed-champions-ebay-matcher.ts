import type { EbayBrowseListing, EbayListingDecision } from "./ebay-browse-adapter"

const NOT_A_COMPLETE_SET = /\b(?:custom|moc|replica|compatible|kompatibel|nachbau|replacement parts?|spare parts?|pezzi di ricambio|scatola vuota|empty box|leerkarton|boite vide|caja vacia|no bricks|senza mattoncini|senza pezzi|no minifigures?|senza minifigur[ae]|ohne minifigur|sans figurine|without instructions|senza istruzioni|loose parts|mattoncini sfusi|incomplete|incompleto|unvollstandig|incomplet|partial set)\b/
const COMPONENTS = /\b(?:minifig(?:s|ures?)?|minifigur[ae]s?|stickers?|adesivi|autocollants|aufkleber|instructions?|istruzioni|anleitung|manuale|wheels?|ruote|carrozzeria|display stand|supporto espositivo|display case|teca|vetrina|lighting kit|light kit|kit luci|led kit|parts?|pezzi|mattoncini|box|scatola|boite|caja)\s+(?:only|soltanto|seulement)\b|\b(?:only|solo|soltanto|nur|seulement)\s+(?:(?:the|la|le|gli|i)\s+)?(?:minifig\w*|figurine|stickers?|adesivi|instructions?|istruzioni|anleitung|manuale|wheels?|ruote|parts?|pezzi|mattoncini|box|scatola|boite|caja|una delle auto|one car)\b/
const ACCESSORY = /\b(?:light kit|lighting kit|led kit|kit luci|display case|display stand|vetrina|teca)\b/
const LOT = /\b(?:lotto|lote|lot|bundle|multipack|collection|collezione completa|konvolut|konvolute)\b|\b(?:[2-9]|[1-9]\d+)\s*(?:x|sets?|kits?|confezioni)\b|\bx\s*(?:[2-9]|[1-9]\d+)\b/
const OPENED = /\b(?:open(?:ed)? box|box open(?:ed)?|opened|unsealed|not sealed|not factory sealed|no seal|scatola apert[ao]|apert[oa]|non sigillat[oa]|non inscatolat[oa]|geoffnet|nicht versiegelt|ohne siegel|non scelle|boite ouverte|sin precinto|caja abierta|used|usat[oa]|gebraucht|occasion|montato|assembled)\b/
const SEALED = /\b(?:sealed|factory seal(?:s)? intact|sigillat[oa]|sigillat[ie]|sigilli intatti|versiegelt|eingeschweisst|scelle[es]?|precintad[oa])\b/
const NON_SET_BRAND = /\b(?:lego star wars|lego technic|lego city|lego friends|non originale|not genuine|mould king|mold king|cada|lepin|megabloks)\b/
const LOOSE_OR_SINGLE_CAR = /\b(?:without box|no box|senza scatola|ohne originalkarton|single car|solo una vettura|solo un auto|only one car|solo una delle auto)\b/
const DOUBLE_PACK = /\b(?:(?:2|two|due|zwei|deux|dos)\s+(?:cars?|auto|autos|voitures|coches|veicoli)|dual pack|double pack|twin pack|doppia confezione)\b/

interface SpeedChampionsIdentity {
  setNumber: string
  name: string
  carCount: number
}

function normalize(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function decision(status: EbayListingDecision["decision"], reason: string): EbayListingDecision {
  return { decision: status, reasonCodes: [reason] }
}

/** First ASK pilot: require evidence of an exact, sealed and complete kit. */
export function classifySpeedChampionsAsking(listing: EbayBrowseListing, identity: SpeedChampionsIdentity, asOf: Date): EbayListingDecision {
  const { setNumber, name, carCount } = identity
  const title = normalize(listing.title)
  const codes = listing.title.match(/(?<![a-z0-9])\d{5}(?![a-z0-9])/gi) ?? []

  if (!/^\d{5}$/.test(setNumber) || !codes.includes(setNumber)) return decision("rejected", "LEGO_SET_CODE_NOT_EXACT")
  if (NON_SET_BRAND.test(title) || NOT_A_COMPLETE_SET.test(title) || COMPONENTS.test(title) || LOOSE_OR_SINGLE_CAR.test(title)) {
    return decision("rejected", "LEGO_INCOMPLETE_OR_NON_GENUINE_SET")
  }
  if (ACCESSORY.test(title)) return decision("needs_review", "LEGO_ACCESSORY_OR_BUNDLE")
  if (codes.some((code) => code !== setNumber) || LOT.test(title)) {
    return decision("needs_review", "LEGO_MULTIPLE_SETS_OR_QUANTITY")
  }
  if (!/\blego\b/.test(title)) return decision("needs_review", "LEGO_BRAND_NOT_CONFIRMED")
  if (carCount > 1 && !DOUBLE_PACK.test(title)) {
    const cars = name.split(/\s+(?:&|e)\s+/i).map((car) => normalize(car.replace(/^auto da corsa\s+/i, "")))
    if (cars.length !== carCount || cars.some((car) => !car || !` ${title} `.includes(` ${car} `))) {
      return decision("needs_review", "LEGO_FULL_MULTI_CAR_SET_NOT_CONFIRMED")
    }
  }
  if (listing.conditionId !== "1000" || OPENED.test(title) || !SEALED.test(title)) {
    return decision("needs_review", "LEGO_FACTORY_SEAL_NOT_CONFIRMED")
  }
  if (listing.itemEndDate) {
    const end = Date.parse(listing.itemEndDate)
    if (!Number.isFinite(end) || end <= asOf.getTime()) return decision("rejected", "LEGO_LISTING_NOT_ACTIVE")
  }
  if (!Number.isFinite(listing.price) || listing.price <= 0 || listing.currency !== "EUR") {
    return decision("needs_review", "LEGO_NO_VERIFIED_EUR_ASK")
  }

  return decision("accepted", "LEGO_EXACT_SEALED_SET_RETAIL_ASK")
}
