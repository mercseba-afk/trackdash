// Synthetic Vault facade only. Never imported by application/runtime code.
import {randomBytes,createHmac} from 'node:crypto'
export function suppressionVault(d){
 d.sql(`create schema if not exists extensions;create extension if not exists pgcrypto with schema extensions;
 create schema vault;create table vault.decrypted_secrets(id uuid primary key,decrypted_secret text not null);
 revoke all on schema vault from public,anon,authenticated,service_role;
 revoke all on vault.decrypted_secrets from public,anon,authenticated,service_role;`)
}
export function suppressionFixture(d){
 // Local random fixture secret, never printed or used as a production key.
 const secret=randomBytes(32).toString('hex'),check=createHmac('sha256',Buffer.from(secret,'hex')).update('trackdash/ebay/suppression-key-check-v1').digest('hex')
 d.sql(`insert into vault.decrypted_secrets values('00000000-0000-4000-8000-000000000099','${secret}');
 insert into trackdash_erasure.suppression_keys(key_id,vault_secret_id,key_check) values('synthetic','00000000-0000-4000-8000-000000000099',decode('${check}','hex'));
 update trackdash_erasure.suppression_config set enabled=true;`)
}
