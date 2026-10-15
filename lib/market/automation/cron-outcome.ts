// Transport-only reporting. Worker counts and market decisions are unchanged.
export type CronStatus = "not_configured" | "no_work" | "success" | "partial" | "failed"

export interface CronWorkerCounts {
  attempted: number
  succeeded: number
  failed: number
  configured?: boolean
}

export interface CronLaneReport {
  ok: boolean
  status: CronStatus
  partial: boolean
  summary: CronWorkerCounts
  error?: string
}

const configurationErrors = new Set([
  "EBAY_BROWSE_NOT_CONFIGURED",
  "EBAY_SCHEDULED_MARKET_WRITES_DISABLED",
  "EBAY_ENV_INVALID",
  "EBAY_CREDENTIAL_ENV_MISMATCH",
  "EBAY_BROWSE_CREDENTIALS_NOT_CONFIGURED",
])

export function summarizeCronWorker(result: PromiseSettledResult<CronWorkerCounts>): CronLaneReport {
  if (result.status === "rejected") {
    // Arbitrary SDK errors can contain URLs, headers or credentials. Only these
    // exact configuration codes cross the reporting boundary; never echo raw errors.
    const message = result.reason instanceof Error ? result.reason.message : ""
    const notConfigured = configurationErrors.has(message)
    return {
      ok: false,
      status: notConfigured ? "not_configured" : "failed",
      partial: false,
      summary: { attempted: 0, succeeded: 0, failed: 0 },
      error: notConfigured ? message : "WORKER_EXECUTION_FAILED",
    }
  }

  const value = result.value
  if (!value || ![value.attempted, value.succeeded, value.failed].every((n) => Number.isSafeInteger(n) && n >= 0)
    || value.attempted !== value.succeeded + value.failed
    || (value.configured !== undefined && typeof value.configured !== "boolean")
    || (value.configured === false && value.attempted !== 0)) {
    return {
      ok: false, status: "failed", partial: false,
      summary: { attempted: 0, succeeded: 0, failed: 0 },
      error: "INVALID_WORKER_RESULT",
    }
  }

  const summary: CronWorkerCounts = {
    attempted: value.attempted, succeeded: value.succeeded, failed: value.failed,
    ...(value.configured === undefined ? {} : { configured: value.configured }),
  }
  const status: CronStatus = value.configured === false ? "not_configured"
    : value.failed > 0 ? (value.succeeded > 0 ? "partial" : "failed")
    : value.attempted === 0 ? "no_work" : "success"
  return {
    ok: status === "success" || status === "no_work",
    status,
    partial: status === "partial",
    summary,
    ...(status === "not_configured" ? { error: "SCANNER_NOT_CONFIGURED" }
      : value.failed > 0 ? { error: "WORKER_JOBS_FAILED" } : {}),
  }
}

export function summarizeCronCycle(lanes: CronLaneReport[]) {
  const unhealthy = lanes.filter((lane) => !lane.ok)
  const succeeded = lanes.some((lane) => lane.summary.succeeded > 0)
  const status: CronStatus = unhealthy.length === 0 ? (succeeded ? "success" : "no_work")
    : succeeded ? "partial"
    : unhealthy.every((lane) => lane.status === "not_configured") ? "not_configured" : "failed"
  return {
    ok: unhealthy.length === 0,
    status,
    partial: status === "partial",
    httpStatus: status === "not_configured" ? 503 : unhealthy.length ? 500 : 200,
  }
}
