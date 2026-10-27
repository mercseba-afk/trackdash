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


 $runtime=[Text.Encoding]::UTF8.GetString((Read-Protected (Join-Path $root 'target-runtime-login.dpapi')))|ConvertFrom-Json
 if($runtime.project -cne $target -or $runtime.role -cne 'trackdash_app'){throw 'Unexpected runtime credential'}
 $env:PGHOST=$pgHost;$env:PGUSER='trackdash_app.'+$target;$env:PGPASSWORD=$runtime.password
 & node.exe --experimental-strip-types (Join-Path $root 'runtime-probe\probe.mjs')
 if($LASTEXITCODE -ne 0){exit 1}
}catch{Write-Output 'DRIVER_PROBE_SETUP_FAILED';exit 1}
finally{$env:PGPASSWORD=$null;$env:PGUSER=$null;$env:PGHOST=$null;$login=$null;$runtime=$null}
