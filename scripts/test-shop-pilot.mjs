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
test('signed-out visitors do not gain signed-in shop capabilities', async () => {
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
function fixture({ signedIn = true, reserved = false, dealError = false, archived = false, hidden = false } = {}) {
  let reads = 0, photos = 0
  const row = { id: shareId, userId:'seller', collectionItemId:'private-copy-id', condition:'Sealed', askingPrice:'25.00', askingCurrency:'EUR', collector:{username:'collector'}, product:{name:'Avante', images:[{url:'family.jpg',position:0}]}, release:{editionName:'Special',itemNumber:'95525',releaseYear:2020,chassis:'MS',images:[{url:'release.jpg',position:0}]} }
  const chain = { select(){return this}, eq(){return this}, neq(){return this}, in: async () => ({data:reserved ? [{conversations:{collection_share_id:shareId}}] : [],error:dealError ? Error('DEAL_LOOKUP_FAILED') : null}) }
  const filters = []
  const publicRow = { id:shareId,user_id:'seller',collection_item_id:'private-copy-id',condition:'Sealed',asking_price:'25.00',asking_currency:'EUR',collector:{username:'collector'},product:{name:'Avante',metadata:{launch_status:'available',catalog_visibility:archived?'archived':'public'},brand:{slug:'tamiya'},images:[{url:'family.jpg',position:0}]},release:{edition_name:'Special',item_number:'95525',release_year:2020,chassis:'MS',catalog_visibility:hidden?'draft':'public',images:[{url:'release.jpg',position:0}]} }
  const publicChain = { select(){return this},eq(...args){filters.push(args);return this},order(){return this},limit(n){assert.equal(n,100);return this},then(resolve){reads++;return Promise.resolve({data:[publicRow],error:null}).then(resolve)} }
  const photoChain = {select(){return this},in(_,ids){photos+=ids.length;return this},order(){return this},then(resolve){return Promise.resolve({data:[{collection_item_id:'private-copy-id',url:'copy.webp'}],error:null}).then(resolve)}}
  const api = load('lib/server/shop.ts', {
    'drizzle-orm': { and: (...v) => v, eq: (...v) => v, sql: (...v) => v },
    'next/navigation': { notFound(){throw Error('NOT_FOUND')} },
    '@/lib/auth/current-user': {getCurrentUser:async()=>signedIn?({id:'owner'}):null},
    '@/lib/db/rls': {withUserContext:async(_,fn)=>fn({query:{collectionShares:{findMany:async(opts)=>{reads++;assert.equal(opts.limit,100);assert.equal(opts.where[0][1],'open_to_offers');return [row]}}}})},
    '@/lib/db/schema': {collectionShares:{shareMode:'mode',id:'id',releaseId:'release'}},
    '@/lib/supabase/admin': {createAdminClient:()=>({from:(table)=>table==='collection_shares'?publicChain:table==='collection_item_photos'?photoChain:chain,storage:{from:()=>({createSignedUrl:async()=>({data:{signedUrl:'signed-copy.jpg'},error:null})})}})},
    '@/lib/actions/shared-copy-photos': {getVisiblePrimaryCopyPhotos:async(ids)=>{photos+=ids.length;return new Map([['private-copy-id','signed-copy.jpg']])}},
    '@/lib/seo/catalog-paths': {releasePublicPath:()=>'/catalog/avante/releases/special'},
  })
  return {...api, counts:()=>({reads,photos}), filters}
}
test('anonymous visitors get only an explicit sale projection with no private identifiers', async()=>{
  const f=fixture({signedIn:false});const [copy]=await f.getShopCopies()
  assert.equal(copy.askingPrice,25);assert.equal(copy.imageUrl,'signed-copy.jpg');assert.equal(copy.isMine,false)
  assert.equal('collectionItemId' in copy,false);assert.equal('userId' in copy,false)
  assert.ok(f.filters.some(([key,value])=>key==='share_mode'&&value==='open_to_offers'))
  assert.ok(f.filters.some(([key,value])=>key==='release.catalog_visibility'&&value==='public'))
  assert.ok(f.filters.some(([key,value])=>key==='product.brand.slug'&&value==='tamiya'))
})
test('anonymous archived and unpublished release rows never expose copies or photos', async()=>{
  for(const options of [{archived:true},{hidden:true}]){
    const f=fixture({signedIn:false,...options});assert.equal((await f.getShopCopies()).length,0);assert.equal(f.counts().photos,0)
  }
})
test('malformed copy identifiers fail before database access',async()=>{
  const f=fixture();await assert.rejects(f.getShopCopies('bad-id'),/NOT_FOUND/);assert.equal(f.counts().reads,0)
})
test('reserved or sold copies are excluded before resolving photos',async()=>{
  for(const signedIn of [true,false]){const f=fixture({signedIn,reserved:true});assert.equal((await f.getShopCopies()).length,0);assert.equal(f.counts().photos,0)}
})
test('reservation lookup errors fail closed',async()=>{
  for(const signedIn of [true,false]) await assert.rejects(fixture({signedIn,dealError:true}).getShopCopies(),/DEAL_LOOKUP_FAILED/)
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

test('anonymous offer click opens account invitation with exact-copy return, signed-in click opens offer', () => {
  for (const signedIn of [false, true]) {
    const updates = []
    let state = 0
    const jsx = (type, props) => ({ type, props })
    const components = new Proxy({}, {get:(_,key)=>String(key)})
    const {ShopScreen} = load('components/screens/shop-screen.tsx', {
      react: {useState(initial){const index=state++;return [initial,value=>updates.push([index,value])]},useEffect(){}},
      'react/jsx-runtime': {jsx,jsxs:jsx},
      'next/link': {default:'Link'}, 'lucide-react':components,
      '@/lib/store':{useStore:()=>({hydrated:true,user:signedIn?{id:'buyer'}:null})},
      '@/lib/i18n':{useI18n:()=>({locale:'it'})},
      '@/lib/format':{formatMoney:value=>`${value} €`},
      '@/lib/seo/catalog-paths':{localizePublicPath:(path,locale)=>locale==='en'?'/en'+path:path},
      '@/components/ui/dialog':components,
      '@/components/ui/button':components,
      '@/components/ui/input':components,
      '@/components/messaging/direct-offer-dialog':components,
    })
    const copy={id:shareId,name:'Avante',editionName:'Special',condition:'Sealed',askingPrice:25,askingCurrency:'EUR',username:'seller',isMine:false}
    const tree=ShopScreen({copies:[copy],detail:true})
    const nodes=[]
    function walk(node){if(!node)return;if(Array.isArray(node)){node.forEach(walk);return}nodes.push(node);walk(node.props?.children);walk(node.props?.render)}
    walk(tree)
    const offer=nodes.find(node=>node.type==='Button'&&node.props?.onClick)
    assert.ok(offer);assert.equal(offer.props.disabled,false);offer.props.onClick()
    if(signedIn) assert.equal(updates[0][1],copy)
    else {
      assert.deepEqual(Array.from(updates[0]),[0,true])
      assert.equal(nodes.find(node=>node.type==='DirectOfferDialog').props.target,null)
      const destinations=nodes.filter(node=>node.props?.href).map(node=>node.props.href)
      assert.ok(destinations.includes(`/signup?next=${encodeURIComponent(`/shop/${shareId}?offer=1`)}`))
      assert.ok(destinations.includes(`/login?next=${encodeURIComponent(`/shop/${shareId}?offer=1`)}`))
    }
  }
})

test('direct offer action rejects anonymous requests before any database write', async()=>{
  let writes=0
  const api=load('lib/actions/direct-offer.ts',{
    'drizzle-orm':{sql:()=>{}},
    '@/lib/auth/current-user':{getCurrentUser:async()=>null},
    '@/lib/db/rls':{withUserContext:async()=>{writes++}},
  })
  await assert.rejects(api.startMarketplaceOfferAction(shareId,25,'EUR'),/Not authenticated/)
  assert.equal(writes,0)
})
