// Controlled browser regression: real MarketScreen/PublicShell/reveal controller,
// synthetic public signals/session. No real login, Next router, DB or network.
import { build } from 'esbuild'
import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import assert from 'node:assert/strict'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {fixture} from './fixtures/market-ui-render.mjs'
const entry = `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {MarketScreen} from './components/screens/market-screen';
import {PublicShell} from './components/public-shell';
import {ScrollRevealController} from './components/scroll-reveal-controller';
window.state={user:null,hydrated:false}; window.listeners=new Set();
window.update=(state)=>{window.state=state;window.listeners.forEach(fn=>fn())};
const products=[{id:'family',name:'Test family',releases:Array.from({length:240},(_,i)=>({id:'r'+i,editionName:'Release '+i,itemNumber:String(90000+i),images:[]}))}];
function App(){const s=React.useSyncExternalStore(fn=>{window.listeners.add(fn);return()=>window.listeners.delete(fn)},()=>window.state);return <><ScrollRevealController/>{location.pathname==='/old'?<><a href='#live-market'>Values</a><div style={{height:1200}}/><section data-reveal id='live-market' style={{height:24000}}>Long list</section></>:<PublicShell><MarketScreen products={products}/></PublicShell>}</>}
createRoot(document.getElementById('root')).render(<App/>);
`
const mocks = {
 'next/link': `import React from 'react'; export default function Link({prefetch,children,...p}){return <a {...p} data-prefetch={String(prefetch)}>{children}</a>}`,
 'next/navigation': `export const usePathname=()=>location.pathname; export const useRouter=()=>({replace(){}});`,
 '@/lib/store': `import React from 'react';export const useStore=()=>React.useSyncExternalStore(fn=>{window.listeners.add(fn);return()=>window.listeners.delete(fn)},()=>window.state);`,
 '@/lib/i18n': `export const useI18n=()=>({locale:new URLSearchParams(location.search).get('locale')||'it'});`,
 '@/lib/market/context': `const signals=Object.fromEntries(Array.from({length:240},(_,i)=>['r'+i,{valueEUR:i%2?null:20+i,soldAnchorEUR:15,soldUnits:1,currentOfferCount:2,retailSourceCount:0,confidenceLabel:'low',trendPercent:i<8&&i%2===0?i-3:null}]));export const useMarketSignals=()=>signals;`,
 '@/components/app-shell': `import React from 'react';export const AppShell=({children})=><main data-app-shell>{children}</main>;`,
 '@/components/catalog/product-image': `import React from 'react';export const ProductImage=()=> <span/>;`,
 '@/components/market-bits': `import React from 'react';export const RarityBadge=()=>null;export const TrendIndicator=()=>null;`,
 '@/components/pwa-install-menu-item': `import React from 'react';export const PwaInstallButton=()=> <button>Install app</button>;export const PwaInstallSettingsButton=PwaInstallButton;`,
 '@/components/brand-mark': `export const BrandMark=()=>null;`,
 '@/components/language-switch': `export const LanguageSwitch=()=>null;`,
}
const result=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',plugins:[{name:'controlled-boundaries',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:process.cwd()}))}}]})
const css=readFileSync('app/globals.css','utf8');
// Preserve exact reveal CSS; basic fixture layout substitutes for Tailwind build.
const reveal=css.slice(css.indexOf('.td-reveal-pending {'),css.indexOf('@keyframes td-hero-copy-in'));
const noScriptHTML=Object.fromEntries(['it','en'].map(locale=>{
 const {load,products}=fixture(locale,{user:null,hydrated:false},locale==='en'?'/en/market':'/market');
 return [locale,renderToStaticMarkup(React.createElement(load('components/public-shell.tsx').PublicShell,null,React.createElement(load('components/screens/market-screen.tsx').MarketScreen,{products})))];
}));
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');if(req.url.startsWith('/no-js')){const locale=new URL(req.url,'http://fixture').searchParams.get('locale')||'it';res.end(`<html><body>${noScriptHTML[locale]}</body></html>`);return}res.end(req.url==='/bundle.js'?result.outputFiles[0].text:`<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${reveal}a.group{display:flex;min-height:76px}section{margin:24px 0} [hidden]{display:none!important} body{margin:0} .scroll-mt-28{scroll-margin-top:112px}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']}).catch(async error=>{await new Promise(r=>server.close(r));throw error});
try {
 for(const viewport of [{width:390,height:844},{width:360,height:640}]){
 for(const locale of ['it','en']){
 const noJS=await browser.newContext({viewport,javaScriptEnabled:false});const noJSPage=await noJS.newPage();
 await noJSPage.goto(base+'/no-js?locale='+locale);
 assert.equal(await noJSPage.locator('h1:visible').count(),1);
 assert.equal(await noJSPage.locator('[data-market-session-loading]:visible').count(),0);
 assert.equal(await noJSPage.locator('#live-market:visible').count(),1);
 console.log('PASS public SSR without JavaScript',locale,viewport);await noJS.close();
 }
 const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}); const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/old');await page.locator('a').click();await page.waitForTimeout(1500);
 console.log("baseline geometry",await page.locator("#live-market").evaluate(e=>({class:e.className,top:e.getBoundingClientRect().top,height:e.getBoundingClientRect().height,scroll:scrollY,viewport:innerHeight,opacity:getComputedStyle(e).opacity})));
 assert.equal(await page.locator('#live-market').evaluate(e=>getComputedStyle(e).opacity),'0');
 console.log('PASS baseline: long reveal section remains invisible after anchor',viewport);
 for(const locale of ['it','en']){
 await page.goto(base+`/${locale==='en'?'en/':''}market?locale=${locale}#live-market`);
 await page.getByRole('status').waitFor(); assert.equal(await page.locator('h1:visible').count(),0);
 await page.evaluate(()=>window.update({user:{id:'controlled-user'},hydrated:true}));
 await page.locator('[data-app-shell]').waitFor();
 const live=page.locator('#live-market');await live.waitFor({state:'visible'});
 await page.waitForFunction(()=>{const top=document.getElementById('live-market').getBoundingClientRect().top;return top>=0&&top<=113});
 assert.equal(await live.evaluate(e=>getComputedStyle(e).opacity),'1');
 assert.equal(await page.locator('a.group').count(),240);assert.equal(await page.getByText('Install app',{exact:true}).count(),0);
 assert.equal(await page.getByText(locale==='it'?'Crea account gratuito':'Create free account',{exact:true}).count(),0);
 assert.equal(await page.locator('[data-reveal]').count(),0);
 assert.equal(await page.locator('a.group[data-prefetch="false"]').count(),240);
 await page.getByRole('tab',{name:locale==='it'?'Trend':'Trends',exact:true}).click();
 assert.equal(await page.locator('a.group:visible').count(),4);
 await page.getByRole('tab',{name:locale==='it'?'Valori':'Values',exact:true}).click();
 assert.equal(await page.locator('a.group:visible').count(),240);
 await context.setOffline(true);await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'))});
 assert.equal(await live.evaluate(e=>getComputedStyle(e).opacity),'1');await context.setOffline(false);
 await page.locator('a.group').last().scrollIntoViewIfNeeded();assert.equal(await live.evaluate(e=>getComputedStyle(e).opacity),'1');
 await page.evaluate(()=>{history.pushState({},'', '/other');history.back()});await page.waitForTimeout(100);assert.equal(await live.evaluate(e=>getComputedStyle(e).opacity),'1');
 await page.reload();await page.evaluate(()=>window.update({user:{id:'controlled-user'},hydrated:true}));await page.locator('[data-app-shell]').waitFor();assert.equal(await live.evaluate(e=>getComputedStyle(e).opacity),'1');
 await page.evaluate(()=>window.update({user:null,hydrated:true}));await page.getByText(locale==='it'?'Crea account gratuito':'Create free account',{exact:true}).first().waitFor();
 await page.evaluate(()=>{location.hash='live-market'});assert.equal(await live.evaluate(e=>getComputedStyle(e).opacity),'1');
 console.log('PASS controlled mobile session/IT-EN/240 rows/direct hash/refresh/history/tabs/offline-resume/visitor hash',locale,viewport);
 }
 assert.deepEqual(errors,[]);await context.close();
 }
} finally {await browser.close();await new Promise(r=>server.close(r))}
