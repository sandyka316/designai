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
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-001",
]

# ── Prompt Step 1: analisis gambar ───────────────────────────────────────────
ANALYSIS_PROMPT = """
Analyze this reference image carefully for product design purposes.
Return a JSON object with EXACTLY these fields (no extra fields):

{
  "dominant_colors": ["#hexcode1", "#hexcode2", "#hexcode3", "#hexcode4", "#hexcode5"],
  "style": "Brief style description (e.g. Minimalist, Gothic, Streetwear, Luxury)",
  "key_elements": "Main visual elements separated by comma",
  "mood": "Mood/atmosphere (e.g. Mystical, Bold, Elegant, Playful)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "totebag_prompt": "A detailed AI image generation prompt to apply this image's design/pattern/artwork onto a totebag product. Describe the totebag with the artwork printed on it. Studio product photo, white background, professional lighting. Max 120 words.",
  "sneakers_prompt": "A detailed AI image generation prompt to apply this image's design/colors/aesthetic onto a pair of sneakers. Describe the sneakers with the design applied. Studio product photo, white background, professional lighting. Max 120 words.",
  "tshirt_prompt": "A detailed AI image generation prompt to apply this image's design/artwork/style onto a T-shirt. Describe the T-shirt with the print/design on it. Studio product photo, white background, clean presentation. Max 120 words."
}

Return ONLY the JSON object. No markdown, no explanation.
"""

# Definisi 3 produk yang didukung
PRODUCTS = [
    {"id": "totebag",  "label": "Tote Bag",   "emoji": "👜", "prompt_key": "totebag_prompt",  "image_size": "1:1"},
    {"id": "sneakers", "label": "Sneakers",    "emoji": "👟", "prompt_key": "sneakers_prompt", "image_size": "1:1"},
    {"id": "tshirt",   "label": "Kaos T-Shirt","emoji": "👕", "prompt_key": "tshirt_prompt",   "image_size": "1:1"},
]


