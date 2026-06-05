import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))

# Urutan fallback model vision (multimodal teks + gambar)
VISION_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-001",
]

PROMPT_TEXT = """
Analyze this image carefully for product design and fashion purposes.
Return a JSON object with EXACTLY these fields (no extra fields):

{
  "dominant_colors": ["#hexcode1", "#hexcode2", "#hexcode3", "#hexcode4", "#hexcode5"],
  "style": "Brief style description (e.g. Minimalist, Gothic, Streetwear, Luxury)",
  "key_elements": "Main visual elements separated by comma",
  "mood": "Mood/atmosphere (e.g. Mystical, Bold, Elegant, Playful)",
  "recommended_use": "Best product category (e.g. Premium Apparel & Accessories)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "generated_prompt": "A detailed AI image generation prompt based on this image's aesthetic, style and mood. Ready to use. Max 150 words."
}

Return ONLY the JSON object. No markdown, no explanation.
"""


async def analyze_image(image_bytes: bytes, mime_type: str) -> dict:
    """
    Analisis gambar menggunakan Gemini Vision.
    Otomatis fallback ke model berikutnya jika quota habis.
    """
    last_error = ""

    for model_name in VISION_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Part.from_text(text=PROMPT_TEXT),
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                ],
            )

            raw_text = response.text.strip()

            # Bersihkan markdown code block jika ada
            if raw_text.startswith("```"):
                lines = raw_text.split("\n")
                raw_text = "\n".join(lines[1:-1])

            result = json.loads(raw_text)

            return {
                "success": True,
                "dominant_colors": result.get("dominant_colors", []),
                "style": result.get("style", ""),
                "key_elements": result.get("key_elements", ""),
                "mood": result.get("mood", ""),
                "recommended_use": result.get("recommended_use", ""),
                "keywords": result.get("keywords", []),
                "generated_prompt": result.get("generated_prompt", ""),
                "message": "Analysis completed successfully",
            }

        except json.JSONDecodeError:
            return {
                "success": False,
                "dominant_colors": [], "style": "", "key_elements": "",
                "mood": "", "recommended_use": "", "keywords": [],
                "generated_prompt": "",
                "message": "Failed to parse AI response. Please try again.",
            }
        except Exception as e:
            err_str = str(e)
            last_error = err_str
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "404" in err_str or "NOT_FOUND" in err_str:
                continue
            break

    # Semua model gagal
    if "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
        msg = "API quota habis untuk hari ini. Silakan ganti API key di backend/.env atau coba lagi besok."
    elif "401" in last_error or "API_KEY" in last_error:
        msg = "API key tidak valid. Periksa GEMINI_API_KEY di backend/.env."
    else:
        msg = f"Analysis failed: {last_error[:200]}"

    return {
        "success": False,
        "dominant_colors": [], "style": "", "key_elements": "",
        "mood": "", "recommended_use": "", "keywords": [],
        "generated_prompt": "", "message": msg,
    }
