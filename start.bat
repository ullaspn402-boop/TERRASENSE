@echo off
title TerraSense Launcher
echo ========================================================
echo    TERRASENSE - AI Environmental Decision System
echo ========================================================
echo.

:: 1. Check for .env file
if not exist .env (
    echo [INFO] .env not found. Creating from .env.example...
    copy .env.example .env >nul
    echo [IMPORTANT] Please update your DATABASE_URL in .env if using a custom database!
    echo.
)

:: 2. Check and install Python dependencies
echo [1/3] Checking Python dependencies...
python -m pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [WARNING] Could not automatically install Python packages. Ensure Python 3.10+ is installed.
)

:: 3. Check and install Node dependencies
echo [2/3] Checking Node.js dependencies...
if not exist node_modules (
    echo [INFO] Installing npm packages...
    call npm install
)

:: 4. Start servers
echo [3/3] Launching FastAPI Backend and Next.js Frontend...
echo.
echo FastAPI Backend running at:  http://127.0.0.1:8000
echo Next.js Dashboard running at: http://localhost:3000
echo.

start "TerraSense FastAPI Backend" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 >nul
start "" "http://localhost:3000"
call npm run dev
