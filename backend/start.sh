#!/bin/bash
# ================================================================
# start.sh — Jalankan DesignAI Backend (setelah setup selesai)
# Jalankan: bash start.sh
# ================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND_DIR="/mnt/d/app/Celerates/backend"

echo -e "${YELLOW}[1/3] Starting PostgreSQL...${NC}"
sudo service postgresql start
echo -e "${GREEN}✓ PostgreSQL running${NC}"

echo -e "${YELLOW}[2/3] Starting Redis...${NC}"
sudo service redis-server start
echo -e "${GREEN}✓ Redis running${NC}"

echo -e "${YELLOW}[3/3] Starting FastAPI backend...${NC}"
cd "$BACKEND_DIR"
source venv_wsl/bin/activate

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🚀 Backend starting...               ${NC}"
echo -e "${GREEN}  API  → http://localhost:8000         ${NC}"
echo -e "${GREEN}  Docs → http://localhost:8000/docs    ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000
