"""
Search route — Full-text search di generation history milik user.

Menggunakan PostgreSQL pg_trgm (trigram similarity) untuk fuzzy matching
pada kolom prompt dan enhanced_prompt, dengan fallback ke ILIKE.

Endpoint:
    GET /api/search?q={query}&limit=20
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, or_, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from models.generation import GenerationHistory
from schemas.dashboard import GalleryItem

router = APIRouter()

# Guest user UUID — sama dengan dashboard.py
_GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

# Warna gradient cycling (sama dengan dashboard.py)
_COLORS = [
    "from-amber-900/40 to-orange-900/20",
    "from-blue-900/40 to-cyan-900/20",
    "from-pink-900/40 to-rose-900/20",
    "from-purple-900/40 to-violet-900/20",
    "from-green-900/40 to-teal-900/20",
    "from-yellow-900/40 to-amber-900/20",
    "from-slate-800/60 to-gray-900/20",
    "from-lime-900/40 to-green-900/20",
]


def _time_ago(dt: datetime) -> str:
    """Konversi datetime ke string relatif: '2 mins ago', dst."""
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        m = seconds // 60
        return f"{m} min{'s' if m > 1 else ''} ago"
    elif seconds < 86400:
        h = seconds // 3600
        return f"{h} hour{'s' if h > 1 else ''} ago"
    elif seconds < 172800:
        return "Yesterday"
    else:
        d = seconds // 86400
        return f"{d} days ago"


@router.get("", response_model=list[GalleryItem])
async def search_generations(
    q: str = Query(..., min_length=1, max_length=200, description="Query pencarian"),
    limit: int = Query(20, ge=1, le=50, description="Jumlah maksimal hasil"),
    db: AsyncSession = Depends(get_db),
):
    """
    Cari gambar-gambar yang sudah digenerate berdasarkan kemiripan prompt.

    Strategi:
    1. Coba pg_trgm similarity (fuzzy match) pada prompt & enhanced_prompt
    2. Fallback ke ILIKE untuk memastikan exact substring match juga tertangkap
    3. Urutkan berdasarkan similarity score tertinggi, lalu terbaru

    Requires: PostgreSQL extension pg_trgm (diaktifkan via migration).
    """
    q_stripped = q.strip()
    if not q_stripped:
        raise HTTPException(status_code=422, detail="Query tidak boleh kosong.")

    like_pattern = f"%{q_stripped}%"

    try:
        # Gunakan pg_trgm similarity + ILIKE fallback
        # similarity() bekerja setelah pg_trgm diaktifkan
        stmt = (
            select(GenerationHistory)
            .where(
                GenerationHistory.user_id == _GUEST_USER_ID,
                GenerationHistory.status == "success",
                GenerationHistory.image_url.isnot(None),
                # Kondisi: trgm match ATAU substring match (ILIKE)
                text(
                    "(prompt % :q "
                    "OR COALESCE(enhanced_prompt, '') % :q "
                    "OR prompt ILIKE :like "
                    "OR COALESCE(enhanced_prompt, '') ILIKE :like)"
                ).bindparams(q=q_stripped, like=like_pattern),
            )
            .order_by(
                # Urutkan berdasarkan similarity score tertinggi
                text(
                    "GREATEST("
                    "  similarity(prompt, :q), "
                    "  similarity(COALESCE(enhanced_prompt, ''), :q)"
                    ") DESC"
                ).bindparams(q=q_stripped),
                GenerationHistory.created_at.desc(),
            )
            .limit(limit)
        )

        result = await db.execute(stmt)
        records = result.scalars().all()

    except Exception:
        # Fallback jika pg_trgm belum diaktifkan — pakai ILIKE saja
        stmt_fallback = (
            select(GenerationHistory)
            .where(
                GenerationHistory.user_id == _GUEST_USER_ID,
                GenerationHistory.status == "success",
                GenerationHistory.image_url.isnot(None),
                or_(
                    GenerationHistory.prompt.ilike(like_pattern),
                    GenerationHistory.enhanced_prompt.ilike(like_pattern),
                ),
            )
            .order_by(GenerationHistory.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(stmt_fallback)
        records = result.scalars().all()

    return [
        GalleryItem(
            id=str(r.id),
            prompt=r.prompt[:60] + ("..." if len(r.prompt) > 60 else ""),
            image_url=r.image_url,
            color=_COLORS[i % len(_COLORS)],
            time=_time_ago(r.created_at),
        )
        for i, r in enumerate(records)
    ]
