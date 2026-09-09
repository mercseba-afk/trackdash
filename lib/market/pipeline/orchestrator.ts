import { createHash } from "node:crypto"
import {
  assignEvidenceGroups,
  buildEvidenceGroupRepresentatives,
  isPossibleOutlier,
} from "./evidence"
import { classifyObservation } from "./matching"
import { assertManualVerifiedObservation } from "./manual-adapter"
import { buildPricePointDraft } from "./promotion"
import type {
  GroupingEvidenceRow,
  MarketPipelineStore,
  StoredEstimate,
  ValuationPointRow,
} from "./repository"
import type {
  ClassifiedCandidate,
  EvidenceSale,
  MarketCondition,
  MarketEstimateDraft,
  PricePointDraft,
  SourceObservation,
} from "./types"
import { computeMarketEstimate } from "./valuation"

export const MANUAL_VERIFIED_SOURCE = {
  slug: "manual_verified_sales",
  name: "Manual verified sales",
  // Compatibility descriptor only; source_type intentionally has no frozen v1
  // vocabulary. ingestion_mode/observation_type carry the actual semantics.
  sourceType: "manual",
  origin: "external_market" as const,
  ingestionMode: "manual" as const,
  isActive: true,
}

export type ManualIngestionStatus =
  | "promoted"
  | "candidate_only"
  | "needs_review"
  | "duplicate"

export interface ManualIngestionResult {
  status: ManualIngestionStatus
  candidateId: string
  pricePointId: string | null
  reasonCodes: string[]
  affectedEstimates: Array<{ releaseId: string; condition: MarketCondition }>
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stableValue(child)]),
    )
  }
  return value
}

export function candidateStateHash(candidate: ClassifiedCandidate): string {
  const { observedAt: _observedAt, ...state } = candidate
  return createHash("sha256").update(JSON.stringify(stableValue(state))).digest("hex")
}

function otherwiseGroupingEligible(candidate: ClassifiedCandidate, point: PricePointDraft): boolean {
  return Boolean(
    candidate.condition === "new_complete_unbuilt" &&
      candidate.isComplete === true &&
      candidate.isLot === false &&
      candidate.quantity === 1 &&
      candidate.sellerFingerprint &&
      ["excluded", "included_exact", "buyer_paid"].includes(candidate.shippingBasis) &&
      point.valuationPrice != null &&
      point.valuationPrice > 0 &&
      point.normalizedPriceEUR != null &&
      point.normalizedPriceEUR > 0 &&
      candidate.soldOn,
  )
}

function toEvidenceSale(row: GroupingEvidenceRow): EvidenceSale {
  return {
    stableId: row.sourceRecordKey,
    releaseId: row.releaseId,
    condition: row.condition,
    sourceId: row.sourceId,
    sellerFingerprint: row.sellerFingerprint,
    soldOn: row.soldOn,
    soldAt: row.soldAt,
    normalizedPriceEUR: row.normalizedPriceEUR,
    evidenceGroupKey: row.evidenceGroupKey,
  }
}

