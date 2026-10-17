-- Review only. Run as the ACTUAL grantor/authorized owner after consumer audit.
-- Does not grant general privileges, change RLS, provision or read any key.
begin;
revoke select,delete on vault.secrets,vault.decrypted_secrets from service_role;
revoke execute on function vault.create_secret(text,text,text,uuid),
 vault.update_secret(uuid,text,text,text,uuid),
 vault._crypto_aead_det_decrypt(bytea,bytea,bigint,bytea,bytea) from service_role;
commit;
-- Verify EFFECTIVE privileges. A non-owner REVOKE by a role with grant option
-- can leave the owner's grant intact; isolated reproduction confirms this.
-- No backup-export role/function is required by the selected runtime design.
