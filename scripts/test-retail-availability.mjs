import assert from "node:assert/strict"
import { parseExactRetailPage } from "../lib/market/automation/exact-page-adapter.ts"
const url = "https://iltempiodellemini4wd.it/prodotto/emperor/"
const metadata = (availability="InStock", price=15, productUrl=url) => `<script type="application/ld+json">${JSON.stringify({"@type":"Product",name:"Tamiya 18625",url:productUrl,offers:{"@type":"Offer",price,priceCurrency:"EUR",availability:`https://schema.org/${availability}`}})}</script>`
const cart = (extra="") => `<form class="cart" action="${url}"><button class="single_add_to_cart_button" ${extra}>Acquista</button></form>`
const page = (box, related="", schema=metadata()) => `${schema}<h1>Tamiya 18625</h1>${box}<div class="product_meta">SKU 18625</div>${related}`
const parse = html => parseExactRetailPage(html,{itemNumber:"18625",pageUrl:url})
assert.equal(parse(page('<p class="stock out-of-stock">Non disponibile</p>')).availability,"out_of_stock")
assert.equal(parse(page('',cart())).availability,"unknown")
assert.equal(parse(page(cart(),'<p class="stock out-of-stock">Non disponibile</p>')).availability,"in_stock")
assert.equal(parse(page(cart('disabled'))).availability,"unknown")
assert.equal(parse(page(cart('aria-disabled="true"'))).availability,"unknown")
assert.equal(parse(page(cart(),"",metadata("BackOrder"))).availability,"unknown")
assert.equal(parse(page('<p class="stock">Su ordinazione</p>'+cart())).availability,"backorder")
assert.equal(parse(page(cart(),"",metadata("NotInStock"))).availability,"unknown")
const foreign = metadata("InStock",2,"https://iltempiodellemini4wd.it/prodotto/related/")
assert.equal(parse(page(cart(),"",foreign+metadata("OutOfStock",50))).price,50)
assert.equal(parse(page(cart(),"",foreign+metadata("OutOfStock",50))).availability,"unknown")
console.log("10 retail availability guards passed")
