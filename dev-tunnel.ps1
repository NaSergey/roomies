# dev-tunnel.ps1
# Starts full dev stack with cloudflare tunnels for front (3000) and back (4000).
#
# Usage: .\dev-tunnel.ps1
#
# Steps:
#   1. Start NestJS backend (npm run start:dev) in a new window
#   2. Start cloudflared tunnel for port 4000, wait for URL
#   3. Update front/.env.local with NEXT_PUBLIC_API_URL=<backend-tunnel-url>
#   4. Start frontend + its cloudflared tunnel (npm run tunnel) in this window
#      -- paste the frontend URL into BotFather as the Web App URL

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

# cloudflared installed via npm wraps a real exe here:
$cloudflaredExe = "$env:APPDATA\npm\node_modules\cloudflared\bin\cloudflared.exe"
if (-not (Test-Path $cloudflaredExe)) {
    $cfCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cfCmd -and $cfCmd.Source -notmatch '\.ps1$') {
        $cloudflaredExe = $cfCmd.Source
    } else {
        Write-Error "cloudflared.exe not found. Run: npm install -g cloudflared"
        exit 1
    }
}

# -- 1. Backend ---------------------------------------------------------------
Write-Host ""
Write-Host "==> [1/3] Starting NestJS backend (port 4000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$projectRoot\roomies back'; npm run start:dev"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# -- 2. Cloudflare tunnel for backend (port 4000) ----------------------------
Write-Host "==> [2/3] Starting cloudflare tunnel for backend (port 4000)..." -ForegroundColor Cyan

$backLogFile = "$env:TEMP\cf-back-roomies.log"
if (Test-Path $backLogFile) { Remove-Item $backLogFile -Force }

$cfBackProc = Start-Process $cloudflaredExe `
    -ArgumentList "tunnel", "--url", "http://localhost:4000" `
    -RedirectStandardError $backLogFile `
    -PassThru -WindowStyle Hidden

Write-Host "    Waiting for tunnel URL (up to 60s)..."
$backUrl = $null
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $backLogFile) {
        $content = Get-Content $backLogFile -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-z0-9\-]+\.trycloudflare\.com') {
            $backUrl = $Matches[0]
            break
        }
    }
}

if (-not $backUrl) {
    Write-Error "Timeout: could not get backend tunnel URL. Is cloudflared installed?"
    Stop-Process -Id $cfBackProc.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "    Backend tunnel: $backUrl" -ForegroundColor Green

# -- 3. Update front/.env.local ----------------------------------------------
Write-Host "==> [3/3] Updating front/.env.local..." -ForegroundColor Cyan
$envLocalPath = "$projectRoot\front\.env.local"
Set-Content -Path $envLocalPath -Value "NEXT_PUBLIC_API_URL=$backUrl" -Encoding utf8
Write-Host "    NEXT_PUBLIC_API_URL=$backUrl" -ForegroundColor Green

# -- 4. Frontend + its tunnel ------------------------------------------------
Write-Host ""
Write-Host "==> Starting frontend (next dev + cloudflare tunnel on port 3000)" -ForegroundColor Cyan
Write-Host "    The frontend tunnel URL will appear below." -ForegroundColor Yellow
Write-Host "    Paste it into BotFather as your Mini App URL." -ForegroundColor Yellow
Write-Host "    Press Ctrl+C to stop the frontend (close backend window manually)." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor DarkGray
Write-Host ""

Set-Location "$projectRoot\front"
npm run tunnel
