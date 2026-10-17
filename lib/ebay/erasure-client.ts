import "server-only"
import { createClient } from "@supabase/supabase-js"
// Separate signed role tokens; neither caller receives a service_role key.
export function createErasureClient(role:"INGRESS"|"WORKER",fetchImpl:typeof fetch) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,apiKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,jwt=process.env[`EBAY_ERASURE_${role}_JWT`]
  if(!url||!apiKey||!jwt)throw Error("SCOPED_ERASURE_CLIENT_NOT_CONFIGURED")
  return createClient(url,apiKey,{global:{fetch:fetchImpl,headers:{Authorization:"Bearer "+jwt}},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
}
