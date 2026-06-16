"""
Prompt Service — Gemini dipakai khusus untuk enhance/memperkaya prompt teks
sebelum dikirim ke FLUX untuk image generation.
"""
import threading

from google import genai
from google.genai import types

from core.config import settings

# ── Gemini Key Rotation State (thread-safe) ───────────────────────────────────
_key_lock  = threading.Lock()
_key_index = 0   # indeks key Gemini yang sedang dipakai

# Model fallback untuk enhance prompt (teks saja, tidak butuh multimodal besar)
_ENHANCE_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-001",
]


def _get_client() -> tuple[genai.Client, int]:
    """
    Ambil Gemini client untuk key saat ini (thread-safe snapshot).
    Return (client, current_key_index).
    """
    keys = settings.GEMINI_KEY_LIST
    if not keys:
        return genai.Client(api_key=""), 0
    with _key_lock:
        idx = _key_index
    return genai.Client(api_key=keys[idx % len(keys)]), idx


def _advance_key(current_index: int) -> None:
    """Maju ke key berikutnya secara thread-safe."""
    global _key_index
    keys = settings.GEMINI_KEY_LIST
    if not keys:
        return
    with _key_lock:
        _key_index = (current_index + 1) % len(keys)

_ENHANCE_SYSTEM = """You are an expert AI image prompt engineer specializing in FLUX and Stable Diffusion models.

Your job: take a user's short/rough design idea and rewrite it into a rich, detailed image generation prompt.

Rules:
- Output ONLY the enhanced prompt — no explanation, no preamble, no markdown
- Keep it under 150 words
- Be specific about: style, lighting, colors, composition, mood, quality tags
- Add professional quality tags at the end: (masterpiece, best quality, highly detailed, sharp focus, 8k)
- Do NOT include any negative prompts or NSFW content
"""

_VISION_ENHANCE_SYSTEM = """You are an expert AI image prompt engineer specializing in FLUX and Stable Diffusion models.

The user has uploaded a reference image AND written a text prompt describing what they want to create.
Your job: analyze the reference image carefully, then write a detailed, SAFE image generation prompt.

STRICT RULES — you MUST follow all of these:
1. COLORS: Extract the EXACT dominant colors from the reference image (hex codes or precise color names like "deep purple #6B21A8", "warm gold", "dusty rose"). These colors MUST appear in the output prompt and MUST be the main colors of the generated object.
2. STYLE: Identify the art style, texture, visual patterns, and mood (e.g. watercolor, oil painting, geometric, abstract, minimalist, floral) and apply it to the object the user requested.
3. OBJECT: The main subject is a PRODUCT or DESIGN OBJECT (e.g. sneakers, t-shirt, bag, mug, hoodie). Apply the reference image's colors and style ONTO that object. NEVER generate people, faces, nudity, violence, or any real person.
4. SAFE CONTENT ONLY: The prompt must describe inanimate objects, products, and design patterns only. No humans, body parts, or sensitive content.
5. OUTPUT FORMAT: Write ONE single cohesive image generation prompt. No explanation, no preamble, no markdown, no bullet points.
6. LENGTH: Keep it under 180 words.
7. END with quality tags: (masterpiece, best quality, highly detailed, sharp focus, studio lighting, clean white background, product photography, 8k, no humans, no people)

Example: if reference image has deep purple and gold swirling patterns (oil painting style) and user asks for "sneakers", output should be:
"A pair of sneakers featuring deep purple #4B0082 and warm gold #D4AF37 color scheme, swirling oil painting patterns printed on the surface, premium leather material, elegant baroque aesthetic, rich jewel tones, studio product photography, white background, (masterpiece, best quality, highly detailed, sharp focus, 8k, no humans, no people)"
"""


async def enhance_prompt(user_prompt: str) -> dict:
    """
    Enhance prompt pengguna menggunakan Gemini (teks saja).
    Round-robin rotasi key: jika 429/quota habis → ganti key, coba lagi.
    Return dict: { success, enhanced_prompt, original_prompt, message }
    """
    keys = settings.GEMINI_KEY_LIST
    if not keys:
        return {
            "success": False,
            "enhanced_prompt": user_prompt,
            "original_prompt": user_prompt,
            "message": "GEMINI_API_KEY belum diset di backend/.env.",
        }

    total_keys = len(keys)
    last_error = ""

    # Snapshot indeks awal
    with _key_lock:
        start_index = _key_index

    for key_attempt in range(total_keys):
        current_key_index = (start_index + key_attempt) % total_keys
        client = genai.Client(api_key=keys[current_key_index])
        key_label = f"key #{current_key_index + 1}/{total_keys}"

        for model_name in _ENHANCE_MODELS:
            try:
                print(f"[PromptService] ✏️ enhance_prompt {key_label} | model={model_name}")
                response = client.models.generate_content(
                    model=model_name,
                    contents=f"Enhance this design prompt for AI image generation:\n\n{user_prompt}",
                    config=types.GenerateContentConfig(
                        system_instruction=_ENHANCE_SYSTEM,
                        temperature=0.7,
                        max_output_tokens=300,
                    ),
                )

                enhanced = response.text.strip() if response.text else ""
                if not enhanced:
                    return {
                        "success": False,
                        "enhanced_prompt": user_prompt,
                        "original_prompt": user_prompt,
                        "message": "Gemini returned empty response, using original prompt.",
                    }

                # ✅ Berhasil → advance key
                _advance_key(current_key_index)
                return {
                    "success": True,
                    "enhanced_prompt": enhanced,
                    "original_prompt": user_prompt,
                    "message": "Prompt enhanced successfully",
                }

            except Exception as e:
                err_str = str(e)
                last_error = err_str
                # 429 / quota → ganti key
                if any(code in err_str for code in ["429", "RESOURCE_EXHAUSTED"]):
                    print(f"[PromptService] 💸 {key_label} quota habis → coba key berikutnya")
                    break  # break model loop → key loop akan increment
                # 503 → retry model berikutnya
                if any(code in err_str for code in ["503", "UNAVAILABLE"]):
                    import asyncio
                    await asyncio.sleep(2)
                    continue
                # 404 → model tidak tersedia, coba model berikutnya
                if any(code in err_str for code in ["404", "NOT_FOUND"]):
                    continue
                # Error lain → stop
                break
        else:
            # Semua model pada key ini gagal bukan karena quota → stop
            pass

    # Fallback: gunakan prompt asli jika Gemini gagal
    return {
        "success": False,
        "enhanced_prompt": user_prompt,
        "original_prompt": user_prompt,
        "message": f"Prompt enhancement skipped (Gemini error: {last_error[:100]}). Using original prompt.",
    }


