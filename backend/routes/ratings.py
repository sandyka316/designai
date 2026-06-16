"""
Route: /api/ratings
====================
Neural Network Rating Prediction & Rating Submission.

- POST /predict  → prediksi rating sebelum generate
- POST /submit   → submit rating setelah generate, trigger retraining
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from models.generation import GenerationHistory
from schemas.ratings import (
    RatingPredictRequest,
    RatingPredictResponse,
    RatingSubmitRequest,
    RatingSubmitResponse,
)
from services.rating_predictor_service import get_predictor

router = APIRouter()

_GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

# Retrain setiap ada kelipatan N data baru
_RETRAIN_EVERY = 5


@router.post("/predict", response_model=RatingPredictResponse)
async def predict_rating(body: RatingPredictRequest):
    """
    Prediksi rating prompt (1-5 bintang) sebelum generate.
    Mode: heuristic (cold start) atau neural_network (setelah cukup data).
    """
    predictor = get_predictor()
    result = predictor.predict(body.prompt)

    return RatingPredictResponse(
        predicted_rating=result["predicted_rating"],
        confidence=result["confidence"],
        label=result["label"],
        score=result["score"],
        reasoning=result["reasoning"],
        mode=result["mode"],
        trained_samples=predictor.trained_samples,
        needs_more_data=predictor.needs_more_data,
    )


@router.post("/submit", response_model=RatingSubmitResponse)
async def submit_rating(body: RatingSubmitRequest, db: AsyncSession = Depends(get_db)):
    """
    Submit rating user untuk sebuah generation.
    Otomatis retrain Neural Network jika sudah cukup data.
    """
    # Cari generation
    try:
        gen_id = uuid.UUID(body.generation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="generation_id tidak valid.")

    result = await db.execute(
        select(GenerationHistory).where(
            GenerationHistory.id == gen_id,
            GenerationHistory.user_id == _GUEST_USER_ID,
        )
    )
    generation = result.scalar_one_or_none()

    if not generation:
        raise HTTPException(status_code=404, detail="Generation tidak ditemukan.")

    # Simpan rating
    generation.rating = body.rating
    generation.rating_reason = body.reason or None
    generation.rated_at = datetime.now(timezone.utc)
    await db.commit()

    # Cek apakah perlu retrain
    predictor = get_predictor()
    retrained = False

    # Ambil semua data yang sudah di-rating
    rated_result = await db.execute(
        select(GenerationHistory).where(
            GenerationHistory.user_id == _GUEST_USER_ID,
            GenerationHistory.rating.isnot(None),
            GenerationHistory.status == "success",
        )
    )
    rated_gens = rated_result.scalars().all()
    total_rated = len(rated_gens)

    # Retrain jika jumlah data kelipatan dari RETRAIN_EVERY
    should_retrain = (
        total_rated >= 10 and
        total_rated % _RETRAIN_EVERY == 0
    )

    if should_retrain:
        training_data = [
            {"prompt": g.prompt, "rating": g.rating}
            for g in rated_gens
            if g.prompt and g.rating
        ]
        retrained = predictor.train(training_data)

    message = f"Rating {body.rating}⭐ berhasil disimpan."
    if retrained:
        message += f" Neural Network diperbarui dengan {total_rated} data."
    elif total_rated < 10:
        message += f" Butuh {10 - total_rated} rating lagi untuk training Neural Network."

    return RatingSubmitResponse(
        success=True,
        message=message,
        trained_samples=predictor.trained_samples,
        retrained=retrained,
    )


@router.get("/stats")
async def get_rating_stats(db: AsyncSession = Depends(get_db)):
    """Statistik rating dan status Neural Network."""
    predictor = get_predictor()

    rated_result = await db.execute(
        select(GenerationHistory).where(
            GenerationHistory.user_id == _GUEST_USER_ID,
            GenerationHistory.rating.isnot(None),
        )
    )
    rated_gens = rated_result.scalars().all()

    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for g in rated_gens:
        if g.rating in rating_dist:
            rating_dist[g.rating] += 1

    avg_rating = (
        sum(g.rating for g in rated_gens) / len(rated_gens)
        if rated_gens else 0.0
    )

    return {
        "total_rated": len(rated_gens),
        "avg_rating": round(avg_rating, 2),
        "rating_distribution": rating_dist,
        "nn_status": {
            "is_trained": predictor.is_trained,
            "trained_samples": predictor.trained_samples,
            "needs_more_data": predictor.needs_more_data,
            "mode": "neural_network" if predictor.is_trained else "heuristic",
        },
    }
