import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import ts from 'typescript'
import * as parser from '../lib/market/automation/amazon-offers.ts'
const require = createRequire(import.meta.url)
const releaseId = Object.keys(parser.AMAZON_SCAN_PILOT)[0]
const job = { job_id:'queue', release_id:releaseId, source_id:'amazon', source_slug:'amazon_it_public', endpoint_id:'endpoint', endpoint_url:'https://www.amazon.it/dp/B083JYP59Y', exact_release_verified:true }
const uuid = 'f9c41146-ecd3-415c-ae0a-461de670e2e8'
const listing = (extra={}) => ({price_symbol:'€',price:30,shipping_price:'GRATUITA',condition:'Nuovo',seller_id:'ADVCR11V8P2X1',seller_name:'RCECHO from Hong Kong',...extra})
const payload = (...listings) => ({item:{name:'Tamiya Item 18094 Neo VQS VZ Chassis'},listings})

test('exact identity, new condition, EUR, seller dedup and no invented shipping',()=>{
  assert.throws(()=>parser.parseAmazonOffers({item:{name:'Tamiya 95598'},listings:[]},'18094'))
  assert.throws(()=>parser.parseAmazonOffers({item:{name:'Tamiya 18094 body set'},listings:[]},'18094'))
  assert.throws(()=>parser.parseAmazonOffers(payload({pinned_offer:true,condition:'',seller_name:''}),'18094'),/AMAZON_OFFERS_INCOMPLETE/)
  const result=parser.parseAmazonOffers(payload(listing(),listing({price:31}),listing({seller_id:'ABCDE12345',price:38.14,shipping_price:null}),listing({condition:'Usato'}),listing({price_symbol:'$'})),'18094')
  assert.deepEqual(result.offers.map(o=>[o.price,o.shipping]),[[30,0],[38.14,null]])
  assert.equal(parser.parseAmazonOffers({item:{name:'Tamiya 95598 Neo VQS Advanced Pack'},listings:[listing({price:408.36})]},'95598').offers[0].price,408.36)
})

function harness({state={},responses=[],old=[]}={}) {
  const db={state:structuredClone(state),queue:{},candidates:new Map(),offers:[],requests:[],recomputed:0}
  const client={from(table){
    let operation='select',body,filters={}
    const execute=()=>{
      if(table==='market_scan_endpoints') {
        if(operation==='update') {db.state=structuredClone(body.last_extraction);return {data:null,error:null}}
        return {data:{last_extraction:structuredClone(db.state)},error:null}
      }
      if(table==='product_releases') return {data:{item_number:'18094'},error:null}
      if(table==='market_scan_queue') {Object.assign(db.queue,body);return {data:null,error:null}}
      if(table==='market_candidates') {
        if(operation==='upsert') {const row={id:'candidate-'+db.candidates.size,...body};db.candidates.set(body.source_record_key,row);return {data:row,error:null}}
        return {data:db.candidates.get(filters.source_record_key)??null,error:null}
      }
      throw Error('Unexpected table '+table)
    }
    const query={select(){return query},eq(k,v){filters[k]=v;return query},update(v){operation='update';body=v;return query},upsert(v){operation='upsert';body=v;return query},single(){return Promise.resolve(execute())},maybeSingle(){return Promise.resolve(execute())},then(resolve,reject){return Promise.resolve().then(execute).then(resolve,reject)}}
    return query
  }}
  const repo={listCurrentOffers:async()=>old,upsertOfferState:async offer=>{db.offers.push(offer)}}
  const source=readFileSync(new URL('../lib/market/automation/amazon-worker.ts',import.meta.url),'utf8')
  const exports={}
  const imports={'server-only':{},'node:crypto':require('node:crypto'),'./amazon-offers':parser,'@/lib/market/pipeline/market-r3-service':{recomputeReleaseMarketSignal:async()=>{db.recomputed++}}}
  const context={exports,require:name=>{assert.ok(name in imports,name);return imports[name]},Date,Set,JSON,Number,Error,String,TextDecoder,AbortSignal,process:{env:{TRACKDASH_SCRAPERAPI_KEY:'test-only-secret'}},fetch:async(url,options)=>{
    db.requests.push({url,options})
    if(options.method==='POST') assert.ok(db.state.nextSubmitAt,'Reservation must persist BEFORE submission')
    const response=responses.shift()
    if(response instanceof Error) throw response
    assert.ok(response,'Unexpected network request')
    return new Response(JSON.stringify(response),{status:200})
  }}
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,context)
  return {db,run:override=>exports.scanClaimedAmazonJob(client,repo,{...job,...override})}
}

