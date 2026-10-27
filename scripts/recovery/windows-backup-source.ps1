$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$root=Join-Path $env:LOCALAPPDATA 'TrackDashRecovery'
$ref='piwogtdkfozbiakyjnvk'
$bin=Join-Path $root 'tools\pgsql\bin'
$started=[DateTime]::UtcNow
$backupDir=Join-Path $root ('backup-'+$started.ToString('yyyyMMddTHHmmssZ'))
$null=New-Item -ItemType Directory -Path $backupDir
function Read-ProtectedJson([string]$path){
 $plain=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($path),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
 try{return ([Text.Encoding]::UTF8.GetString($plain)|ConvertFrom-Json)}finally{[Array]::Clear($plain,0,$plain.Length)}
}
function Protect-Bytes([byte[]]$bytes,[string]$path){
 $encrypted=[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
 [IO.File]::WriteAllBytes($path,$encrypted)
}
function Quote-Arg([string]$value){return '"'+$value.Replace('"','\"')+'"'}
function Run-Tool([string]$name,[string]$arguments){
 $info=New-Object Diagnostics.ProcessStartInfo
 $info.FileName=Join-Path $bin $name
 $info.Arguments=$arguments;$info.UseShellExecute=$false;$info.CreateNoWindow=$true
 $info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true
 $child=New-Object Diagnostics.Process;$child.StartInfo=$info;$null=$child.Start()
 $outputTask=$child.StandardOutput.ReadToEndAsync()
 $errorTask=$child.StandardError.ReadToEndAsync()
 $child.WaitForExit()
 if($child.ExitCode -ne 0){
  Protect-Bytes ([Text.Encoding]::UTF8.GetBytes($errorTask.Result)) (Join-Path $backupDir ($name+'-error.dpapi'))
  throw ('Backup tool failed: '+$name)
 }
 return $outputTask.Result
}
$parent=$null;$stage='load-credentials'
try{
 $login=Read-ProtectedJson (Join-Path $root 'source-readonly-login.dpapi')
 $poolers=@(Read-ProtectedJson (Join-Path $root ($ref+'-pooler-config.dpapi')))
 $connectionText=$poolers[0].connection_string
 if(-not $connectionText){$connectionText=$poolers[0].connectionString}
 $hostMatch=[regex]::Match($connectionText,'@([^:/]+):([0-9]+)/')
 if(-not $hostMatch.Success){throw 'Pooler host unavailable'}
 $pgHost=$hostMatch.Groups[1].Value
 if($pgHost -notmatch '\.pooler\.supabase\.com$'){throw 'Unexpected pooler host'}
 if($login.role -ne 'cli_login_supabase_read_only_user'){throw 'Expected read-only login role'}
 $env:PGPASSWORD=$login.password;$env:PGSSLMODE='verify-full'
 $env:PGSSLROOTCERT=Join-Path $root 'tools\prod-ca-2021.crt'
 $env:PGCONNECT_TIMEOUT='15'
 $env:PGOPTIONS='-c application_name=trackdash_consistent_backup'
 $connectionArgs=' -h '+$pgHost+' -p 5432 -U '+$login.role+'.'+$ref+' -d postgres'
 $stage='open-snapshot'
 $info=New-Object Diagnostics.ProcessStartInfo
 $info.FileName=Join-Path $bin 'psql.exe'
 $info.Arguments='-X -w -q -A -t -v ON_ERROR_STOP=1'+$connectionArgs
 $info.UseShellExecute=$false;$info.CreateNoWindow=$true
 $info.RedirectStandardInput=$true;$info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true
 $parent=New-Object Diagnostics.Process;$parent.StartInfo=$info;$null=$parent.Start()
 $parent.StandardInput.WriteLine('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SET LOCAL ROLE supabase_read_only_user; SELECT pg_export_snapshot();')
 $parent.StandardInput.Flush()
 $snapshot=$parent.StandardOutput.ReadLine()
 if($snapshot -notmatch '^[0-9a-fA-F]+-[0-9a-fA-F]+-[0-9]+$'){throw 'Snapshot export failed'}
 $stage='dump-database'
 $archive=Join-Path $backupDir 'database.dump'
 $null=Run-Tool 'pg_dump.exe' ('--format=custom --compress=6 --no-password --role=supabase_read_only_user --lock-wait-timeout=15s --snapshot='+$snapshot+' --file='+(Quote-Arg $archive)+$connectionArgs)
 $stage='count-snapshot-tables'
 $countQuery="select coalesce(jsonb_object_agg(s||'.'||t,((xpath('/table/row/n/text()',query_to_xml(format('select count(*) as n from %I.%I',s,t),false,false,'')))[1]::text)::bigint),'{}'::jsonb) from (select schemaname s,tablename t from pg_tables where schemaname in ('public','private','auth','storage','drizzle','supabase_migrations')) tables;"
 $parent.StandardInput.WriteLine($countQuery);$parent.StandardInput.Flush()
 $countsLine=$parent.StandardOutput.ReadLine()
 if(-not $countsLine){throw 'Snapshot table count export failed'}
 $counts=$countsLine|ConvertFrom-Json
 Protect-Bytes ([Text.Encoding]::UTF8.GetBytes($countsLine)) (Join-Path $backupDir 'snapshot-counts.json.dpapi')
 $parent.StandardInput.WriteLine('COMMIT;');$parent.StandardInput.Close()
 $parent.WaitForExit()
 if($parent.ExitCode -ne 0){throw 'Snapshot transaction failed'}
 $stage='dump-roles'
 $roleConnectionArgs=' -h '+$pgHost+' -p 5432 -U '+$login.role+'.'+$ref+' -l postgres'
 $roles=Run-Tool 'pg_dumpall.exe' ('--roles-only --no-role-passwords --role=supabase_read_only_user'+$roleConnectionArgs)
 Protect-Bytes ([Text.Encoding]::UTF8.GetBytes($roles)) (Join-Path $backupDir 'roles.sql.dpapi')
 $roles=$null
 $stage='verify-archive-directory'
 $toc=Run-Tool 'pg_restore.exe' ('--list '+(Quote-Arg $archive))
 $required=@('auth users','auth identities','auth mfa_factors','public product_releases','public market_release_signals','public market_offer_states','public price_points','storage objects')
 foreach($table in $required){if($toc -notmatch ('TABLE DATA '+[regex]::Escape($table)+' ')){throw 'Required table missing from backup'}}
 $stage='encrypt-and-check-backup'
 $plainArchive=[IO.File]::ReadAllBytes($archive)
 $sha=[Security.Cryptography.SHA256]::Create()
 $digest=[BitConverter]::ToString($sha.ComputeHash($plainArchive)).Replace('-','').ToLowerInvariant()
 $encryptedPath=Join-Path $backupDir 'database.dump.dpapi'
 Protect-Bytes $plainArchive $encryptedPath
 $restoredBytes=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($encryptedPath),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
 $checkDigest=[BitConverter]::ToString($sha.ComputeHash($restoredBytes)).Replace('-','').ToLowerInvariant()
 if($checkDigest -ne $digest){throw 'Encrypted backup round-trip mismatch'}
 $manifest=@{Source=$ref;StartedUTC=$started.ToString('o');CompletedUTC=[DateTime]::UtcNow.ToString('o');ArchiveSHA256=$digest;TableCounts=$counts;SnapshotConsistent=$true;RolesPasswordHashesExcluded=$true;IncludesStorageBytes=$false;IsFinalCutoverSnapshot=$false}
 Protect-Bytes ([Text.Encoding]::UTF8.GetBytes(($manifest|ConvertTo-Json -Depth 100 -Compress))) (Join-Path $backupDir 'manifest.json.dpapi')
 [IO.File]::WriteAllText((Join-Path $root 'latest-backup-location.txt'),$backupDir)
 $archiveSize=$plainArchive.Length
 [Array]::Clear($plainArchive,0,$plainArchive.Length);[Array]::Clear($restoredBytes,0,$restoredBytes.Length)
 Remove-Item -LiteralPath $archive
 [pscustomobject]@{Backup='PASS';Encrypted=$true;EncryptionRoundTrip='PASS';SnapshotConsistent=$true;ArchiveBytes=$archiveSize;TablesCounted=@($counts.PSObject.Properties).Count;Releases=$counts.'public.product_releases';Signals=$counts.'public.market_release_signals';Offers=$counts.'public.market_offer_states';PricePoints=$counts.'public.price_points';AuthUsers=$counts.'auth.users';AuthIdentities=$counts.'auth.identities';MFAFactors=$counts.'auth.mfa_factors';StorageObjects=$counts.'storage.objects';StorageBytesCopied=$false;RestoreTested=$false}|ConvertTo-Json -Compress
}catch{
 if($archive -and (Test-Path -LiteralPath $archive)){
  $failedArchive=[IO.File]::ReadAllBytes($archive)
  Protect-Bytes $failedArchive ($archive+'.dpapi')
  [Array]::Clear($failedArchive,0,$failedArchive.Length)
  Remove-Item -LiteralPath $archive
 }
 [pscustomobject]@{Backup='FAIL';Stage=$stage;ErrorType=$_.Exception.GetType().Name;PrivateDetailsSuppressed=$true}|ConvertTo-Json -Compress
 exit 1
}finally{
 $env:PGPASSWORD=$null;$login=$null
 if($parent -and -not $parent.HasExited){$parent.StandardInput.Close();if(-not $parent.WaitForExit(5000)){$parent.Kill()}}
}
