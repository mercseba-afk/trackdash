import assert from 'node:assert/strict'
import {randomBytes} from 'node:crypto'
import {sealInbox,openInbox,inboxIdentity,validateInboxKeys} from '../lib/ebay/erasure-inbox.ts'
const old=randomBytes(32).toString('hex'),next=randomBytes(32).toString('hex')
process.env.EBAY_ERASURE_KEYS=JSON.stringify({old});process.env.EBAY_ERASURE_CURRENT_KEY='old'
const message={notificationId:'synthetic-notification',identifiers:{username:'synthetic-private-user',userId:'synthetic-private-id',eiasToken:'synthetic-private-token'}}
let box=sealInbox(message)
assert.deepEqual(openInbox(box.key,box.sealed),Object.values(message.identifiers))
assert.ok(!JSON.stringify(box).includes('synthetic-private'))
assert.notDeepEqual(sealInbox(message).sealed,box.sealed)
assert.throws(()=>openInbox('0'.repeat(64),box.sealed),/EBAY_INBOX_DECRYPT_FAILED/)
assert.throws(()=>openInbox(box.key,{...box.sealed,tag:Buffer.alloc(16).toString('base64')}),/EBAY_INBOX_DECRYPT_FAILED/)
process.env.EBAY_ERASURE_KEYS=JSON.stringify({old,next});process.env.EBAY_ERASURE_CURRENT_KEY='next'
assert.deepEqual(openInbox(box.key,box.sealed),Object.values(message.identifiers))
const rotated=inboxIdentity(message);assert.equal(rotated.digests.old,box.digest);assert.notEqual(rotated.digest,box.digest)
process.env.EBAY_ERASURE_KEYS=JSON.stringify({next});assert.throws(()=>openInbox(box.key,box.sealed),/EBAY_INBOX_DECRYPT_FAILED/)
process.env.EBAY_ERASURE_KEYS='invalid synthetic-secret';assert.throws(validateInboxKeys,e=>e.message==='EBAY_INBOX_KEY_UNAVAILABLE')
console.log('PASS inbox encryption, random IV, authenticated job binding, tamper rejection, key rotation and safe key failures')
