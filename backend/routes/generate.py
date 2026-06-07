import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from models.generation import GenerationHistory
from schemas.generate import GenerateRequest, GenerateResponse
from services.generate_service import generate_image_from_prompt

router = APIRouter()

# Guest user UUID — dipakai sementara sebelum auth diimplementasi
_GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.post("", response_model=GenerateResponse)
async def generate_image(
    body: GenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate gambar dari text prompt.

    **Alur:**
    1. Gemini memperkaya prompt (enhance)
    2. NanoBanana FLUX men-generate gambar
    3. Hasil disimpan ke database

    **Model:**
    - `hd` — FLUX via NanoBanana (1:1)
    - `genius` — Pro only
    - `super-genius` — Enterprise only
    """
    from fastapi import HTTPException

    if body.model in ("genius", "super-genius"):
        raise HTTPException(
            status_code=403,
            detail="Model ini hanya tersedia untuk pengguna Pro / Enterprise.",
        )

    result = await generate_image_from_prompt(body.prompt, body.model)

    # ── Simpan ke database ────────────────────────────────────────────────────
    record = GenerationHistory(
        user_id=_GUEST_USER_ID,
        prompt=result["prompt_used"],
        enhanced_prompt=result.get("enhanced_prompt"),
        model_used=result["model_used"],
        image_url=result["image_url"] if result["success"] else None,
        status="success" if result["success"] else "failed",
        error_message=None if result["success"] else result["message"],
        generation_time_ms=result["generation_time_ms"],
    )
    db.add(record)
    await db.commit()

    # ── Return response ───────────────────────────────────────────────────────
    if not result["success"]:
        msg = result["message"]
        if "quota" in msg.lower() or "429" in msg:
            status_code = 429
        elif "api key" in msg.lower() or "token" in msg.lower() or "401" in msg:
            status_code = 401
        elif "billing" in msg.lower() or "kredit" in msg.lower() or "402" in msg:
            status_code = 402
        else:
            status_code = 503
        raise HTTPException(status_code=status_code, detail=msg)

    return GenerateResponse(**result)
