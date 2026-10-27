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
 $statusFile=Join-Path $root 'google-configuration-status.json'
 $config=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$target+'/config/auth') -Headers $headers
 if(-not $config.external_google_client_id){throw 'Target Google client ID missing'}
 Add-Type -AssemblyName System.Windows.Forms
 Add-Type -AssemblyName System.Drawing
 $form=New-Object Windows.Forms.Form
 $form.Text='TrackDash - Google OAuth - NUOVO Supabase Frankfurt'
 $form.Size=New-Object Drawing.Size(680,315)
 $form.StartPosition='CenterScreen';$form.TopMost=$true;$form.FormBorderStyle='FixedDialog';$form.MaximizeBox=$false;$form.MinimizeBox=$false
 $label=New-Object Windows.Forms.Label
 $label.Text='Incolla il Client secret del client Google indicato sotto.'+[Environment]::NewLine+'Il segreto sara salvato cifrato sul PC e usato solo sul NUOVO Supabase.'+[Environment]::NewLine+'Non e la password Google. Nessuna modifica al vecchio Supabase.'
 $label.Location=New-Object Drawing.Point(18,15);$label.Size=New-Object Drawing.Size(630,65);$form.Controls.Add($label)
 $idLabel=New-Object Windows.Forms.Label;$idLabel.Text='Client ID gia configurato (deve corrispondere alla pagina Google):';$idLabel.Location=New-Object Drawing.Point(18,88);$idLabel.Size=New-Object Drawing.Size(630,20);$form.Controls.Add($idLabel)
 $idBox=New-Object Windows.Forms.TextBox;$idBox.Text=$config.external_google_client_id;$idBox.ReadOnly=$true;$idBox.Location=New-Object Drawing.Point(18,112);$idBox.Size=New-Object Drawing.Size(625,25);$form.Controls.Add($idBox)
 $secretLabel=New-Object Windows.Forms.Label;$secretLabel.Text='Client secret Google (incolla qui):';$secretLabel.Location=New-Object Drawing.Point(18,150);$secretLabel.Size=New-Object Drawing.Size(625,20);$form.Controls.Add($secretLabel)
 $secretBox=New-Object Windows.Forms.TextBox;$secretBox.UseSystemPasswordChar=$true;$secretBox.Location=New-Object Drawing.Point(18,175);$secretBox.Size=New-Object Drawing.Size(625,25);$form.Controls.Add($secretBox)
 $ok=New-Object Windows.Forms.Button;$ok.Text='Configura nuovo Supabase';$ok.Location=New-Object Drawing.Point(235,220);$ok.Size=New-Object Drawing.Size(235,30);$ok.DialogResult=[Windows.Forms.DialogResult]::OK;$form.Controls.Add($ok)
 $cancel=New-Object Windows.Forms.Button;$cancel.Text='Annulla';$cancel.Location=New-Object Drawing.Point(490,220);$cancel.Size=New-Object Drawing.Size(150,30);$cancel.DialogResult=[Windows.Forms.DialogResult]::Cancel;$form.Controls.Add($cancel)
 $form.AcceptButton=$ok;$form.CancelButton=$cancel;$form.Add_Shown({$secretBox.Focus()})
 $dialog=$form.ShowDialog()
 if($dialog -ne [Windows.Forms.DialogResult]::OK){
  $report=[pscustomobject]@{GoogleConfiguration='CANCELLED';TargetChanged=$false}
  [IO.File]::WriteAllText($statusFile,($report|ConvertTo-Json -Compress));$report|ConvertTo-Json -Compress;exit 0
 }
 $secret=$secretBox.Text.Trim();$secretBox.Clear();$form.Dispose()
 if($secret -notmatch '^[A-Za-z0-9_-]{20,256}$'){throw 'Invalid Google client secret format'}
 Protect-TrackDashFile $secret 'target-google-client-secret.dpapi'
 $payload=@{external_google_client_id=$config.external_google_client_id;external_google_secret=$secret;external_google_enabled=$true}
 $null=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$target+'/config/auth') -Headers $headers -Method Patch -ContentType 'application/json' -Body ($payload|ConvertTo-Json -Compress)
 $checked=Invoke-RestMethod -Uri ('https://api.supabase.com/v1/projects/'+$target+'/config/auth') -Headers $headers
 if(-not $checked.external_google_enabled -or $checked.external_google_client_id -cne $config.external_google_client_id){throw 'Google configuration verification failed'}
 $report=[pscustomobject]@{GoogleConfiguration='CONFIGURED';ProviderEnabled=$true;ClientIDPreserved=$true;SecretProtectedLocally=$true;RealGoogleLoginTested=$false;OldProjectChanged=$false;VercelProductionChanged=$false}
 [IO.File]::WriteAllText($statusFile,($report|ConvertTo-Json -Compress));$report|ConvertTo-Json -Compress
}catch{
 $report=[pscustomobject]@{GoogleConfiguration='FAIL';HTTPStatus=$(if($_.Exception.Response){[int]$_.Exception.Response.StatusCode}else{0});Details='Suppressed'}
 if($statusFile){[IO.File]::WriteAllText($statusFile,($report|ConvertTo-Json -Compress))}
 $report|ConvertTo-Json -Compress;exit 1
}finally{
 if($pointer -ne [IntPtr]::Zero){[TrackDashCred]::CredFree($pointer)}
 if($form){$form.Dispose()};$secret=$null;$token=$null;$headers=$null;$payload=$null
 if($bytes){[Array]::Clear($bytes,0,$bytes.Length)}
}
