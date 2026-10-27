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

 $stage='prepare-runtime-credential'
 $credentialFile=Join-Path $root 'target-runtime-login.dpapi'
 if(Test-Path -LiteralPath $credentialFile){
  $runtime=[Text.Encoding]::UTF8.GetString((Read-Protected $credentialFile))|ConvertFrom-Json
 }else{
  $random=New-Object byte[] 32;$rng=[Security.Cryptography.RandomNumberGenerator]::Create();$rng.GetBytes($random);$rng.Dispose()
  $runtime=[pscustomobject]@{role='trackdash_app';password=([BitConverter]::ToString($random).Replace('-','').ToLowerInvariant());project=$target}
  Write-Protected ([Text.Encoding]::UTF8.GetBytes(($runtime|ConvertTo-Json -Compress))) $credentialFile
  [Array]::Clear($random,0,$random.Length)
 }
 if($runtime.project -cne $target -or $runtime.role -cne 'trackdash_app' -or $runtime.password -notmatch '^[0-9a-f]{64}$'){throw 'Unexpected runtime credential'}
 $sqlFile=Join-Path $root 'runtime-password.tmp.sql';$tempFiles+=$sqlFile
 [IO.File]::WriteAllText($sqlFile,("ALTER ROLE trackdash_app PASSWORD '"+$runtime.password+"';"),[Text.UTF8Encoding]::new($false))
 $null=Run-Tool 'psql.exe' ('-X -w --single-transaction -v ON_ERROR_STOP=1'+$connectionArgs+' --command="SET ROLE postgres;" --file="'+$sqlFile+'"')
 $env:PGHOST=$pgHost;$env:PGUSER='trackdash_app.'+$target;$env:PGPASSWORD=$runtime.password
 & node.exe --experimental-strip-types (Join-Path $root 'runtime-probe\probe.mjs')
 if($LASTEXITCODE -ne 0){exit 1}
 [pscustomobject]@{RuntimeCredentialProtected=$true;OriginalPasswordChanged=$false;ProductionChanged=$false}|ConvertTo-Json -Compress
}catch{[pscustomobject]@{RuntimeSetup='FAIL';Stage=$stage;Details='Suppressed'}|ConvertTo-Json -Compress;exit 1}
finally{$env:PGPASSWORD=$null;$env:PGUSER=$null;$env:PGHOST=$null;$login=$null;$runtime=$null;foreach($path in $tempFiles){if(Test-Path -LiteralPath $path){Remove-Item -LiteralPath $path}}}
