import "server-only"

import { resolveMarketEurBasis } from "@/lib/fx/ecb"
import type { HotWheelsAskAuditResult } from "./hotwheels-ebay-audit"
import {
  assessHotWheelsSecondaryObservation,
  type HotWheelsSecondaryObservation,
} from "./hotwheels-secondary-source-policy"
import {
  simulateHotWheelsMarketSignal,
  type HotWheelsSimulatedSignal,
  type HotWheelsSignalObservation,
} from "./hotwheels-market-simulator"

const HCJ81_RELEASE_ID = "f16ed92f-34fb-5fd6-bd8b-c26ff3e831ee"
const SNAPSHOT_DATE = "2026-09-24"

type PreviewEvidenceRow = {
  source: string
  sourceFamily: "ebay" | "mercari" | "retail"
  sourceRecordKey: string
  url: string | null
  kind: "ask" | "sold" | "context"
  itemPriceEUR: number | null
  deliveredCostEUR: number | null
  marketUse: "ask" | "mv_candidate" | "context_only" | "rejected"
  evidenceClass: string
  valuationWeight: number
  reasonCodes: string[]
  note: string
}

export type HotWheelsMarketSignalPreview = {
  releaseId: string
  identifier: string
  generatedAt: string
  signal: HotWheelsSimulatedSignal
  liveEbay: {
    uniqueListings: number
    accepted: number
    review: number
    rejected: number
    acceptedAskCount: number
    deliveredAskCount: number
  }
  evidence: PreviewEvidenceRow[]
  readiness: {
    sufficientForPreview: boolean
    sufficientForPublishedMv: boolean
    note: string
  }
}

const SECONDARY_SNAPSHOT: Array<{
  sourceFamily: "mercari" | "retail"
  observation: HotWheelsSecondaryObservation
  url: string | null
  note: string
}> = [
  {
    sourceFamily: "mercari",
    observation: {
      source: "Mercari",
      sourceRecordKey: "m24698711774",
      title: "Hot Wheels Mountain Drifters LB-ER34 Super Silhouette Nissan Skyline",
      description: "NEW PACKAGE HAS SOFT CORNERS & SMALL BENDS",
      status: "sold",
      sourceKind: "marketplace",
      saleMechanism: "fixed_price",
      structuredCondition: "new",
      exactReleaseMatch: true,
      isLot: false,
      quantity: 1,
      price: 17,
      currency: "USD",
      shipping: 5.29,
      originCountry: "US",
      deliveryCountry: "IT",
      soldOn: null,
    },
    url: "https://www.mercari.com/us/item/m24698711774/",
    note: "SOLD reale, ma card con angoli morbidi/pieghe: utile come floor, escluso dal MV mint/carded.",
  },
  {
    sourceFamily: "mercari",
    observation: {
      source: "Mercari",
      sourceRecordKey: "m35763573132",
      title: "Hot Wheels Mountain Drifters LB-ER34 Super Silhouette Nissan Skyline",
      description: "Cracked Blister. Ships in protector.",
      status: "sold",
      sourceKind: "marketplace",
      saleMechanism: "fixed_price",
      structuredCondition: "new",
      exactReleaseMatch: true,
      isLot: false,
      quantity: 1,
      price: 13.5,
      currency: "USD",
      shipping: 4.99,
      originCountry: "US",
      deliveryCountry: "IT",
      soldOn: null,
    },
    url: "https://www.mercari.com/us/item/m35763573132/",
    note: "SOLD reale con blister crepato: contesto/floor, non comparabile con copia mint carded.",
  },
  {
    sourceFamily: "retail",
    observation: {
      source: "Toys-shop.gr",
      sourceRecordKey: "toys-shop-hcj81-079-859",
      title: "Mattel Hot Wheels Car Culture Mountain Drifters Super Silhouette Nissan Skyline FPY86 / HCJ81",
      description: "Prodotto retail HCJ81, pagina sold-out.",
      status: "unavailable",
      sourceKind: "retailer",
      saleMechanism: "fixed_price",
      retailWasObservedInStockAtThisPrice: false,
      structuredCondition: "new",
      exactReleaseMatch: true,
      isLot: false,
      quantity: 1,
      price: 7.99,
      currency: "EUR",
      shipping: null,
      originCountry: "GR",
      deliveryCountry: "IT",
      soldOn: null,
    },
    url: "https://www.toys-shop.gr/el/p/paichnidia/aftokinitakia-kai-ochimata/metallika-die-cast/1035431-mattel-hot-wheels-hot-wheels-car-culture-mountain-drifters-super-silhouette-nissan-skyline-x4-aftokinitakia-syllektika-agonistika-fpy86-hcj81.html",
    note: "Retail storico reale e oggi sold-out; utile come riferimento, ma non prova una transazione osservata.",
  },
]

