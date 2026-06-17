"""
Script untuk cek isi database - debug analytics data.
Jalankan: python check_db.py
"""
import asyncio
from sqlalchemy import select
from database.session import AsyncSessionLocal
from models.generation import GenerationHistory


async def check():
    async with AsyncSessionLocal() as session:
        stmt = select(GenerationHistory).order_by(GenerationHistory.created_at.desc()).limit(20)
        result = await session.execute(stmt)
        records = result.scalars().all()

        print(f"\n{'='*70}")
        print(f"  Total 20 records terbaru di database")
        print(f"{'='*70}")

        if not records:
            print("  [KOSONG] Tidak ada data di tabel generation_history!")
            return

        for r in records:
            ts = r.created_at.strftime("%Y-%m-%d %H:%M")
            uid = str(r.user_id)[:8]
            prompt_preview = r.prompt[:65]
            print(f"  [{r.status:7}] user={uid}... | {ts} | {prompt_preview}")

        print()
        # Hitung per status
        success = sum(1 for r in records if r.status == "success")
        failed  = sum(1 for r in records if r.status == "failed")
        print(f"  Status breakdown (dari 20 terbaru): success={success}, failed={failed}")

        # Cek user_id
        guest_id = "00000000"
        guest_count = sum(1 for r in records if str(r.user_id).startswith(guest_id))
        print(f"  Guest user records: {guest_count}")
        print()


asyncio.run(check())
