import { readFileSync, statSync } from "node:fs"
import { pathToFileURL } from "node:url"
import { summarizeCronWorker } from "../lib/market/automation/cron-outcome.ts"

// Never print response bodies, headers, arbitrary strings, URLs or worker results.
// The hosting layer can return HTML/JSON errors before TrackDash runs at all.
export function diagnoseScanResponse({ httpStatus, curlExit = 0, body = "" }) {
  const http = Number(httpStatus)
  const transport = Number(curlExit)
  const diagnostic = {
    ok: false,
    httpStatus: Number.isInteger(http) && http >= 100 && http <= 599 ? http : 0,
    curlExit: Number.isInteger(transport) && transport >= 0 && transport <= 255 ? transport : 1,
    reason: "INVALID_CRON_RESPONSE",
  }
  if (diagnostic.curlExit !== 0) {
    diagnostic.reason = diagnostic.curlExit === 28 ? "TRANSPORT_TIMEOUT" : "TRANSPORT_ERROR"
    return diagnostic
  }
  let payload
  try { payload = JSON.parse(body) } catch { /* HTML/empty/malformed body: no raw output. */ }
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    if (payload.result) {
      const report = summarizeCronWorker({ status: "fulfilled", value: payload.result })
      diagnostic.applicationStatus = report.status
      diagnostic.summary = report.summary
      // Accept the old Production protocol without status/partial, but still
      // verify its counters/configured flag; ok:true alone is never evidence.
      if (payload.ok === report.ok && !report.error
        && (payload.status === undefined || payload.status === report.status)
        && (payload.partial === undefined || payload.partial === report.partial)) {
        diagnostic.ok = diagnostic.httpStatus === 200 && report.ok
        diagnostic.reason = diagnostic.ok ? "OK" : "HTTP_ERROR"
      } else if (report.error && report.error !== "INVALID_WORKER_RESULT") {
        diagnostic.reason = report.error
      }
    } else if (payload.ok === false) {
      // Only fixed protocol codes/statuses are eligible for diagnostic output.
      if (["not_configured", "partial", "failed"].includes(payload.status)) {
        diagnostic.applicationStatus = payload.status
      }
      diagnostic.reason = ["UNAUTHORIZED", "CRON_SECRET_NOT_CONFIGURED"].includes(payload.error)
        ? payload.error : "CRON_REJECTED"
    }
  }
  if (diagnostic.httpStatus !== 200) {
    diagnostic.ok = false
    if (diagnostic.httpStatus === 402) diagnostic.reason = "HOSTING_UNAVAILABLE_OR_PAUSED"
    else if (diagnostic.httpStatus === 0) diagnostic.reason = "MISSING_HTTP_STATUS"
    else if (diagnostic.reason === "INVALID_CRON_RESPONSE") diagnostic.reason = "HTTP_ERROR"
  }
  return diagnostic
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , bodyPath, httpStatus, curlExit] = process.argv
  let body = ""
  try {
    if (statSync(bodyPath).size <= 1_048_576) body = readFileSync(bodyPath, "utf8")
  } catch { /* A transport error can leave no response file. */ }
  const diagnostic = diagnoseScanResponse({ httpStatus, curlExit, body })
  console.log(JSON.stringify(diagnostic))
  process.exitCode = diagnostic.ok ? 0 : 1
}
