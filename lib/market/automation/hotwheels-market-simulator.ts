export type HotWheelsSignalObservation = {
  source: string
  sourceFamily: "ebay" | "mercari" | "retail"
  kind: "ask" | "sold"
  itemPriceEUR: number
  deliveredCostEUR?: number | null
  valuationWeight?: number
  canonicalEligible?: boolean
  active?: boolean
}

export type HotWheelsSimulatedSignal = {
  marketStatus: "consolidated" | "observing" | "data_incoming"
  marketValueEUR: number | null
  soldAnchorEUR: number | null
  askAnchorEUR: number | null
  startingEffectiveCostEUR: number | null
  askMinEUR: number | null
  askMaxEUR: number | null
  soldSourceFamilies: number
  guardedSold: Array<{ source: string; itemPriceEUR: number; reason: string }>
}

function round2(v:number){ return Math.round((v+Number.EPSILON)*100)/100 }
function median(values:number[]):number|null{
  if(!values.length) return null
  const a=[...values].sort((x,y)=>x-y)
  const m=Math.floor(a.length/2)
  return a.length%2 ? a[m] : (a[m-1]+a[m])/2
}
function weightedMedian(rows:Array<{value:number;weight:number}>):number|null{
  const valid=rows.filter(r=>r.weight>0).sort((a,b)=>a.value-b.value)
  if(!valid.length) return null
  const total=valid.reduce((s,r)=>s+r.weight,0)
  let acc=0
  for(const r of valid){ acc+=r.weight; if(acc>=total/2) return r.value }
  return valid.at(-1)?.value ?? null
}

export function simulateHotWheelsMarketSignal(observations:HotWheelsSignalObservation[]):HotWheelsSimulatedSignal{
  const asks=observations.filter(o=>o.kind==="ask" && o.active!==false && o.itemPriceEUR>0)
  const askPrices=asks.map(o=>o.itemPriceEUR)
  const askAnchor=median(askPrices)

  const delivered=asks
    .map(o=>o.deliveredCostEUR)
    .filter((v):v is number=>typeof v==="number" && Number.isFinite(v) && v>0)

  const guardedSold:HotWheelsSimulatedSignal["guardedSold"]=[]
  const soldCandidates=observations.filter(o=>{
    if(o.kind!=="sold" || o.canonicalEligible!==true || o.itemPriceEUR<=0) return false
    if(askAnchor!=null && (o.itemPriceEUR>askAnchor*2.5 || o.itemPriceEUR<askAnchor*0.35)){
      guardedSold.push({source:o.source,itemPriceEUR:round2(o.itemPriceEUR),reason:"OUTLIER_VS_ASK_CENTER"})
      return false
    }
    return true
  })

  const soldAnchor=weightedMedian(soldCandidates.map(o=>({value:o.itemPriceEUR,weight:o.valuationWeight??1})))
  const sourceFamilies=new Set(soldCandidates.map(o=>o.sourceFamily)).size
  const totalWeight=soldCandidates.reduce((s,o)=>s+(o.valuationWeight??1),0)
  const consolidated=soldCandidates.length>=2 && sourceFamilies>=2 && totalWeight>=1.5

  return {
    marketStatus: consolidated ? "consolidated" : asks.length ? "observing" : "data_incoming",
    marketValueEUR: consolidated && soldAnchor!=null ? round2(soldAnchor) : null,
    soldAnchorEUR: soldAnchor==null ? null : round2(soldAnchor),
    askAnchorEUR: askAnchor==null ? null : round2(askAnchor),
    startingEffectiveCostEUR: delivered.length ? round2(Math.min(...delivered)) : null,
    askMinEUR: askPrices.length ? round2(Math.min(...askPrices)) : null,
    askMaxEUR: askPrices.length ? round2(Math.max(...askPrices)) : null,
    soldSourceFamilies: sourceFamilies,
    guardedSold,
  }
}