async def _analyze_with_gemini(image_bytes: bytes, mime_type: str) -> dict:
    """
    Kirim gambar ke Gemini, dapatkan analisis + 3 prompt produk.
    Round-robin rotasi API key + fallback ke model berikutnya jika quota habis.
    Retry otomatis jika 503 (service unavailable).
    """
    keys = settings.GEMINI_KEY_LIST
    if not keys:
        return {
            "success": False,
            "message": "GEMINI_API_KEY belum diset. Isi API key di backend/.env.",
        }

    total_keys = len(keys)
    MAX_RETRIES = 2   # retry per key per model saat 503

    # Snapshot indeks awal secara thread-safe
    with _gemini_key_lock:
        start_key_index = _gemini_key_index

    last_error = ""

    # Iterasi semua kombinasi key × model (key sebagai outer loop)
    for key_attempt in range(total_keys):
        current_key_index = (start_key_index + key_attempt) % total_keys
        api_key = keys[current_key_index]
        key_label = f"key #{current_key_index + 1}/{total_keys} (...{api_key[-6:]})"
        client = genai.Client(api_key=api_key)

        for model_name in VISION_MODELS:
            for retry in range(MAX_RETRIES):
                try:
                    print(f"[Recommendation] 🔍 Gemini {key_label} | model={model_name} | attempt={retry + 1}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[
                            types.Part.from_text(text=ANALYSIS_PROMPT),
                            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        ],
                    )

                    raw_text = response.text.strip()

                    # Bersihkan markdown code block jika ada
                    if raw_text.startswith("```"):
                        lines = raw_text.split("\n")
                        raw_text = "\n".join(lines[1:-1])

                    result = json.loads(raw_text)

                    # ✅ Berhasil → advance key index agar request berikutnya pakai key selanjutnya
                    with _gemini_key_lock:
                        _gemini_key_index = (current_key_index + 1) % total_keys

                    print(f"[Recommendation] ✅ Gemini berhasil dengan {key_label} model={model_name}")
                    return {"success": True, "data": result}

                except json.JSONDecodeError:
                    # JSON parse error → tidak ada gunanya retry atau ganti key
                    return {
                        "success": False,
                        "message": "Failed to parse AI response. Please try again.",
                    }

                except Exception as e:
                    err_str = str(e)
                    last_error = err_str

                    # 503 / UNAVAILABLE → retry dengan backoff
                    if any(code in err_str for code in ["503", "UNAVAILABLE"]):
                        if retry < MAX_RETRIES - 1:
                            wait = 2 * (retry + 1)
                            print(f"[Recommendation] ⏳ 503 → retry dalam {wait}s...")
                            await asyncio.sleep(wait)
                            continue
                        else:
                            # Sudah max retry untuk model ini → coba model berikutnya
                            print(f"[Recommendation] ⚠️ 503 max retry untuk {model_name} → coba model berikutnya")
                            break

                    # 429 / quota habis → langsung ganti key (keluar dari model & retry loop)
                    if any(code in err_str for code in ["429", "RESOURCE_EXHAUSTED"]):
                        print(f"[Recommendation] 💸 {key_label} quota habis → coba key berikutnya")
                        # Break dari retry dan model loop, lanjut ke key berikutnya
                        break

                    # 404 / NOT_FOUND → model tidak tersedia, coba model berikutnya
                    if any(code in err_str for code in ["404", "NOT_FOUND"]):
                        print(f"[Recommendation] ⚠️ Model {model_name} not found → coba model berikutnya")
                        break

                    # Error lain → stop seluruh proses
                    print(f"[Recommendation] ❌ Error tak terduga: {err_str[:100]}")
                    last_error = err_str
                    break

                # Break dari retry loop jika tidak ada continue
                break

            else:
                # Retry loop selesai tanpa break (semua retry habis) → lanjut model berikutnya
                continue

            # Break dari retry loop (quota/error) → cek apakah harus ganti key
            if any(code in last_error for code in ["429", "RESOURCE_EXHAUSTED"]):
                # Ganti key → break dari model loop
                break
            # Error lain → lanjut model berikutnya
            continue

        else:
            # Semua model sudah dicoba untuk key ini
            # Jika terakhir error bukan quota, tidak perlu ganti key
            if not any(code in last_error for code in ["429", "RESOURCE_EXHAUSTED"]):
                break

        # Lanjut ke key berikutnya (loop key_attempt increment otomatis)

    # Semua key & model sudah dicoba
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


async def _generate_and_upload(product: dict, prompt: str) -> dict:
    """
    Generate image untuk satu produk via NanoBanana lalu upload ke R2.
    Return dict siap pakai untuk ProductResult.
    """
    nb_result = await nanobanana_generate(prompt, product["image_size"])

    if not nb_result["success"]:
        return {
            "id": product["id"],
            "label": product["label"],
            "emoji": product["emoji"],
            "prompt": prompt,
            "image_url": None,
            "success": False,
        }

    r2_result = await r2_upload(
        image_bytes=nb_result["image_bytes"],
        model_id=product["id"],
        content_type=nb_result["content_type"] or "image/png",
    )

    return {
        "id": product["id"],
        "label": product["label"],
        "emoji": product["emoji"],
        "prompt": prompt,
        "image_url": r2_result["url"] if r2_result["success"] else None,
        "success": r2_result["success"],
    }


async def analyze_image(image_bytes: bytes, mime_type: str) -> dict:
    """
    Analisis gambar referensi dan generate 3 produk (totebag, sneakers, tshirt).

    Alur:
      1. Gemini Vision → analisis + 3 prompt produk (dengan round-robin key rotation)
      2. NanoBanana → generate image 3 produk secara parallel
      3. R2 → upload semua gambar
    """
    # ── Step 1: Analisis via Gemini ───────────────────────────────────────────
    gemini_result = await _analyze_with_gemini(image_bytes, mime_type)
    if not gemini_result["success"]:
        return {
            "success": False,
            "dominant_colors": [], "style": "", "key_elements": "",
            "mood": "", "keywords": [], "products": [],
            "message": gemini_result["message"],
        }

    data = gemini_result["data"]

    # ── Step 2 & 3: Generate + Upload 3 produk secara parallel ───────────────
    tasks = [
        _generate_and_upload(product, data.get(product["prompt_key"], ""))
        for product in PRODUCTS
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
