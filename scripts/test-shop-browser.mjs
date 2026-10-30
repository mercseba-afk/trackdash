// Controlled UI test: real shop screen and navigation, synthetic session/data.
// No production login, writes, messages or offers are sent.
import { build } from 'esbuild'
import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import assert from 'node:assert/strict'
const entry = `import React from 'react';import {createRoot} from 'react-dom/client';import {ShopScreen} from './components/screens/shop-screen';import {AppShell} from './components/app-shell';
window.owner=!location.search.includes('normal');
const copy={id:'11111111-1111-4111-8111-111111111111',name:'Avante Mk.II',editionName:'Special 2020',itemNumber:'95525',releaseYear:2020,chassis:'MS',condition:'Sealed',askingPrice:25,askingCurrency:'EUR',username:'seller',imageUrl:null,releaseHref:'/catalog/avante/releases/special',isMine:location.search.includes('mine')};
createRoot(document.getElementById('root')).render(<AppShell><ShopScreen copies={[copy]} detail={location.pathname==='/detail'}/></AppShell>);`
const mocks={
 'next/link':`import React from 'react';export default function Link({children,prefetch,...props}){return <a {...props}>{children}</a>}`,
 'next/navigation':`export const usePathname=()=>'/shop';export const useRouter=()=>({replace(){},push(){}});`,
 '@/lib/seo/catalog-paths':`export const localizePublicPath=(path,locale)=>locale==='en'?'/en'+path:path;`,
 '@/lib/i18n':`export const useI18n=()=>({locale:'it',t:(key)=>({'nav.catalog':'Catalogo','nav.collection':'Collezione','nav.scanner':'Scanner','nav.messages':'Messaggi','menu.profile':'Profilo','nav.dashboard':'Home'}[key]||key)});`,
 '@/lib/store':`export const useStore=()=>({hydrated:true,user:{id:window.owner?'owner':'normal',username:'demo',email:window.owner?'merc.seba@gmail.com':'normal@example.com'},logout(){}});`,
 '@/lib/actions/shop-access':`export const getShopAccessAction=async()=>window.owner;`,
 '@/lib/actions/speed-champions-access':`export const getSpeedChampionsAccessAction=async()=>false;`,
 '@/lib/actions/messaging':`export const getUnreadMessagingCountAction=async()=>2;`,
 '@/lib/supabase/client':`export const createClient=()=>({channel(){const c={on(){return c},subscribe(){return c}};return c},removeChannel(){}});`,
 '@/components/brand-mark':`import React from 'react';export const BrandMark=()=> <span>TrackDash</span>;`,
 '@/components/facebook-link':`export const FacebookLink=()=>null;export const SocialFollow=()=>null;`,
 '@/components/collectible-vertical-switch':`export const CollectibleVerticalSwitch=()=>null;`,
 '@/components/language-switch':`export const LanguageSwitch=()=>null;`,
 '@/components/notification-center':`export const NotificationCenter=()=>null;`,
 '@/components/pwa-install-menu-item':`export const PwaInstallButton=()=>null;export const PwaInstallMenuItem=()=>null;`,
 '@/components/messaging/direct-offer-dialog':`import React from 'react';export const DirectOfferDialog=({target})=>target?<div role='dialog' data-share={target.shareId}>Proposta a {target.username}</div>:null;`,
}
const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:process.cwd()}))}}]})
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:`<html><head><meta name='viewport' content='width=device-width,initial-scale=1'></head><body><div id='root'></div><script src='/bundle.js'></script></body></html>`)})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']})
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));const base=`http://127.0.0.1:${server.address().port}`
 await page.goto(base);await page.waitForFunction(()=>document.querySelectorAll('a[href="/shop"]').length===2)
 const bottom=page.locator('nav').last();assert.deepEqual(await bottom.locator('a').allTextContents(),['Catalogo','Collezione','Scanner','In vendita','Messaggi2'])
 assert.equal(await bottom.locator('a[href="/profile"]').count(),0)
 assert.equal(await page.locator('a[href^="/shop/"]').count(),1)
 await page.getByRole('textbox').fill('not-found');assert.equal(await page.locator('a[href^="/shop/"]').count(),0)
 await page.getByRole('textbox').fill('95525');assert.equal(await page.locator('a[href^="/shop/"]').count(),1)
 await page.goto(base+'/detail');await page.getByRole('button',{name:'Fai un’offerta'}).click();assert.equal(await page.getByRole('dialog').getAttribute('data-share'),'11111111-1111-4111-8111-111111111111')
 await page.goto(base+'/detail?mine');assert.equal(await page.getByRole('button',{name:'La tua copia'}).isDisabled(),true)
 await page.goto(base+'?normal');await page.waitForTimeout(100);assert.equal(await page.locator('a[href="/shop"]').count(),2);assert.equal(await page.locator('nav').last().locator('a[href="/profile"]').count(),0)
 assert.deepEqual(errors,[]);console.log('PASS owner navigation, collector navigation, search, exact-copy offer target, own-copy guard; no browser errors')
}finally{await browser.close();await new Promise(r=>server.close(r))}
