import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        host='localhost', port=5432,
        database='designai_db', user='designai', password='designai_secret'
    )

    # Total semua data
    total = await conn.fetchval('SELECT COUNT(*) FROM generation_history')

    # Status breakdown
    status_rows = await conn.fetch(
        'SELECT status, COUNT(*) as cnt FROM generation_history GROUP BY status ORDER BY cnt DESC'
    )

    # Data dengan prompt (untuk semantic search)
    with_prompt = await conn.fetchval(
        "SELECT COUNT(*) FROM generation_history WHERE prompt IS NOT NULL AND prompt != ''"
    )

    # Kolom yang tersedia
    cols = await conn.fetch(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='generation_history' ORDER BY ordinal_position"
    )

    # Sample 5 data
    samples = await conn.fetch(
        "SELECT id, status, LEFT(prompt, 60) as prompt_preview, created_at FROM generation_history ORDER BY created_at DESC LIMIT 5"
    )

    print(f"{'='*55}")
    print(f"TOTAL DATA         : {total}")
    print(f"{'='*55}")
    print("STATUS BREAKDOWN:")
    for row in status_rows:
        print(f"  {row['status']:<15} : {row['cnt']}")
    print(f"{'='*55}")
    print(f"Data dengan prompt  : {with_prompt}")
    print(f"{'='*55}")
    print("KOLOM TABEL generation_history:")
    for col in cols:
        print(f"  {col['column_name']:<28} {col['data_type']}")
    print(f"{'='*55}")
    print("SAMPLE 5 DATA TERBARU:")
    for row in samples:
        print(f"  status={row['status']:<10} | prompt={row['prompt_preview']} | date={row['created_at']}")

    await conn.close()

asyncio.run(main())
