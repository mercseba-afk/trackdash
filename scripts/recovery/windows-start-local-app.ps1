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





 $target='uhojhqxnzrolmnopwgpy'
 $folder=[IO.File]::ReadAllText((Join-Path $root 'local-app-location.txt')).Trim()
 if($folder -cne (Join-Path $root 'trackdash-3db96bd67a706fb507b41ce6d743296521782206')){throw 'Unexpected source location'}
 if(Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue){throw 'Local port already occupied'}
 $runtime=[Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes((Join-Path $root 'target-runtime-login.dpapi')),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))|ConvertFrom-Json
 if($runtime.project -cne $target -or $runtime.role -cne 'trackdash_app'){throw 'Unexpected runtime project'}
 $poolers=@([Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes((Join-Path $root ($target+'-pooler-config.dpapi'))),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))|ConvertFrom-Json)
 $connectionText=$poolers[0].connection_string;if(-not $connectionText){$connectionText=$poolers[0].connectionString}
 $match=[regex]::Match($connectionText,'@([^:/]+):([0-9]+)/')
 if(-not $match.Success -or $match.Groups[1].Value -notmatch '\.pooler\.supabase\.com$'){throw 'Unexpected pooler host'}
 $keys=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$target+'/api-keys') -Headers $headers
 $anon=@($keys|Where-Object{$_.name -eq 'anon'})[0].api_key;$service=@($keys|Where-Object{$_.name -eq 'service_role'})[0].api_key
 if(-not $anon -or -not $service){throw 'API credentials unavailable'}
 $config=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$target+'/config/auth') -Headers $headers
 if(-not $config.external_google_enabled -or -not $config.smtp_host){throw 'Google or SMTP not configured'}
 Protect-TrackDashFile ($config|ConvertTo-Json -Depth 100 -Compress) 'target-auth-before-local-test.dpapi'
 $allow=@($config.uri_allow_list -split ','|Where-Object{$_})+@('http://localhost:3000/**')
 $payload=@{site_url='http://localhost:3000';uri_allow_list=(($allow|Select-Object -Unique) -join ',')}
 $null=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$target+'/config/auth') -Headers $headers -Method Patch -ContentType 'application/json' -Body ($payload|ConvertTo-Json -Compress)
 $env:NEXT_PUBLIC_SUPABASE_URL='https://'+$target+'.supabase.co'
 $env:NEXT_PUBLIC_SUPABASE_ANON_KEY=$anon;$env:SUPABASE_SECRET_KEY=$service;$env:SUPABASE_SERVICE_ROLE_KEY=$service
 $env:DATABASE_URL='postgresql://trackdash_app.'+$target+':'+$runtime.password+'@'+$match.Groups[1].Value+':6543/postgres?sslmode=verify-full'
 $env:NODE_EXTRA_CA_CERTS=Join-Path $root 'tools\prod-ca-2021.crt'
 $env:EBAY_ENV='sandbox';$env:EBAY_MARKET_WRITES_ENABLED='false'
 foreach($name in @('CRON_SECRET','EBAY_MICROBATCH_SECRET','EBAY_CLIENT_ID','EBAY_CLIENT_SECRET','EBAY_MARKETPLACE_DELETION_ENDPOINT','EBAY_MARKETPLACE_DELETION_TOKEN','MIGRATION_DATABASE_URL','VERCEL_ENV')){[Environment]::SetEnvironmentVariable($name,$null,'Process')}
 $env:NEXT_TELEMETRY_DISABLED='1'
 $p=Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList 'node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3000' -WorkingDirectory $folder -RedirectStandardOutput (Join-Path $root 'local-app-stdout.private.log') -RedirectStandardError (Join-Path $root 'local-app-stderr.private.log') -WindowStyle Hidden -PassThru
 [IO.File]::WriteAllText((Join-Path $root 'local-app-pid.txt'),$p.Id)
 [pscustomobject]@{LocalAppStarted=$true;PID=$p.Id;URL='http://localhost:3000';Database='Frankfurt target only';ScannerCredentialsAbsent=$true;EbayWritesEnabled=$false;VercelChanged=$false}|ConvertTo-Json -Compress
}catch{[pscustomobject]@{LocalAppStarted=$false;HTTPStatus=$(if($_.Exception.Response){[int]$_.Exception.Response.StatusCode}else{0});Details='Suppressed'}|ConvertTo-Json -Compress;exit 1}
finally{
 if($pointer -ne [IntPtr]::Zero){[TrackDashCred]::CredFree($pointer)}
 $token=$null;$headers=$null;$runtime=$null;$anon=$null;$service=$null
 foreach($name in @('NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY','DATABASE_URL')){[Environment]::SetEnvironmentVariable($name,$null,'Process')}
 if($bytes){[Array]::Clear($bytes,0,$bytes.Length)}
}
