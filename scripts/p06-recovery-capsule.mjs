// Recovery format prototype. Not imported by runtime; no storage provider,
// scheduler, secret lookup or production database access is implemented here.
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto'
export const recoveryTables=['notifications','recomputes','notification_work','fence','alerts','heartbeat','suppression_config','suppression_keys','suppressed_identities','suppressed_candidates','ebay_sources']
const fail=()=>{throw Error('RECOVERY_CAPSULE_REJECTED')}
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
const aad=h=>Buffer.from(JSON.stringify(['trackdash-recovery-v1',h.project,h.schema,h.generation,h.parent,h.keyId]))
const validHeader=h=>h&&/^[a-z0-9_-]{1,64}$/.test(h.project)&&/^[0-9a-f]{64}$/.test(h.schema)&&Number.isSafeInteger(h.generation)&&h.generation>0&&(h.parent===null||/^[0-9a-f]{64}$/.test(h.parent))&&/^[a-zA-Z0-9_-]{1,40}$/.test(h.keyId)
export function validateCheckpoint(state){
 if(!state||Object.keys(state).sort().join('|')!==[...recoveryTables].sort().join('|')||recoveryTables.some(t=>!Array.isArray(state[t])))fail()
 if(state.suppression_config.length!==1||state.fence.length!==1||state.heartbeat.length!==1||!state.suppression_keys.length)fail()
 for(const n of state.notifications)if(!['received','erased','completed'].includes(n.state)||!(/^[0-9a-f]{64}$/.test(n.notification_key))||(n.state==='received'&&!n.sealed))fail()
 return state
}
export function sealCheckpoint(state,key,inputHeader){
 try{
  const {project,schema,generation,parent,keyId}=inputHeader,header={project,schema,generation,parent,keyId}
  validateCheckpoint(state);if(!validHeader(header)||!Buffer.isBuffer(key)||key.length!==32)fail()
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad(header))
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(state),'utf8'),cipher.final()])
  const envelope={version:1,header,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')}
  // Witness must be persisted independently of the database AND archive being
  // restored. Taking it from the envelope itself defeats rollback detection.
  return {envelope,witness:{...header,digest:digest(envelope)}}
 }catch{fail()}
}
export function openCheckpoint(envelope,keyring,witness){
 try{
  if(!witness||!validHeader(witness)||envelope?.version!==1||!validHeader(envelope.header)||digest(envelope)!==witness.digest||aad(envelope.header).toString()!==aad(witness).toString())fail()
  const key=keyring[envelope.header.keyId];if(!Buffer.isBuffer(key)||key.length!==32)fail()
  const iv=Buffer.from(envelope.iv,'base64'),tag=Buffer.from(envelope.tag,'base64');if(iv.length!==12||tag.length!==16)fail()
  const cipher=createDecipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad(envelope.header));cipher.setAuthTag(tag)
  return validateCheckpoint(JSON.parse(Buffer.concat([cipher.update(Buffer.from(envelope.ciphertext,'base64')),cipher.final()]).toString('utf8')))
 }catch{fail()}
}
