"""
generate_embeddings.py — Script untuk generate CLIP embeddings semua prompt di DB
==================================================================================
Jalankan sekali untuk mengisi kolom `embedding` di tabel generation_history.

Usage:
    cd backend
    python generate_embeddings.py
"""

import asyncio
import json
import sys
import os

# Tambah path agar bisa import dari backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncpg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Gunakan individual POSTGRES_* env vars (bukan DATABASE_URL)
def get_db_config() -> dict:
    return {
        "user": os.getenv("POSTGRES_USER", "designai"),
        "password": os.getenv("POSTGRES_PASSWORD", "designai_secret"),
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "database": os.getenv("POSTGRES_DB", "designai_db"),
    }


async def main():
    print("[VSM] Mulai generate embeddings untuk semua prompt...")
    
    # Import CLIP service
    from services.vsm_service import encode_text, embedding_to_json
    
    db_config = get_db_config()
    print(f"[VSM] Connecting to {db_config['host']}:{db_config['port']}/{db_config['database']} as {db_config['user']}")
    conn = await asyncpg.connect(**db_config)
    
    try:
        # Cek apakah kolom embedding sudah ada, jika belum buat dulu
        col_exists = await conn.fetchval("""
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name='generation_history' AND column_name='embedding'
        """)
        if not col_exists:
            print("[VSM] Kolom 'embedding' belum ada, membuat kolom...")
            await conn.execute("""
                ALTER TABLE generation_history ADD COLUMN embedding TEXT
            """)
            print("[VSM] Kolom 'embedding' berhasil dibuat.")
        else:
            print("[VSM] Kolom 'embedding' sudah ada.")

        # Ambil semua row yang punya prompt
        rows = await conn.fetch("""
            SELECT id, prompt, enhanced_prompt, status
            FROM generation_history
            WHERE prompt IS NOT NULL
            ORDER BY created_at ASC
        """)
        
        print(f"[VSM] Ditemukan {len(rows)} baris dengan prompt.")
        
        success_count = 0
        skip_count = 0
        error_count = 0
        
        for i, row in enumerate(rows, 1):
            row_id = row["id"]
            prompt = row["prompt"]
            enhanced = row["enhanced_prompt"]
            
            # Gabung prompt + enhanced_prompt untuk embedding yang lebih kaya
            text_for_embedding = prompt
            if enhanced and enhanced.strip():
                text_for_embedding = f"{prompt} {enhanced}"
            
            try:
                short_prompt = prompt[:60] + "..." if len(prompt) > 60 else prompt
                print(f"[{i}/{len(rows)}] Encoding: '{short_prompt}' ", end="", flush=True)
                
                embedding = encode_text(text_for_embedding)
                embedding_json = embedding_to_json(embedding)
                
                # Simpan ke DB
                await conn.execute("""
                    UPDATE generation_history
                    SET embedding = $1
                    WHERE id = $2
                """, embedding_json, row_id)
                
                print(f"✅ (dim={len(embedding)})")
                success_count += 1
                
            except Exception as e:
                print(f"❌ Error: {e}")
                error_count += 1
        
        print(f"\n[VSM] Selesai!")
        print(f"  ✅ Berhasil: {success_count}")
        print(f"  ⏭️  Dilewati: {skip_count}")
        print(f"  ❌ Error   : {error_count}")
        
        # Verifikasi
        count = await conn.fetchval("""
            SELECT COUNT(*) FROM generation_history WHERE embedding IS NOT NULL
        """)
        print(f"\n[VSM] Total baris dengan embedding: {count}")
        
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
