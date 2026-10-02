import type { Condition, Product, ProductRelease, Rarity } from "@/lib/types"

const RELEASE_TYPE_IT: Record<string, string> = {
  "Anniversary": "Anniversario",
  "Anniversary Edition": "Edizione anniversario",
  "Black Special": "Black Special",
  "Chassis Variant": "Variante chassis",
  "Clear Body": "Carrozzeria trasparente",
  "Clear Special": "Clear Special",
  "Collaboration Special": "Edizione speciale collaborazione",
  "Color Special": "Edizione colore speciale",
  "Event Limited": "Edizione limitata evento",
  "Finished Model": "Modello assemblato",
  "First Production": "Prima produzione",
  "Japan Cup Edition": "Edizione Japan Cup",
  "Limited": "Limitata",
  "Limited Edition": "Edizione limitata",
  "Limited Reissue": "Ristampa limitata",
  "Memorial Reissue": "Ristampa Memorial",
  "Modern Redesign": "Redesign moderno",
  "MS Chassis Version": "Versione chassis MS",
  "New Year Limited": "Edizione limitata di Capodanno",
  "Official Collaboration": "Collaborazione ufficiale",
  "Original": "Originale",
  "Other": "Altro",
  "Premium": "Premium",
  "Prize Limited": "Edizione premio limitata",
  "Prize Promotional": "Promozionale premio",
  "Promotional": "Promozionale",
  "Regional Limited": "Edizione regionale limitata",
  "Regional Package Variant": "Variante confezione regionale",
  "Reissue": "Ristampa",
  "Retailer Limited": "Edizione limitata retailer",
  "RS": "RS",
  "Special": "Speciale",
  "Special Edition": "Edizione speciale",
  "Spot Reissue": "Ristampa spot",
  "Zodiac": "Zodiacale",
  "Zodiac Limited": "Edizione zodiacale limitata",
}

const RARITY_IT: Record<string, string> = {
  Common: "Comune",
  Uncommon: "Non comune",
  Rare: "Rara",
  "Very Rare": "Molto rara",
  Grail: "Grail",
}

const CONDITION_IT: Record<string, string> = {
  Sealed: "Sigillato",
  "New / Opened": "Nuovo / Aperto",
  Built: "Montato",
  Used: "Usato",
  Incomplete: "Incompleto",
}

const MARKET_PART_IT: Record<string, string> = {
  Japan: "Giappone",
  Germany: "Germania",
  International: "Internazionale",
  "Sanfrecce Hiroshima": "Sanfrecce Hiroshima",
  "Hong Kong": "Hong Kong",
  Korea: "Corea",
  "South Korea": "Corea del Sud",
  Singapore: "Singapore",
  Taiwan: "Taiwan",
  "Asia Challenge": "Asia Challenge",
  USA: "USA",
  Global: "Globale",
}

const SIMPLE_COLOR_IT: Record<string, string> = {
  Black: "Nero",
  White: "Bianco",
  Red: "Rosso",
  Blue: "Blu",
  Yellow: "Giallo",
  Green: "Verde",
  Purple: "Viola",
  Orange: "Arancione",
  Pink: "Rosa",
  Silver: "Argento",
  Gold: "Oro",
  Clear: "Trasparente",
  "Clear Blue": "Blu trasparente",
  "Clear Pink": "Rosa trasparente",
  "Clear Red": "Rosso trasparente",
  "Clear Violet": "Viola trasparente",
  "Smoke Black": "Nero fumé",
  Smoke: "Fumé",
  Violet: "Viola",
  Gray: "Grigio",
  Magenta: "Magenta",
  "Light Blue": "Azzurro",
  "Navy Blue": "Blu navy",
  Pearl: "Perlato",
  "Gun Metal": "Canna di fucile",
  "Gold Metallic": "Oro metallizzato",
  "Blue Plated": "Blu placcato",
  "Green Plated": "Verde placcato",
  "Silver Plated": "Argento placcato",
}

