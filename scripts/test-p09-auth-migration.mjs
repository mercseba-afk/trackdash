// Actual callback handler, mocked Auth transport only. No email is sent.
// These contract tests do NOT certify provider settings or real delivery.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import vm from 'node:vm'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const source=readFileSync('app/auth/callback/route.ts','utf8')
function handler({user=null,error=null}={}){
 const calls=[],exports={}
 const supabase={auth:{exchangeCodeForSession:async code=>{calls.push(['exchange',code]);return {error}},getUser:async()=>({data:{user}})},from:name=>({update:value=>({eq:async(key,id)=>{calls.push(['update',name,value,key,id]);return {error:null}}})})}
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,URLSearchParams,Date,process:{env:{NODE_ENV:'production'}},require:name=>{
  if(name==='next/server')return {NextResponse:{redirect:url=>({location:String(url)})}}
  if(name==='@/lib/supabase/server')return {createClient:async()=>supabase}
  throw Error('UNEXPECTED_IMPORT:'+name)
 }})
 return {run:query=>exports.GET({url:'https://isolated.trackdash.invalid/auth/callback?'+query,headers:new Headers()}),calls}
}
test('existing Google identity follows PKCE to requested Release without changing UUID/profile',async()=>{
 const h=handler({user:{id:'synthetic-uuid',created_at:'2026-01-01T00:00:00Z',last_sign_in_at:'2026-10-18T00:00:00Z',user_metadata:{onboarding_completed:true}}})
 assert.equal((await h.run('code=synthetic&flow=google&next=%2Fcatalog%2Fsynthetic&locale=en')).location,'https://isolated.trackdash.invalid/catalog/synthetic')
 assert.equal(h.calls.length,1);assert.equal(h.calls[0][0],'exchange')
})
test('fresh Google account onboarding preserves IT/EN and updates its own profile only',async()=>{
 for(const locale of ['it','en']){
  const h=handler({user:{id:'synthetic-new',created_at:'2026-10-18T00:00:00Z',last_sign_in_at:'2026-10-18T00:00:10Z',user_metadata:{onboarding_completed:false}}})
  const response=await h.run('code=synthetic&flow=google&next=%2Fcollection&locale='+locale)
  assert.equal(new URL(response.location).pathname,'/onboarding');assert.equal(new URL(response.location).searchParams.get('locale'),locale)
  assert.equal(h.calls[1][1],'profiles');assert.equal(h.calls[1][2].preferred_locale,locale);assert.equal(h.calls[1][4],'synthetic-new')
 }
})
test('recovery exchanges code and enters update-password, never an external redirect',async()=>{
 const h=handler()
 assert.equal((await h.run('code=synthetic&next=%2Fupdate-password')).location,'https://isolated.trackdash.invalid/update-password')
 assert.equal((await h.run('code=synthetic&next=https%3A%2F%2Fevil.invalid')).location,'https://isolated.trackdash.invalid/update-password')
 assert.equal(h.calls.length,2)
})
test('failed/missing Google exchange returns explicit login error and preserves safe next',async()=>{
 for(const code of ['code=expired&','']){
  const h=handler({error:{message:'synthetic invalid'}})
  const response=await h.run(code+'flow=google&next=%2Fcollection')
  assert.equal(new URL(response.location).pathname,'/login');assert.equal(new URL(response.location).searchParams.get('oauth_error'),'google');assert.equal(new URL(response.location).searchParams.get('next'),'/collection')
 }
})
test('expired/missing recovery code stays on explicit update-password handling',async()=>{
 const h=handler({error:{message:'synthetic expired'}})
 assert.equal((await h.run('code=expired&next=%2Fupdate-password')).location,'https://isolated.trackdash.invalid/update-password')
 assert.equal((await h.run('')).location,'https://isolated.trackdash.invalid/update-password')
})
