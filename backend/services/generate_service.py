"""
Generate Service — Alur kombinasi:
  1. Gemini  → enhance prompt (via prompt_service)
     - Jika ada gambar referensi → enhance_prompt_with_image (Vision)
     - Jika tidak ada → enhance_prompt (teks saja)
  2. NanoBanana → generate image (FLUX via nanobananaapi.ai) → raw bytes
  3. Cloudflare R2 → upload bytes → simpan public URL

Model mapping:
  hd           → image_size 1:1  (standard)
  genius       → image_size 16:9 (widescreen, Pro only)
  super-genius → image_size 9:16 (portrait, Enterprise only)
"""
import time

from services.prompt_service import enhance_prompt, enhance_prompt_with_image
from services.nanobanana_service import generate_image as nanobanana_generate
from services.storage_service import upload_image as r2_upload


async def generate_image_from_prompt(
    prompt: str,
    model_id: str,
    image_bytes: bytes | None = None,
    image_mime: str | None = None,
) -> dict:
    """
    Generate gambar dari text prompt, dengan opsional gambar referensi.

    Alur:
      1. Jika ada image_bytes → Gemini Vision analisis gambar + gabungkan dengan prompt
         Jika tidak ada      → Gemini enhance prompt teks saja
      2. NanoBanana generate image (FLUX) → raw bytes
      3. Upload raw bytes ke Cloudflare R2 → public URL
    """
    start = time.time()

    # Model → image_size mapping
    size_map = {
        "hd":           "1:1",
        "genius":       "16:9",
        "super-genius": "9:16",
    }
    image_size = size_map.get(model_id, "1:1")

    # ── Step 1: Enhance prompt ────────────────────────────────────────────────
    if image_bytes and image_mime:
        # Ada gambar referensi → pakai Gemini Vision
        enhance_result = await enhance_prompt_with_image(prompt, image_bytes, image_mime)
    else:
        # Teks saja
        enhance_result = await enhance_prompt(prompt)

    enhanced_prompt = enhance_result["enhanced_prompt"]

    # ── Step 2: Generate image via NanoBanana → raw bytes ────────────────────
    nb_result = await nanobanana_generate(enhanced_prompt, image_size)

    if not nb_result["success"]:
        elapsed_ms = int((time.time() - start) * 1000)
        return {
            "success": False,
            "image_url": None,
            "prompt_used": prompt,
            "enhanced_prompt": enhanced_prompt,
            "model_used": f"nanobanana/{image_size}",
            "generation_time_ms": elapsed_ms,
            "message": nb_result["message"],
        }

    # ── Step 3: Upload ke Cloudflare R2 ──────────────────────────────────────
    r2_result = await r2_upload(
        image_bytes=nb_result["image_bytes"],
        model_id=model_id,
        content_type=nb_result["content_type"] or "image/png",
    )

    elapsed_ms = int((time.time() - start) * 1000)

    if not r2_result["success"]:
        return {
            "success": False,
            "image_url": None,
            "prompt_used": prompt,
            "enhanced_prompt": enhanced_prompt,
            "model_used": f"nanobanana/{image_size}",
            "generation_time_ms": elapsed_ms,
            "message": f"Gambar berhasil digenerate namun gagal disimpan: {r2_result['message']}",
        }

    return {
        "success": True,
        "image_url": r2_result["url"],
        "prompt_used": prompt,
        "enhanced_prompt": enhanced_prompt,
        "model_used": f"nanobanana/{image_size}",
        "generation_time_ms": elapsed_ms,
        "message": "Image generated and uploaded successfully",
    }