const BODY_ADJECTIVES: Record<string, string> = {
  black: "nera",
  white: "bianca",
  red: "rossa",
  blue: "blu",
  yellow: "gialla",
  green: "verde",
  purple: "viola",
  orange: "arancione",
  pink: "rosa",
  silver: "argento",
  gold: "oro",
  gray: "grigia",
  magenta: "magenta",
  violet: "viola",
  clear: "trasparente",
  "clear blue": "blu trasparente",
  "clear red": "rossa trasparente",
  "clear orange": "arancione trasparente",
  "pearl white": "bianca perlata",
  "pearl blue": "blu perlata",
  "gold-plated": "placcata oro",
  "silver-plated": "placcata argento",
  "black-plated": "placcata nera",
  "violet metal-plated": "metallizzata viola",
  "metallic red": "rosso metallizzato",
  "light green metallic": "verde chiaro metallizzato",
}

const CHASSIS_NAMES = [
  "Super TZ-X", "Super XX", "Super II", "Super TZ", "Super X",
  "Super 1", "Type 1", "Type 2", "Type 3", "FM-A", "Zero",
  "VS", "MS", "MA", "VZ", "AR", "FM",
]

function replaceCommonItalianTerms(value: string): string {
  return value
    .replace(/\bClear Blue\b/gi, "blu trasparente")
    .replace(/\bClear Red\b/gi, "rosso trasparente")
    .replace(/\bClear Pink\b/gi, "rosa trasparente")
    .replace(/\bClear Violet\b/gi, "viola trasparente")
    .replace(/\bFluorescent Orange\b/gi, "arancione fluorescente")
    .replace(/\bFluorescent Pink\b/gi, "rosa fluorescente")
    .replace(/\bFluorescent Green\b/gi, "verde fluorescente")
    .replace(/\bFluorescent Yellow\b/gi, "giallo fluorescente")
    .replace(/\bLight Blue\b/gi, "azzurro")
    .replace(/\bLight Green\b/gi, "verde chiaro")
    .replace(/\bNavy Blue\b/gi, "blu navy")
    .replace(/\bDark Blue\b/gi, "blu scuro")
    .replace(/\bGun Metal\b/gi, "canna di fucile")
    .replace(/\bBlack\b/gi, "nero")
    .replace(/\bWhite\b/gi, "bianco")
    .replace(/\bRed\b/gi, "rosso")
    .replace(/\bBlue\b/gi, "blu")
    .replace(/\bGreen\b/gi, "verde")
    .replace(/\bPurple\b/gi, "viola")
    .replace(/\bOrange\b/gi, "arancione")
    .replace(/\bPink\b/gi, "rosa")
    .replace(/\bSilver\b/gi, "argento")
    .replace(/\bGold\b/gi, "oro")
    .replace(/\bGray\b/gi, "grigio")
    .replace(/\bClear\b/gi, "trasparente")
    .replace(/\bSmoke\b/gi, "fumé")
    .replace(/\bPearl\b/gi, "perlato")
    .replace(/\bMetallic\b/gi, "metallizzato")
    .replace(/\bPlated\b/gi, "placcato")
    .replace(/\breinforced\b/gi, "rinforzato")
    .replace(/\blarge-diameter\b/gi, "di grande diametro")
    .replace(/\blarge\b/gi, "grandi")
    .replace(/\bnarrow\b/gi, "stretti")
    .replace(/\bhard\b/gi, "hard")
}

function feminineDescriptor(value: string): string {
  return value
    .replace(/\bnero\b/g, "nera")
    .replace(/\bbianco\b/g, "bianca")
    .replace(/\brosso\b/g, "rossa")
    .replace(/\bgrigio\b/g, "grigia")
    .replace(/\bgiallo\b/g, "gialla")
    .replace(/\brinforzato\b/g, "rinforzata")
    .replace(/\bmetallizzato\b/g, "metallizzata")
    .replace(/\bplaccato\b/g, "placcata")
    .replace(/\bperlato\b/g, "perlata")
}

