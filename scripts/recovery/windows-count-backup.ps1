$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$root=Join-Path $env:LOCALAPPDATA 'TrackDashRecovery'
$backupDir=[IO.File]::ReadAllText((Join-Path $root 'latest-backup-location.txt')).Trim()
if(-not $backupDir.StartsWith($root+'\backup-')){throw 'Unexpected backup location'}
function Read-Protected([string]$path){return [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($path),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)}
function Write-Protected([byte[]]$bytes,[string]$path){[IO.File]::WriteAllBytes($path,[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))}
$tempArchive=Join-Path $backupDir 'count-verification.tmp.dump'
try{
 $archiveBytes=Read-Protected (Join-Path $backupDir 'database.dump.dpapi')
 [IO.File]::WriteAllBytes($tempArchive,$archiveBytes)
 [Array]::Clear($archiveBytes,0,$archiveBytes.Length)
 $info=New-Object Diagnostics.ProcessStartInfo
 $info.FileName=Join-Path $root 'tools\pgsql\bin\pg_restore.exe'
 $info.Arguments='--data-only --no-owner --no-privileges --file=- "'+$tempArchive+'"'
 $info.UseShellExecute=$false;$info.CreateNoWindow=$true;$info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true
 $child=New-Object Diagnostics.Process;$child.StartInfo=$info;$null=$child.Start()
 $errorTask=$child.StandardError.ReadToEndAsync()
 $counts=@{};$currentTable=$null
 while($null -ne ($line=$child.StandardOutput.ReadLine())){
  if($null -ne $currentTable){
   if($line -ceq '\.'){$currentTable=$null}else{$counts[$currentTable]++}
  }elseif($line -match '^COPY (?:"([^"]+)"|([a-zA-Z0-9_]+))\.(?:"([^"]+)"|([a-zA-Z0-9_]+)) \(.*\) FROM stdin;$'){
   $schema=$matches[1];if(-not $schema){$schema=$matches[2]}
   $table=$matches[3];if(-not $table){$table=$matches[4]}
   $currentTable=$schema+'.'+$table
   if($counts.ContainsKey($currentTable)){throw 'Duplicate COPY block'}
   $counts[$currentTable]=0
  }elseif($line.StartsWith('COPY ')){throw 'Unsupported COPY header'}
 }
 $child.WaitForExit()
 if($child.ExitCode -ne 0 -or $currentTable){throw 'Archive data stream incomplete'}
 foreach($key in @('public.product_releases','public.market_release_signals','public.market_offer_states','public.price_points','auth.users','auth.identities','auth.mfa_factors','storage.objects')){if(-not $counts.ContainsKey($key)){throw 'Required table data missing'}}
 $manifestBytes=Read-Protected (Join-Path $backupDir 'manifest.json.dpapi')
 $manifest=[Text.Encoding]::UTF8.GetString($manifestBytes)|ConvertFrom-Json
 [Array]::Clear($manifestBytes,0,$manifestBytes.Length)
 $manifest.TableCounts=$counts
 $manifest|Add-Member -NotePropertyName ArchiveCountMethod -NotePropertyValue 'COPY-records-from-native-archive' -Force
 Write-Protected ([Text.Encoding]::UTF8.GetBytes(($manifest|ConvertTo-Json -Depth 100 -Compress))) (Join-Path $backupDir 'manifest.json.dpapi')
 Write-Protected ([Text.Encoding]::UTF8.GetBytes(($counts|ConvertTo-Json -Compress))) (Join-Path $backupDir 'snapshot-counts.json.dpapi')
 [pscustomobject]@{ArchiveCountVerification='PASS';Tables=$counts.Count;Releases=$counts['public.product_releases'];Signals=$counts['public.market_release_signals'];Offers=$counts['public.market_offer_states'];PricePoints=$counts['public.price_points'];AuthUsers=$counts['auth.users'];AuthIdentities=$counts['auth.identities'];MFAFactors=$counts['auth.mfa_factors'];StorageObjects=$counts['storage.objects'];StorageBytesCopied=$false;RestoreTested=$false}|ConvertTo-Json -Compress
}catch{
 [pscustomobject]@{ArchiveCountVerification='FAIL';ErrorType=$_.Exception.GetType().Name;Reason=$(if($_.Exception.Message -in @('Archive data stream incomplete','Required table data missing','Unsupported COPY header','Duplicate COPY block')){$_.Exception.Message}else{'PRIVATE_ERROR_SUPPRESSED'});PrivateDetailsSuppressed=$true}|ConvertTo-Json -Compress
 exit 1
}finally{
 if(Test-Path -LiteralPath $tempArchive){Remove-Item -LiteralPath $tempArchive}
}
