$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$root=Join-Path $env:LOCALAPPDATA 'TrackDashRecovery'
$backup=[IO.File]::ReadAllText((Join-Path $root 'latest-backup-location.txt')).Trim()
$work=Join-Path $backup 'restore-preparation'
$null=New-Item -ItemType Directory -Path $work -Force
function Read-Protected([string]$path){return [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($path),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)}
function Write-Protected([byte[]]$bytes,[string]$path){[IO.File]::WriteAllBytes($path,[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))}
$archive=Join-Path $work 'source.tmp.dump';$sqlFile=Join-Path $work 'restore.tmp.sql'
try{
 $manifest=[Text.Encoding]::UTF8.GetString((Read-Protected (Join-Path $backup 'manifest.json.dpapi')))|ConvertFrom-Json
 $bytes=Read-Protected (Join-Path $backup 'database.dump.dpapi')
 $sha=[Security.Cryptography.SHA256]::Create()
 if([BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-','').ToLowerInvariant() -cne $manifest.ArchiveSHA256){throw 'Archive digest mismatch'}
 [IO.File]::WriteAllBytes($archive,$bytes);[Array]::Clear($bytes,0,$bytes.Length)
 $pgRestore=Join-Path $root 'tools\pgsql\bin\pg_restore.exe'
 $toc=& $pgRestore --list $archive
 if($LASTEXITCODE -ne 0){throw 'Archive TOC failed'}
 $selected=@();$omittedData=@();$includedData=@()
 foreach($line in $toc){
  if($line -notmatch '^[0-9]+; [0-9]+ [0-9]+ (.+)$'){continue}
  $description=$matches[1]
  $include=($description -match ' (public|private|drizzle|supabase_migrations) ')
  if($description -match '^TABLE DATA (auth|storage) (\S+) '){
   $schema=$matches[1];$table=$matches[2]
   $include=(($schema -eq 'auth' -and $table -ne 'schema_migrations') -or ($schema -eq 'storage' -and $table -notin @('migrations','buckets_vectors','vector_indexes')))
  }
  if($description -match '^SEQUENCE SET (auth|storage) '){$include=$true}
  if($description -match '^TRIGGER auth users (on_auth_user_created|on_auth_user_create_subscription) '){$include=$true}
  if($description -match '^POLICY storage objects collection_item_photos_storage_'){$include=$true}
  if($description -match '^EVENT TRIGGER - ensure_rls '){$include=$true}
  if($description -match '^DEFAULT ACL public .* supabase_admin$'){$include=$false}
  if($description -match '^TABLE DATA (\S+) (\S+) '){
   $key=$matches[1]+'.'+$matches[2]
   if($include){$includedData+=$key}else{
    $count=$manifest.TableCounts.$key
    if($null -eq $count){throw 'Archive count missing'}
    if($count -gt 0 -and $key -notin @('auth.schema_migrations','storage.migrations','realtime.schema_migrations')){throw 'Nonempty table omitted'}
    $omittedData+=$key
   }
  }
  if($include){$selected+=$line}
 }
 foreach($key in @('auth.users','auth.identities','auth.mfa_factors','public.product_releases','public.market_release_signals','storage.objects')){if($key -notin $includedData){throw 'Required table excluded'}}
 $listFile=Join-Path $work 'restore.list'
 [IO.File]::WriteAllLines($listFile,$selected,[Text.UTF8Encoding]::new($false))
 $null=& $pgRestore --no-owner --use-list $listFile --file $sqlFile $archive
 if($LASTEXITCODE -ne 0){throw 'Restore SQL generation failed'}
 Write-Protected ([IO.File]::ReadAllBytes($sqlFile)) (Join-Path $work 'restore.sql.dpapi')
 $roles=[Text.Encoding]::UTF8.GetString((Read-Protected (Join-Path $backup 'roles.sql.dpapi')))
 $runtimeRoleLines=@($roles -split "\r?\n"|Where-Object{$_ -match '^CREATE ROLE trackdash_app;|^ALTER ROLE trackdash_app |^GRANT anon TO trackdash_app |^GRANT authenticated TO trackdash_app |^GRANT trackdash_app TO postgres '})
 if($runtimeRoleLines.Count -lt 4){throw 'Runtime role definition incomplete'}
 $expectedAttributes='ALTER ROLE trackdash_app WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;'
 if($expectedAttributes -notin $runtimeRoleLines){throw 'Unexpected runtime role attributes'}
 $runtimeRoleLines=@($runtimeRoleLines|Where-Object{$_ -notmatch '^ALTER ROLE trackdash_app |^GRANT trackdash_app TO postgres '}|ForEach-Object{if($_ -ceq 'CREATE ROLE trackdash_app;'){'CREATE ROLE trackdash_app INHERIT NOCREATEROLE NOCREATEDB LOGIN;'}else{$_}})
 $runtimeRoleSQL=($runtimeRoleLines -join [Environment]::NewLine).Replace(' GRANTED BY supabase_admin','')
 Write-Protected ([Text.Encoding]::UTF8.GetBytes($runtimeRoleSQL)) (Join-Path $work 'runtime-role.sql.dpapi')
 [pscustomobject]@{Preparation='PASS';SourceArchiveVerified=$true;SelectedTOCEntries=$selected.Count;SelectedDataTables=$includedData.Count;OmittedManagedTables=$omittedData;RuntimeRoleStatements=$runtimeRoleLines.Count;IncludesPrivateSchema=([bool]($selected|Where-Object{$_ -match 'SCHEMA - private '}));IncludesAuthTriggers=(@($selected|Where-Object{$_ -match 'TRIGGER auth users '}).Count);StoragePolicies=(@($selected|Where-Object{$_ -match 'POLICY storage objects '}).Count);IncludesRLSAutoEnable=([bool]($selected|Where-Object{$_ -match 'EVENT TRIGGER - ensure_rls '}));TargetModified=$false}|ConvertTo-Json -Depth 5 -Compress
}catch{
 $safeReasons=@('Archive digest mismatch','Archive TOC failed','Archive count missing','Nonempty table omitted','Required table excluded','Restore SQL generation failed','Runtime role definition incomplete')
 [pscustomobject]@{Preparation='FAIL';Reason=$(if($_.Exception.Message -in $safeReasons){$_.Exception.Message}else{'PRIVATE_DETAILS_SUPPRESSED'})}|ConvertTo-Json -Compress
 exit 1
}finally{
 foreach($path in @($archive,$sqlFile)){if(Test-Path -LiteralPath $path){Remove-Item -LiteralPath $path}}
}