function pluralDescriptor(value: string): string {
  return value
    .replace(/\bnero\b/g, "neri")
    .replace(/\bbianco\b/g, "bianchi")
    .replace(/\brosso\b/g, "rossi")
    .replace(/\bgrigio\b/g, "grigi")
    .replace(/\bgiallo\b/g, "gialli")
    .replace(/\bverde\b/g, "verdi")
    .replace(/\barancione\b/g, "arancioni")
    .replace(/\brinforzato\b/g, "rinforzati")
    .replace(/\bmetallizzato\b/g, "metallizzati")
    .replace(/\bplaccato\b/g, "placcati")
    .replace(/\bperlato\b/g, "perlati")
    .replace(/\bfluorescente\b/g, "fluorescenti")
}

function translateColorSegment(segment: string): string {
  const value = segment.trim()
  if (!value) return value
  if (SIMPLE_COLOR_IT[value]) return SIMPLE_COLOR_IT[value]

  if (/ collaboration$/i.test(value)) {
    return `Collaborazione ${value.replace(/ collaboration$/i, "")}`
  }
  if (/ collaboration livery$/i.test(value)) {
    return `Livrea collaborazione ${value.replace(/ collaboration livery$/i, "")}`
  }
  if (/ livery$/i.test(value)) {
    return `Livrea ${value.replace(/ livery$/i, "")}`
  }
  if (/ team specification$/i.test(value)) {
    return `Specifica squadra ${replaceCommonItalianTerms(value.replace(/ team specification$/i, ""))}`
  }
  if (/ packaging$/i.test(value)) {
    return `Confezione ${replaceCommonItalianTerms(value.replace(/ packaging$/i, ""))}`
  }
  if (/ decals$/i.test(value)) {
    return `Decal ${replaceCommonItalianTerms(value.replace(/ decals$/i, ""))}`
  }
  if (/ markings$/i.test(value)) {
    return `Grafiche ${replaceCommonItalianTerms(value.replace(/ markings$/i, ""))}`
  }
  if (/ driver$/i.test(value)) {
    return `Pilota ${replaceCommonItalianTerms(value.replace(/ driver$/i, ""))}`
  }

  const polyBody = value.match(/^(.+?) polycarbonate body$/i)
  if (polyBody) {
    return `Carrozzeria in policarbonato ${feminineDescriptor(replaceCommonItalianTerms(polyBody[1]))}`
  }

  const body = value.match(/^(.+?) body$/i)
  if (body) {
    const descriptor = body[1].trim()
    const exact = BODY_ADJECTIVES[descriptor.toLowerCase()]
    return `Carrozzeria ${exact ?? feminineDescriptor(replaceCommonItalianTerms(descriptor))}`
  }

  const wheels = value.match(/^(.+?) wheels$/i)
  if (wheels) return `Cerchi ${pluralDescriptor(replaceCommonItalianTerms(wheels[1]))}`

  const tires = value.match(/^(.+?) tires$/i)
  if (tires) return `Pneumatici ${pluralDescriptor(replaceCommonItalianTerms(tires[1]))}`

  const chassis = value.match(/^(.+?) chassis$/i)
  if (chassis) {
    const descriptor = chassis[1].trim()
    const chassisName = CHASSIS_NAMES.find((name) => descriptor.endsWith(name))
    if (chassisName) {
      const before = descriptor.slice(0, -chassisName.length).trim()
      return `Chassis ${chassisName}${before ? ` · ${replaceCommonItalianTerms(before)}` : ""}`
    }
    return `Chassis ${replaceCommonItalianTerms(descriptor)}`
  }

  return replaceCommonItalianTerms(value)
    .replace(/\bparts\b/gi, "parti")
    .replace(/\bwheels\b/gi, "cerchi")
    .replace(/\btires\b/gi, "pneumatici")
    .replace(/\bbody\b/gi, "carrozzeria")
    .replace(/\bpackaging\b/gi, "confezione")
    .replace(/\bproduction\b/gi, "produzione")
    .replace(/\bearly\b/gi, "prima produzione")
    .replace(/\blater\b/gi, "produzione successiva")
}

