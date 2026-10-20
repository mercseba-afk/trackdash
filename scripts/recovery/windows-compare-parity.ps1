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

 $backup=[IO.File]::ReadAllText((Join-Path $root 'latest-backup-location.txt')).Trim()
 $lines=[IO.File]::ReadAllLines((Join-Path $backup 'restore-preparation\restore.list'))
 $queries=@()
 foreach($line in $lines){if($line -match ' TABLE DATA (\S+) (\S+) '){$schema=$matches[1];$table=$matches[2];if($schema -notmatch '^[a-z_]+$' -or $table -notmatch '^[a-z0-9_]+$'){throw 'Unexpected table identifier'};$key=$schema+'.'+$table;$queries+=("select '"+$key+"'::text as name,count(*)::bigint as rows,md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' order by md5(to_jsonb(t)::text)),'')) as digest from "+$key+" t")}}
 if($queries.Count -ne 83){throw 'Unexpected table count'}
 $query='BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; '+($queries -join ' union all ')+'; COMMIT;'
 $all=@{}
 foreach($ref in @('piwogtdkfozbiakyjnvk','uhojhqxnzrolmnopwgpy')){
  $response=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$ref+'/database/query') -Headers $headers -Method Post -ContentType 'application/json' -Body (@{query=$query}|ConvertTo-Json -Compress)
  $map=@{};foreach($row in @($response)){$map[$row.name]=$row}
  if($map.Count -ne 83){throw 'Unexpected parity response'}
  $all[$ref]=$map
 }
 $differences=@();$rows=0
 foreach($key in $all['piwogtdkfozbiakyjnvk'].Keys){$a=$all['piwogtdkfozbiakyjnvk'][$key];$b=$all['uhojhqxnzrolmnopwgpy'][$key];$rows+=$a.rows;if($a.rows -ne $b.rows -or $a.digest -cne $b.digest){$differences+=[pscustomobject]@{Table=$key;CountsEqual=($a.rows -eq $b.rows);ContentEqual=($a.digest -ceq $b.digest)}}}
 $report=[pscustomobject]@{Check='ALL_RESTORED_TABLE_CONTENT';TablesCompared=83;SourceRows=$rows;DifferenceCount=$differences.Count;Differences=$differences;SourceModified=$false;InstantCutoverGuarantee=$false}
 Protect-TrackDashFile ($report|ConvertTo-Json -Depth 10 -Compress) 'latest-parity-report.dpapi'
 $report|ConvertTo-Json -Depth 10 -Compress
}catch{[pscustomobject]@{Parity='FAIL';HTTPStatus=$(if($_.Exception.Response){[int]$_.Exception.Response.StatusCode}else{0});Details='Suppressed'}|ConvertTo-Json -Compress;exit 1}
finally{if($pointer -ne [IntPtr]::Zero){[TrackDashCred]::CredFree($pointer)};$token=$null;$headers=$null;if($bytes){[Array]::Clear($bytes,0,$bytes.Length)}}
