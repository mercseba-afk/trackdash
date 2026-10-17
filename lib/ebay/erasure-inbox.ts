import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto"
import type { EbayDeletionNotification } from "./account-deletion"

interface SealedInbox { keyId: string; iv: string; tag: string; ciphertext: string }
function keys(): Record<string, Buffer> {
  try {
    const input = JSON.parse(process.env.EBAY_ERASURE_KEYS ?? "{}") as Record<string, string>
    if (!Object.keys(input).length) throw Error()
    return Object.fromEntries(Object.entries(input).map(([id, value]) => {
      if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id) || !/^[a-f0-9]{64}$/.test(value)) throw Error()
      return [id, Buffer.from(value, "hex")]
    }))
  } catch { throw new Error("EBAY_INBOX_KEY_UNAVAILABLE") }
}
const derive = (secret: Buffer, purpose: string) => createHmac("sha256", secret).update("trackdash/ebay/" + purpose).digest()
export function validateInboxKeys() {
  if (!keys()[process.env.EBAY_ERASURE_CURRENT_KEY ?? ""]) throw new Error("EBAY_INBOX_KEY_UNAVAILABLE")
}
export function inboxIdentity(message: EbayDeletionNotification) {
  const key = createHash("sha256").update(message.notificationId).digest("hex")
  const ring = keys(), keyId = process.env.EBAY_ERASURE_CURRENT_KEY ?? ""
  if (!ring[keyId]) throw new Error("EBAY_INBOX_KEY_UNAVAILABLE")
  const immutable = JSON.stringify([message.notificationId, message.identifiers.username,
    message.identifiers.userId ?? null, message.identifiers.eiasToken ?? null])
  const digests = Object.fromEntries(Object.entries(ring).map(([id, secret]) => [id,
    createHmac("sha256", derive(secret, "idempotency-v1")).update(immutable).digest("hex")]))
  return { key, digest: digests[keyId], digests, keyId }
}
export function sealInbox(message: EbayDeletionNotification) {
  const identity = inboxIdentity(message), secret = keys()[identity.keyId]
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", derive(secret, "encryption-v1"), iv)
  cipher.setAAD(Buffer.from("trackdash-ebay-v1:" + identity.key))
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(message.identifiers), "utf8"), cipher.final()])
  return { ...identity, sealed: { keyId: identity.keyId, iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") } }
}
export function openInbox(key: string, sealed: SealedInbox): string[] {
  try {
    const secret = keys()[sealed.keyId]
    if (!secret) throw Error()
    const decipher = createDecipheriv("aes-256-gcm", derive(secret, "encryption-v1"), Buffer.from(sealed.iv, "base64"))
    decipher.setAAD(Buffer.from("trackdash-ebay-v1:" + key))
    decipher.setAuthTag(Buffer.from(sealed.tag, "base64"))
    const value = JSON.parse(Buffer.concat([decipher.update(Buffer.from(sealed.ciphertext, "base64")), decipher.final()]).toString("utf8"))
    if (typeof value.username !== "string" || !value.username) throw Error()
    return [value.username, value.userId, value.eiasToken].filter((v): v is string => typeof v === "string" && !!v)
  } catch { throw new Error("EBAY_INBOX_DECRYPT_FAILED") }
}