export function releaseTypeLabel(value: string, it: boolean): string {
  return it ? (RELEASE_TYPE_IT[value] ?? value) : value
}

export function rarityLabel(value: Rarity | string, it: boolean): string {
  return it ? (RARITY_IT[value] ?? value) : value
}

export function conditionLabel(value: Condition | string, it: boolean): string {
  return it ? (CONDITION_IT[value] ?? value) : value
}

export function countryMarketLabel(value: string | undefined, it: boolean): string {
  if (!value) return "—"
  if (!it) return value
  return value
    .split("/")
    .map((part) => part.trim())
    .map((part) => MARKET_PART_IT[part] ?? part)
    .join(" / ")
}

export function colorLabel(value: string | undefined, it: boolean): string {
  if (!value) return "—"
  if (!it) return value
  return value.split("/").map(translateColorSegment).join(" / ")
}

export function productDescriptionForLocale(
  product: Product,
  descriptionIt: string | null | undefined,
  it: boolean,
): string {
  if (!it) return product.description
  if (descriptionIt?.trim()) return normalizeItalianEditorialText(descriptionIt)

  const facts = [
    product.originalReleaseYear ? `introdotta nel ${product.originalReleaseYear}` : null,
    product.chassis ? `con chassis originale ${product.chassis}` : null,
  ].filter(Boolean)

  const first = `${product.name} è una famiglia Tamiya Mini 4WD${facts.length ? `, ${facts.join(" e ")}` : ""}.`
  const count = product.releases.length
  const second = count > 0
    ? `TrackDash mantiene separate ${count} ${count === 1 ? "Release verificata" : "Release verificate"} per non confondere originali, ristampe ed edizioni speciali.`
    : ""

  return [first, second].filter(Boolean).join(" ")
}

export function releaseDescriptionForLocale(
  product: Product,
  release: ProductRelease,
  localizedDescription: { en: string | null; it: string | null } | undefined,
  it: boolean,
): string {
  if (!it) return localizedDescription?.en?.trim() || product.description

  if (localizedDescription?.it?.trim()) {
    return normalizeItalianEditorialText(localizedDescription.it)
  }

  const facts = [
    release.itemNumber ? `ITEM ${release.itemNumber}` : null,
    release.releaseYear ? `uscita nel ${release.releaseYear}` : null,
    release.chassis ? `chassis ${release.chassis}` : null,
    release.releaseType ? releaseTypeLabel(release.releaseType, true).toLowerCase() : null,
  ].filter(Boolean)

  return `${release.editionName} è una Release della famiglia ${product.name}${facts.length ? `: ${facts.join(", ")}` : ""}.`
}

export function normalizeItalianEditorialText(value: string): string {
  return value
    .replace(/carrozzeria\s+Red\b/g, "carrozzeria rossa")
    .replace(/carrozzeria\s+Blue\b/g, "carrozzeria blu")
    .replace(/carrozzeria\s+Black\b/g, "carrozzeria nera")
    .replace(/carrozzeria\s+White\b/g, "carrozzeria bianca")
    .replace(/carrozzeria\s+Green\b/g, "carrozzeria verde")
    .replace(/carrozzeria\s+Silver\b/g, "carrozzeria argento")
    .replace(/\bClear Red\b/g, "rosso trasparente")
    .replace(/\bClear Blue\b/g, "blu trasparente")
    .replace(/\bClear Pink\b/g, "rosa trasparente")
    .replace(/\bGreen Plated\b/g, "verde placcata")
    .replace(/\bBlue Plated\b/g, "blu placcata")
    .replace(/\bBlack Metallic\b/g, "nero metallizzato")
    .replace(/\bPink Metallic\b/g, "rosa metallizzato")
    .replace(/\bpremio amusement\b/gi, "premio arcade")
    .replace(/\blimited\b/gi, "limitata")
    .replace(/\bwave produttive\b/gi, "serie produttive")
    .replace(/\bwave\b/gi, "serie produttiva")
    .replace(/\bredesign\b/gi, "reinterpretazione")
}
