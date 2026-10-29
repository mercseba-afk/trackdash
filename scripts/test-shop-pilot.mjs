import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
function load(path, mocks, env = {}) {
  const exports = {}
  const source = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  vm.runInNewContext(source, { exports, process: { env }, Set, require(name) {
    if (name === 'server-only') return {}
    if (!(name in mocks)) throw Error('UNEXPECTED_IMPORT:' + name)
    return mocks[name]
  } })
  return exports
}
test('signed-out visitors cannot access shop data, including preview/development', async () => {
  const gate = load('lib/server/shop-gate.ts', { react: { cache: fn => fn }, '@/lib/auth/current-user': { getCurrentUser: async () => null } }, { VERCEL_ENV: 'preview', NODE_ENV: 'development' })
  assert.equal(await gate.canAccessShop(), false)
})
test('ordinary signed-in collectors can access the shop without admin membership', async () => {
  for (const id of ['ordinary-collector', 'owner']) {
    const gate = load('lib/server/shop-gate.ts', { react: { cache: fn => fn }, '@/lib/auth/current-user': { getCurrentUser: async () => ({ id }) } })
    assert.equal(await gate.canAccessShop(), true)
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

test('ordinary collector mobile navigation ends with shop and messages', () => {
  const jsx = (type, props) => ({ type, props })
  const componentMocks = new Proxy({}, { get: (_, key) => String(key) })
  const source = ts.transpileModule(readFileSync(new URL('../components/app-shell.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(source, { exports, require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
    if (name === 'react') return { useState: () => [0, () => {}], useEffect() {}, useCallback: fn => fn }
    if (name === 'next/navigation') return { usePathname: () => '/shop', useRouter: () => ({}) }
    if (name === '@/lib/store') return { useStore: () => ({ user: { id: 'ordinary-collector', email: 'collector@example.com' } }) }
    if (name === '@/lib/i18n') return { useI18n: () => ({ locale: 'it', t: key => key }) }
    if (name === '@/lib/utils') return { cn: (...values) => values.filter(Boolean).join(' ') }
    return componentMocks
  } })
  const tree = exports.AppShell({ children: null })
  const navs = []
  function walk(node) {
    if (!node) return
    if (Array.isArray(node)) { node.forEach(walk); return }
    if (node.type === 'nav') navs.push(node)
    walk(node.props?.children)
  }
  walk(tree)
  const bottom = navs.at(-1)
  assert.deepEqual(Array.from(bottom.props.children, node => node.props.href), ['/catalog', '/collection', '/scanner', '/shop', '/messages'])
})
