import json
from typing import Any

import redis.asyncio as aioredis

from core.config import settings

# Single shared Redis client (connection pool otomatis)
_redis_client: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    """Ambil Redis client singleton (lazy init)."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def close_redis() -> None:
    """Tutup koneksi Redis saat shutdown."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None


# ─── Caching helpers ──────────────────────────────────────────────────────────

async def cache_get(key: str) -> Any | None:
    """Ambil nilai dari cache. Return None jika tidak ada."""
    redis = get_redis()
    value = await redis.get(key)
    if value is None:
        return None
    return json.loads(value)


async def cache_set(key: str, value: Any, ttl: int = 60) -> None:
    """Simpan nilai ke cache dengan TTL dalam detik."""
    redis = get_redis()
    await redis.setex(key, ttl, json.dumps(value))


async def cache_delete(key: str) -> None:
    """Hapus cache berdasarkan key."""
    redis = get_redis()
    await redis.delete(key)


async def cache_delete_pattern(pattern: str) -> None:
    """Hapus semua cache yang cocok dengan pattern (misal: 'dashboard:*')."""
    redis = get_redis()
    keys = await redis.keys(pattern)
    if keys:
        await redis.delete(*keys)


# ─── Rate limiting helpers ────────────────────────────────────────────────────

async def rate_limit_check(identifier: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    """
    Cek apakah identifier (user_id / IP) sudah melewati rate limit.

    Returns:
        (allowed: bool, current_count: int)

    Contoh:
        allowed, count = await rate_limit_check(f"rl:generate:{user_id}", 10, 60)
        if not allowed:
            raise HTTPException(429, "Rate limit exceeded")
    """
    redis = get_redis()
    key = f"rate_limit:{identifier}"

    pipe = redis.pipeline()
    await pipe.incr(key)
    await pipe.expire(key, window_seconds)
    results = await pipe.execute()

    current_count: int = results[0]
    allowed = current_count <= limit
    return allowed, current_count


# ─── Job Queue helpers (ARQ-compatible) ───────────────────────────────────────

async def enqueue_job(queue_name: str, payload: dict) -> str:
    """
    Tambah job ke Redis list queue.
    ARQ akan pick up job ini secara otomatis.

    Returns: job_id (UUID string)
    """
    import uuid
    redis = get_redis()
    job_id = str(uuid.uuid4())
    job = {"job_id": job_id, **payload}
    await redis.lpush(queue_name, json.dumps(job))
    return job_id


async def get_job_status(job_id: str) -> dict | None:
    """Ambil status job dari Redis (disimpan oleh worker)."""
    redis = get_redis()
    value = await redis.get(f"job:status:{job_id}")
    if value is None:
        return None
    return json.loads(value)


async def set_job_status(job_id: str, status: dict, ttl: int = 3600) -> None:
    """Worker memanggil ini untuk update status job."""
    redis = get_redis()
    await redis.setex(f"job:status:{job_id}", ttl, json.dumps(status))