async def enhance_prompt_with_image(user_prompt: str, image_bytes: bytes, mime_type: str) -> dict:
    """
    Enhance prompt dengan menggabungkan analisis gambar referensi + teks prompt user.
    Gemini Vision membaca gambar → ekstrak style → gabungkan dengan prompt user.
    Round-robin rotasi key: jika 429/quota habis → ganti key, coba lagi.
    Return dict: { success, enhanced_prompt, original_prompt, message }
    """
    keys = settings.GEMINI_KEY_LIST
    if not keys:
        return {
            "success": False,
            "enhanced_prompt": user_prompt,
            "original_prompt": user_prompt,
            "message": "GEMINI_API_KEY belum diset di backend/.env.",
        }

    total_keys = len(keys)
    last_error = ""

    # Snapshot indeks awal
    with _key_lock:
        start_index = _key_index

    for key_attempt in range(total_keys):
        current_key_index = (start_index + key_attempt) % total_keys
        client = genai.Client(api_key=keys[current_key_index])
        key_label = f"key #{current_key_index + 1}/{total_keys}"

        for model_name in _ENHANCE_MODELS:
            try:
                print(f"[PromptService] 🖼️ enhance_with_image {key_label} | model={model_name}")
                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Part.from_text(
                            text=(
                                f"Reference image is attached.\n"
                                f"User's request: \"{user_prompt}\"\n\n"
                                f"IMPORTANT:\n"
                                f"1. First, identify the EXACT dominant colors in the reference image\n"
                                f"2. The output object ({user_prompt}) MUST use those exact colors as the primary color scheme\n"
                                f"3. Apply the visual style/pattern/texture from the reference image onto the object\n"
                                f"4. Write ONE detailed image generation prompt combining all of this"
                            )
                        ),
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=_VISION_ENHANCE_SYSTEM,
                        temperature=0.7,
                        max_output_tokens=350,
                    ),
                )

                # Cek apakah Gemini memblokir response karena SAFETY filter
                candidates = getattr(response, "candidates", None)
                if candidates and hasattr(candidates[0], "finish_reason"):
                    finish_reason = candidates[0].finish_reason
                    finish_name = getattr(finish_reason, "name", str(finish_reason))
                    if finish_name == "SAFETY":
                        print("[PromptService] ⚠️ Gemini Vision blocked by SAFETY filter → fallback ke text-only enhance")
                        return await enhance_prompt(user_prompt)

                enhanced = response.text.strip() if response.text else ""
                if not enhanced:
                    # Response kosong bisa berarti SAFETY block tanpa exception
                    print("[PromptService] ⚠️ Gemini Vision returned empty response → fallback ke text-only enhance")
                    return await enhance_prompt(user_prompt)

                # ✅ Berhasil → advance key
                _advance_key(current_key_index)
                return {
                    "success": True,
                    "enhanced_prompt": enhanced,
                    "original_prompt": user_prompt,
                    "message": "Prompt enhanced with image reference successfully",
                }

            except Exception as e:
                err_str = str(e)
                last_error = err_str
                # Deteksi SAFETY block dari Gemini → fallback ke text-only enhance
                if any(keyword in err_str for keyword in ["SAFETY", "safety_ratings", "blocked", "HARM"]):
                    print(f"[PromptService] ⚠️ Gemini Vision SAFETY exception → fallback: {err_str[:100]}")
                    return await enhance_prompt(user_prompt)
                # 429 / quota → ganti key
                if any(code in err_str for code in ["429", "RESOURCE_EXHAUSTED"]):
                    print(f"[PromptService] 💸 {key_label} quota habis → coba key berikutnya")
                    break  # break model loop → key loop akan increment
                # 503 → retry dengan delay
                if any(code in err_str for code in ["503", "UNAVAILABLE"]):
                    import asyncio
                    await asyncio.sleep(2)
                    continue
                # 404 → model tidak tersedia, coba model berikutnya
                if any(code in err_str for code in ["404", "NOT_FOUND"]):
                    continue
                # Error lain → stop
                break
        else:
            # Semua model pada key ini gagal bukan karena quota → stop
            pass

    # Fallback: gunakan prompt asli
    return {
        "success": False,
        "enhanced_prompt": user_prompt,
        "original_prompt": user_prompt,
        "message": f"Vision enhancement skipped (error: {last_error[:100]}). Using original prompt.",
    }
