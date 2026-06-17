import asyncio
import asyncpg

async def test():
    try:
        conn = await asyncpg.connect(
            "postgresql://designai:designai_secret@127.0.0.1:5432/designai_db"
        )
        version = await conn.fetchval("SELECT version()")
        print(f"✅ Connected! {version}")
        await conn.close()
    except Exception as e:
        import traceback
        print(f"❌ Error type: {type(e).__name__}")
        print(f"❌ Error: {e}")
        traceback.print_exc()

asyncio.run(test())
