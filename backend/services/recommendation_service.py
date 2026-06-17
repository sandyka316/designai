"""
Recommendation Service — Alur:
  1. Gemini Vision  → analisis gambar referensi (warna, style, mood)
  2. Gemini         → generate 3 prompt spesifik per produk (totebag, sneakers, tshirt)
  3. NanoBanana     → generate image per produk (parallel)
  4. R2             → upload setiap gambar → return public URL

Rotasi Gemini API Key (Round-Robin):
  - Semua key dibaca dari settings.GEMINI_KEY_LIST
    (dari GEMINI_API_KEYS di .env, fallback ke GEMINI_API_KEY)
  - Setiap request sukses → key index maju 1 (true round-robin load balancing)
  - Jika key aktif mendapat error 429/RESOURCE_EXHAUSTED → otomatis ganti key berikutnya
  - Jika 503/UNAVAILABLE → retry dulu, lalu ganti model/key berikutnya
  - Jika semua key & model sudah dicoba → return error
"""
import asyncio
import json
import threading

from google import genai
from google.genai import types

from core.config import settings
from services.nanobanana_service import generate_image as nanobanana_generate
from services.storage_service import upload_image as r2_upload

# ── Gemini Key Rotation State (thread-safe) ───────────────────────────────────
_gemini_key_lock  = threading.Lock()
_gemini_key_index = 0   # indeks key Gemini yang sedang dipakai


def _get_gemini_client(key_index: int) -> genai.Client:
    """Buat Gemini client dengan key pada indeks tertentu."""
    keys = settings.GEMINI_KEY_LIST
    if not keys:
        return genai.Client(api_key="")
    return genai.Client(api_key=keys[key_index % len(keys)])


def _advance_gemini_key() -> int:
    """Maju ke key Gemini berikutnya secara thread-safe. Return indeks baru."""
    global _gemini_key_index
    keys = settings.GEMINI_KEY_LIST
    if not keys:
        return 0
    with _gemini_key_lock:
        _gemini_key_index = (_gemini_key_index + 1) % len(keys)
        return _gemini_key_index


VISION_MODELS = [
    "gemini-2.5-flash-lite",   # ✅ model yang tersedia
    "gemini-2.5-flash",        # fallback
]

# ── Prompt: Auto Mode (analisis gambar, AI pilih produk dinamis) ─────────────
ANALYSIS_PROMPT = """
Analyze this reference image carefully for product design/fashion purposes.
Return a JSON object with EXACTLY this structure (no extra fields):

{
  "dominant_colors": ["#hexcode1", "#hexcode2", "#hexcode3", "#hexcode4", "#hexcode5"],
  "style": "Brief style description (e.g. Minimalist, Gothic, Streetwear, Batik Traditional, Luxury)",
  "key_elements": "Main visual elements separated by comma",
  "mood": "Mood/atmosphere (e.g. Mystical, Bold, Elegant, Playful, Earthy)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "products": [
    {
      "id": "unique_snake_case_id",
      "label": "Product Name in English",
      "emoji": "relevant_emoji",
      "prompt": "A detailed AI image generation prompt (max 120 words) to apply this image's design/colors/style onto this product. Be specific about the product appearance, how the design is applied, materials. End with: Studio product photo, white background, professional lighting."
    },
    {
      "id": "unique_snake_case_id_2",
      "label": "Product Name 2",
      "emoji": "relevant_emoji_2",
      "prompt": "Detailed prompt for product 2..."
    },
    {
      "id": "unique_snake_case_id_3",
      "label": "Product Name 3",
      "emoji": "relevant_emoji_3",
      "prompt": "Detailed prompt for product 3..."
    }
  ]
}

IMPORTANT RULES:
- Choose exactly 3 products that would BEST showcase this image's design/style/colors
- Products should be diverse (don't pick 3 similar items)
- Base your product selection on the image content:
  * Batik/traditional pattern → sarung, blus, selendang, cap, totebag
  * Gothic/dark aesthetic → hoodie, phone case, backpack, cap
  * Minimalist/clean → totebag, tshirt, mug, pillow
  * Streetwear/urban → hoodie, cap, sneakers, backpack
  * Floral/feminine → blouse, scarf, clutch bag, phone case
  * Abstract/geometric → tshirt, phone case, canvas print, cap
- Return ONLY the JSON object. No markdown, no explanation.
"""

