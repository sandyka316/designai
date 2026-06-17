# ── Base image: Python 3.11 slim (Debian-based, lebih ringan dari Ubuntu) ──
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies yang dibutuhkan (untuk asyncpg, torch, pillow, dll.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements dulu (untuk layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy seluruh source code
COPY . .

# Expose port FastAPI
EXPOSE 8000

# Jalankan uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