test('one submission, no credential persisted, fixed URL, pending response holds queue',async()=>{
  const h=harness({responses:[{id:uuid,status:'running',asin:'B083JYP59Y'}]})
  assert.equal((await h.run()).status,'review')
  assert.equal(h.db.requests.length,1)
  assert.equal(h.db.requests[0].url,'https://async.scraperapi.com/structured/amazon/offers/v1')
  assert.deepEqual(Object.keys(JSON.parse(h.db.requests[0].options.body)).sort(),['apiKey','asin','country_code','tld'])
  assert.equal(h.db.state.providerJobId,uuid)
  assert.ok(!JSON.stringify(h.db.state).includes('test-only-secret'))
  assert.equal(h.db.offers.length,0)
  assert.equal(h.db.queue.locked_until,null)
})

test('lost submission response reserves a full day and cannot spend twice',async()=>{
  const h=harness({responses:[Error('network url with test-only-secret')]})
  assert.equal((await h.run()).status,'failed')
  assert.equal((await h.run()).status,'review')
  assert.equal(h.db.requests.length,1)
  assert.ok(!JSON.stringify(h.db.state).includes('test-only-secret'))
})

test('finished async response persists independent sellers; no SOLD or false EU origin',async()=>{
  const h=harness({state:{asin:'B083JYP59Y',providerJobId:uuid,requestStartedAt:new Date().toISOString(),nextSubmitAt:new Date(Date.now()+86400000).toISOString()},responses:[{status:'finished',response:{statusCode:200,credits:5,body:JSON.stringify(payload(listing(),listing({seller_id:'A1RP831ATRGZHA',seller_name:'Amazon US',price:38.14})))}}]})
  assert.equal((await h.run()).status,'accepted')
  assert.equal(h.db.requests.length,1)
  assert.equal(h.db.requests[0].options.method,undefined)
  assert.equal(h.db.requests[0].url,'https://async.scraperapi.com/jobs/'+uuid)
  assert.equal(h.db.offers.length,2)
  assert.notEqual(h.db.offers[0].sellerFingerprint,h.db.offers[1].sellerFingerprint)
  assert.equal(h.db.recomputed,1)
  for(const c of h.db.candidates.values()) {assert.equal(c.observation_type,'active_listing');assert.equal(c.raw_payload.itemLocationCountry,null);assert.equal(c.is_complete,true)}
  await h.run()
  assert.equal(h.db.requests.length,1,'Completion cannot immediately submit another charged request')
})

test('malformed/partial response preserves all prior prices',async()=>{
  const h=harness({state:{asin:'B083JYP59Y',providerJobId:uuid,requestStartedAt:new Date().toISOString()},responses:[{status:'finished',response:{item:{name:'Tamiya 18094'}}}],old:[{sourceId:'amazon',itemPrice:30}]})
  assert.equal((await h.run()).status,'failed')
  assert.equal(h.db.offers.length,0)
})

test('only the two explicitly verified endpoints can consume provider credits',async()=>{
  const h=harness()
  assert.equal((await h.run({endpoint_url:'https://evil.invalid/'})).status,'failed')
  assert.equal((await h.run({release_id:'another-release'})).status,'failed')
  assert.equal(h.db.requests.length,0)
})
