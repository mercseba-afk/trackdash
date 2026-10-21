import assert from "node:assert/strict"
import { discoverCurrentRetailEndpoints as discover } from "./discover-current-retail-endpoints.mjs"
const catalog = [{ id:"a",item_number:"18069" },{id:"b",item_number:"18025"},{id:"c",item_number:"18025"}]
const card = (item, stock, path = "/product/6058/kit") => `<div class="indice_fondo_prodotti2"><a href="${path}">Cod. ${item}</a><div class="disponibilita_indice"><i></i> ${stock}</div>`
assert.equal(discover("briosi_public", card("18069","Non disponbile"),catalog).candidates.length,0)
assert.equal(discover("briosi_public", card("18069","Disponibile"),catalog).candidates[0].status,"needs_exact_page_verification")
assert.equal(discover("briosi_public",card("18025","Disponibile"),catalog).ambiguous,1)
assert.equal(discover("briosi_public",card("99999","Disponibile"),catalog).candidates.length,0)
const im = (button,url="https://www.imodellini.it/product") => `<div class="product-thumb"><h4><a href="${url}">Kit</a></h4><p class="m-and-m">Tamiya 18069</p><span>${button}</span>`
assert.equal(discover("imodellini_public",im("Notifica"),catalog).candidates.length,0)
assert.equal(discover("imodellini_public",im("Acquista"),catalog).candidates.length,1)
assert.equal(discover("imodellini_public",im("Acquista","https://untrusted.invalid/product"),catalog).candidates.length,0)
assert.throws(()=>discover("unknown","",catalog),/UNSUPPORTED_SOURCE/)
console.log("8 retail discovery guards passed; output is review-only, never automatic enrollment")
