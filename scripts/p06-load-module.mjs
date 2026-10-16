import {build} from 'esbuild'
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
export async function loadModule(entry){
 const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'isolated',setup(b){
 b.onResolve({filter:/^server-only$/},()=>({path:'empty',namespace:'stub'}))
 b.onResolve({filter:/^@\/lib\/supabase\/admin$/},()=>({path:'admin',namespace:'stub'}))
 b.onResolve({filter:/^next\/server$/},()=>({path:'next',namespace:'stub'}))
 b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:a.path==='admin'?'export const createAdminClient=()=>{if(!globalThis.__p06HttpClient)throw Error("UNEXPECTED_ADMIN_CLIENT");return globalThis.__p06HttpClient}':a.path==='next'?'export class NextResponse extends Response {static json(data,init){return new Response(JSON.stringify(data),init)}}':'export {}'}))
 }}]})
 const dir=mkdtempSync(join(tmpdir(),'trackdash-p06-')),file=join(dir,'module.mjs')
 writeFileSync(file,result.outputFiles[0].text)
 try{return await import(pathToFileURL(file).href)}finally{rmSync(dir,{recursive:true,force:true})}
}
