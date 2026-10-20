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





 $configs=@{}
 foreach($ref in @('piwogtdkfozbiakyjnvk','uhojhqxnzrolmnopwgpy')){$configs[$ref]=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/config/auth') -Headers $headers}
 $a=$configs['piwogtdkfozbiakyjnvk'];$b=$configs['uhojhqxnzrolmnopwgpy']
 $differences=@($a.PSObject.Properties.Name|Where-Object{($a.$_|ConvertTo-Json -Depth 100 -Compress) -cne ($b.$_|ConvertTo-Json -Depth 100 -Compress)})
 [pscustomobject]@{AuthConfigurationDifferentFields=$differences;ComparedFields=@($a.PSObject.Properties.Name).Count}|ConvertTo-Json -Depth 10 -Compress
}catch{Write-Output 'AUTH_CONFIG_COMPARISON_FAILED';exit 1}
finally{if($pointer -ne [IntPtr]::Zero){[TrackDashCred]::CredFree($pointer)};$token=$null;$headers=$null;if($bytes){[Array]::Clear($bytes,0,$bytes.Length)}}
