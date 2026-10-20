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





 $ref='uhojhqxnzrolmnopwgpy'
 $keys=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/api-keys') -Headers $headers
 $anon=@($keys|Where-Object{$_.name -eq 'anon'})[0].api_key
 $service=@($keys|Where-Object{$_.name -eq 'service_role'})[0].api_key
 if(-not $anon -or -not $service){throw 'API credentials missing'}
 Add-Type -AssemblyName System.Net.Http
 $client=New-Object Net.Http.HttpClient
 $client.DefaultRequestHeaders.Add('apikey',$anon)
 $settings=Invoke-RestMethod -Uri ('https://'+$ref+'.supabase.co/auth/v1/settings') -Headers @{apikey=$anon}
 $response=$client.GetAsync(('https://'+$ref+'.supabase.co/rest/v1/profiles?select=id&limit=1')).GetAwaiter().GetResult()
 $profileStatus=[int]$response.StatusCode
 $privateBlocked=$profileStatus -in @(401,403)
 if($response.IsSuccessStatusCode){$privateBody=$response.Content.ReadAsStringAsync().GetAwaiter().GetResult()|ConvertFrom-Json;$privateBlocked=(@($privateBody).Count -eq 0)}
 $client.DefaultRequestHeaders.Clear();$client.DefaultRequestHeaders.Add('apikey',$service);$client.DefaultRequestHeaders.Add('Authorization',('Bearer '+$service));$client.DefaultRequestHeaders.Add('Prefer','count=exact')
 $tables=@()
 foreach($table in @('product_releases','market_release_signals','market_offer_states','price_points')){
  $response=$client.GetAsync(('https://'+$ref+'.supabase.co/rest/v1/'+$table+'?select=*&limit=1')).GetAwaiter().GetResult()
  $range=($response.Content.Headers.GetValues('Content-Range') -join '');$count=$null;if($range -match '/([0-9]+)$'){$count=[long]$matches[1]}
  $tables+=[pscustomobject]@{Table=$table;HTTPStatus=[int]$response.StatusCode;Count=$count}
 }
 [pscustomobject]@{AuthSettingsHTTP='PASS';EmailProviderEnabled=$settings.external.email;GoogleProviderEnabled=$settings.external.google;AnonymousProfilesDeniedOrEmpty=$privateBlocked;AnonymousProfilesHTTP=$profileStatus;DataAPI=$tables;RealAuthTested=$false;SMTPDeliveryTested=$false}|ConvertTo-Json -Depth 10 -Compress
}catch{[pscustomobject]@{APIProbe='FAIL';HTTPStatus=$(if($_.Exception.Response){[int]$_.Exception.Response.StatusCode}else{0});Details='Suppressed'}|ConvertTo-Json -Compress;exit 1}
finally{if($pointer -ne [IntPtr]::Zero){[TrackDashCred]::CredFree($pointer)};if($client){$client.Dispose()};$token=$null;$headers=$null;$service=$null;$anon=$null;if($bytes){[Array]::Clear($bytes,0,$bytes.Length)}}
