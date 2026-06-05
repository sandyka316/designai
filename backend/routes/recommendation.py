from fastapi import APIRouter, UploadFile, File, HTTPException
from schemas.recommendation import RecommendationResponse
from services.recommendation_service import analyze_image

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_MB = 10


@router.post("", response_model=RecommendationResponse)
async def get_recommendation(file: UploadFile = File(...)):
    """
    Analisis gambar referensi dan dapatkan rekomendasi produk + generated prompt.

    - **file**: File gambar (PNG, JPG, WEBP — maks 10MB)
    """
    # Validasi mime type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan PNG, JPG, atau WEBP.",
        )

    # Baca konten file
    image_bytes = await file.read()

    # Validasi ukuran file
    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File terlalu besar ({size_mb:.1f}MB). Maksimum {MAX_FILE_SIZE_MB}MB.",
        )

    result = await analyze_image(image_bytes, file.content_type)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])

    return RecommendationResponse(**result)
