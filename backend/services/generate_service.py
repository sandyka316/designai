"""
Generate Service — Alur kombinasi:
  1. Gemini  → enhance prompt (via prompt_service)
  2. NanoBanana → generate image (FLUX via nanobananaapi.ai)

Model mapping:
  hd           → image_size 1:1  (standard)
  genius       → image_size 16:9 (widescreen, Pro only)
  super-genius → image_size 9:16 (portrait, Enterprise only)
"""
import time

from services.prompt_service import enhance_prompt
from services.nanobanana_service import generate_image as nanobanana_generate


async def generate_image_from_prompt(prompt: str, model_id: str) -> dict:
    """
    Generate gambar dari text prompt.

    Alur:
      1. Gemini enhance prompt
      2. NanoBanana generate image (FLUX)
    """
    start = time.time()

    # Model → image_size mapping
    size_map = {
        "hd":           "1:1",
        "genius":       "16:9",
        "super-genius": "9:16",
    }
    image_size = size_map.get(model_id, "1:1")

    # ── Step 1: Enhance prompt via Gemini ─────────────────────────────────────
    enhance_result = await enhance_prompt(prompt)
    enhanced_prompt = enhance_result["enhanced_prompt"]

    # ── Step 2: Generate image via NanoBanana ─────────────────────────────────
    nb_result = await nanobanana_generate(enhanced_prompt, image_size)

    elapsed_ms = int((time.time() - start) * 1000)

    if not nb_result["success"]:
        return {
            "success": False,
            "image_url": None,
            "prompt_used": prompt,
            "enhanced_prompt": enhanced_prompt,
            "model_used": f"nanobanana/{image_size}",
            "generation_time_ms": elapsed_ms,
            "message": nb_result["message"],
        }

    return {
        "success": True,
        "image_url": nb_result["image_url"],
        "prompt_used": prompt,
        "enhanced_prompt": enhanced_prompt,
        "model_used": f"nanobanana/{image_size}",
        "generation_time_ms": elapsed_ms,
        "message": "Image generated successfully",
    }
