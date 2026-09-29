$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$meterSource = [System.Drawing.Image]::FromFile((Join-Path $PSScriptRoot 'logo.png'))
$meterBitmap = New-Object System.Drawing.Bitmap 256,256
$meterGraphics = [System.Drawing.Graphics]::FromImage($meterBitmap)
$meterGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$meterGraphics.DrawImage($meterSource,0,0,256,256)
$meterStream = New-Object System.IO.MemoryStream
$meterBitmap.Save($meterStream,[System.Drawing.Imaging.ImageFormat]::Png)
$meterBytes = $meterStream.ToArray()
$meterFile = [System.IO.File]::Create((Join-Path $PSScriptRoot 'windows\codex-meter.ico'))
$meterWriter = New-Object System.IO.BinaryWriter $meterFile
try {
    $meterWriter.Write([uint16]0)
    $meterWriter.Write([uint16]1)
    $meterWriter.Write([uint16]1)
    $meterWriter.Write([byte]0)
    $meterWriter.Write([byte]0)
    $meterWriter.Write([byte]0)
    $meterWriter.Write([byte]0)
    $meterWriter.Write([uint16]1)
    $meterWriter.Write([uint16]32)
    $meterWriter.Write([uint32]$meterBytes.Length)
    $meterWriter.Write([uint32]22)
    $meterWriter.Write($meterBytes)
} finally {
    $meterWriter.Dispose()
    $meterGraphics.Dispose()
    $meterBitmap.Dispose()
    $meterSource.Dispose()
    $meterStream.Dispose()
}
Write-Output 'Windows-pictogram gemaakt.'
