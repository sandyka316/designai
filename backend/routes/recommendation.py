import uuid
import time

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from database.session import get_db
from models.generation import GenerationHistory
from models.user import User
from schemas.recommendation import RecommendationResponse
from services.recommendation_service import analyze_image, analyze_image_with_prompt

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_MB = 10


@router.post("", response_model=RecommendationResponse)
async def get_recommendation(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    AUTO MODE — Analisis gambar referensi dan generate desain produk.

    **Alur:**
    1. Gemini Vision menganalisis style, warna, dan mood gambar
    2. Gemini memilih 3 produk yang paling sesuai dengan gambar (dinamis)
    3. NanoBanana men-generate gambar 3 produk secara parallel
    4. Gambar diupload ke Cloudflare R2
    5. Hasil disimpan ke database (GenerationHistory)

    - **file**: File gambar referensi (PNG, JPG, WEBP — maks 10MB)
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan PNG, JPG, atau WEBP.",
        )

    image_bytes = await file.read()

    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File terlalu besar ({size_mb:.1f}MB). Maksimum {MAX_FILE_SIZE_MB}MB.",
        )

    start = time.time()
    result = await analyze_image(image_bytes, file.content_type)
    elapsed_ms = int((time.time() - start) * 1000)

    # ── Simpan setiap produk ke GenerationHistory ─────────────────────────────
    if result.get("products"):
        for product in result["products"]:
            prompt_text = product.get("prompt") or f"Recommendation: {product.get('label', 'product')}"
            record = GenerationHistory(
                user_id=current_user.id,
                prompt=prompt_text[:500],
                enhanced_prompt=None,
                model_used=f"recommendation/{product.get('id', 'product')}",
                image_url=product.get("image_url") if product.get("success") else None,
                status="success" if product.get("success") else "failed",
                error_message=None if product.get("success") else "Generation failed",
                generation_time_ms=elapsed_ms,
            )
            db.add(record)
        await db.commit()

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])

    return RecommendationResponse(**result)


@router.post("/manual", response_model=RecommendationResponse)
async def get_recommendation_manual(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    MANUAL MODE — Analisis gambar referensi + arahan/instruksi user.

    **Alur:**
    1. Gemini Vision menerima gambar + arahan user
    2. Gemini menggabungkan keduanya: gambar memberi visual, arahan memberi arah produk
    3. AI memilih 3 produk paling sesuai + generate prompt per produk
    4. NanoBanana men-generate gambar 3 produk secara parallel
    5. Gambar diupload ke Cloudflare R2
    6. Hasil disimpan ke database (GenerationHistory)

    - **file**: File gambar referensi (PNG, JPG, WEBP — maks 10MB)
    - **prompt**: Arahan/instruksi user (e.g. "buat versi streetwear modern", "jadikan gothic dark")
    """
    if not prompt or not prompt.strip():
        raise HTTPException(status_code=422, detail="Prompt/arahan tidak boleh kosong.")

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan PNG, JPG, atau WEBP.",
        )

    image_bytes = await file.read()

    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File terlalu besar ({size_mb:.1f}MB). Maksimum {MAX_FILE_SIZE_MB}MB.",
        )

    start = time.time()
    result = await analyze_image_with_prompt(image_bytes, file.content_type, prompt.strip())
    elapsed_ms = int((time.time() - start) * 1000)

    # ── Simpan setiap produk ke GenerationHistory ────────────────────────────────────────
    if result.get("products"):
        for product in result["products"]:
            prompt_text = product.get("prompt") or f"Manual: {prompt}"
            record = GenerationHistory(
                user_id=current_user.id,
                prompt=prompt.strip()[:500],
                enhanced_prompt=prompt_text[:500],
                model_used=f"recommendation-manual/{product.get('id', 'product')}",
                image_url=product.get("image_url") if product.get("success") else None,
                status="success" if product.get("success") else "failed",
                error_message=None if product.get("success") else "Generation failed",
                generation_time_ms=elapsed_ms,
            )
            db.add(record)
        await db.commit()

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])

    return RecommendationResponse(**result)
