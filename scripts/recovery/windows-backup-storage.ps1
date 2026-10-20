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

 $ref='piwogtdkfozbiakyjnvk'
 $backup=[IO.File]::ReadAllText((Join-Path $root 'latest-backup-location.txt')).Trim()
 $folder=Join-Path $backup 'storage';$null=New-Item -ItemType Directory -Path $folder -Force
 $response=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/database/query') -Headers $headers -Method Post -ContentType 'application/json' -Body '{"query":"BEGIN READ ONLY; select jsonb_agg(to_jsonb(o) order by id) objects from storage.objects o; COMMIT;"}'
 $objects=@(@($response)[0].objects)
 if($objects.Count -ne 2){throw 'Storage count changed; inspect before download'}
 Protect-TrackDashFile ($objects|ConvertTo-Json -Depth 100 -Compress) 'source-storage-metadata.dpapi'
 $keys=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/api-keys') -Headers $headers
 $service=@($keys|Where-Object{$_.name -eq 'service_role'})[0].api_key
 if(-not $service){throw 'Storage service credential unavailable'}
 Add-Type -AssemblyName System.Net.Http
 $client=New-Object Net.Http.HttpClient
 $client.DefaultRequestHeaders.Add('apikey',$service);$client.DefaultRequestHeaders.Add('Authorization',('Bearer '+$service))
 $downloaded=0;$totalBytes=0
 foreach($object in $objects){
  $path=[Uri]::EscapeDataString($object.bucket_id)+'/'+(($object.name -split '/'|ForEach-Object{[Uri]::EscapeDataString($_)}) -join '/')
  $result=$client.GetAsync(('https://'+$ref+'.supabase.co/storage/v1/object/'+$path)).GetAwaiter().GetResult()
  if(-not $result.IsSuccessStatusCode){[pscustomobject]@{StorageBackup='BLOCKED';HTTPStatus=[int]$result.StatusCode;FilesCompleted=$downloaded}|ConvertTo-Json -Compress;exit 1}
  $data=$result.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
  if($data.Length -ne [long]$object.metadata.size){throw 'Storage byte size mismatch'}
  $protected=[Security.Cryptography.ProtectedData]::Protect($data,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
  [IO.File]::WriteAllBytes((Join-Path $folder ($object.id+'.dpapi')),$protected)
  $check=[Security.Cryptography.ProtectedData]::Unprotect($protected,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
  if([Convert]::ToBase64String([Security.Cryptography.SHA256]::Create().ComputeHash($data)) -cne [Convert]::ToBase64String([Security.Cryptography.SHA256]::Create().ComputeHash($check))){throw 'Storage backup verification failed'}
  $downloaded++;$totalBytes+=$data.Length;[Array]::Clear($data,0,$data.Length);[Array]::Clear($check,0,$check.Length)
 }
 [pscustomobject]@{StorageBackup='PASS';EncryptedFiles=$downloaded;Bytes=$totalBytes;SourceModified=$false}|ConvertTo-Json -Compress
}catch{[pscustomobject]@{StorageBackup='FAIL';HTTPStatus=$(if($_.Exception.Response){[int]$_.Exception.Response.StatusCode}else{0});Details='Suppressed'}|ConvertTo-Json -Compress;exit 1}
finally{if($pointer -ne [IntPtr]::Zero){[TrackDashCred]::CredFree($pointer)};if($client){$client.Dispose()};$service=$null;$token=$null;$headers=$null;if($bytes){[Array]::Clear($bytes,0,$bytes.Length)}}
