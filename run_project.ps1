# CFM56-5B4 Turbofan Digital Twin - PowerShell Launcher
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   CFM56-5B4 TURBOFAN DIGITAL TWIN LAUNCHER" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $projectRoot

Write-Host "[1/2] Starting Flask Backend API on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot'; python src/dashboard_api.py"

Write-Host "[2/2] Starting Vite Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot/dashboard'; npm run dev -- --host 127.0.0.1 --port 5173"

Write-Host ""
Write-Host "Waiting 5 seconds for engines and models to load..." -ForegroundColor Gray
Start-Sleep -Seconds 5

Write-Host "Opening browser..." -ForegroundColor Green
Start-Process "http://127.0.0.1:5173"

Write-Host ""
Write-Host "All systems operational!" -ForegroundColor Green
Write-Host "Backend API:  http://127.0.0.1:5000" -ForegroundColor White
Write-Host "Frontend UI:  http://127.0.0.1:5173" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
