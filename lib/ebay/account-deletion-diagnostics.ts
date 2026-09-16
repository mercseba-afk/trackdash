export type EbayDeletionRouteStage =
  | "request_received"
  | "signature_header_parsed"
  | "oauth_token_ok"
  | "public_key_ok"
  | "signature_verified"
  | "payload_parsed"
  | "supabase_client_ok"
  | "erasure_completed"
  | "recompute_completed"

const SAFE_ERROR_CODES = new Set([
  "EBAY_DELETION_REQUIRES_PRODUCTION",
  "EBAY_PRODUCTION_CREDENTIALS_NOT_CONFIGURED",
  "EBAY_NOTIFICATION_TOO_LARGE",
  "EBAY_NOTIFICATION_INVALID_JSON",
  "EBAY_SIGNATURE_INVALID",
  "EBAY_NOTIFICATION_OAUTH_FAILED",
  "EBAY_NOTIFICATION_OAUTH_INVALID",
  "EBAY_PUBLIC_KEY_FETCH_FAILED",
  "EBAY_PUBLIC_KEY_INVALID",
  "EBAY_SIGNATURE_VERIFY_FAILED",
  "EBAY_NOTIFICATION_INVALID",
  "EBAY_NOTIFICATION_TOPIC_INVALID",
  "EBAY_NOTIFICATION_DATA_INVALID",
  "EBAY_RECOMPUTE_FAILED",
])

const SAFE_ERASURE_OPERATIONS = new Set([
  "load_source_policies",
  "load_source_registry",
  "load_market_candidates",
  "update_market_candidates",
  "load_market_offer_states",
  "update_market_offer_states",
  "load_price_points",
  "update_price_points",
  "load_market_aggregate_observations",
  "update_market_aggregate_observations",
  "load_market_monthly_source_stats",
  "update_market_monthly_source_stats",
])

export function safeEbayDeletionErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return "UNKNOWN"
  if (SAFE_ERROR_CODES.has(error.message)) return error.message

  const prefix = "EBAY_USER_ERASURE_FAILED:"
  if (error.message.startsWith(prefix)) {
    const operation = error.message.slice(prefix.length)
    if (SAFE_ERASURE_OPERATIONS.has(operation)) return `${prefix}${operation}`
  }

  return "UNKNOWN"
}

export function formatEbayDeletionFailure(
  stage: EbayDeletionRouteStage,
  error: unknown,
): string {
  return `[ebay-account-deletion] failed stage=${stage} code=${safeEbayDeletionErrorCode(error)}`
}
