$ErrorActionPreference='Stop'
$root=Join-Path $env:LOCALAPPDATA 'TrackDashRecovery'
$sha='3db96bd67a706fb507b41ce6d743296521782206'
$folder=Join-Path $root ('trackdash-'+$sha)
$zip=Join-Path $root ('source-'+$sha+'.zip')
$stage='download-reviewed-source'
try{
 if(-not (Test-Path -LiteralPath (Join-Path $folder 'package.json'))){
  Invoke-WebRequest -UseBasicParsing -Uri ('https://codeload.github.com/mercseba-afk/trackdash/zip/'+$sha) -OutFile $zip
  Expand-Archive -LiteralPath $zip -DestinationPath $root
 }
 if(-not (Test-Path -LiteralPath (Join-Path $folder 'pnpm-lock.yaml'))){throw 'Source archive layout mismatch'}
 $stage='install-frozen-dependencies'
 $info=New-Object Diagnostics.ProcessStartInfo
 $info.FileName='cmd.exe'
 $info.Arguments='/d /s /c "npx.cmd --yes pnpm@11.25.0 install --frozen-lockfile"'
 $info.WorkingDirectory=$folder;$info.UseShellExecute=$false;$info.CreateNoWindow=$true
 $info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true
 $p=New-Object Diagnostics.Process;$p.StartInfo=$info;$null=$p.Start()
 $stdout=$p.StandardOutput.ReadToEndAsync();$stderr=$p.StandardError.ReadToEndAsync();$p.WaitForExit()
 [IO.File]::WriteAllText((Join-Path $root 'local-app-install.log'),($stdout.Result+[Environment]::NewLine+$stderr.Result))
 if($p.ExitCode -ne 0){throw 'Dependency install failed'}
 [IO.File]::WriteAllText((Join-Path $root 'local-app-location.txt'),$folder)
 [pscustomobject]@{LocalAppPreparation='PASS';Commit=$sha;FrozenLockfile=$true;SecretsLoaded=$false;ProductionChanged=$false}|ConvertTo-Json -Compress
}catch{[pscustomobject]@{LocalAppPreparation='FAIL';Stage=$stage;Details='Inspect local private log'}|ConvertTo-Json -Compress;exit 1}
