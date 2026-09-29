$ErrorActionPreference = 'Stop'
$meterRoot = $PSScriptRoot
$meterExe = Join-Path $meterRoot 'windows\Codex Meter.exe'
$meterIcon = Join-Path $meterRoot 'windows\codex-meter.ico'
if (!(Test-Path -LiteralPath $meterExe)) { throw 'Codex Meter.exe ontbreekt.' }
if (!(Test-Path -LiteralPath $meterIcon)) { throw 'Het pictogram ontbreekt.' }
$meterDesktop = [Environment]::GetFolderPath('Desktop')
$meterLinkPath = Join-Path $meterDesktop 'Codex Meter.lnk'
$meterShell = New-Object -ComObject WScript.Shell
$meterLink = $meterShell.CreateShortcut($meterLinkPath)
$meterLink.TargetPath = $meterExe
$meterLink.WorkingDirectory = Split-Path -Parent $meterExe
$meterLink.IconLocation = "$meterIcon,0"
$meterLink.Description = 'Codex Meter - tegoed, verbruik en resetmomenten'
$meterLink.Save()
$meterCheck = $meterShell.CreateShortcut($meterLinkPath)
if ($meterCheck.TargetPath -ne $meterExe -or $meterCheck.IconLocation -ne "$meterIcon,0") { throw 'Controle van de snelkoppeling mislukt.' }
Write-Output "Bureaubladsnelkoppeling aangemaakt en gecontroleerd: $meterLinkPath"
