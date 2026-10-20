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

 $query="select jsonb_build_object('relations',(select coalesce(jsonb_object_agg(n.nspname||'.'||c.relname,md5(jsonb_build_object('kind',c.relkind,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'owner',pg_get_userbyid(c.relowner),'acl',(select array_agg(a::text order by a::text) from unnest(coalesce(c.relacl,acldefault((case when c.relkind='S' then 'S' else 'r' end)::pg_catalog.`"char`",c.relowner))) a where split_part(a::text,'=',1) <> quote_ident(pg_get_userbyid(c.relowner))),'columns',(select jsonb_agg(jsonb_build_array(a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,a.attidentity,a.attgenerated,(select array_agg(column_acl::text order by column_acl::text) from unnest(a.attacl) column_acl)) order by a.attnum) from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped))::text)),'{}') from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private','drizzle','supabase_migrations') and c.relkind in ('r','p','S','v','m')),'policies',(select coalesce(jsonb_object_agg(schemaname||'.'||tablename||'.'||policyname,md5(to_jsonb(p)::text)),'{}') from pg_policies p where schemaname in ('public','private','storage')),'functions',(select coalesce(jsonb_object_agg(n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',md5(pg_get_functiondef(p.oid)||coalesce((select array_agg(x::text order by x::text)::text from unnest(coalesce(p.proacl,acldefault('f',p.proowner))) x where split_part(x::text,'=',1) <> quote_ident(pg_get_userbyid(p.proowner))),'')||pg_get_userbyid(p.proowner))),'{}') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind in ('f','p')),'triggers',(select coalesce(jsonb_object_agg(n.nspname||'.'||c.relname||'.'||t.tgname,md5(pg_get_triggerdef(t.oid)||t.tgenabled::text)),'{}') from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in ('public','private','auth','storage')),'constraints',(select coalesce(jsonb_object_agg(n.nspname||'.'||r.relname||'.'||c.conname,md5(pg_get_constraintdef(c.oid)||c.convalidated::text)),'{}') from pg_constraint c join pg_class r on r.oid=c.conrelid join pg_namespace n on n.oid=r.relnamespace where n.nspname in ('public','private')),'sequences',(select coalesce(jsonb_object_agg(schemaname||'.'||sequencename,md5((to_jsonb(s)-'sequenceowner')::text)),'{}') from pg_sequences s where schemaname in ('public','private','auth','storage')),'publication',(select coalesce(jsonb_agg(jsonb_build_array(pubname,schemaname,tablename) order by pubname,schemaname,tablename),'[]') from pg_publication_tables where schemaname='public')) as metadata"
 $all=@{}
 foreach($ref in @('piwogtdkfozbiakyjnvk','uhojhqxnzrolmnopwgpy')){
  $response=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/database/query') -Headers $headers -Method Post -ContentType 'application/json' -Body (@{query='BEGIN READ ONLY; '+$query+'; COMMIT;'}|ConvertTo-Json -Compress)
  $all[$ref]=@($response)[0].metadata
  if(-not $all[$ref]){throw 'Metadata response missing'}
 }
 $a=$all['piwogtdkfozbiakyjnvk'];$b=$all['uhojhqxnzrolmnopwgpy'];$differences=@();$checked=0
 foreach($kind in @('relations','policies','functions','triggers','constraints','sequences')){foreach($p in $a.$kind.PSObject.Properties){$checked++;if($p.Value -cne $b.$kind.($p.Name)){$differences+=($kind+':'+$p.Name)}}}
 $pub=(($a.publication|ConvertTo-Json -Depth 10 -Compress) -ceq ($b.publication|ConvertTo-Json -Depth 10 -Compress))
 [pscustomobject]@{MetadataObjectsCompared=$checked;DifferenceCount=$differences.Count;Differences=$differences;RealtimePublicationEqual=$pub;SourceModified=$false}|ConvertTo-Json -Depth 10 -Compress
}catch{[pscustomobject]@{MetadataParity='FAIL';HTTPStatus=$(if($_.Exception.Response){[int]$_.Exception.Response.StatusCode}else{0});Details='Suppressed'}|ConvertTo-Json -Compress;exit 1}
finally{if($pointer -ne [IntPtr]::Zero){[TrackDashCred]::CredFree($pointer)};$token=$null;$headers=$null;if($bytes){[Array]::Clear($bytes,0,$bytes.Length)}}
