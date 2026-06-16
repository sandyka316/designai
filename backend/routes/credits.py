"""
Route: /api/credits
===================
Fuzzy Logic Credit Scoring — hitung dan klaim bonus kredit
berdasarkan aktivitas user.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from models.generation import GenerationHistory
from models.user import User
from schemas.credits import FuzzyCreditResponse, ActivityMetricsResponse, MembershipResponse, ModifierResponse
from services.fuzzy_credit_service import (
    ActivityMetrics,
    compute_fuzzy_credits,
    _quality_modifier,
    _recency_modifier,
)

router = APIRouter()

# Guest user UUID
_GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def _get_activity_metrics(user_id: uuid.UUID, db: AsyncSession) -> ActivityMetrics:
    """Ambil ActivityMetrics user dari database."""
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    # Generasi dalam 7 hari terakhir
    result = await db.execute(
        select(GenerationHistory).where(
            GenerationHistory.user_id == user_id,
            GenerationHistory.created_at >= week_ago,
        )
    )
    recent_gens = result.scalars().all()
    generations_this_week = len(recent_gens)

    # Success rate (semua waktu)
    all_result = await db.execute(
        select(GenerationHistory).where(GenerationHistory.user_id == user_id)
    )
    all_gens = all_result.scalars().all()
    if all_gens:
        success_count = sum(1 for g in all_gens if g.status == "success")
        success_rate = success_count / len(all_gens)
        avg_prompt_length = sum(len(g.prompt) for g in all_gens) / len(all_gens)
    else:
        success_rate = 0.0
        avg_prompt_length = 0.0

    # Hari sejak generate terakhir
    last_gen_result = await db.execute(
        select(GenerationHistory)
        .where(GenerationHistory.user_id == user_id)
        .order_by(GenerationHistory.created_at.desc())
        .limit(1)
    )
    last_gen = last_gen_result.scalar_one_or_none()
    if last_gen:
        delta = now - last_gen.created_at.replace(tzinfo=timezone.utc)
        days_since_last_gen = delta.days
    else:
        days_since_last_gen = 999  # belum pernah generate

    return ActivityMetrics(
        generations_this_week=generations_this_week,
        success_rate=round(success_rate, 4),
        avg_prompt_length=round(avg_prompt_length, 1),
        days_since_last_gen=days_since_last_gen,
    )


@router.get("/status", response_model=FuzzyCreditResponse)
async def get_credit_status(db: AsyncSession = Depends(get_db)):
    """
    Hitung status kredit fuzzy user saat ini.
    Jika user memiliki bonus yang belum diklaim, kredit otomatis ditambahkan.
    """
    user_id = _GUEST_USER_ID

    # Ambil user
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    # Hitung aktivitas
    metrics = await _get_activity_metrics(user_id, db)

    # Fuzzy scoring
    fuzzy_result = compute_fuzzy_credits(metrics)

    # Hitung modifiers untuk response
    quality_mod = _quality_modifier(metrics.success_rate, metrics.avg_prompt_length)
    recency_mod = _recency_modifier(metrics.days_since_last_gen)

    # Award bonus jika ada (langsung tambahkan)
    credits_awarded = False
    new_credits_total = None
    message = "Status kredit berhasil dihitung."

    if fuzzy_result.bonus_credits > 0:
        user.credits_total += fuzzy_result.bonus_credits
        await db.commit()
        await db.refresh(user)
        credits_awarded = True
        new_credits_total = user.credits_total
        message = f"🎉 {fuzzy_result.bonus_credits} kredit bonus berhasil ditambahkan!"

    return FuzzyCreditResponse(
        bonus_credits=fuzzy_result.bonus_credits,
        activity_label=fuzzy_result.activity_label,
        activity_score=fuzzy_result.activity_score,
        membership=MembershipResponse(**fuzzy_result.membership),
        modifiers=ModifierResponse(quality=round(quality_mod, 3), recency=round(recency_mod, 3)),
        reasoning=fuzzy_result.reasoning,
        input_metrics=ActivityMetricsResponse(
            generations_this_week=metrics.generations_this_week,
            success_rate=metrics.success_rate,
            avg_prompt_length=metrics.avg_prompt_length,
            days_since_last_gen=metrics.days_since_last_gen,
        ),
        credits_awarded=credits_awarded,
        new_credits_total=new_credits_total,
        message=message,
    )
