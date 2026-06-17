"""
Route: /api/limits
==================
Daily usage limit per feature per user.
- generate      : 5x per hari
- recommendation: 2x per hari
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

# Timezone WIB — daily limit reset setiap tengah malam WIB (= 07:00 UTC)
_WIB = ZoneInfo("Asia/Jakarta")

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from models.generation import GenerationHistory
from models.user import User
from core.auth import get_current_user

router = APIRouter()

# Daily limits per feature
DAILY_LIMITS: dict[str, int] = {
    "generate": 5,
    "recommendation": 2,
}

# Model prefix di GenerationHistory yang menandai feature
FEATURE_MODEL_PREFIX: dict[str, list[str]] = {
    "generate": ["hd", "genius", "super-genius"],
    "recommendation": ["recommendation/"],
}


class LimitStatusResponse(BaseModel):
    feature: str
    used_today: int
    daily_limit: int
    remaining: int
    reset_at: str  # ISO datetime string — tengah malam WIB berikutnya (07:00 UTC)


class UseResponse(BaseModel):
    success: bool
    feature: str
    used_today: int
    remaining: int
    message: str


async def _count_today_usage(user_id: uuid.UUID, feature: str, db: AsyncSession) -> int:
    """Hitung berapa kali user sudah pakai feature tertentu hari ini (WIB).
    Reset setiap tengah malam WIB = 07:00 UTC.
    """
    # Ambil waktu sekarang dalam WIB, lalu ambil awal hari (00:00 WIB)
    now_wib = datetime.now(_WIB)
    today_start_wib = now_wib.replace(hour=0, minute=0, second=0, microsecond=0)
    # Konversi ke UTC untuk query DB
    today_start = today_start_wib.astimezone(timezone.utc)

    prefixes = FEATURE_MODEL_PREFIX.get(feature, [feature])

    result = await db.execute(
        select(GenerationHistory).where(
            GenerationHistory.user_id == user_id,
            GenerationHistory.created_at >= today_start,
        )
    )
    records = result.scalars().all()

    count = 0
    for r in records:
        model = r.model_used or ""
        for prefix in prefixes:
            if model.startswith(prefix) or model == prefix:
                count += 1
                break

    return count


@router.get("/status/{feature}", response_model=LimitStatusResponse)
async def get_limit_status(
    feature: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cek sisa limit harian untuk feature tertentu.
    Feature: 'generate' atau 'recommendation'
    """
    if feature not in DAILY_LIMITS:
        raise HTTPException(status_code=400, detail=f"Feature tidak dikenal: {feature}")

    user_id = current_user.id
    daily_limit = DAILY_LIMITS[feature]
    used_today = await _count_today_usage(user_id, feature, db)
    remaining = max(0, daily_limit - used_today)

    # Waktu reset = tengah malam WIB berikutnya (= 07:00 UTC hari ini atau besok)
    now_wib = datetime.now(_WIB)
    next_reset_wib = (now_wib + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    reset_at = next_reset_wib.astimezone(timezone.utc).isoformat()

    return LimitStatusResponse(
        feature=feature,
        used_today=used_today,
        daily_limit=daily_limit,
        remaining=remaining,
        reset_at=reset_at,
    )


@router.post("/check/{feature}", response_model=UseResponse)
async def check_and_use_limit(
    feature: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cek apakah user masih punya sisa limit, lalu catat penggunaan.
    Dipanggil oleh frontend sebelum melakukan generate/recommendation.
    Mengembalikan error 429 jika limit habis.
    """
    if feature not in DAILY_LIMITS:
        raise HTTPException(status_code=400, detail=f"Feature tidak dikenal: {feature}")

    user_id = current_user.id
    daily_limit = DAILY_LIMITS[feature]
    used_today = await _count_today_usage(user_id, feature, db)

    if used_today >= daily_limit:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "daily_limit_exceeded",
                "feature": feature,
                "used_today": used_today,
                "daily_limit": daily_limit,
                "message": f"Batas harian {feature} ({daily_limit}x/hari) sudah tercapai. Reset besok.",
            },
        )

    remaining = max(0, daily_limit - used_today - 1)

    return UseResponse(
        success=True,
        feature=feature,
        used_today=used_today,
        remaining=remaining,
        message=f"OK — sisa {remaining} penggunaan hari ini",
    )
