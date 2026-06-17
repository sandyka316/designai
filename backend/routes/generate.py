import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from database.session import get_db
from models.generation import GenerationHistory
from models.user import User
from schemas.generate import GenerateResponse
from services.generate_service import generate_image_from_prompt

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_SIZE_MB = 10


@router.post("", response_model=GenerateResponse)
async def generate_image(
    prompt: str = Form(..., min_length=3, max_length=1000),
    model: str = Form(default="hd"),
    reference_image: UploadFile | None = File(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate gambar dari text prompt, dengan opsional gambar referensi.

    **Alur tanpa gambar:**
    1. Gemini memperkaya prompt (enhance)
    2. NanoBanana FLUX men-generate gambar
    3. Hasil disimpan ke database

    **Alur dengan gambar referensi:**
    1. Gemini Vision menganalisis gambar referensi + menggabungkan dengan prompt
    2. NanoBanana FLUX men-generate gambar
    3. Hasil disimpan ke database

    **Model:**
    - `hd` — FLUX via NanoBanana (1:1)
    - `genius` — Pro only
    - `super-genius` — Enterprise only
    """
    if model in ("genius", "super-genius"):
        raise HTTPException(
            status_code=403,
            detail="Model ini hanya tersedia untuk pengguna Pro / Enterprise.",
        )

    # ── Baca gambar referensi jika ada ───────────────────────────────────────
    image_bytes = None
    image_mime = None

    if reference_image and reference_image.filename:
        # Validasi tipe file
        content_type = reference_image.content_type or ""
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=415,
                detail=f"Tipe file tidak didukung: {content_type}. Gunakan PNG, JPG, atau WEBP.",
            )

        image_bytes = await reference_image.read()

        # Validasi ukuran file
        size_mb = len(image_bytes) / (1024 * 1024)
        if size_mb > MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=413,
                detail=f"File terlalu besar ({size_mb:.1f}MB). Maksimum {MAX_FILE_SIZE_MB}MB.",
            )

        image_mime = content_type

    # ── Generate ──────────────────────────────────────────────────────────────
    result = await generate_image_from_prompt(
        prompt=prompt,
        model_id=model,
        image_bytes=image_bytes,
        image_mime=image_mime,
    )

    # ── Simpan ke database ────────────────────────────────────────────────────
    record = GenerationHistory(
        user_id=current_user.id,
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
