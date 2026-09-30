import "server-only"

import {
  applyAskTrend,
  computeCurrentMarketSignal,
  type AskMarketSnapshot,
  type CurrentOfferEvidence,
  type MarketSignalDraft,
  type SoldMarketEvidence,
} from "@/lib/market/pipeline/market-model"
import { applyPublicMarketPublicationPolicy } from "@/lib/market/pipeline/market-publication-policy"
import type { HotWheelsAskAuditResult } from "./hotwheels-ebay-audit"

export type HotWheelsSharedSoldEvidence = SoldMarketEvidence

export type HotWheelsSharedMarketPreview = {
  releaseId: string
  identifier: string
  generatedAt: string
  engine: "shared-market-method-v4"
  conditionSemantics: "new_carded_unopened"
  signal: MarketSignalDraft
  inputs: {
    acceptedAskCount: number
    deliveredAskCount: number
    soldEvidenceCount: number
    askSnapshotCount: number
  }
  readiness: {
    marketValuePublished: boolean
    hasCurrentAskContext: boolean
    note: string
  }
}

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR",
  "GR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK",
])

function marketRegion(country: string | null | undefined): CurrentOfferEvidence["marketRegion"] {
  const code = country?.trim().toUpperCase()
  if (!code) return "global"
  if (EU_COUNTRIES.has(code) || code === "GB" || code === "CH" || code === "NO") return "europe"
  if (code === "JP") return "japan"
  if (code === "US" || code === "CA") return "north_america"
  if (["AU", "NZ", "SG", "HK", "TW", "KR"].includes(code)) return "asia_pacific"
  return "global"
}

function auditOffers(audit: HotWheelsAskAuditResult, observedAt: string): CurrentOfferEvidence[] {
  return audit.listings.flatMap((row) => {
    if (row.decision !== "accepted" || row.itemPriceEUR == null || row.itemPriceEUR <= 0) return []

    // The shared engine treats a non-null shippingEUR as a trustworthy delivered-cost
    // component. Hot Wheels audit shipping is therefore forwarded only when the
    // Italy-delivered EU basis is actually verified. Extra-EU / unknown delivery
    // stays item-only instead of pretending that visible postage is landed cost.
    const shippingEUR = row.costBasis === "delivered_eu"
      ? row.shippingEUR ?? 0
      : null

    return [{
      stableId: `hotwheels-ebay:${row.marketplace}:${row.itemId}`,
      candidateId: null,
      sourceId: `ebay_active_public:${row.marketplace}`,
      channel: "marketplace" as const,
      sellerFingerprint: row.seller ? `ebay:${row.seller}` : null,
      merchantKey: null,
      marketRegion: marketRegion(row.itemLocationCountry),
      availability: "in_stock" as const,
      itemPriceEUR: row.itemPriceEUR,
      shippingEUR,
      observedAt,
    }]
  })
}

export function buildHotWheelsSharedMarketPreview(input: {
  audit: HotWheelsAskAuditResult
  soldEvidence?: HotWheelsSharedSoldEvidence[]
  askSnapshots?: AskMarketSnapshot[]
  now?: Date
}): HotWheelsSharedMarketPreview {
  const now = input.now ?? new Date()
  const generatedAt = now.toISOString()
  const asOfDate = generatedAt.slice(0, 10)
  const offers = auditOffers(input.audit, generatedAt)
  const soldEvidence = input.soldEvidence ?? []
  const askSnapshots = input.askSnapshots ?? []

  const computed = computeCurrentMarketSignal({
    offers,
    soldEvidence,
    monthlySoldEvidence: soldEvidence.filter((row) => row.grain === "monthly"),
    asOfDate,
  })
  const published = applyPublicMarketPublicationPolicy(computed, soldEvidence, asOfDate)
  const signal = applyAskTrend(published, askSnapshots, asOfDate)

  const deliveredAskCount = offers.filter((row) => row.shippingEUR != null).length
  const hasCurrentAskContext = signal.activeOfferCount > 0
  const marketValuePublished = signal.marketValueEUR != null

  return {
    releaseId: input.audit.releaseId,
    identifier: input.audit.primaryIdentifier,
    generatedAt,
    engine: "shared-market-method-v4",
    // Database condition remains the shared collector lane
    // `new_complete_unbuilt` for compatibility. For Hot Wheels this lane means
    // a new, unopened, original-card/package collectible. We intentionally do not
    // fork the price engine or invent a parallel public condition yet.
    conditionSemantics: "new_carded_unopened",
    signal,
    inputs: {
      acceptedAskCount: offers.length,
      deliveredAskCount,
      soldEvidenceCount: soldEvidence.length,
      askSnapshotCount: askSnapshots.length,
    },
    readiness: {
      marketValuePublished,
      hasCurrentAskContext,
      note: marketValuePublished
        ? "Il Market Value supera le stesse regole di pubblicazione Market Method v4 usate da Mini 4WD."
        : hasCurrentAskContext
          ? "ASK exact-release disponibili, ma il motore condiviso non pubblica un Market Value senza SOLD/retail qualificati sufficienti."
          : "Nessun segnale corrente sufficiente: il motore condiviso resta fail-closed e non inventa un Market Value.",
    },
  }
}
