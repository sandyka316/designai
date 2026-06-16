import uuid
import time

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from models.generation import GenerationHistory
from schemas.recommendation import RecommendationResponse
from services.recommendation_service import analyze_image

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_MB = 10

# Guest user UUID — sementara sebelum auth
_GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.post("", response_model=RecommendationResponse)
async def get_recommendation(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Analisis gambar referensi dan generate desain produk.

    **Alur:**
    1. Gemini Vision menganalisis style, warna, dan mood gambar
    2. Gemini menghasilkan 3 prompt spesifik per produk
    3. NanoBanana men-generate gambar 3 produk secara parallel
    4. Gambar diupload ke Cloudflare R2
    5. Hasil disimpan ke database (GenerationHistory)

    **Produk yang dihasilkan:** Tote Bag, Sneakers, Kaos T-Shirt

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
            # Ambil prompt produk sebagai teks prompt utama
            prompt_text = product.get("prompt") or f"Recommendation: {product.get('label', 'product')}"
            record = GenerationHistory(
                user_id=_GUEST_USER_ID,
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