# ── Prompt: Manual Mode (analisis gambar + arahan user) ──────────────────────
MANUAL_ANALYSIS_PROMPT_TEMPLATE = """
Analyze this reference image for product design/fashion purposes.
The user's creative direction: "{user_prompt}"

Based on BOTH the image visuals AND the user's direction above, select exactly 3 products that:
1. Match the image's colors, patterns, and aesthetic
2. Align with what the user is asking for (their direction takes priority for product type selection)

Return a JSON object with EXACTLY this structure (no extra fields):

{{
  "dominant_colors": ["#hexcode1", "#hexcode2", "#hexcode3", "#hexcode4", "#hexcode5"],
  "style": "Style description combining the image aesthetic + user direction",
  "key_elements": "Main visual elements from the image",
  "mood": "Mood/atmosphere (considering both image and user's intent)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "products": [
    {{
      "id": "unique_snake_case_id",
      "label": "Product Name in English",
      "emoji": "relevant_emoji",
      "prompt": "A detailed AI image generation prompt (max 120 words) that applies the image's design/colors onto this product while respecting the user's direction. Describe the product appearance, how the design is applied, materials. End with: Studio product photo, white background, professional lighting."
    }},
    {{
      "id": "unique_snake_case_id_2",
      "label": "Product Name 2",
      "emoji": "relevant_emoji_2",
      "prompt": "Detailed prompt for product 2..."
    }},
    {{
      "id": "unique_snake_case_id_3",
      "label": "Product Name 3",
      "emoji": "relevant_emoji_3",
      "prompt": "Detailed prompt for product 3..."
    }}
  ]
}}

IMPORTANT RULES:
- User direction TAKES PRIORITY for product type (e.g. user says "streetwear" → pick streetwear products)
- Image provides the visual style, colors, and pattern to apply onto those products
- Combine both: batik image + "buat streetwear" → hoodie with batik print, cap with batik motif, sneakers with batik accent
- Products should be diverse (don't pick 3 similar items)
- Return ONLY the JSON object. No markdown, no explanation.
"""


async def _analyze_with_gemini(image_bytes: bytes, mime_type: str) -> dict:
    """
    Auto Mode: Kirim gambar ke Gemini, dapatkan analisis + 3 produk dinamis.
    Round-robin rotasi API key + fallback ke model berikutnya jika quota habis.
    """
    global _gemini_key_index
    keys = settings.GEMINI_KEY_LIST
    if not keys:
        return {"success": False, "message": "GEMINI_API_KEY belum diset di backend/.env."}

    total_keys = len(keys)
    MAX_RETRIES = 2

    with _gemini_key_lock:
        start_key_index = _gemini_key_index

    last_error = ""

    for key_attempt in range(total_keys):
        current_key_index = (start_key_index + key_attempt) % total_keys
        api_key = keys[current_key_index]
        key_label = f"key #{current_key_index + 1}/{total_keys} (...{api_key[-6:]})"
        client = genai.Client(api_key=api_key)

        for model_name in VISION_MODELS:
            for retry in range(MAX_RETRIES):
                try:
                    print(f"[Recommendation] 🔍 Gemini {key_label} | model={model_name} | attempt={retry + 1}")
                    response = await client.aio.models.generate_content(
                        model=model_name,
                        contents=[
                            types.Part.from_text(text=ANALYSIS_PROMPT),
                            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        ],
                    )

                    raw_text = response.text.strip()
                    if raw_text.startswith("```"):
                        lines = raw_text.split("\n")
                        raw_text = "\n".join(lines[1:-1])

                    result = json.loads(raw_text)

                    with _gemini_key_lock:
                        _gemini_key_index = (current_key_index + 1) % total_keys

                    print(f"[Recommendation] ✅ Gemini berhasil {key_label} model={model_name}")
                    return {"success": True, "data": result}

                except json.JSONDecodeError:
                    return {"success": False, "message": "Failed to parse AI response. Please try again."}

                except Exception as e:
                    err_str = str(e)
                    last_error = err_str

                    if any(code in err_str for code in ["503", "UNAVAILABLE"]):
                        if retry < MAX_RETRIES - 1:
                            wait = 2 * (retry + 1)
                            print(f"[Recommendation] ⏳ 503 → retry dalam {wait}s...")
                            await asyncio.sleep(wait)
                            continue
                        else:
                            print(f"[Recommendation] ⚠️ 503 max retry → coba model berikutnya")
                            break

                    if any(code in err_str for code in ["429", "RESOURCE_EXHAUSTED"]):
                        print(f"[Recommendation] 💸 {key_label} quota habis → coba key berikutnya")
                        break

                    if any(code in err_str for code in ["404", "NOT_FOUND"]):
                        print(f"[Recommendation] ⚠️ Model {model_name} not found → coba model berikutnya")
                        break

                    print(f"[Recommendation] ❌ Error: {err_str[:100]}")
                    break

                break

            else:
                continue

            if any(code in last_error for code in ["429", "RESOURCE_EXHAUSTED"]):
                break
            continue

        else:
            if not any(code in last_error for code in ["429", "RESOURCE_EXHAUSTED"]):
                break

    print(f"[Recommendation] ❌ Semua Gemini key & model gagal.")
    if "503" in last_error or "UNAVAILABLE" in last_error:
        msg = "Gemini API sedang sibuk (503). Silakan coba lagi dalam beberapa detik."
    elif "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
        msg = "Semua Gemini API key quota habis. Silakan coba lagi besok atau tambah key di GEMINI_API_KEYS."
    elif "401" in last_error or "API_KEY" in last_error:
        msg = "API key tidak valid. Periksa GEMINI_API_KEY di backend/.env."
    else:
        msg = f"Analysis failed: {last_error[:200]}"

    return {"success": False, "message": msg}


