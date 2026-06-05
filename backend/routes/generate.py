from fastapi import APIRouter, HTTPException
from schemas.generate import GenerateRequest, GenerateResponse
from services.generate_service import generate_image_from_prompt

router = APIRouter()


@router.post("", response_model=GenerateResponse)
async def generate_image(body: GenerateRequest):
    """
    Generate gambar dari text prompt.

    - **prompt**: Deskripsi gambar yang ingin di-generate (min 3, max 1000 karakter)
    - **model**: Model yang digunakan (`hd`, `genius`, `super-genius`)
    """
    if body.model in ("genius", "super-genius"):
        raise HTTPException(
            status_code=403,
            detail="Model ini hanya tersedia untuk pengguna Pro / Enterprise.",
        )

    result = await generate_image_from_prompt(body.prompt, body.model)

    if not result["success"]:
        msg = result["message"]
        # Pilih HTTP status code yang sesuai
        if "quota" in msg.lower() or "429" in msg:
            status_code = 429
        elif "api key" in msg.lower() or "401" in msg:
            status_code = 401
        else:
            status_code = 503
        raise HTTPException(status_code=status_code, detail=msg)

    return GenerateResponse(**result)
