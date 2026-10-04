$ErrorActionPreference = 'Stop'
$meterVersion = (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'package.json') -Raw | ConvertFrom-Json).version
$meterRelease = Join-Path $PSScriptRoot 'release'
$meterInstaller = Join-Path $meterRelease "Codex-Meter-Setup-$meterVersion-x64.exe"
if (!(Test-Path -LiteralPath $meterInstaller)) { throw 'Build the Windows installer first.' }
$meterStage = Join-Path $meterRelease 'zip-stage'
New-Item -ItemType Directory -Path $meterStage -Force | Out-Null
$meterInstall = Join-Path $meterStage 'INSTALL.exe'
$meterReadme = Join-Path $meterStage 'LEESMIJ.txt'
Copy-Item -LiteralPath $meterInstaller -Destination $meterInstall -Force
@"
CODEX METER $meterVersion - WINDOWS

NEDERLANDS
1. Pak de ZIP volledig uit: rechtsklik > Alles uitpakken.
2. Dubbelklik op INSTALL.exe (Windows kan de naam als INSTALL tonen).
3. Volg de installer. Start daarna Codex Meter via het bureaublad of Startmenu.

UPDATEN
Sluit Codex Meter volledig via het icoon bij de klok > Afsluiten.
Dubbelklik op INSTALL.exe en gebruik dezelfde installatiemap als eerder.
Je hoeft de vorige versie niet te verwijderen. Je taalkeuze en Sync-koppeling
blijven bewaard wanneer je onder hetzelfde Windows-account bijwerkt.
Gebruikte je eerder alleen de losse portable map? Dan maakt deze installer
een normale installatie; start voortaan de nieuwe bureaubladsnelkoppeling.

De bron-pc heeft Codex met een actieve aanmelding nodig.
De gaming-pc kan Codex Meter Sync gebruiken zonder Codex te installeren.

ENGLISH
Extract the entire ZIP, then double-click INSTALL.exe and follow the installer.
For an update, quit Codex Meter from its tray menu and run INSTALL.exe again.
Use the existing installation folder and Windows account. Do not uninstall first.
Language and Sync settings are retained. If migrating from a portable folder,
use the new desktop shortcut after installing.

https://github.com/rpg86x/codex-meter
"@ | Set-Content -LiteralPath $meterReadme -Encoding utf8
$meterZip = Join-Path $meterRelease 'Codex-Meter-Windows.zip'
Compress-Archive -LiteralPath @($meterInstall, $meterReadme) -DestinationPath $meterZip -Force
# Verify the actual archive contents and the bytes of its installer.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$meterArchive = [IO.Compression.ZipFile]::OpenRead($meterZip)
try {
    $meterNames = @($meterArchive.Entries | ForEach-Object FullName | Sort-Object)
    if (($meterNames -join ',') -ne 'INSTALL.exe,LEESMIJ.txt') { throw 'Unexpected ZIP contents.' }
    $meterStream = $meterArchive.GetEntry('INSTALL.exe').Open()
    $meterHasher = [Security.Cryptography.SHA256]::Create()
    try { $meterPackedHash = [BitConverter]::ToString($meterHasher.ComputeHash($meterStream)).Replace('-', '') }
    finally { $meterStream.Dispose(); $meterHasher.Dispose() }
    if ($meterPackedHash -ne (Get-FileHash -LiteralPath $meterInstaller -Algorithm SHA256).Hash) { throw 'ZIP installer hash mismatch.' }
} finally { $meterArchive.Dispose() }
Write-Output "Verified $meterZip : INSTALL.exe + LEESMIJ.txt"