function median(values: number[]): number {
  if (!values.length) throw new Error("median requires at least one value")
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

interface ComparableGroup {
  evidenceGroupKey: string
  representativeEUR: number
  anchorDate: string
}

// Outliers are evaluated against all prior independent evidence groups for the
// comparable Release+condition set. Group construction itself still remains
// Release+condition+source+seller+fixed-anchor-7-days.
function comparableGroups(points: ValuationPointRow[]): ComparableGroup[] {
  const buckets = new Map<string, { values: number[]; anchorDate: string }>()

  for (const point of points) {
    const current = buckets.get(point.evidenceGroupKey)
    if (!current) {
      buckets.set(point.evidenceGroupKey, {
        values: [point.normalizedPriceEUR],
        anchorDate: point.soldOn,
      })
      continue
    }
    current.values.push(point.normalizedPriceEUR)
    if (point.soldOn < current.anchorDate) current.anchorDate = point.soldOn
  }

  return [...buckets.entries()].map(([evidenceGroupKey, bucket]) => ({
    evidenceGroupKey,
    representativeEUR: median(bucket.values),
    anchorDate: bucket.anchorDate,
  }))
}

function materialEstimateChanged(previous: StoredEstimate | null, next: MarketEstimateDraft): boolean {
  if (!previous) return true
  return (
    previous.displayMode !== next.displayMode ||
    previous.value !== next.value ||
    previous.low !== next.low ||
    previous.high !== next.high ||
    previous.median !== next.median ||
    previous.rangeMethod !== next.rangeMethod ||
    previous.sampleSize !== next.sampleSize ||
    previous.independentEvidenceCount !== next.independentEvidenceCount ||
    previous.windowDays !== next.windowDays ||
    previous.lastVerifiedSale !== next.lastVerifiedSale ||
    previous.lastVerifiedSaleOn !== next.lastVerifiedSaleOn ||
    previous.lastVerifiedSaleAt !== next.lastVerifiedSaleAt ||
    previous.trendPercent !== next.trendPercent ||
    previous.trendWindowDays !== next.trendWindowDays
  )
}

function estimateKey(releaseId: string, condition: MarketCondition): string {
  return `${releaseId}|${condition}`
}

async function regroupExistingPartition(
  repo: MarketPipelineStore,
  input: {
    releaseId: string
    condition: MarketCondition
    sourceId: string
    sellerFingerprint: string | null
  },
): Promise<void> {
  if (!input.sellerFingerprint) return
  const existing = await repo.listGroupingEvidence({
    releaseId: input.releaseId,
    condition: input.condition,
    sourceId: input.sourceId,
    sellerFingerprint: input.sellerFingerprint,
  })
  if (!existing.length) return

  const assignments = assignEvidenceGroups(existing.map(toEvidenceSale))
  for (const row of existing) {
    const key = assignments.get(row.sourceRecordKey)
    if (key && key !== row.evidenceGroupKey) {
      await repo.updateGroupingAssignment({ pointId: row.id, candidateId: row.candidateId, evidenceGroupKey: key })
    }
  }
}

async function recomputeEstimate(
  repo: MarketPipelineStore,
  releaseId: string,
  condition: MarketCondition,
  asOfDate: string,
): Promise<void> {
  const points = await repo.listValuationPoints(releaseId, condition)
  const draft = computeMarketEstimate(points, asOfDate)
  if (!draft) {
    await repo.deleteEstimate(releaseId, condition)
    return
  }

  const previous = await repo.getEstimate(releaseId, condition)
  await repo.upsertEstimate({
    releaseId,
    condition,
    draft,
    previous,
    materiallyChanged: materialEstimateChanged(previous, draft),
  })
}

async function recomputeAffectedEstimates(
  repo: MarketPipelineStore,
  affected: Map<string, { releaseId: string; condition: MarketCondition }>,
  asOfDate: string,
): Promise<void> {
  for (const item of affected.values()) {
    await recomputeEstimate(repo, item.releaseId, item.condition, asOfDate)
  }
}

function addAffected(
  affected: Map<string, { releaseId: string; condition: MarketCondition }>,
  releaseId: string | null,
  condition: MarketCondition,
): void {
  if (releaseId) affected.set(estimateKey(releaseId, condition), { releaseId, condition })
}

function manualCorrectionMayCompleteRevalidation(observation: SourceObservation): boolean {
  return Boolean(observation.identityReviewed && observation.matchEvidence?.includes("manual_override"))
}

export async function ingestManualVerifiedSaleWithStore(
  observation: SourceObservation,
  repo: MarketPipelineStore,
  now = new Date(),
): Promise<ManualIngestionResult> {
  assertManualVerifiedObservation(observation)

  const asOfDate = now.toISOString().slice(0, 10)
  const catalog = await repo.listCatalogReleases()
  const source = await repo.ensureSource(MANUAL_VERIFIED_SOURCE)

  let candidate = classifyObservation(observation, catalog)
  const previous = await repo.findCandidate(source.id, candidate.sourceRecordKey)
  const affected = new Map<string, { releaseId: string; condition: MarketCondition }>()

  if (previous) addAffected(affected, previous.resolvedReleaseId, previous.condition)

  if (candidate.originalSource && candidate.originalRecordId) {
    const exactDuplicate = await repo.findExactAcceptedDuplicate({
      sourceId: source.id,
      originalSource: candidate.originalSource,
      originalRecordId: candidate.originalRecordId,
      excludeCandidateId: previous?.id,
    })
    if (exactDuplicate) {
      candidate = {
        ...candidate,
        decision: "duplicate",
        reasonCodes: uniq([...candidate.reasonCodes, "EXACT_ORIGINAL_RECORD_DUPLICATE"]),
      }
    }
  }

  let stored = await repo.upsertCandidate({
    sourceId: source.id,
    candidate,
    stateHash: candidateStateHash(candidate),
  })

  addAffected(affected, stored.resolvedReleaseId, stored.condition)
  const existingPoint = await repo.getCandidatePoint(stored.id)

  // Human-review state is sticky. Re-importing the same source record may
  // refresh its observed facts, but it must never silently approve an outlier
  // that was already routed to review. Only an explicit review action may clear
  // POSSIBLE_OUTLIER. Exact duplicates/rejections still take precedence.
  const pendingOutlierReview = Boolean(
    previous?.decision === "needs_review" &&
      previous.reasonCodes.includes("POSSIBLE_OUTLIER") &&
      candidate.decision !== "duplicate" &&
      candidate.decision !== "rejected",
  )

  if (pendingOutlierReview) {
    stored = await repo.patchCandidate(stored.id, {
      decision: "needs_review",
      reasonCodes: uniq([...stored.reasonCodes, "POSSIBLE_OUTLIER"]),
    })
    if (existingPoint) await repo.disableCandidatePoint(stored.id)

    if (previous?.resolvedReleaseId && previous.sellerFingerprint) {
      await regroupExistingPartition(repo, {
        releaseId: previous.resolvedReleaseId,
        condition: previous.condition,
        sourceId: previous.sourceId,
        sellerFingerprint: previous.sellerFingerprint,
      })
    }

    await recomputeAffectedEstimates(repo, affected, asOfDate)
    return {
      status: "needs_review",
      candidateId: stored.id,
      pricePointId: existingPoint?.id ?? null,
      reasonCodes: stored.reasonCodes,
      affectedEstimates: [...affected.values()],
    }
  }

  if (candidate.decision !== "accepted") {
    if (existingPoint) await repo.disableCandidatePoint(stored.id)

    if (previous?.resolvedReleaseId && previous.sellerFingerprint) {
      await regroupExistingPartition(repo, {
        releaseId: previous.resolvedReleaseId,
        condition: previous.condition,
        sourceId: previous.sourceId,
        sellerFingerprint: previous.sellerFingerprint,
      })
    }

    await recomputeAffectedEstimates(repo, affected, asOfDate)
    return {
      status: candidate.decision === "duplicate" ? "duplicate" : "needs_review",
      candidateId: stored.id,
      pricePointId: existingPoint?.id ?? null,
      reasonCodes: stored.reasonCodes,
      affectedEstimates: [...affected.values()],
    }
  }

  const canCompleteRevalidation = manualCorrectionMayCompleteRevalidation(observation)
  if (stored.needsRevalidation && !canCompleteRevalidation) {
    stored = await repo.patchCandidate(stored.id, {
      decision: "needs_review",
      reasonCodes: uniq([...stored.reasonCodes, "REVALIDATION_REQUIRED"]),
    })
    if (existingPoint) await repo.disableCandidatePoint(stored.id)
    await recomputeAffectedEstimates(repo, affected, asOfDate)
    return {
      status: "needs_review",
      candidateId: stored.id,
      pricePointId: existingPoint?.id ?? null,
      reasonCodes: stored.reasonCodes,
      affectedEstimates: [...affected.values()],
    }
  }

  const provisionalCandidate: ClassifiedCandidate = {
    ...candidate,
    resolvedReleaseId: stored.resolvedReleaseId,
    needsRevalidation: stored.needsRevalidation,
    evidenceGroupKey: null,
  }
  const provisional = buildPricePointDraft(provisionalCandidate)

  if (!provisional.ok) {
    stored = await repo.patchCandidate(stored.id, {
      needsRevalidation: true,
      reasonCodes: uniq([...stored.reasonCodes, provisional.reason, "NORMALIZATION_REVALIDATION_REQUIRED"]),
    })
    if (existingPoint) await repo.disableCandidatePoint(stored.id)
    await recomputeAffectedEstimates(repo, affected, asOfDate)
    return {
      status: "candidate_only",
      candidateId: stored.id,
      pricePointId: existingPoint?.id ?? null,
      reasonCodes: stored.reasonCodes,
      affectedEstimates: [...affected.values()],
    }
  }

  let evidenceGroupKey: string | null = null
  let possibleOutlier = false

  if (
    stored.resolvedReleaseId &&
    candidate.sellerFingerprint &&
    otherwiseGroupingEligible(candidate, provisional.point)
  ) {
    const existing = (await repo.listGroupingEvidence({
      releaseId: stored.resolvedReleaseId,
      condition: candidate.condition,
      sourceId: source.id,
      sellerFingerprint: candidate.sellerFingerprint,
    })).filter((row) => row.candidateId !== stored.id)

    const newSale: EvidenceSale = {
      stableId: candidate.sourceRecordKey,
      releaseId: stored.resolvedReleaseId,
      condition: candidate.condition,
      sourceId: source.id,
      sellerFingerprint: candidate.sellerFingerprint,
      soldOn: candidate.soldOn!,
      soldAt: candidate.soldAt,
      normalizedPriceEUR: provisional.point.normalizedPriceEUR,
    }

    const allSales = [...existing.map(toEvidenceSale), newSale]
    const assignments = assignEvidenceGroups(allSales)
    evidenceGroupKey = assignments.get(candidate.sourceRecordKey) ?? null

    for (const row of existing) {
      const key = assignments.get(row.sourceRecordKey)
      if (key && key !== row.evidenceGroupKey) {
        await repo.updateGroupingAssignment({ pointId: row.id, candidateId: row.candidateId, evidenceGroupKey: key })
      }
    }

    if (evidenceGroupKey) {
      const currentPartitionReps = buildEvidenceGroupRepresentatives(
        allSales.map((sale) => ({
          ...sale,
          evidenceGroupKey: assignments.get(sale.stableId) ?? null,
        })),
      )
      const current = currentPartitionReps.find((rep) => rep.evidenceGroupKey === evidenceGroupKey)

      if (current) {
        const currentStableId = `${source.id}|${candidate.sourceRecordKey}`
        const priorPoints = (await repo.listValuationPoints(stored.resolvedReleaseId, candidate.condition))
          .filter((point) => point.stableId !== currentStableId)
        const priorGroups = comparableGroups(priorPoints)
        const groupAlreadyExisted = Boolean(
          existingPoint?.evidenceGroupKey === evidenceGroupKey ||
          priorGroups.some((group) => group.evidenceGroupKey === evidenceGroupKey),
        )

        if (!groupAlreadyExisted) {
          const priorRepresentatives = priorGroups
            .filter((group) => group.anchorDate < current.anchorDate)
            .map((group) => group.representativeEUR)
          possibleOutlier = isPossibleOutlier(current.representativeEUR, priorRepresentatives)
        }
      }
    }
  }

  if (stored.needsRevalidation && canCompleteRevalidation) {
    // The Release-change trigger already failed the linked point closed. Clear
    // candidate/point revalidation only after the reviewed identity and current
    // normalization/grouping rules have completed successfully.
    stored = await repo.patchCandidate(stored.id, {
      evidenceGroupKey,
      needsRevalidation: false,
    })
    if (existingPoint?.needsRevalidation) await repo.clearPointRevalidation(stored.id)
  } else {
    stored = await repo.patchCandidate(stored.id, { evidenceGroupKey })
  }

  const finalCandidate: ClassifiedCandidate = {
    ...candidate,
    resolvedReleaseId: stored.resolvedReleaseId,
    evidenceGroupKey,
    needsRevalidation: false,
  }
  const finalPromotion = buildPricePointDraft(finalCandidate)
  if (!finalPromotion.ok) throw new Error(`Invariant error after grouping: ${finalPromotion.reason}`)

  let pointDraft = finalPromotion.point
  if (possibleOutlier) {
    pointDraft = { ...pointDraft, valuationEligible: false }
    stored = await repo.patchCandidate(stored.id, {
      decision: "needs_review",
      reasonCodes: uniq([...stored.reasonCodes, "POSSIBLE_OUTLIER"]),
    })
  }

  const point = await repo.upsertPricePoint({
    candidateId: stored.id,
    sourceId: source.id,
    point: pointDraft,
  })

  // If this UPSERT corrected Release/condition/seller partition membership,
  // rebuild the old partition as well. Removing an early sale may shift every
  // fixed-anchor 7-day key that follows it.
  if (
    previous?.resolvedReleaseId &&
    previous.sellerFingerprint &&
    (
      previous.resolvedReleaseId !== stored.resolvedReleaseId ||
      previous.condition !== stored.condition ||
      previous.sellerFingerprint !== stored.sellerFingerprint
    )
  ) {
    await regroupExistingPartition(repo, {
      releaseId: previous.resolvedReleaseId,
      condition: previous.condition,
      sourceId: previous.sourceId,
      sellerFingerprint: previous.sellerFingerprint,
    })
  }

  await recomputeAffectedEstimates(repo, affected, asOfDate)

  return {
    status: possibleOutlier ? "needs_review" : "promoted",
    candidateId: stored.id,
    pricePointId: point.id,
    reasonCodes: stored.reasonCodes,
    affectedEstimates: [...affected.values()],
  }
}

export async function recordMarketValueSnapshotWithStore(input: {
  releaseId: string
  condition: MarketCondition
  snapshotPeriod: string
  repository: MarketPipelineStore
}): Promise<boolean> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.snapshotPeriod)) {
    throw new Error("snapshotPeriod must be YYYY-MM-DD")
  }
  return input.repository.recordHistorySnapshot(input)
}