param([ValidateSet('Inventory','GetPasswords','CompareTargetAuth','ClearUnverifiedSecrets','CreateSourceReadOnly','ProbeSource','CreateTargetMigration','CompareManagedSchemas','CompareManagedAccess','CompareDefaultACL')][string]$Mode='Inventory')
$ErrorActionPreference='Stop'
$root=Join-Path $env:LOCALAPPDATA 'TrackDashRecovery'
Add-Type -AssemblyName System.Security
function Protect-TrackDashFile([string]$Text,[string]$Name) {
 $plain=[Text.Encoding]::UTF8.GetBytes($Text)
 try { $protected=[Security.Cryptography.ProtectedData]::Protect($plain,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [IO.File]::WriteAllBytes((Join-Path $root $Name),$protected) }
 finally { [Array]::Clear($plain,0,$plain.Length) }
}
if($Mode -eq 'GetPasswords') {
 foreach($entry in @(@{Name='source';Label='VECCHIO progetto TrackDash';Ref='piwogtdkfozbiakyjnvk'},@{Name='target';Label='NUOVO TrackDash Production - Francoforte';Ref='uhojhqxnzrolmnopwgpy'})) {
  $credential=Get-Credential -UserName ('postgres.'+$entry.Ref) -Message ('Inserisci la password DATABASE ESISTENTE per '+$entry.Label+'. Non la password dell account Supabase. Sara salvata cifrata sul PC solo per questa migrazione. Nessun reset.')
  if($null -eq $credential){Write-Output 'CREDENTIAL_ENTRY_CANCELLED';exit 1}
  $credential | Export-Clixml -LiteralPath (Join-Path $root ($entry.Name+'-database.credential.xml'))
  $credential=$null
 }
 Write-Output 'LOCAL_DATABASE_CREDENTIALS_SAVED_ENCRYPTED'
 exit 0
}
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class TrackDashCred {
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
 public struct Credential { public uint Flags; public uint Type; public string TargetName; public string Comment; public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten; public uint BlobSize; public IntPtr Blob; public uint Persist; public uint AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName; }
 [DllImport("Advapi32.dll", EntryPoint="CredReadW", CharSet=CharSet.Unicode, SetLastError=true)]
 public static extern bool Read(string target,uint type,int flags,out IntPtr credential);
 [DllImport("Advapi32.dll")] public static extern void CredFree(IntPtr credential);
}
'@
$pointer=[IntPtr]::Zero
try {
 if(-not [TrackDashCred]::Read('Supabase CLI:supabase',1,0,[ref]$pointer)){throw 'CLI credential unavailable'}
 $credential=[Runtime.InteropServices.Marshal]::PtrToStructure($pointer,[type][TrackDashCred+Credential])
 $bytes=New-Object byte[] $credential.BlobSize
 [Runtime.InteropServices.Marshal]::Copy($credential.Blob,$bytes,0,$credential.BlobSize)
 $token=[Text.Encoding]::UTF8.GetString($bytes)
 if($token -notmatch '^sbp_'){$token=[Text.Encoding]::Unicode.GetString($bytes)}
 if($token -notmatch '^sbp_'){throw 'Unsupported credential encoding'}
 $headers=@{Authorization=('Bearer '+$token)}

 $query=@"
with objects as (
 select 'TABLE' kind,format('%I.%I',n.nspname,c.relname) identity,coalesce(c.relacl,acldefault('r',c.relowner)) acl,c.relowner owner
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private','drizzle','supabase_migrations') and c.relkind in ('r','p','v','m')
 union all select 'SEQUENCE',format('%I.%I',n.nspname,c.relname),coalesce(c.relacl,acldefault('S',c.relowner)),c.relowner
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private','drizzle','supabase_migrations') and c.relkind='S'
 union all select 'FUNCTION',format('%I.%I(%s)',n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)),coalesce(p.proacl,acldefault('f',p.proowner)),p.proowner
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f'
), lines as (
 select 0 phase,kind,identity,format('REVOKE ALL PRIVILEGES ON %s %s FROM PUBLIC, anon, authenticated, service_role, trackdash_app;',kind,identity) sql from objects
 union all select 1,kind,identity,format('GRANT %s ON %s %s TO %s%s;',e.privilege_type,kind,identity,case when e.grantee=0 then 'PUBLIC' else quote_ident(pg_get_userbyid(e.grantee)) end,case when e.is_grantable then ' WITH GRANT OPTION' else '' end) from objects cross join lateral aclexplode(acl) e where e.grantee<>owner
 -- Table REVOKE also removes column grants. Restore those only after all
 -- table-level revokes/grants, without widening them to whole-table access.
 union all select 2,'COLUMN',format('%I.%I.%I',n.nspname,c.relname,a.attname),
 format('GRANT %s (%I) ON TABLE %I.%I TO %s%s;',e.privilege_type,a.attname,n.nspname,c.relname,case when e.grantee=0 then 'PUBLIC' else quote_ident(pg_get_userbyid(e.grantee)) end,case when e.is_grantable then ' WITH GRANT OPTION' else '' end)
 from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace cross join lateral aclexplode(a.attacl) e
 where n.nspname in ('public','private','drizzle','supabase_migrations') and a.attnum>0 and not a.attisdropped and e.grantee<>c.relowner
)
select count(*) statements,'BEGIN; SET LOCAL lock_timeout=''2s'';'||E'\n'||string_agg(sql,E'\n' order by phase,kind,identity,sql)||E'\nCOMMIT;' sql from lines
"@
 $r=Invoke-RestMethod -Uri 'https://api.supabase.com/v1/projects/piwogtdkfozbiakyjnvk/database/query' -Headers $headers -Method Post -ContentType 'application/json' -Body (@{query='BEGIN READ ONLY; '+$query+'; COMMIT;'}|ConvertTo-Json -Compress)
 $result=@($r)[0]
 if($result.statements -lt 100 -or $result.sql -notmatch '^BEGIN;'){throw 'Unexpected permission plan'}
 [IO.File]::WriteAllText((Join-Path $root 'align-source-permissions.sql'),$result.sql,[Text.UTF8Encoding]::new($false))
 [pscustomobject]@{PermissionPlanPrepared=$true;Statements=$result.statements;SourceModified=$false;TargetModified=$false}|ConvertTo-Json -Compress
}catch{Write-Output 'PERMISSION_PLAN_FAILED';exit 1}
finally{if($pointer -ne [IntPtr]::Zero){[TrackDashCred]::CredFree($pointer)};$token=$null;$headers=$null;if($bytes){[Array]::Clear($bytes,0,$bytes.Length)}}
