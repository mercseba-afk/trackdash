import type { SourceObservation } from "./types"

export interface SourceScanTarget {
  releaseId?: string | null
  itemNumber?: string | null
}

export interface SourceAdapter {
  slug: string
  ingestionMode: "api" | "licensed_feed" | "manual" | "internal"
  scan(target: SourceScanTarget): Promise<SourceObservation[]>
}

export class ManualVerifiedSalesAdapter implements SourceAdapter {
  readonly slug = "manual_verified_sales"
  readonly ingestionMode = "manual" as const
  private readonly observations: SourceObservation[]

  constructor(observations: SourceObservation[]) {
    this.observations = observations
  }

  async scan(target: SourceScanTarget): Promise<SourceObservation[]> {
    return this.observations.filter((observation) => {
      if (target.releaseId && observation.explicitReleaseId) {
        return observation.explicitReleaseId === target.releaseId
      }
      if (target.itemNumber && observation.itemNumberObserved) {
        return observation.itemNumberObserved.replace(/\D/g, "") === target.itemNumber.replace(/\D/g, "")
      }
      return !target.releaseId && !target.itemNumber
    })
  }
}

export function assertManualVerifiedObservation(observation: SourceObservation): void {
  if (!observation.sourceRecordKey) throw new Error("manual observation requires sourceRecordKey")
  if (!observation.explicitReleaseId) throw new Error("manual verified sale requires explicitReleaseId")
  if (!observation.identityReviewed) throw new Error("manual verified sale requires identityReviewed=true")
  if (!observation.matchEvidence?.includes("manual_override")) {
    throw new Error("manual verified sale requires manual_override evidence")
  }
  if (!observation.soldOn) throw new Error("manual verified sale requires soldOn")
  if (observation.price == null || observation.price < 0) throw new Error("manual verified sale requires non-negative price")
  if (!observation.currency) throw new Error("manual verified sale requires currency")
  if (!observation.observationType || !["sold_confirmed", "auction_awarded", "marketplace_sold"].includes(observation.observationType)) {
    throw new Error("manual verified sale must be a completed-sale observation type")
  }
}