async def _analyze_with_gemini_manual(image_bytes: bytes, mime_type: str, user_prompt: str) -> dict:
    """
    Manual Mode: Kirim gambar + arahan user ke Gemini Vision.
    Gemini menggabungkan keduanya untuk memilih 3 produk yang paling cocok.
    Response format sama dengan Auto Mode.
    """
    global _gemini_key_index
    keys = settings.GEMINI_KEY_LIST
    if not keys:
        return {"success": False, "message": "GEMINI_API_KEY belum diset di backend/.env."}

    filled_prompt = MANUAL_ANALYSIS_PROMPT_TEMPLATE.format(user_prompt=user_prompt)
    total_keys = len(keys)
    MAX_RETRIES = 2

    with _gemini_key_lock:
        start_key_index = _gemini_key_index

    last_error = ""

    for key_attempt in range(total_keys):
        current_key_index = (start_key_index + key_attempt) % total_keys
        api_key = keys[current_key_index]
        key_label = f"key #{current_key_index + 1}/{total_keys} (...{api_key[-6:]})"
        client = genai.Client(api_key=api_key)

        for model_name in VISION_MODELS:
            for retry in range(MAX_RETRIES):
                try:
                    print(f"[RecommendationManual] 🔍 Gemini {key_label} | model={model_name} | attempt={retry + 1}")
                    response = await client.aio.models.generate_content(
                        model=model_name,
                        contents=[
                            types.Part.from_text(text=filled_prompt),
                            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        ],
                    )

                    raw_text = response.text.strip()
                    if raw_text.startswith("```"):
                        lines = raw_text.split("\n")
                        raw_text = "\n".join(lines[1:-1])

                    result = json.loads(raw_text)

                    with _gemini_key_lock:
                        _gemini_key_index = (current_key_index + 1) % total_keys

                    print(f"[RecommendationManual] ✅ Gemini berhasil {key_label} model={model_name}")
                    return {"success": True, "data": result}

                except json.JSONDecodeError:
                    return {"success": False, "message": "Failed to parse AI response. Please try again."}

                except Exception as e:
                    err_str = str(e)
                    last_error = err_str

                    if any(code in err_str for code in ["503", "UNAVAILABLE"]):
                        if retry < MAX_RETRIES - 1:
                            wait = 2 * (retry + 1)
                            print(f"[RecommendationManual] ⏳ 503 → retry dalam {wait}s...")
                            await asyncio.sleep(wait)
                            continue
                        else:
                            print(f"[RecommendationManual] ⚠️ 503 max retry → coba model berikutnya")
                            break

                    if any(code in err_str for code in ["429", "RESOURCE_EXHAUSTED"]):
                        print(f"[RecommendationManual] 💸 {key_label} quota habis → coba key berikutnya")
                        break

                    if any(code in err_str for code in ["404", "NOT_FOUND"]):
                        print(f"[RecommendationManual] ⚠️ Model {model_name} not found → coba model berikutnya")
                        break

                    print(f"[RecommendationManual] ❌ Error: {err_str[:100]}")
                    break

                break

            else:
                continue

            if any(code in last_error for code in ["429", "RESOURCE_EXHAUSTED"]):
                break
            continue

        else:
            if not any(code in last_error for code in ["429", "RESOURCE_EXHAUSTED"]):
                break

    print(f"[RecommendationManual] ❌ Semua Gemini key & model gagal.")
    if "503" in last_error or "UNAVAILABLE" in last_error:
        msg = "Gemini API sedang sibuk (503). Silakan coba lagi dalam beberapa detik."
    elif "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
        msg = "Semua Gemini API key quota habis. Silakan coba lagi besok atau tambah key di GEMINI_API_KEYS."
    elif "401" in last_error or "API_KEY" in last_error:
        msg = "API key tidak valid. Periksa GEMINI_API_KEY di backend/.env."
    else:
        msg = f"Analysis failed: {last_error[:200]}"

    return {"success": False, "message": msg}


