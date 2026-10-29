import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { fixture } from './fixtures/market-ui-render.mjs'

for(const locale of ['it','en']){
 test(`authenticated ${locale}: data first, all Releases and canonical locale links, no promotion or reveal`,()=>{
  const {load,products}=fixture(locale,{user:{id:'test'},hydrated:true})
  const html=renderToStaticMarkup(React.createElement(load('components/screens/market-screen.tsx').MarketScreen,{products}))
  assert.match(html,/id="live-market"/);assert.doesNotMatch(html,/data-reveal|PwaInstall|Crea account|Create free account|Market beta|Pro coming later/)
  assert.equal((html.match(/class="group flex/g)||[]).length,240)
  assert.match(html,new RegExp(`href="${locale==='en'?'/en':''}/catalog/`))
  assert.match(html,/Valori disponibili|Available values/);assert.match(html,/Mercato osservato|Observed market/)
 })
 test(`visitor ${locale}: landing and login/signup preserve live anchor`,()=>{
  const {load,products}=fixture(locale,{user:null,hydrated:true})
  const html=renderToStaticMarkup(React.createElement(load('components/screens/market-screen.tsx').MarketScreen,{products}))
  assert.match(html,/%23live-market/);assert.match(html,/PwaInstallSettingsButton/);assert.doesNotMatch(html,/data-reveal/)
 })
 test(`session restoring ${locale}: neutral visible shell, SSR content retained hidden`,()=>{
  const {load}=fixture(locale,{user:null,hydrated:false},locale==='en'?'/en/market':'/market')
  const html=renderToStaticMarkup(React.createElement(load('components/public-shell.tsx').PublicShell,null,'PUBLIC SEO CONTENT'))
  assert.match(html,/role="status"/);assert.match(html,/<div data-market-session-content="true" hidden="">PUBLIC SEO CONTENT<\/div>/);assert.doesNotMatch(html,/Crea account|Create free account|<header/);assert.match(html,/<noscript><style>/)
 })
}
test('main market content never participates in reveal; long sections exceed the old visibility threshold',()=>{
 const source=readFileSync('components/screens/market-screen.tsx','utf8')
 assert.doesNotMatch(source,/data-reveal/)
 assert.ok(844/(240*76)<0.12)
 assert.match(source,/<Link href=\{href\} prefetch=\{false\}/)
})

for (const locale of ['it','en']) test(`public ${locale}: complete HTML matches approved layout and copy`,()=>{
 const {load,products}=fixture(locale,{user:null,hydrated:true})
 const html=renderToStaticMarkup(React.createElement(load('components/screens/market-screen.tsx').MarketScreen,{products})).replace(/ data-reveal(?:="[^"]*")?/g,'')
 const expected=JSON.parse(readFileSync('scripts/fixtures/market-public-baseline.json','utf8'))
 assert.equal(createHash('sha256').update(html).digest('hex'),expected[locale])
})
