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

 $source='piwogtdkfozbiakyjnvk';$target='uhojhqxnzrolmnopwgpy'
 $path=Join-Path $root 'smtp-migration-key.tmp'
 $secret=[IO.File]::ReadAllText($path).Trim()
 if($secret -notmatch '^re_[A-Za-z0-9_]+$'){throw 'Unexpected credential'}
 Protect-TrackDashFile $secret 'smtp-migration-key.dpapi'
 $auth=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$source+'/config/auth') -Headers $headers
 if($auth.smtp_host -cne 'smtp.resend.com'){throw 'Unexpected original SMTP provider'}
 $payload=@{smtp_host=$auth.smtp_host;smtp_port=$auth.smtp_port;smtp_user=$auth.smtp_user;smtp_admin_email=$auth.smtp_admin_email;smtp_sender_name=$auth.smtp_sender_name;smtp_pass=$secret}
 $null=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$target+'/config/auth') -Headers $headers -Method Patch -ContentType 'application/json' -Body ($payload|ConvertTo-Json -Compress)
 $check=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$target+'/config/auth') -Headers $headers
 $fields=@('smtp_host','smtp_port','smtp_user','smtp_admin_email','smtp_sender_name')
 $mismatches=@($fields|Where-Object{$auth.$_ -cne $check.$_})
 [pscustomobject]@{SMTPConfigured=[bool]$check.smtp_host;OriginalNonSecretFieldsPreserved=($mismatches.Count -eq 0);Credential='New domain-restricted sending key';EmailDeliveryTested=$false;ProductionChanged=$false}|ConvertTo-Json -Compress
}catch{[pscustomobject]@{SMTPConfiguration='FAIL';HTTPStatus=$(if($_.Exception.Response){[int]$_.Exception.Response.StatusCode}else{0});Details='Suppressed'}|ConvertTo-Json -Compress;exit 1}
finally{if($pointer -ne [IntPtr]::Zero){[TrackDashCred]::CredFree($pointer)};$token=$null;$headers=$null;$secret=$null;$payload=$null;if($bytes){[Array]::Clear($bytes,0,$bytes.Length)};if(Test-Path -LiteralPath (Join-Path $root 'smtp-migration-key.tmp')){Remove-Item -LiteralPath (Join-Path $root 'smtp-migration-key.tmp')}}
