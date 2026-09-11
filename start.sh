#!/usr/bin/env bash
set -e

echo "========================================================"
echo "   TERRASENSE - AI Environmental Decision System"
echo "========================================================"
echo ""

# 1. Check for .env file
if [ ! -f .env ]; then
    echo "[INFO] .env not found. Creating from .env.example..."
    cp .env.example .env
    echo "[IMPORTANT] Please update your DATABASE_URL in .env if using a custom database!"
    echo ""
fi

# 2. Check and install Python dependencies
echo "[1/3] Checking Python dependencies..."
python3 -m pip install -r requirements.txt --quiet || true

# 3. Check and install Node dependencies
echo "[2/3] Checking Node dependencies..."
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing npm packages..."
    npm install
fi

# 4. Start servers
echo "[3/3] Launching FastAPI Backend and Next.js Frontend..."
echo ""
echo "FastAPI Backend running at:  http://127.0.0.1:8000"
echo "Next.js Dashboard running at: http://localhost:3000"
echo ""

python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload &
FASTAPI_PID=$!

trap "kill $FASTAPI_PID" EXIT

sleep 2
npm run dev