async def _generate_and_upload(product: dict, prompt: str) -> dict:
    """
    Generate image untuk satu produk via NanoBanana lalu upload ke R2.
    product: dict dengan keys {id, label, emoji, prompt} dari Gemini
    """
    nb_result = await nanobanana_generate(prompt, "1:1")

    if not nb_result["success"]:
        return {
            "id": product.get("id", "unknown"),
            "label": product.get("label", "Product"),
            "emoji": product.get("emoji", "🎨"),
            "prompt": prompt,
            "image_url": None,
            "success": False,
        }

    r2_result = await r2_upload(
        image_bytes=nb_result["image_bytes"],
        model_id=product.get("id", "product"),
        content_type=nb_result["content_type"] or "image/png",
    )

    return {
        "id": product.get("id", "unknown"),
        "label": product.get("label", "Product"),
        "emoji": product.get("emoji", "🎨"),
        "prompt": prompt,
        "image_url": r2_result["url"] if r2_result["success"] else None,
        "success": r2_result["success"],
    }


async def analyze_image(image_bytes: bytes, mime_type: str) -> dict:
    """
    AUTO MODE: Analisis gambar referensi dan generate 3 produk dinamis.

    Alur:
      1. Gemini Vision → analisis + AI pilih 3 produk terbaik + prompt masing-masing
      2. NanoBanana → generate image 3 produk secara parallel
      3. R2 → upload semua gambar
    """
    # Step 1: Analisis via Gemini
    gemini_result = await _analyze_with_gemini(image_bytes, mime_type)
    if not gemini_result["success"]:
        return {
            "success": False,
            "dominant_colors": [], "style": "", "key_elements": "",
            "mood": "", "keywords": [], "products": [],
            "message": gemini_result["message"],
        }

    data = gemini_result["data"]
    ai_products = data.get("products", [])

    # Validasi: pastikan ada 3 produk dari Gemini
    if not ai_products or len(ai_products) < 1:
        return {
            "success": False,
            "dominant_colors": [], "style": "", "key_elements": "",
            "mood": "", "keywords": [], "products": [],
            "message": "AI failed to determine suitable products. Please try again.",
        }

    # Step 2 & 3: Generate + Upload secara parallel
    tasks = [
        _generate_and_upload(product, product.get("prompt", ""))
        for product in ai_products[:3]  # maksimal 3
    ]
    product_results = await asyncio.gather(*tasks, return_exceptions=False)

    return {
        "success": True,
        "dominant_colors": data.get("dominant_colors", []),
        "style": data.get("style", ""),
        "key_elements": data.get("key_elements", ""),
        "mood": data.get("mood", ""),
        "keywords": data.get("keywords", []),
        "products": list(product_results),
        "message": "Analysis and generation completed",
    }


async def analyze_image_with_prompt(image_bytes: bytes, mime_type: str, user_prompt: str) -> dict:
    """
    MANUAL MODE: Analisis gambar referensi + arahan user, generate 3 produk dinamis.

    Alur:
      1. Gemini Vision → gabungkan gambar + arahan user → AI pilih 3 produk + prompt
      2. NanoBanana → generate image 3 produk secara parallel
      3. R2 → upload semua gambar

    Response format identik dengan analyze_image() (Auto Mode).
    """
    # Step 1: Analisis gambar + prompt via Gemini
    gemini_result = await _analyze_with_gemini_manual(image_bytes, mime_type, user_prompt)
    if not gemini_result["success"]:
        return {
            "success": False,
            "dominant_colors": [], "style": "", "key_elements": "",
            "mood": "", "keywords": [], "products": [],
            "message": gemini_result["message"],
        }

    data = gemini_result["data"]
    ai_products = data.get("products", [])

    if not ai_products or len(ai_products) < 1:
        return {
            "success": False,
            "dominant_colors": [], "style": "", "key_elements": "",
            "mood": "", "keywords": [], "products": [],
            "message": "AI failed to determine suitable products. Please try again.",
        }

    # Step 2 & 3: Generate + Upload secara parallel
    tasks = [
        _generate_and_upload(product, product.get("prompt", ""))
        for product in ai_products[:3]
    ]
    product_results = await asyncio.gather(*tasks, return_exceptions=False)

    return {
        "success": True,
        "dominant_colors": data.get("dominant_colors", []),
        "style": data.get("style", ""),
        "key_elements": data.get("key_elements", ""),
        "mood": data.get("mood", ""),
        "keywords": data.get("keywords", []),
        "products": list(product_results),
        "message": "Analysis and generation completed",
    }
