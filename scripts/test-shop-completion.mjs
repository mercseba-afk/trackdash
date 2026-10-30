// Executes real page/component functions with mocked transports. No accounts,
// messages or emails are created; these tests do not certify SMTP delivery.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {fixture} from './fixtures/market-ui-render.mjs'
import {localizePublicPath,publicAbsoluteUrl,publicLanguageAlternates} from '../lib/seo/catalog-paths.ts'
const jsx=(type,props)=>({type,props})
const components=new Proxy({}, {get:(_,key)=>String(key)})
function load(path,mocks,globals={}) {
 const exports={}
 const source=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText
 vm.runInNewContext(source,{exports,URL,URLSearchParams,console,...globals,require(name){
  if(name in mocks)return mocks[name]
  if(name==='react/jsx-runtime')return {jsx,jsxs:jsx}
  if(name==='lucide-react'||name.startsWith('@/components/'))return components
  throw Error('Unexpected import '+name)
 }})
 return exports
}
function nodes(tree) {
 const all=[]
 function walk(node){if(!node)return;if(Array.isArray(node)){node.forEach(walk);return}all.push(node);walk(node.props?.children);walk(node.props?.render)}
 walk(tree);return all
}
for(const locale of ['it','en']) {
 const path=`${locale==='en'?'/en':''}/shop/11111111-1111-4111-8111-111111111111?offer=1`
 for(const mode of ['signup','login']) test(`${mode} ${locale}: real form preserves exact shop offer destination`,async()=>{
  const redirects=[],calls=[]
  const values=mode==='signup'?['collector@example.invalid','collector','Italy','synthetic-password',false,false,false]:['collector@example.invalid','synthetic-password',false,false]
  let index=0
  const api=load('components/screens/auth-screen.tsx',{
   react:{useState:()=>[values[index++],()=>{}]},
   'next/link':{default:'Link'},
   'next/navigation':{useRouter:()=>({push:path=>redirects.push(path),refresh(){}})},
   '@/lib/i18n':{useI18n:()=>({locale,setLocale(){}})},
   '@/lib/supabase/client':{createClient:()=>({auth:{
    signUp:async payload=>{calls.push(payload);return {data:{session:null},error:null}},
    signInWithPassword:async()=>({data:{user:{email:'collector@example.invalid',user_metadata:{onboarding_completed:true}}},error:null}),
    mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal1',nextLevel:'aal1'}})},
   }})},
   sonner:{toast:{error(message){throw Error(message)},success(){}}},
  },{window:{location:{origin:'https://isolated.trackdash.invalid'}}})
  const auth=api.AuthScreen({mode,nextPath:path})
  const entry=nodes(auth).find(n=>typeof n.type==='function'&&n.type.name===(mode==='signup'?'SignupForm':'LoginForm'))
  assert.ok(entry)
  const form=entry.type(entry.props)
  await form.props.onSubmit({preventDefault(){}})
  if(mode==='signup') {
   const callback=new URL(calls[0].options.emailRedirectTo)
   assert.equal(callback.origin,'https://isolated.trackdash.invalid');assert.equal(callback.pathname,'/auth/callback')
   assert.equal(callback.searchParams.get('flow'),'signup');assert.equal(callback.searchParams.get('next'),path)
   assert.equal(callback.searchParams.get('locale'),locale)
  } else assert.deepEqual(redirects,[path])
 })
 test(`${locale} marketplace has correct canonical, alternate language and social metadata`,async()=>{
  const api=load('app/shop/page.tsx',{
   'next/headers':{cookies:async()=>({get:()=>({value:locale})})},
   '@/lib/seo/catalog-paths':{publicAbsoluteUrl,publicLanguageAlternates},
   '@/lib/server/shop':{getShopCopies:async()=>[]},
  })
  const metadata=await api.generateMetadata()
  assert.equal(metadata.alternates.canonical,`https://trackdash.it${locale==='en'?'/en':''}/shop`)
  assert.equal(metadata.alternates.languages.en,'https://trackdash.it/en/shop')
  assert.equal(metadata.openGraph.url,metadata.alternates.canonical)
  assert.equal(metadata.robots.index,true)
  assert.match(metadata.title,locale==='en'?/Marketplace/:/Mercatino/)
 })
 test(`${locale} language switch preserves copy, search and hash`,()=>{
  const redirects=[],target=locale==='it'?'en':'it',current=locale==='en'?'/en/shop/copy':'/shop/copy'
  const api=load('components/language-switch.tsx',{
   'next/navigation':{usePathname:()=>current,useRouter:()=>({push:path=>redirects.push(path)})},
   '@/lib/i18n':{useI18n:()=>({locale,setLocale(){}})},
   '@/lib/seo/catalog-paths':{localizePublicPath},
   '@/lib/utils':{cn:(...v)=>v.join(' ')},
  },{window:{location:{search:'?offer=1',hash:'#details'}}})
  const tree=api.LanguageSwitch({})
  nodes(tree).find(n=>n.type==='button'&&n.props.children===target).props.onClick()
  assert.deepEqual(redirects,[`${target==='en'?'/en':''}/shop/copy?offer=1#details`])
 })
 test(`${locale} home teaser links directly to public marketplace without mock negotiation`,()=>{
  const {load}=fixture(locale,{user:null,hydrated:true})
  const html=renderToStaticMarkup(React.createElement(load('components/screens/public-home-screen.tsx').PublicHomeScreen,{products:[]}))
  const section=html.match(/<section[^>]*id="community"[\s\S]*?<\/section>/)?.[0]
  assert.ok(section)
  assert.match(section,new RegExp(`href="${locale==='en'?'/en':''}/shop"`))
  assert.doesNotMatch(section,/Offerta strutturata|Structured offer|Ciao!|Hi!|%2Fmessages/)
 })
 test(`${locale} marketplace renders localized copy links and concise trading instructions`,()=>{
  const {load}=fixture(locale,{user:null,hydrated:true})
  const copy={id:'copy',name:'Avante',editionName:'Special',itemNumber:'95525',condition:'Sealed',askingPrice:25,askingCurrency:'EUR',username:'collector',imageUrl:null,isMine:false}
  const html=renderToStaticMarkup(React.createElement(load('components/screens/shop-screen.tsx').ShopScreen,{copies:[copy]}))
  assert.match(html,new RegExp(`href="${locale==='en'?'/en':''}/shop/copy"`))
  assert.match(html,locale==='en'?/How the marketplace works/:/Come funziona il mercatino/)
 })
}

test('home release example uses live values and concise captions without changing underlying market provenance',()=>{
 const {load,signals}=fixture('it',{user:null,hydrated:true})
 signals.r0={valueEUR:34.91,soldUnits:10,representativeAskItemEUR:51.81,representativeAskSellerCount:3,representativeAskOrigin:'extra_eu'}
 const products=[{id:'family',name:'Avante Mk.III',releases:[{id:'r0',itemNumber:'95087',editionName:'Japan Cup 2015',releaseYear:2015,images:['example.jpg']}]}]
 const html=renderToStaticMarkup(React.createElement(load('components/home-discovery.tsx').HomeDiscovery,{products,copies:[]}))
 assert.match(html,/34,91/);assert.match(html,/51,81/)
 assert.match(html,/10.*vendite concluse osservate/);assert.match(html,/Prezzi rilevati/)
 assert.doesNotMatch(html,/Mediana|extra-UE|provenienza da verificare|Stima TrackDash/)
 assert.equal(signals.r0.representativeAskOrigin,'extra_eu')
 assert.match(html,/18012-1988-original-confezione/)
})
