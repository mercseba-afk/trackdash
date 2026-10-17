import {build} from 'esbuild'
import {mkdirSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const result=await build({entryPoints:['ops/ebay-erasure/worker.ts'],bundle:true,platform:'node',target:'node22',format:'cjs',write:false,legalComments:'inline',plugins:[{name:'server-only-build',setup(b){b.onResolve({filter:/^server-only$/},()=>({path:'empty',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export {}'}))}}]})
mkdirSync('work/p06a-worker',{recursive:true})
const bytes=result.outputFiles[0].contents;writeFileSync('work/p06a-worker/index.js',bytes)
console.log(JSON.stringify({artifact:'work/p06a-worker/index.js',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}))
