param([ValidateSet('Inventory','CompareTargetAuth','ClearUnverifiedSecrets','CreateSourceReadOnly','ProbeSource','CreateTargetMigration','CompareManagedSchemas','CompareManagedAccess','CompareDefaultACL')][string]$Mode='Inventory')
$ErrorActionPreference='Stop'
$root=Join-Path $env:LOCALAPPDATA 'TrackDashRecovery'
Add-Type -AssemblyName System.Security
function Protect-TrackDashFile([string]$Text,[string]$Name) {
 $plain=[Text.Encoding]::UTF8.GetBytes($Text)
 try { $protected=[Security.Cryptography.ProtectedData]::Protect($plain,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [IO.File]::WriteAllBytes((Join-Path $root $Name),$protected) }
 finally { [Array]::Clear($plain,0,$plain.Length) }
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




 if($Mode -eq 'CreateTargetMigration'){
  $ref='uhojhqxnzrolmnopwgpy'
  $login=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/cli/login-role') -Headers $headers -Method Post -ContentType 'application/json' -Body '{"read_only":false}'
  if(-not $login.role -or -not $login.password){throw 'Temporary target credential response incomplete'}
  Protect-TrackDashFile ($login|ConvertTo-Json -Compress) 'target-migration-login.dpapi'
  [pscustomobject]@{Target=$ref;MigrationCredentialCreated=$true;TTLSeconds=$login.ttl_seconds}|ConvertTo-Json -Compress
  exit 0
 }


 if($Mode -eq 'CompareDefaultACL'){
  $query="select coalesce(jsonb_object_agg(owner||'.'||schema||'.'||kind,acl),'{}'::jsonb) as metadata from (select pg_get_userbyid(d.defaclrole) owner,coalesce(n.nspname,'GLOBAL') schema,d.defaclobjtype::text kind,(select jsonb_agg(v::text order by v::text) from unnest(d.defaclacl) v) acl from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace) entries"
  $all=@{}
  foreach($ref in @('piwogtdkfozbiakyjnvk','uhojhqxnzrolmnopwgpy')){
   $response=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/database/query') -Headers $headers -Method Post -ContentType 'application/json' -Body (@{query=$query}|ConvertTo-Json -Compress)
   $all[$ref]=@($response)[0].metadata
  }
  $source=$all['piwogtdkfozbiakyjnvk'];$target=$all['uhojhqxnzrolmnopwgpy']
  $rows=@($source.PSObject.Properties|ForEach-Object{[pscustomobject]@{OwnerScope=$_.Name;Equal=(($_.Value|ConvertTo-Json -Depth 20 -Compress) -ceq ($target.($_.Name)|ConvertTo-Json -Depth 20 -Compress))}})
  $rows|ConvertTo-Json -Depth 5 -Compress
  exit 0
 }
 if($Mode -eq 'CompareManagedAccess'){
  $query="select jsonb_build_object('relations',(select coalesce(jsonb_object_agg(n.nspname||'.'||c.relname,coalesce(c.relacl::text,'')),'{}'::jsonb) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('auth','storage','realtime') and c.relkind in ('r','p','v','m','S')),'schemas',(select jsonb_object_agg(nspname,coalesce(nspacl::text,'')) from pg_namespace where nspname in ('auth','storage','realtime')),'functions',(select coalesce(jsonb_object_agg(n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',coalesce(p.proacl::text,'')),'{}'::jsonb) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('auth','storage','realtime'))) as metadata"
  $all=@{}
  foreach($ref in @('piwogtdkfozbiakyjnvk','uhojhqxnzrolmnopwgpy')){
   $response=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/database/query') -Headers $headers -Method Post -ContentType 'application/json' -Body (@{query=$query}|ConvertTo-Json -Compress)
   $all[$ref]=@($response)[0].metadata
  }
  $source=$all['piwogtdkfozbiakyjnvk'];$target=$all['uhojhqxnzrolmnopwgpy'];$differences=@()
  foreach($kind in @('relations','schemas','functions')){foreach($property in $source.$kind.PSObject.Properties){if($property.Value -cne $target.$kind.($property.Name)){$differences+=($kind+':'+$property.Name)}}}
  [pscustomobject]@{ManagedAccessDifferences=$differences;DifferenceCount=$differences.Count}|ConvertTo-Json -Depth 5 -Compress
  exit 0
 }
 if($Mode -eq 'CompareManagedSchemas'){
  $query="select jsonb_build_object('managed_columns',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'column',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notnull',a.attnotnull,'generated',a.attgenerated) order by n.nspname,c.relname,a.attnum) from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('auth','storage') and c.relkind='r' and a.attnum>0 and not a.attisdropped),'app_owners',(select jsonb_agg(distinct pg_get_userbyid(c.relowner)) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private','drizzle','supabase_migrations') and c.relkind in ('r','p','S','v','m')),'function_owners',(select jsonb_agg(distinct pg_get_userbyid(p.proowner)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private')),'event_triggers',(select jsonb_agg(jsonb_build_object('name',e.evtname,'function',e.evtfoid::regproc::text,'enabled',e.evtenabled)) from pg_event_trigger e),'auth_version',(select max(version) from auth.schema_migrations)) as metadata"
  $all=@{}
  foreach($ref in @('piwogtdkfozbiakyjnvk','uhojhqxnzrolmnopwgpy')){
   $response=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/database/query') -Headers $headers -Method Post -ContentType 'application/json' -Body (@{query=$query}|ConvertTo-Json -Compress)
   $metadata=@($response)[0].metadata
   if(-not $metadata){throw 'Metadata response missing'}
   $all[$ref]=$metadata
   Protect-TrackDashFile ($metadata|ConvertTo-Json -Depth 100 -Compress) ($ref+'-schema-metadata.dpapi')
  }
  $source=$all['piwogtdkfozbiakyjnvk'];$target=$all['uhojhqxnzrolmnopwgpy']
  $same=(($source.managed_columns|ConvertTo-Json -Depth 100 -Compress) -ceq ($target.managed_columns|ConvertTo-Json -Depth 100 -Compress))
  [pscustomobject]@{ManagedColumnsIdentical=$same;SourceAuthVersion=$source.auth_version;TargetAuthVersion=$target.auth_version;SourceAppOwners=$source.app_owners;SourceFunctionOwners=$source.function_owners;SourceEventTriggers=$source.event_triggers;TargetEventTriggers=$target.event_triggers}|ConvertTo-Json -Depth 10 -Compress
  exit 0
 }
 if($Mode -in @('CreateSourceReadOnly','ProbeSource')) {
  $ref='piwogtdkfozbiakyjnvk'
  if($Mode -eq 'CreateSourceReadOnly') { $login=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/cli/login-role') -Headers $headers -Method Post -ContentType 'application/json' -Body '{"read_only":true}' } else { $login=[Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes((Join-Path $root 'source-readonly-login.dpapi')),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))|ConvertFrom-Json }
  if(-not $login.role -or -not $login.password){throw 'Temporary credential response incomplete'}
  Protect-TrackDashFile ($login|ConvertTo-Json -Compress) 'source-readonly-login.dpapi'
  $pooler=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/config/database/pooler') -Headers $headers
  $pooler=@($pooler)[0]
  $connectionText=$pooler.connection_string
  if(-not $connectionText){$connectionText=$pooler.connectionString}
  $hostMatch=[regex]::Match($connectionText,'@([^:/]+):([0-9]+)/')
  if(-not $hostMatch.Success){throw 'Cannot determine session pooler host'}
  $pgHost=$hostMatch.Groups[1].Value
  if($pgHost -notmatch '\.pooler\.supabase\.com$'){throw 'Unexpected pooler host'}
  $env:PGPASSWORD=$login.password;$env:PGSSLMODE='verify-full'
  $env:PGSSLROOTCERT=Join-Path $root 'tools\prod-ca-2021.crt'
  $env:PGCONNECT_TIMEOUT='15'
  $env:PGOPTIONS='-c default_transaction_read_only=on -c application_name=trackdash_recovery_readonly'
  $psql=Join-Path $root 'tools\pgsql\bin\psql.exe'
  $query="BEGIN READ ONLY; SET LOCAL ROLE supabase_read_only_user; select json_build_object('read_only',current_setting('transaction_read_only'),'users',(select count(*) from auth.users),'password_hashes',(select count(*) from auth.users where encrypted_password is not null and encrypted_password<>''),'identities',(select count(*) from auth.identities),'mfa_factors',(select count(*) from auth.mfa_factors),'storage_objects',(select count(*) from storage.objects),'releases',(select count(*) from public.product_releases)); COMMIT;"
  $processInfo=New-Object Diagnostics.ProcessStartInfo
  $processInfo.FileName=$psql
  $processInfo.Arguments='-X -w -q -A -t -h '+$pgHost+' -p 5432 -U '+$login.role+'.'+$ref+' -d postgres -v ON_ERROR_STOP=1 -c "'+$query+'"'
  $processInfo.UseShellExecute=$false;$processInfo.CreateNoWindow=$true
  $processInfo.RedirectStandardOutput=$true;$processInfo.RedirectStandardError=$true
  $process=New-Object Diagnostics.Process
  $process.StartInfo=$processInfo
  $null=$process.Start()
  $queryResult=$process.StandardOutput.ReadToEnd();$privateError=$process.StandardError.ReadToEnd()
  $process.WaitForExit()
  if($process.ExitCode -ne 0){
   $category='OTHER_CONNECTION_OR_PRIVILEGE_FAILURE'
   foreach($pattern in @('certificate verify failed','root certificate file','password authentication failed','Tenant or user not found','permission denied','timeout','could not translate host','Connection refused','SSL error','invalid value')){if($privateError -match [regex]::Escape($pattern)){$category=$pattern;break}}
   [pscustomobject]@{TemporaryRoleCreated=$true;ReadOnlyRequested=$true;TTLSeconds=$login.ttl_seconds;DatabaseProbe='FAILED';Category=$category}|ConvertTo-Json -Compress;exit 1
  }
  [pscustomobject]@{TemporaryRoleCreated=$true;ReadOnlyRequested=$true;TTLSeconds=$login.ttl_seconds;DatabaseProbe='PASS';Inventory=($queryResult|ConvertFrom-Json)}|ConvertTo-Json -Depth 5 -Compress
  exit 0
 }
 if($Mode -eq 'ClearUnverifiedSecrets') {
  $targetRef='uhojhqxnzrolmnopwgpy'
  $clearPayload=@{smtp_pass='';external_google_secret='';external_google_enabled=$false;smtp_host=''}
  $null=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$targetRef+'/config/auth') -Headers $headers -Method Patch -ContentType 'application/json' -Body ($clearPayload|ConvertTo-Json -Compress)
  $checked=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$targetRef+'/config/auth') -Headers $headers
  [pscustomobject]@{Target=$targetRef;SMTPConfigured=[bool]$checked.smtp_host;GoogleEnabled=[bool]$checked.external_google_enabled;UnverifiedSecretsCleared=$true}|ConvertTo-Json -Compress
  exit 0
 }


 if($Mode -eq 'CompareTargetAuth') {
  $sourceRef='piwogtdkfozbiakyjnvk';$targetRef='uhojhqxnzrolmnopwgpy'
  $sourceAuth=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$sourceRef+'/config/auth') -Headers $headers
  $targetAuth=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$targetRef+'/config/auth') -Headers $headers
  $keys=@($sourceAuth.PSObject.Properties.Name|Where-Object{$_ -match '^(smtp_|mailer_templates_|mailer_subjects_|mailer_notifications_|mailer_urlpaths_|external_google_)' -and $_ -notin @('smtp_pass','external_google_secret','external_google_enabled','smtp_host')})
  $mismatches=@($keys|Where-Object{($sourceAuth.$_|ConvertTo-Json -Compress -Depth 100) -cne ($targetAuth.$_|ConvertTo-Json -Compress -Depth 100)})
  [pscustomobject]@{Target=$targetRef;ComparedNonSecretFields=$keys.Count;MismatchedFields=$mismatches;SMTPConfigured=[bool]$targetAuth.smtp_host;GoogleEnabled=[bool]$targetAuth.external_google_enabled}|ConvertTo-Json -Depth 5 -Compress
  exit 0
 }

 foreach($ref in @('piwogtdkfozbiakyjnvk','uhojhqxnzrolmnopwgpy')) {
  $auth=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/config/auth') -Headers $headers
  Protect-TrackDashFile ($auth|ConvertTo-Json -Depth 100 -Compress) ($ref+'-auth-config.dpapi')
  $pooler=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/config/database/pooler') -Headers $headers
  Protect-TrackDashFile ($pooler|ConvertTo-Json -Depth 100 -Compress) ($ref+'-pooler-config.dpapi')
  $jit=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/jit-access') -Headers $headers
  [pscustomobject]@{
   Project=$ref; SMTPConfigured=[bool]$auth.smtp_host; GoogleEnabled=[bool]$auth.external_google_enabled;
   GoogleClientConfigured=[bool]$auth.external_google_client_id;
   AuthConfigFields=@($auth.PSObject.Properties.Name).Count; EncryptionConfigFields=@($auth.PSObject.Properties.Name|Where-Object{$_ -match 'encryption'});
   TemporaryAccess=$jit.state; PoolerEndpoints=@($pooler).Count
  }|ConvertTo-Json -Depth 5 -Compress
 }
} catch { [pscustomobject]@{Error='CONFIGURATION_OPERATION_FAILED';HTTPStatus=$(if($_.Exception.Response){[int]$_.Exception.Response.StatusCode}else{0});ErrorType=$_.Exception.GetType().Name}|ConvertTo-Json -Compress;exit 1 }
finally {
 if($pointer -ne [IntPtr]::Zero){[TrackDashCred]::CredFree($pointer)}
 $token=$null;$headers=$null;$env:PGPASSWORD=$null;$login=$null
 if($bytes){[Array]::Clear($bytes,0,$bytes.Length)}
}