async function toEur(amount: number | null | undefined, currency: string | null | undefined): Promise<number | null> {
  if (amount == null || !currency) return null
  const fx = await resolveMarketEurBasis(amount, currency.toUpperCase(), SNAPSHOT_DATE)
  return fx.amountEUR
}

export async function buildHcj81MarketSignalPreview(
  audit: HotWheelsAskAuditResult,
): Promise<HotWheelsMarketSignalPreview> {
  if (audit.releaseId !== HCJ81_RELEASE_ID || audit.primaryIdentifier !== "HCJ81") {
    throw new Error("HOTWHEELS_MARKET_PREVIEW_HCJ81_ONLY")
  }

  const evidence: PreviewEvidenceRow[] = []
  const observations: HotWheelsSignalObservation[] = []

  for (const row of audit.listings) {
    if (row.decision !== "accepted" || row.itemPriceEUR == null) continue

    observations.push({
      source: `eBay · ${row.marketplace} · ${row.itemId}`,
      sourceFamily: "ebay",
      kind: "ask",
      itemPriceEUR: row.itemPriceEUR,
      deliveredCostEUR: row.effectiveCostEUR,
      active: true,
    })

    evidence.push({
      source: `eBay · ${row.marketplace}`,
      sourceFamily: "ebay",
      sourceRecordKey: row.itemId,
      url: row.itemWebUrl ?? null,
      kind: "ask",
      itemPriceEUR: row.itemPriceEUR,
      deliveredCostEUR: row.effectiveCostEUR,
      marketUse: "ask",
      evidenceClass: "current_fixed_ask",
      valuationWeight: 0,
      reasonCodes: row.reasonCodes,
      note: row.effectiveCostEUR != null
        ? "ASK live accettato; costo effettivo UE verso l'Italia verificato."
        : "ASK live accettato; non usato come 'Disponibile da' senza costo consegnato affidabile.",
    })
  }

  for (const entry of SECONDARY_SNAPSHOT) {
    const assessed = assessHotWheelsSecondaryObservation(entry.observation)
    const itemPriceEUR = await toEur(entry.observation.price, entry.observation.currency)
    const shippingEUR = await toEur(entry.observation.shipping, entry.observation.currency)
    const deliveredCostEUR = assessed.costBasis === "delivered_eu" && itemPriceEUR != null && shippingEUR != null
      ? Math.round((itemPriceEUR + shippingEUR + Number.EPSILON) * 100) / 100
      : null

    const kind = assessed.marketUse === "ask"
      ? "ask"
      : entry.observation.status === "sold"
        ? "sold"
        : "context"

    if (itemPriceEUR != null && (kind === "ask" || kind === "sold")) {
      observations.push({
        source: `${entry.observation.source} · ${entry.observation.sourceRecordKey}`,
        sourceFamily: entry.sourceFamily,
        kind,
        itemPriceEUR,
        deliveredCostEUR,
        valuationWeight: assessed.valuationWeight,
        canonicalEligible: assessed.marketUse === "mv_candidate",
        active: kind === "ask",
      })
    }

    evidence.push({
      source: entry.observation.source,
      sourceFamily: entry.sourceFamily,
      sourceRecordKey: entry.observation.sourceRecordKey,
      url: entry.url,
      kind,
      itemPriceEUR,
      deliveredCostEUR,
      marketUse: assessed.marketUse,
      evidenceClass: assessed.evidenceClass,
      valuationWeight: assessed.valuationWeight,
      reasonCodes: assessed.reasonCodes,
      note: entry.note,
    })
  }

  const signal = simulateHotWheelsMarketSignal(observations)
  const acceptedAskCount = evidence.filter((row) => row.sourceFamily === "ebay" && row.marketUse === "ask").length
  const deliveredAskCount = evidence.filter((row) => row.sourceFamily === "ebay" && row.deliveredCostEUR != null).length
  const distinctAskFamilies = new Set(
    evidence.filter((row) => row.marketUse === "ask").map((row) => row.sourceFamily),
  ).size
  const usefulContext = evidence.filter((row) => row.marketUse === "context_only").length

  return {
    releaseId: audit.releaseId,
    identifier: audit.primaryIdentifier,
    generatedAt: new Date().toISOString(),
    signal,
    liveEbay: {
      uniqueListings: audit.uniqueListings,
      accepted: audit.accepted,
      review: audit.review,
      rejected: audit.rejected,
      acceptedAskCount,
      deliveredAskCount,
    },
    evidence,
    readiness: {
      sufficientForPreview: acceptedAskCount >= 3 && (distinctAskFamilies >= 1 || usefulContext >= 2),
      sufficientForPublishedMv: signal.marketValueEUR != null,
      note: signal.marketValueEUR != null
        ? "Il segnale soddisfa la soglia pilota per un Market Value."
        : "ASK sufficienti per leggere il mercato; SOLD mint/carded multi-fonte ancora insufficienti per pubblicare un Market Value.",
    },
  }
}
