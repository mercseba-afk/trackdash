// Offline discovery only. Fetch each public category once outside this helper;
// candidates still require exact-page identity/price/stock verification.
// No database connection, network requests, enrollment or valuation writes.
import { readFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

export function discoverCurrentRetailEndpoints(source, html, releases) {
  const hosts = { briosi_public: "www.briosigiocattoli.it", imodellini_public: "www.imodellini.it" }
  const host = hosts[source]
  if (!host) throw new Error("UNSUPPORTED_SOURCE")
  const byItem = new Map()
  for (const release of releases) {
    const item = String(release.item_number ?? "")
    if (!/^\d{5}$/.test(item)) continue
    const matches = byItem.get(item) ?? []
    if (!matches.some(row => row.id === release.id)) matches.push(release)
    byItem.set(item, matches)
  }
  const blocks = source === "briosi_public"
    ? html.split('<div class="indice_fondo_prodotti2">').slice(1)
    : html.split('class="product-thumb"').slice(1)
  const candidates = new Map()
  let available = 0
  let ambiguous = 0
  for (const block of blocks) {
    const item = source === "briosi_public"
      ? /Cod\.\s*(\d{5})\b/.exec(block)?.[1]
      : /class="m-and-m">Tamiya\s+(\d{5})\b/.exec(block)?.[1]
    const stock = /class="disponibilita_indice[^>]*>([\s\S]*?)<\/div>/.exec(block)?.[1]
    const purchasable = source === "briosi_public"
      ? stock?.replace(/<[^>]*>/g, "").trim() === "Disponibile"
      : /<span>Acquista<\/span>/.test(block)
    if (!purchasable) continue
    available++
    const matches = byItem.get(item) ?? []
    if (matches.length > 1) { ambiguous++; continue }
    if (matches.length !== 1) continue
    const href = source === "briosi_public"
      ? /href="(\/product\/[^"?#]+)"/.exec(block)?.[1]
      : /<h4><a href="([^"]+)"/.exec(block)?.[1]
    if (!href) continue
    let url
    try { url = new URL(href.replaceAll("&amp;", "&"), `https://${host}`) } catch { continue }
    if (url.protocol !== "https:" || url.hostname !== host || url.username || url.password) continue
    candidates.set(`${matches[0].id}|${url.href}`, {
      releaseId: matches[0].id, itemNumber: item, url: url.href,
      status: "needs_exact_page_verification",
    })
  }
  return { source, cards: blocks.length, available, ambiguous, candidates: [...candidates.values()] }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [source, indexPath, catalogPath] = process.argv.slice(2)
  if (!source || !indexPath || !catalogPath) throw new Error("Usage: node scripts/discover-current-retail-endpoints.mjs SOURCE INDEX.html CATALOG.json")
  console.log(JSON.stringify(discoverCurrentRetailEndpoints(source, readFileSync(indexPath, "utf8"), JSON.parse(readFileSync(catalogPath, "utf8"))), null, 2))
}
