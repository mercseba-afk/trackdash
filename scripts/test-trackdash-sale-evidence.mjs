import assert from "node:assert/strict"

// This test keeps the marketplace evidence contract explicit without requiring
// database fixtures. It mirrors the pair/month rules consumed by Market Method v2.
const DAY_MS = 86_400_000
const daysBetween = (a, b) => Math.abs(new Date(`${a}T00:00:00Z`) - new Date(`${b}T00:00:00Z`)) / DAY_MS
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function pairClusters(sales) {
  const byPair = new Map()
  for (const sale of sales) {
    const pair = [sale.seller, sale.buyer].sort().join("|")
    const rows = byPair.get(pair) ?? []
    rows.push(sale)
    byPair.set(pair, rows)
  }
  const out = []
  for (const [pair, rows] of byPair) {
    const ordered = [...rows].sort((a, b) => a.date.localeCompare(b.date))
    let cluster = []
    const flush = () => {
      if (!cluster.length) return
      out.push({ pair, price: median(cluster.map((x) => x.price)), first: cluster[0].date, last: cluster.at(-1).date })
      cluster = []
    }
    for (const sale of ordered) {
      const previous = cluster.at(-1)
      if (previous && daysBetween(previous.date, sale.date) > 30) flush()
      cluster.push(sale)
    }
    flush()
  }
  return out
}

const clusters = pairClusters([
  { seller: "a", buyer: "b", price: 20, date: "2026-08-01" },
  { seller: "a", buyer: "b", price: 40, date: "2026-08-10" },
  { seller: "b", buyer: "a", price: 30, date: "2026-08-20" },
  { seller: "a", buyer: "c", price: 22, date: "2026-08-20" },
  { seller: "a", buyer: "b", price: 24, date: "2026-10-05" },
])

assert.equal(clusters.length, 3, "same pair inside 30 days must not manufacture independent volume")
assert.equal(clusters.find((x) => x.pair === "a|b" && x.first === "2026-08-01")?.price, 30, "pair cluster uses median item price")
assert.equal(clusters.filter((x) => x.pair === "a|b").length, 2, "same pair can become new evidence after the time cluster expires")
assert.equal(clusters.filter((x) => x.pair === "a|c").length, 1, "independent counterpart remains independent evidence")

console.log("TRACKDASH CONFIRMED SALE EVIDENCE TEST PASSED")