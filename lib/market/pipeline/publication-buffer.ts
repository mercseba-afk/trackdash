import type { SupabaseClient } from "@supabase/supabase-js"
export interface PublicationWrite { table: string; row: Record<string, unknown> }
// Use the existing repository's exact publication mapping, buffering its upserts.
// No duplicate MV/SOLD/ASK calculations and no unfenced canonical writes.
export function bufferedPublication(client: SupabaseClient) {
  const writes: PublicationWrite[] = []
  const tables = new Set(["market_release_signals", "market_release_monthly_signals", "market_release_ask_snapshots"])
  const wrap = (builder: any, table: string): any => {
    builder.retry?.(false)
    return new Proxy(builder, { get(target, key) {
      if (key === "upsert") return (row: Record<string, unknown>) => {
        if (!tables.has(table)) throw new Error("UNEXPECTED_PUBLICATION_WRITE")
        writes.push({ table, row })
        return Promise.resolve({ data: null, error: null })
      }
      if (["insert", "update", "delete"].includes(String(key))) throw new Error("UNEXPECTED_PUBLICATION_WRITE")
      const value = Reflect.get(target, key)
      if (typeof value !== "function") return value
      if (key === "then") return value.bind(target)
      return (...args: unknown[]) => wrap(value.apply(target, args), table)
    } })
  }
  const reader = new Proxy(client, { get(target, key) {
    if (key === "from") return (table: string) => wrap(target.from(table), table)
    if (key === "rpc") throw new Error("UNEXPECTED_PUBLICATION_WRITE")
    const value = Reflect.get(target, key)
    return typeof value === "function" ? value.bind(target) : value
  } })
  return { client: reader, writes }
}
