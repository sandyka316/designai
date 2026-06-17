#!/bin/bash
# ================================================================
# Setup Script — DesignAI Backend di WSL Ubuntu
# Jalankan: bash setup_wsl.sh
# ================================================================

set -e  # stop kalau ada error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  DesignAI Backend — WSL Setup Script  ${NC}"
echo -e "${GREEN}========================================${NC}"

# ── 1. Update apt ────────────────────────────────────────────────
echo -e "\n${YELLOW}[1/7] Update package list...${NC}"
sudo apt-get update -y

# ── 2. Install Python 3.11 ───────────────────────────────────────
echo -e "\n${YELLOW}[2/7] Install Python 3.11...${NC}"
sudo apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt-get update -y
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev python3-pip

python3.11 --version
echo -e "${GREEN}✓ Python 3.11 installed${NC}"

# ── 3. Install PostgreSQL ────────────────────────────────────────
echo -e "\n${YELLOW}[3/7] Install PostgreSQL 16...${NC}"
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL (WSL tidak auto-start service)
sudo service postgresql start
echo -e "${GREEN}✓ PostgreSQL installed & started${NC}"

# ── 4. Setup Database & User ─────────────────────────────────────
echo -e "\n${YELLOW}[4/7] Setup database designai_db...${NC}"
sudo -u postgres psql << 'SQL'
-- Buat user
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'designai') THEN
    CREATE USER designai WITH PASSWORD 'designai_secret';
  END IF;
END
$$;

-- Buat database
SELECT 'CREATE DATABASE designai_db OWNER designai'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'designai_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE designai_db TO designai;
\q
SQL
echo -e "${GREEN}✓ Database designai_db siap${NC}"

# ── 5. Install Redis ─────────────────────────────────────────────
echo -e "\n${YELLOW}[5/7] Install Redis...${NC}"
sudo apt-get install -y redis-server

# Set password Redis sesuai .env
sudo sed -i 's/^# requirepass .*/requirepass redis_secret/' /etc/redis/redis.conf
sudo sed -i 's/^requirepass .*/requirepass redis_secret/' /etc/redis/redis.conf
# Kalau baris requirepass belum ada sama sekali, tambahkan
grep -q "^requirepass" /etc/redis/redis.conf || echo "requirepass redis_secret" | sudo tee -a /etc/redis/redis.conf

sudo service redis-server start
echo -e "${GREEN}✓ Redis installed & started${NC}"

# ── 6. Buat venv & install dependencies ──────────────────────────
echo -e "\n${YELLOW}[6/7] Setup Python venv & install requirements...${NC}"

# Path ke backend (akses dari WSL via /mnt/d/)
BACKEND_DIR="/mnt/d/app/Celerates/backend"

cd "$BACKEND_DIR"

# Buat venv Linux (terpisah dari venv Windows)
python3.11 -m venv venv_wsl

source venv_wsl/bin/activate

pip install --upgrade pip
pip install -r requirements.txt --timeout 120 --retries 5

echo -e "${GREEN}✓ Dependencies installed${NC}"

# ── 7. Jalankan Alembic migration ────────────────────────────────
echo -e "\n${YELLOW}[7/7] Jalankan database migration...${NC}"

# Update .env agar POSTGRES_HOST pakai localhost (bukan container name)
# karena kita di WSL, bukan Docker
export POSTGRES_HOST=localhost
export REDIS_HOST=localhost

# Cek apakah ada alembic migrations
if [ -f "alembic.ini" ]; then
    alembic upgrade head
    echo -e "${GREEN}✓ Database migration selesai${NC}"
else
    echo -e "${YELLOW}⚠ alembic.ini tidak ditemukan, skip migration${NC}"
fi

# ── Done ─────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Setup SELESAI!                    ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Untuk JALANKAN backend, gunakan:"
echo -e "${YELLOW}  cd /mnt/d/app/Celerates/backend${NC}"
echo -e "${YELLOW}  source venv_wsl/bin/activate${NC}"
echo -e "${YELLOW}  uvicorn main:app --reload --host 0.0.0.0 --port 8000${NC}"
echo ""
echo -e "API tersedia di: ${GREEN}http://localhost:8000${NC}"
echo -e "Docs tersedia di: ${GREEN}http://localhost:8000/docs${NC}"
