import "server-only"

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
  return ingestManualVerifiedSaleWithStore(observation, repository, options.now ?? new Date())
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
