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

 $stage='p08-precondition'
 $query="BEGIN READ ONLY; SET LOCAL ROLE postgres; select count(*) from pg_proc where proname in ('p08_ebay_erasure_terms','p08_ebay_erasure_row_terms','trackdash_plan_ebay_erasure','trackdash_apply_ebay_erasure'); COMMIT;"
 $existing=Run-Tool 'psql.exe' ('-X -w -q -A -t -v ON_ERROR_STOP=1'+$connectionArgs+' -c "'+$query+'"')
 if([int]$existing.Trim() -ne 0){throw 'P08 objects already present; inspect phase before retry'}
 $stage='p08-helpers-indexes-rpcs'
 $sql=Join-Path $root 'p08-ebay-erasure.sql'
 $null=Run-Tool 'psql.exe' ('-X -w -v ON_ERROR_STOP=1 -v VERBOSITY=verbose'+$connectionArgs+' --command="SET ROLE postgres;" --file="'+$sql+'"')
 [pscustomobject]@{P08='APPLIED';Target=$target;OuterTransaction=$false;Order='helpers-concurrent-indexes-rpcs'}|ConvertTo-Json -Compress
}catch{
 $sqlState=$null
 if($privateError -match 'ERROR:\s+([0-9A-Z]{5}):'){$sqlState=$matches[1]}
 [pscustomobject]@{P08='FAIL';Stage=$stage;SQLState=$sqlState;Details='Encrypted locally; inspect before retry'}|ConvertTo-Json -Compress
 exit 1
}finally{$env:PGPASSWORD=$null;$login=$null}
