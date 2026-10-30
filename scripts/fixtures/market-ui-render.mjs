import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
import * as React from 'react'
import * as jsx from 'react/jsx-runtime'

// Real presentation modules, controlled session/public signals; never load DB/Auth.
export function fixture(locale, state, path='/market', sources={}) {
 const signals=Object.fromEntries(Array.from({length:240},(_,i)=>['r'+i,{valueEUR:i%2?null:20+i,soldAnchorEUR:15,soldUnits:1,currentOfferCount:2,retailSourceCount:0,confidenceLabel:'low',trendPercent:null}]))
 const mocks={
  react:React,'react/jsx-runtime':jsx,
  'next/link':{__esModule:true,default:({children,href,className})=>React.createElement('a',{href,className},children)},
  'next/navigation':{usePathname:()=>path,useRouter:()=>({replace(){}})},
  '@/lib/utils':{cn:(...args)=>args.filter(Boolean).join(' ')},
  '@/lib/store':{useStore:()=>state},'@/lib/i18n':{useI18n:()=>({locale})},
  '@/lib/market/context':{useMarketSignals:()=>signals},
 }
 function load(file){
  let p=resolve(file);if(!/\.tsx?$/.test(p))p+='.ts';const exports={};
  const source=ts.transpileModule((sources[p] ?? readFileSync(p,'utf8')),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText
  vm.runInNewContext(source,{exports,require(name){
   if(mocks[name])return mocks[name]
   if(name.endsWith('.css'))return {}
   if(name==='@/components/home-discovery')return load('components/home-discovery.tsx')
   if(name.startsWith('@/components/')||name==='lucide-react') return new Proxy({}, {get:(_,key)=>key==='__esModule'?true:({children})=>React.createElement('div',{'data-component':String(key)},children)})
   if(name.startsWith('@/'))return load(name.slice(2))
   if(name.startsWith('.'))return load(resolve(dirname(p),name))
   throw Error('Unexpected import '+name)
  }},{filename:p});return exports
 }
 const products=[{id:'family',name:'Test family',releases:Array.from({length:240},(_,i)=>({id:'r'+i,editionName:'Release '+i,itemNumber:String(90000+i),images:[]}))}]
 return {load,products,signals}
}
