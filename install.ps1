# Copies every wallpaper in wallpapers\ into Lively Wallpaper's library.
#
#   powershell -ExecutionPolicy Bypass -File install.ps1            copy only
#   powershell -ExecutionPolicy Bypass -File install.ps1 -Restart   copy, then restart Lively
#
# Lively reads its library when it starts, so a new wallpaper shows up after a
# restart. Nothing here needs admin rights. Re-running it is safe: it overwrites
# the wallpaper's files and leaves your saved settings for it alone.

param([switch]$Restart)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $here 'wallpapers'

# ---- find Lively's data folder (installer build, then the Microsoft Store build) ----
$candidates = @(Join-Path $env:LOCALAPPDATA 'Lively Wallpaper')
$candidates += Get-ChildItem (Join-Path $env:LOCALAPPDATA 'Packages') -Directory -Filter '*LivelyWallpaper*' -ErrorAction SilentlyContinue |
    ForEach-Object { Join-Path $_.FullName 'LocalCache\Local\Lively Wallpaper' }
$data = $candidates | Where-Object { Test-Path (Join-Path $_ 'Settings.json') } | Select-Object -First 1
if (-not $data) {
    Write-Host 'Lively Wallpaper has not been run on this account yet.' -ForegroundColor Yellow
    Write-Host 'Install it, start it once, then run this again: https://github.com/lively-community/lively' -ForegroundColor Yellow
    exit 1
}

# The library can be moved in Lively's settings; Settings.json says where it is.
$library = (Get-Content (Join-Path $data 'Settings.json') -Raw | ConvertFrom-Json).WallpaperDir
if (-not $library) { $library = Join-Path $data 'Library' }
$dest = Join-Path $library 'wallpapers'
New-Item -ItemType Directory -Force $dest | Out-Null
Write-Host "Lively library : $dest"

# ---- copy ----
foreach ($folder in Get-ChildItem $src -Directory) {
    if (-not (Test-Path (Join-Path $folder.FullName 'LivelyInfo.json'))) { continue }
    $target = Join-Path $dest $folder.Name
    New-Item -ItemType Directory -Force $target | Out-Null
    Copy-Item (Join-Path $folder.FullName '*') $target -Recurse -Force
    $n = (Get-ChildItem $folder.FullName -Recurse -File).Count
    Write-Host ("  copied {0,-24} {1,3} files" -f $folder.Name, $n)
}

# ---- restart ----
$names = 'Lively', 'Lively.UI.WinUI', 'Lively.Player.WebView2', 'Lively.Player.CefSharp', 'Lively.Watchdog'
$exe = (Get-Process -Name 'Lively' -ErrorAction SilentlyContinue | Select-Object -First 1).Path
if (-not $exe) { $exe = Join-Path $env:ProgramFiles 'Lively Wallpaper\Lively.exe' }
if ($Restart -and (Test-Path $exe)) {
    Get-Process -Name $names -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    Start-Process $exe
    Write-Host 'Lively restarted. The wallpapers are in its library now.'
} else {
    Write-Host 'Restart Lively (tray icon, Exit, then start it again) and the wallpapers appear in its library.'
}
