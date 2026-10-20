$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$root=Join-Path $env:LOCALAPPDATA 'TrackDashRecovery'
$backup=[IO.File]::ReadAllText((Join-Path $root 'latest-backup-location.txt')).Trim()
$work=Join-Path $backup 'restore-preparation'
$target='uhojhqxnzrolmnopwgpy';$bin=Join-Path $root 'tools\pgsql\bin'
$stage='load-target-credentials'
$tempFiles=@()
function Read-Protected([string]$path){return [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($path),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)}
function Write-Protected([byte[]]$bytes,[string]$path){[IO.File]::WriteAllBytes($path,[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))}
function Run-Tool([string]$name,[string]$arguments){
 $info=New-Object Diagnostics.ProcessStartInfo
 $info.FileName=Join-Path $bin $name;$info.Arguments=$arguments
 $info.UseShellExecute=$false;$info.CreateNoWindow=$true;$info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true
 $child=New-Object Diagnostics.Process;$child.StartInfo=$info;$null=$child.Start()
 $outTask=$child.StandardOutput.ReadToEndAsync();$errTask=$child.StandardError.ReadToEndAsync();$child.WaitForExit()
 if($child.ExitCode -ne 0){
  $script:privateError=$errTask.Result
  Write-Protected ([Text.Encoding]::UTF8.GetBytes($script:privateError)) (Join-Path $work ('target-'+$stage+'-error.dpapi'))
  throw 'Native target operation failed'
 }
 return $outTask.Result
}
try{
 $login=[Text.Encoding]::UTF8.GetString((Read-Protected (Join-Path $root 'target-migration-login.dpapi')))|ConvertFrom-Json
 if($login.role -ne 'cli_login_postgres'){throw 'Unexpected target role'}
 $poolers=@([Text.Encoding]::UTF8.GetString((Read-Protected (Join-Path $root ($target+'-pooler-config.dpapi'))))|ConvertFrom-Json)
 $connectionText=$poolers[0].connection_string;if(-not $connectionText){$connectionText=$poolers[0].connectionString}
 $hostMatch=[regex]::Match($connectionText,'@([^:/]+):([0-9]+)/')
 if(-not $hostMatch.Success){throw 'Target host unavailable'}
 $pgHost=$hostMatch.Groups[1].Value
 if($pgHost -notmatch '\.pooler\.supabase\.com$'){throw 'Unexpected target host'}
 $env:PGPASSWORD=$login.password;$env:PGSSLMODE='verify-full'
 $env:PGSSLROOTCERT=Join-Path $root 'tools\prod-ca-2021.crt';$env:PGCONNECT_TIMEOUT='15';$env:PGOPTIONS='-c application_name=trackdash_target_restore'
 $connectionArgs=' -h '+$pgHost+' -p 5432 -U '+$login.role+'.'+$target+' -d postgres'
 $stage='empty-target-check'
 $checkSQL="BEGIN READ ONLY; SET LOCAL ROLE postgres; select json_build_object('users',(select count(*) from auth.users),'objects',(select count(*) from storage.objects),'app_tables',(select count(*) from pg_tables where schemaname in ('public','private','drizzle','supabase_migrations'))); COMMIT;"
 $check=Run-Tool 'psql.exe' ('-X -w -q -A -t -v ON_ERROR_STOP=1'+$connectionArgs+' -c "'+$checkSQL+'"')
 $empty=$check|ConvertFrom-Json
 if($empty.users -ne 0 -or $empty.objects -ne 0 -or $empty.app_tables -ne 0){throw 'Destination is not empty'}
 $stage='target-safety-backup'
 $targetArchive=Join-Path $work 'target-before-import.tmp.dump';$tempFiles+=$targetArchive
 if(-not (Test-Path -LiteralPath (Join-Path $work 'target-before-import.dump.dpapi'))){
  $null=Run-Tool 'pg_dump.exe' ('--format=custom --compress=6 --no-password --role=postgres --file="'+$targetArchive+'"'+$connectionArgs)
  $safetyBytes=[IO.File]::ReadAllBytes($targetArchive);Write-Protected $safetyBytes (Join-Path $work 'target-before-import.dump.dpapi');[Array]::Clear($safetyBytes,0,$safetyBytes.Length)
 }
 $rolesFile=Join-Path $work 'runtime-role.tmp.sql';$restoreFile=Join-Path $work 'restore.tmp.sql';$tempFiles+=$rolesFile;$tempFiles+=$restoreFile
 foreach($item in @(@{Encrypted='runtime-role.sql.dpapi';Plain=$rolesFile},@{Encrypted='restore.sql.dpapi';Plain=$restoreFile})){
  $plain=Read-Protected (Join-Path $work $item.Encrypted);[IO.File]::WriteAllBytes($item.Plain,$plain);[Array]::Clear($plain,0,$plain.Length)
 }
 $stage='restore-transaction'
 $arguments='-X -w --single-transaction -v ON_ERROR_STOP=1 -v VERBOSITY=verbose'+$connectionArgs+' --command="SET ROLE postgres; SET session_replication_role = replica;" --file="'+$rolesFile+'" --file="'+$restoreFile+'" --command="SET session_replication_role = origin;"'
 $null=Run-Tool 'psql.exe' $arguments
 $stage='verify-restored-counts'
 $query="BEGIN READ ONLY; SET LOCAL ROLE postgres; select json_build_object('releases',(select count(*) from public.product_releases),'signals',(select count(*) from public.market_release_signals),'offers',(select count(*) from public.market_offer_states),'price_points',(select count(*) from public.price_points),'users',(select count(*) from auth.users),'identities',(select count(*) from auth.identities),'mfa_factors',(select count(*) from auth.mfa_factors),'storage_objects',(select count(*) from storage.objects)); COMMIT;"
 $result=Run-Tool 'psql.exe' ('-X -w -q -A -t -v ON_ERROR_STOP=1'+$connectionArgs+' -c "'+$query+'"')
 [pscustomobject]@{Restore='PASS';Target=$target;TransactionCommitted=$true;Counts=($result|ConvertFrom-Json);StorageBytesCopied=$false;AuthFlowsTested=$false}|ConvertTo-Json -Depth 5 -Compress
}catch{
 $sqlState=$null
 if($privateError -match 'ERROR:\s+([0-9A-Z]{5}):'){$sqlState=$matches[1]}
 $category='PRIVATE_DETAILS_SUPPRESSED'
 foreach($pattern in @('EAUTHQUERY','password authentication failed','certificate verify failed','permission denied','must be superuser','already exists','must be owner','does not exist','violates')){if($privateError -match [regex]::Escape($pattern)){$category=$pattern;break}}
 if($_.Exception.Message -eq 'Destination is not empty'){$category='DESTINATION_NOT_EMPTY'}
 [pscustomobject]@{Restore='FAIL';Stage=$stage;SQLState=$sqlState;Category=$category;TransactionCommitted=$false}|ConvertTo-Json -Compress
 exit 1
}finally{
 $env:PGPASSWORD=$null;$login=$null
 foreach($path in $tempFiles){if(Test-Path -LiteralPath $path){Remove-Item -LiteralPath $path}}
}
