@echo off
title CFM56-5B4 Digital Twin - Startup Launcher
echo ========================================================
echo   CFM56-5B4 TURBOFAN DIGITAL TWIN LAUNCHER
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Flask Backend API on port 5000...
start "CFM56 Backend API (Port 5000)" cmd /k "python src/dashboard_api.py"

echo [2/2] Starting Vite Frontend on port 5173...
start "CFM56 Frontend UI (Port 5173)" cmd /k "cd dashboard && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Waiting 5 seconds for services to initialize...
timeout /t 5 /nobreak >nul

echo Opening browser at http://127.0.0.1:5173 ...
start http://127.0.0.1:5173

echo.
echo ========================================================
echo   Both services are now running!
echo   - Backend:  http://127.0.0.1:5000
echo   - Frontend: http://127.0.0.1:5173
echo ========================================================
echo (You can close this launcher window. The server windows will stay open.)
pause
