// Deterministic, dependency-free UUID generation for TrackDash's seed
// catalog (see lib/data/products.ts).
//
// WHY THIS EXISTS: products.ts is imported directly by client components
// (catalog-screen.tsx, product-detail-screen.tsx, ...), so whatever
// generates its ids has to run in the browser too — synchronously, with
// no extra dependencies. That rules out Node's `crypto` module and the
// async Web Crypto `subtle.digest` API, so this is a small, self-contained
// implementation of SHA-1 (the algorithm RFC 4122 UUIDv5 is built on).
//
// Every id in the catalog is derived once, deterministically, from a
// stable natural key (e.g. "product:18626", "release:18626:1") — so
// re-running the app, or adding a brand-new seed entry, never changes an
// id that already exists. That stability is what lets the same ids be
// used both here and in the matching SQL seed migration
// (supabase/migrations/0003_seed_initial_catalog.sql) without hand-copying
// UUID strings between the two: both are generated from the same seed
// data through this same function.
//
// This is real RFC 4122 UUIDv5 (namespace + name, SHA-1-based) rooted at
// the standard predefined NAMESPACE_URL, not a toy hash — Postgres's
// `uuid` column only validates the format, but using the real algorithm
// means these ids are also well-distributed and collision-resistant, not
// merely "shaped like" a uuid.

// RFC 4122 predefined namespace for URL-rooted names.
const NAMESPACE_URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8"

function uuidToBytes(uuid: string): number[] {
  const hex = uuid.replace(/-/g, "")
  const bytes: number[] = []
  for (let i = 0; i < 32; i += 2) {
    bytes.push(Number.parseInt(hex.slice(i, i + 2), 16))
  }
  return bytes
}

function utf8Bytes(str: string): number[] {
  return Array.from(new TextEncoder().encode(str))
}

function leftRotate(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0
}

// Minimal, standard SHA-1 over a byte array. Returns 20 bytes.
function sha1(bytes: number[]): number[] {
  const message = [...bytes]
  const bitLength = message.length * 8

  message.push(0x80)
  while (message.length % 64 !== 56) message.push(0)
  for (let i = 7; i >= 0; i--) {
    message.push((bitLength / 2 ** (8 * i)) & 0xff)
  }

  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0

  for (let chunkStart = 0; chunkStart < message.length; chunkStart += 64) {
    const w = new Array<number>(80).fill(0)
    for (let i = 0; i < 16; i++) {
      const offset = chunkStart + i * 4
      w[i] = ((message[offset] << 24) | (message[offset + 1] << 16) | (message[offset + 2] << 8) | message[offset + 3]) >>> 0
    }
    for (let i = 16; i < 80; i++) {
      w[i] = leftRotate(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1)
    }

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4

    for (let i = 0; i < 80; i++) {
      let f: number
      let k: number
      if (i < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (i < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }
      const temp = (leftRotate(a, 5) + f + e + k + w[i]) >>> 0
      e = d
      d = c
      c = leftRotate(b, 30)
      b = a
      a = temp
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
  }

  const digest: number[] = []
  for (const h of [h0, h1, h2, h3, h4]) {
    digest.push((h >>> 24) & 0xff, (h >>> 16) & 0xff, (h >>> 8) & 0xff, h & 0xff)
  }
  return digest
}

function bytesToUuid(bytes: number[]): string {
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/**
 * Derives a stable, valid RFC 4122 v5 UUID from a natural key, rooted at
 * the standard NAMESPACE_URL. Same input -> same output, always, in any
 * JS environment (browser or server).
 */
export function stableUuid(name: string): string {
  const data = [...uuidToBytes(NAMESPACE_URL), ...utf8Bytes(name)]
  const hash = sha1(data).slice(0, 16)
  hash[6] = (hash[6] & 0x0f) | 0x50 // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80 // variant 10xxxxxx
  return bytesToUuid(hash)
}
