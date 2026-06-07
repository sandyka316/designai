"""
Prompt Service — Gemini dipakai khusus untuk enhance/memperkaya prompt teks
sebelum dikirim ke FLUX untuk image generation.
"""
from google import genai
from google.genai import types

from core.config import settings

_client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Model fallback untuk enhance prompt (teks saja, tidak butuh multimodal besar)
_ENHANCE_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-001",
]

_ENHANCE_SYSTEM = """You are an expert AI image prompt engineer specializing in FLUX and Stable Diffusion models.

Your job: take a user's short/rough design idea and rewrite it into a rich, detailed image generation prompt.

Rules:
- Output ONLY the enhanced prompt — no explanation, no preamble, no markdown
- Keep it under 150 words
- Be specific about: style, lighting, colors, composition, mood, quality tags
- Add professional quality tags at the end: (masterpiece, best quality, highly detailed, sharp focus, 8k)
- Do NOT include any negative prompts or NSFW content
"""


async def enhance_prompt(user_prompt: str) -> dict:
    """
    Enhance prompt pengguna menggunakan Gemini (teks).
    Return dict: { success, enhanced_prompt, original_prompt, message }
    """
    last_error = ""

    for model_name in _ENHANCE_MODELS:
        try:
            response = _client.models.generate_content(
                model=model_name,
                contents=f"Enhance this design prompt for AI image generation:\n\n{user_prompt}",
                config=types.GenerateContentConfig(
                    system_instruction=_ENHANCE_SYSTEM,
                    temperature=0.7,
                    max_output_tokens=300,
                ),
            )

            enhanced = response.text.strip()
            if not enhanced:
                return {
                    "success": False,
                    "enhanced_prompt": user_prompt,
                    "original_prompt": user_prompt,
                    "message": "Gemini returned empty response, using original prompt.",
                }

            return {
                "success": True,
                "enhanced_prompt": enhanced,
                "original_prompt": user_prompt,
                "message": "Prompt enhanced successfully",
            }

        except Exception as e:
            err_str = str(e)
            last_error = err_str
            if any(code in err_str for code in ["429", "404", "RESOURCE_EXHAUSTED", "NOT_FOUND"]):
                continue
            break

    # Fallback: gunakan prompt asli jika Gemini gagal
    return {
        "success": False,
        "enhanced_prompt": user_prompt,
        "original_prompt": user_prompt,
        "message": f"Prompt enhancement skipped (Gemini error: {last_error[:100]}). Using original prompt.",
    }
