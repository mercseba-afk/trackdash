import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
function load(path, mocks, env = {}) {
  const exports = {}
  const source = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(source, { exports, process: { env }, Set, require(name) {
    if (name === 'server-only') return {}
    if (!(name in mocks)) throw Error('UNEXPECTED_IMPORT:' + name)
    return mocks[name]
  } })
  return exports
}
test('owner gate fails closed without allowlist, even on preview/development', async () => {
  let reads = 0
  const gate = load('lib/server/shop-gate.ts', { react: { cache: fn => fn }, '@/lib/admin/access': { getCurrentAdmin: async () => { reads++; return { id: 'owner' } } } }, { VERCEL_ENV: 'preview', NODE_ENV: 'development' })
  assert.equal(await gate.canAccessShop(), false)
  assert.equal(reads, 0)
})
test('only the configured owner with admin membership is authorized', async () => {
  for (const [user, expected] of [[null, false], [{id:'other'}, false], [{id:'owner'}, true]]) {
    const gate = load('lib/server/shop-gate.ts', { react: { cache: fn => fn }, '@/lib/admin/access': { getCurrentAdmin: async () => user } }, { SPEED_CHAMPIONS_OWNER_ID: 'owner' })
    assert.equal(await gate.canAccessShop(), expected)
  }
})
const shareId = '11111111-1111-4111-8111-111111111111'
function fixture({ allowed = true, reserved = false, dealError = false } = {}) {
  let reads = 0, photos = 0
  const row = { id: shareId, userId:'seller', collectionItemId:'private-copy-id', condition:'Sealed', askingPrice:'25.00', askingCurrency:'EUR', collector:{username:'collector'}, product:{name:'Avante', images:[{url:'family.jpg',position:0}]}, release:{editionName:'Special',itemNumber:'95525',releaseYear:2020,chassis:'MS',images:[{url:'release.jpg',position:0}]} }
  const chain = { select(){return this}, eq(){return this}, neq(){return this}, in: async () => ({data:reserved ? [{conversations:{collection_share_id:shareId}}] : [],error:dealError ? Error('DEAL_LOOKUP_FAILED') : null}) }
  const api = load('lib/server/shop.ts', {
    'drizzle-orm': { and: (...v) => v, eq: (...v) => v, sql: (...v) => v },
    'next/navigation': { notFound(){throw Error('NOT_FOUND')} },
    './shop-gate': {canAccessShop:async()=>allowed},
    '@/lib/auth/current-user': {getCurrentUser:async()=>({id:'owner'})},
    '@/lib/db/rls': {withUserContext:async(_,fn)=>fn({query:{collectionShares:{findMany:async(opts)=>{reads++;assert.equal(opts.limit,100);assert.equal(opts.where[0][1],'open_to_offers');return [row]}}}})},
    '@/lib/db/schema': {collectionShares:{shareMode:'mode',id:'id',releaseId:'release'}},
    '@/lib/supabase/admin': {createAdminClient:()=>({from:()=>chain})},
    '@/lib/actions/shared-copy-photos': {getVisiblePrimaryCopyPhotos:async(ids)=>{photos+=ids.length;return new Map([['private-copy-id','signed-copy.jpg']])}},
    '@/lib/seo/catalog-paths': {releasePublicPath:()=>'/catalog/avante/releases/special'},
  })
  return {...api, counts:()=>({reads,photos})}
}
test('unauthorized data requests stop before database and storage access', async()=>{
  const f=fixture({allowed:false});await assert.rejects(f.getShopCopies(),/NOT_FOUND/);assert.equal(f.counts().reads,0)
})
test('malformed copy identifiers fail before database access',async()=>{
  const f=fixture();await assert.rejects(f.getShopCopies('bad-id'),/NOT_FOUND/);assert.equal(f.counts().reads,0)
})
test('reserved or sold copies are excluded before resolving photos',async()=>{
  const f=fixture({reserved:true});assert.equal((await f.getShopCopies()).length,0);assert.equal(f.counts().photos,0)
})
test('reservation lookup errors fail closed',async()=>{
  await assert.rejects(fixture({dealError:true}).getShopCopies(),/DEAL_LOOKUP_FAILED/)
})
test('available copies show exact photo and price without private collection identifiers',async()=>{
  const [copy]=await fixture().getShopCopies(shareId)
  assert.equal(copy.imageUrl,'signed-copy.jpg');assert.equal(copy.fallbackImageUrl,'release.jpg');assert.equal(copy.askingPrice,25);assert.equal(copy.isMine,false)
  assert.equal(copy.releaseHref,'/catalog/avante/releases/special')
  assert.equal('collectionItemId' in copy,false);assert.equal('userId' in copy,false)
})
