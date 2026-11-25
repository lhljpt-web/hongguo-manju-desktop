param(
  [Parameter(Mandatory=$true)][string]$InstallDirectory,
  [Parameter(Mandatory=$true)][string]$AppExecutable,
  [string]$LogPath,
  [ValidateRange(1,60)][int]$WaitSeconds=20
)
$ErrorActionPreference='Stop'
function Report([string]$message) {
  Write-Output $message
  if ($LogPath) { try { Add-Content -LiteralPath $LogPath -Value ((Get-Date -Format o)+' '+$message) -Encoding UTF8 -ErrorAction Stop } catch {} }
}
try {
  $installRoot=[IO.Path]::GetFullPath($InstallDirectory).TrimEnd('\')
  if ($installRoot.Length -le [IO.Path]::GetPathRoot($installRoot).Length -or [IO.Path]::GetFileName($AppExecutable) -ne $AppExecutable) { throw 'Invalid install path' }
  $mainPath=[IO.Path]::Combine($installRoot,$AppExecutable)
  Report ('Checking installed components: '+$mainPath)
  $runtimeRoot=[IO.Path]::Combine($installRoot,'resources','runtime-bundle')
  $workerPaths=@([IO.Path]::Combine($runtimeRoot,'java','bin','java.exe'),[IO.Path]::Combine($runtimeRoot,'ffmpeg.exe'),[IO.Path]::Combine($installRoot,'resources','sdk-playback','hongguo-sdk-playback.exe'))
  function Get-InstalledProcesses {
    # ExecutablePath is available on Win32_Process; never match by image name alone.
    Get-CimInstance -ClassName Win32_Process | Where-Object { $_.ExecutablePath -and ($_.ExecutablePath -eq $mainPath -or $workerPaths -contains $_.ExecutablePath) }
  }
  $deadline=[DateTime]::UtcNow.AddSeconds($WaitSeconds)
  do {
    $installed=@(Get-InstalledProcesses)
    if (-not @($installed | Where-Object { $_.ExecutablePath -eq $mainPath }).Count) { break }
    if ([DateTime]::UtcNow -ge $deadline) { Report 'Client still running; exit from its tray menu and retry. No files were deleted.'; exit 10 }
    Start-Sleep -Milliseconds 200
  } while ($true)
  foreach ($worker in @($installed | Where-Object { $workerPaths -contains $_.ExecutablePath })) {
    $process=Get-Process -Id $worker.ProcessId -ErrorAction SilentlyContinue
    if (-not $process) { continue }
    # Recheck the live image to avoid terminating an unrelated reused PID.
    # A 32-bit NSIS-launched PowerShell cannot read .Path for a 64-bit worker.
    # CIM exposes ExecutablePath in both bitnesses; compare creation time too.
    $live=Get-CimInstance -ClassName Win32_Process -Filter ('ProcessId = '+$worker.ProcessId)
    if (-not $live) { continue }
    if ($workerPaths -notcontains $live.ExecutablePath -or $live.CreationDate -ne $worker.CreationDate) { throw 'Worker identity could not be verified' }
    Report ('Stopping leftover runtime PID '+$process.Id)
    $process.Kill()
    if (-not $process.WaitForExit(5000)) { throw 'Runtime did not exit' }
  }
  if (@(Get-InstalledProcesses).Count) { throw 'Installed components are still running' }
  Report 'Installed components have exited. Media cache and application data are unchanged.'
  exit 0
} catch {
  Report ('Cannot release installed components: '+$_.Exception.Message)
  exit 20
}
