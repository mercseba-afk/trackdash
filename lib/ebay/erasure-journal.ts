import "server-only"
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb"

export interface TokenReceipt {
  version: 1
  key: string
  digest: string
  keyId: string
  tokens: { keyId: string; token: string }[]
  sourceIds: string[]
}
const hex = /^[0-9a-f]{64}$/
export class JournalError extends Error {
  constructor(readonly code: "UNAVAILABLE" | "INVALID" | "CONFLICT") { super("EBAY_JOURNAL_" + code) }
}
export function validateReceipt(input: unknown): TokenReceipt {
  const r = input as TokenReceipt
  if (!r || Object.keys(r).sort().join() !== "digest,key,keyId,sourceIds,tokens,version" || r.version !== 1 ||
      !hex.test(r.key) || !hex.test(r.digest) || !/^[a-zA-Z0-9_-]{1,40}$/.test(r.keyId) ||
      !Array.isArray(r.tokens) || r.tokens.length < 1 || r.tokens.length > 48 ||
      r.tokens.some(t => !t || Object.keys(t).sort().join() !== "keyId,token" || !/^[a-zA-Z0-9_-]{1,40}$/.test(t.keyId) || !hex.test(t.token)) ||
      !Array.isArray(r.sourceIds) || r.sourceIds.length > 1000 || r.sourceIds.some(s => !/^[0-9a-f-]{36}$/.test(s))) throw new JournalError("INVALID")
  return r
}
export interface JournalMeta { accepted:number; completed:number }
export interface ErasureJournal {
  put(receipt:TokenReceipt,digests:Record<string,string>,deadline:number):Promise<void>
  get(key:string,deadline:number):Promise<TokenReceipt>
  pending(deadline:number):Promise<TokenReceipt[]>
  scan(cursor:string|null,deadline:number):Promise<{receipts:TokenReceipt[];cursor:string|null}>
  meta(deadline:number):Promise<JournalMeta>
  complete(receipt:TokenReceipt,deadline:number):Promise<void>
}
export class DynamoErasureJournal implements ErasureJournal {
  constructor(private client:DynamoDBDocumentClient,private table:string) {}
  private async send(command:any,deadline:number):Promise<any> {
    try {
      if(Date.now()>=deadline)throw Error()
      return await this.client.send(command,{abortSignal:AbortSignal.timeout(Math.max(1,Math.min(8000,deadline-Date.now())))})
    }catch{throw new JournalError("UNAVAILABLE")}
  }
  async get(key:string,deadline:number) {
    if(!hex.test(key))throw new JournalError("INVALID")
    const row=await this.send(new GetCommand({TableName:this.table,Key:{pk:'r#'+key},ConsistentRead:true}),deadline)
    const r=validateReceipt(row.Item?.receipt)
    if(r.key!==key)throw new JournalError("INVALID")
    return r
  }
  async meta(deadline:number):Promise<JournalMeta> {
    const {Item}=await this.send(new GetCommand({TableName:this.table,Key:{pk:'_meta'},ConsistentRead:true}),deadline)
    const result={accepted:Item?.accepted??0,completed:Item?.completed??0}
    if(!Number.isSafeInteger(result.accepted)||!Number.isSafeInteger(result.completed)||result.completed<0||result.accepted<result.completed)throw new JournalError("INVALID")
    return result
  }
  async put(receipt:TokenReceipt,digests:Record<string,string>,deadline:number) {
    validateReceipt(receipt)
    try {
      await this.send(new TransactWriteCommand({TransactItems:[
        {Put:{TableName:this.table,Item:{pk:'r#'+receipt.key,state:'pending',createdAt:new Date().toISOString(),receipt},ConditionExpression:'attribute_not_exists(pk)'}},
        {Update:{TableName:this.table,Key:{pk:'_meta'},UpdateExpression:'ADD accepted :one',ExpressionAttributeValues:{':one':1}}},
      ]}),deadline)
    }catch(error){
      // A transaction commits BOTH the receipt and counter, or neither. A lost
      // response/duplicate is accepted only after a strong read proves storage.
      const prior=await this.get(receipt.key,deadline)
      if(digests[prior.keyId]!==prior.digest)throw new JournalError("CONFLICT")
    }
  }
  async pending(deadline:number) {
    const out=await this.send(new QueryCommand({TableName:this.table,IndexName:'pending',KeyConditionExpression:'#s=:pending',ExpressionAttributeNames:{'#s':'state'},ExpressionAttributeValues:{':pending':'pending'},Limit:8,ScanIndexForward:true}),deadline)
    // GSI is eventually consistent; primary strong reads and the atomic
    // accepted/completed counters prevent an empty index from meaning healthy.
    return Promise.all((out.Items??[]).map((r:any)=>this.get(String(r.pk).slice(2),deadline)))
  }
  async scan(cursor:string|null,deadline:number) {
    let start
    try{start=cursor?JSON.parse(cursor):undefined}catch{throw new JournalError("INVALID")}
    const out=await this.send(new ScanCommand({TableName:this.table,ConsistentRead:true,Limit:8,ExclusiveStartKey:start}),deadline)
    const receipts=(out.Items??[]).filter((r:any)=>r.pk!=='_meta').map((r:any)=>validateReceipt(r.receipt))
    return {receipts,cursor:out.LastEvaluatedKey?JSON.stringify(out.LastEvaluatedKey):null}
  }
  async complete(receipt:TokenReceipt,deadline:number) {
    const {Item}=await this.send(new GetCommand({TableName:this.table,Key:{pk:'r#'+receipt.key},ConsistentRead:true}),deadline)
    if(Item?.receipt?.digest!==receipt.digest)throw new JournalError("CONFLICT")
    if(Item.state==='completed')return
    try{
      await this.send(new TransactWriteCommand({TransactItems:[
        {Update:{TableName:this.table,Key:{pk:'r#'+receipt.key},UpdateExpression:'SET #s=:done',ConditionExpression:'#s=:pending',ExpressionAttributeNames:{'#s':'state'},ExpressionAttributeValues:{':done':'completed',':pending':'pending'}}},
        {Update:{TableName:this.table,Key:{pk:'_meta'},UpdateExpression:'ADD completed :one',ExpressionAttributeValues:{':one':1}}},
      ]}),deadline)
    }catch(error){
      const next=await this.send(new GetCommand({TableName:this.table,Key:{pk:'r#'+receipt.key},ConsistentRead:true}),deadline)
      if(next.Item?.state!=='completed'||next.Item?.receipt?.digest!==receipt.digest)throw error
    }
  }
}
let sharedClient:DynamoDBDocumentClient|undefined
export function createErasureJournal():ErasureJournal {
  const table=process.env.EBAY_ERASURE_JOURNAL_TABLE,region=process.env.EBAY_ERASURE_JOURNAL_REGION
  if(!table||!/^trackdash-erasure-[a-z0-9-]{1,100}$/.test(table)||!region||!/^[a-z]{2}-[a-z]+-\d$/.test(region))throw new JournalError("UNAVAILABLE")
  if(process.env.VERCEL==='1'&&!/^arn:aws:iam::[0-9]{12}:role\//.test(process.env.EBAY_ERASURE_JOURNAL_ROLE_ARN??''))throw new JournalError("UNAVAILABLE")
  sharedClient??=DynamoDBDocumentClient.from(new DynamoDBClient({region,maxAttempts:1,...(process.env.VERCEL==='1'?{credentials:awsCredentialsProvider({roleArn:process.env.EBAY_ERASURE_JOURNAL_ROLE_ARN!})}:{})}),{marshallOptions:{removeUndefinedValues:true}})
  return new DynamoErasureJournal(sharedClient,table)
}
