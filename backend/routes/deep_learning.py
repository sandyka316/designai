"""
deep_learning.py — Deep Learning Feature Routes
=================================================
1. POST /api/dl/clip/score       → CLIP Prompt-Image Alignment Score
2. GET  /api/dl/clip/history     → Score semua image dari histori (batch)
3. POST /api/dl/lstm/train       → Train LSTM dari histori prompt
4. POST /api/dl/lstm/suggest     → Generate prompt suggestions
5. GET  /api/dl/lstm/status      → Status training model LSTM
"""

import asyncio
import logging
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from models.generation import GenerationHistory
from services.clip_service import score_prompt_image_alignment
from services.lstm_service import get_training_status, suggest_prompts, train_on_prompts

logger = logging.getLogger(__name__)
router = APIRouter()

_GUEST_USER_ID = "00000000-0000-0000-0000-000000000001"


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class CLIPScoreRequest(BaseModel):
    prompt: str
    image_url: str


class LSTMSuggestRequest(BaseModel):
    seed: str = ""
    num_suggestions: int = 5
    temperature: float = 0.8


# ─────────────────────────────────────────────────────────────────────────────
# 1. CLIP — Score satu gambar
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/clip/score")
async def clip_score(req: CLIPScoreRequest) -> dict[str, Any]:
    """
    Hitung CLIP alignment score antara prompt dan gambar.

    - Input: prompt (str) + image_url (str, bisa base64 atau http URL)
    - Output: score 0–100, label (Excellent/Good/Fair/Poor), interpretasi
    """
    if not req.prompt.strip():
        raise HTTPException(status_code=422, detail="Prompt tidak boleh kosong.")
    if not req.image_url.strip():
        raise HTTPException(status_code=422, detail="image_url tidak boleh kosong.")

    # Jalankan di thread pool (CPU-bound, blocking)
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        score_prompt_image_alignment,
        req.prompt,
        req.image_url,
    )

    return result


# ─────────────────────────────────────────────────────────────────────────────
# 2. CLIP — Batch score dari histori
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/clip/history")
async def clip_history(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Ambil histori generasi terbaru (success + ada image_url) dan hitung CLIP score.
    Dibatasi `limit` item untuk menghindari timeout.
    """
    limit = min(limit, 20)  # max 20

    stmt = (
        select(GenerationHistory)
        .where(
            GenerationHistory.status == "success",
            GenerationHistory.image_url.is_not(None),
        )
        .order_by(GenerationHistory.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    if not records:
        return {"items": [], "total": 0, "message": "Belum ada data generasi yang berhasil."}

    # Score setiap item (jalankan di executor agar tidak block event loop)
    loop = asyncio.get_event_loop()
    items = []

    for r in records:
        # Skip jika image_url terlalu panjang (base64 besar — bisa timeout)
        img_url = r.image_url or ""
        if img_url.startswith("data:image") and len(img_url) > 5_000_000:
            score_data = {
                "score": None,
                "label": "Skipped",
                "interpretation": "Gambar base64 terlalu besar untuk diproses.",
                "error": "image_too_large",
            }
        else:
            score_data = await loop.run_in_executor(
                None,
                score_prompt_image_alignment,
                r.prompt,
                img_url,
            )

        items.append({
            "id": str(r.id),
            "prompt": r.prompt[:100],
            "created_at": r.created_at.isoformat(),
            "clip_score": score_data.get("score"),
            "clip_label": score_data.get("label"),
            "clip_interpretation": score_data.get("interpretation"),
            "clip_raw": score_data.get("score_raw"),
            "image_url": img_url[:200] if img_url.startswith("http") else "[base64]",
        })

    avg_score = None
    scored = [i["clip_score"] for i in items if i["clip_score"] is not None]
    if scored:
        avg_score = round(sum(scored) / len(scored), 1)

    return {
        "items": items,
        "total": len(items),
        "avg_score": avg_score,
        "message": f"Scored {len(scored)} of {len(items)} images.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. LSTM — Train dari histori
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/lstm/train")
async def lstm_train(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Train LSTM dari semua prompt di histori generasi (prompt asli user, bukan enhanced).
    Filter: prompt 5–120 karakter (bukan enhanced Gemini).
    """
    stmt = (
        select(GenerationHistory.prompt)
        .where(GenerationHistory.status == "success")
        .order_by(GenerationHistory.created_at.desc())
    )
    result = await db.execute(stmt)
    raw_prompts = [row[0] for row in result.fetchall()]

    if not raw_prompts:
        raise HTTPException(status_code=404, detail="Tidak ada histori prompt untuk training.")

    # Filter: prompt asli (<=120 char), bukan enhanced Gemini
    prompts = [p for p in raw_prompts if p and 5 <= len(p.strip()) <= 120]

    if len(prompts) < 3:
        raise HTTPException(
            status_code=422,
            detail=f"Prompt valid terlalu sedikit: {len(prompts)} (butuh minimal 3). Tambah lebih banyak generasi terlebih dahulu.",
        )

    logger.info(f"[LSTM] Starting training on {len(prompts)} prompts...")

    # Training CPU-bound → jalankan di executor
    loop = asyncio.get_event_loop()
    train_result = await loop.run_in_executor(None, train_on_prompts, prompts)

    return {
        "status": "trained" if train_result.get("success") else "failed",
        **train_result,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. LSTM — Generate suggestions
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/lstm/suggest")
async def lstm_suggest(req: LSTMSuggestRequest) -> dict[str, Any]:
    """
    Generate prompt suggestions dari LSTM.

    - seed: awal prompt (bisa kosong — model akan pilih sendiri dari training data)
    - num_suggestions: jumlah variasi (1–10)
    - temperature: 0.5 (konservatif) – 1.2 (kreatif)
    """
    num = max(1, min(req.num_suggestions, 10))
    temp = max(0.3, min(req.temperature, 1.5))

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: suggest_prompts(
            seed_text=req.seed,
            num_suggestions=num,
            temperature=temp,
        ),
    )

    return result


# ─────────────────────────────────────────────────────────────────────────────
# 5. LSTM — Status
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/lstm/status")
async def lstm_status() -> dict[str, Any]:
    """Cek status training model LSTM saat ini."""
    return get_training_status()
