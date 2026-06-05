import os
import time
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Urutan fallback model image generation
IMAGE_MODELS = [
    "gemini-3.1-flash-image",
    "gemini-2.5-flash-image",
    "gemini-3-pro-image-preview",
    "gemini-3.1-flash-image-preview",
]


async def generate_image_from_prompt(prompt: str, model_id: str) -> dict:
    """
    Generate gambar dari text prompt menggunakan Gemini image model.
    Otomatis fallback ke model berikutnya jika model pertama tidak tersedia.
    """
    start = time.time()

    client = genai.Client(api_key=GEMINI_API_KEY)

    enhanced_prompt = (
        f"{prompt}. "
        "High quality, professional design, sharp focus, detailed, commercial ready."
    )

    last_error = ""
    for model_name in IMAGE_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=enhanced_prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                ),
            )

            image_url = None
            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    img_bytes = part.inline_data.data
                    mime = part.inline_data.mime_type or "image/png"
                    b64 = base64.b64encode(img_bytes).decode("utf-8")
                    image_url = f"data:{mime};base64,{b64}"
                    break

            elapsed_ms = int((time.time() - start) * 1000)

            if image_url is None:
                return {
                    "success": False,
                    "image_url": None,
                    "prompt_used": prompt,
                    "model_used": model_name,
                    "generation_time_ms": elapsed_ms,
                    "message": "No image returned by the model. Try a different prompt.",
                }

            return {
                "success": True,
                "image_url": image_url,
                "prompt_used": prompt,
                "model_used": model_name,
                "generation_time_ms": elapsed_ms,
                "message": "Image generated successfully",
            }

        except Exception as e:
            err_str = str(e)
            last_error = err_str

            # Kalau 429 (quota habis) atau 404 (model tidak ada) → coba model berikutnya
            if "429" in err_str or "404" in err_str or "RESOURCE_EXHAUSTED" in err_str or "NOT_FOUND" in err_str:
                continue
            # Error lain (auth, network) → langsung berhenti
            break

    elapsed_ms = int((time.time() - start) * 1000)

    # Beri pesan yang jelas ke user
    if "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
        user_message = (
            "API quota habis untuk hari ini. "
            "Silakan ganti API key di backend/.env atau coba lagi besok."
        )
    elif "401" in last_error or "API_KEY" in last_error:
        user_message = "API key tidak valid. Periksa GEMINI_API_KEY di backend/.env."
    else:
        user_message = f"Generation failed: {last_error[:200]}"

    return {
        "success": False,
        "image_url": None,
        "prompt_used": prompt,
        "model_used": model_id,
        "generation_time_ms": elapsed_ms,
        "message": user_message,
    }
