import "server-only"
import { createPublicKey, verify as verifySignature } from "node:crypto"

const OIDC_ISSUER = "https://token.actions.githubusercontent.com"
const OIDC_JWKS = "https://token.actions.githubusercontent.com/.well-known/jwks"
const TRUSTED_REPO_ID = "1351337497"
const TRUSTED_REF = "refs/heads/main"

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null
}

// GitHub Actions OIDC is verified cryptographically, not merely decoded.
// Trust only the precise scheduled workflow on the canonical main branch.
export async function verifyTrackDashGithubAction(token: string, audience: string, workflow: string): Promise<boolean> {
  try {
    if (token.length > 8192) return false
    const parts = token.split(".")
    if (parts.length !== 3) return false
    const [encodedHeader, encodedClaims, encodedSignature] = parts
    const header = asObject(JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")))
    const claims = asObject(JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8")))
    if (!header || !claims || header.alg !== "RS256" || typeof header.kid !== "string") return false
    const now = Math.floor(Date.now() / 1000)
    if (
      claims.iss !== OIDC_ISSUER ||
      claims.aud !== audience ||
      claims.repository_id !== TRUSTED_REPO_ID ||
      claims.ref !== TRUSTED_REF ||
      claims.workflow_ref !== workflow ||
      (claims.event_name !== "schedule" && claims.event_name !== "push") ||
      typeof claims.exp !== "number" ||
      typeof claims.iat !== "number" ||
      claims.exp < now - 60 ||
      claims.iat > now + 60 ||
      claims.exp - claims.iat > 600 ||
      (typeof claims.nbf === "number" && claims.nbf > now + 60)
    ) return false

    const response = await fetch(OIDC_JWKS, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return false
    const jwks = asObject(await response.json())
    const keys = Array.isArray(jwks?.keys) ? jwks.keys : []
    const jwk = keys.find((value: unknown) => {
      const key = asObject(value)
      return !!key && key.kid === header.kid && key.kty === "RSA" && (!key.alg || key.alg === "RS256")
    })
    if (!jwk) return false
    const publicKey = createPublicKey({ key: jwk as import("node:crypto").JsonWebKey, format: "jwk" })
    return verifySignature(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedClaims}`),
      publicKey,
      Buffer.from(encodedSignature, "base64url"),
    )
  } catch {
    return false
  }
}

