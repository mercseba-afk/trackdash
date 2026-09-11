import "server-only"

import { enrichMarketObservationFx } from "@/lib/fx/ecb"
import { MarketPipelineRepository, type MarketPipelineStore } from "./repository"
import {
  ingestManualVerifiedSaleWithStore,
  recordMarketValueSnapshotWithStore,
  type ManualIngestionResult,
} from "./orchestrator"
import type { MarketCondition, SourceObservation } from "./types"

export async function ingestManualVerifiedSale(
  observation: SourceObservation,
  options: {
    repository?: MarketPipelineStore
    now?: Date
  } = {},
): Promise<ManualIngestionResult> {
  const repository = options.repository ?? new MarketPipelineRepository()
  // Production ingestion no longer requires callers to hand-calculate FX.
  // Foreign completed sales get the ECB reference rate from the latest
  // published business day on/before soldOn. If ECB is unavailable, the
  // observation remains native-currency and the existing promotion guard
  // fails closed rather than inventing a conversion.
  const normalizedObservation = await enrichMarketObservationFx(observation)
  return ingestManualVerifiedSaleWithStore(normalizedObservation, repository, options.now ?? new Date())
}

// Snapshot cadence is intentionally NOT invented here. Callers supply the
// explicit period (YYYY-MM-DD) when a separate scheduler/product decision says
// a snapshot should be recorded.
export async function recordMarketValueSnapshot(input: {
  releaseId: string
  condition: MarketCondition
  snapshotPeriod: string
  repository?: MarketPipelineStore
}): Promise<boolean> {
  const repository = input.repository ?? new MarketPipelineRepository()
  return recordMarketValueSnapshotWithStore({
    releaseId: input.releaseId,
    condition: input.condition,
    snapshotPeriod: input.snapshotPeriod,
    repository,
  })
}
