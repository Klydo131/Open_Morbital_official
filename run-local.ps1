# Open Morbital local runner for Windows.
# Copies the app to a user-local workspace before installing dependencies.

$ErrorActionPreference = "Stop"

$source = $PSScriptRoot
$dest = Join-Path $env:LOCALAPPDATA "Open_Morbital\app"
$excludeNames = @("node_modules", "dist", ".env", ".git", "*.log")

Write-Host ""
Write-Host "Open Morbital Local Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest | Out-Null
    Write-Host "Created local workspace: $dest"
}

$sourcePath = (Resolve-Path $source).Path.TrimEnd("\")
$destPath = (Resolve-Path $dest).Path.TrimEnd("\")

if ($sourcePath -ieq $destPath) {
    Write-Host "Using local workspace: $dest"
} else {
    Write-Host "Copying app files to: $dest"
    Get-ChildItem -Path $source -Force | Where-Object {
        $name = $_.Name
        -not ($excludeNames | Where-Object { $name -like $_ })
    } | ForEach-Object {
        $target = Join-Path $dest $_.Name
        Copy-Item -LiteralPath $_.FullName -Destination $target -Recurse -Force
    }
}

Set-Location $dest

if (Test-Path "package-lock.json") {
    Write-Host "Installing dependencies with npm ci..." -ForegroundColor Yellow
    npm.cmd ci --no-audit --no-fund
} else {
    Write-Host "Installing dependencies with npm install..." -ForegroundColor Yellow
    npm.cmd install --no-audit --no-fund
}

Write-Host ""
Write-Host "Starting Open Morbital. Use the local address printed by Vite." -ForegroundColor Green
npm.cmd run dev
