"""
NanoBanana API Service — Image generation via nanobananaapi.ai

Alur (async task):
  1. POST /api/v1/nanobanana/generate  → dapat taskId
  2. Polling GET /api/v1/nanobanana/record-info?taskId=...  → tunggu sampai SUCCESS
  3. Return resultImageUrl → download raw bytes → diserahkan ke storage_service

Rotasi API Key (Round-Robin):
  - Semua key dibaca dari settings.NANOBANANA_KEY_LIST (dari NANOBANANA_API_KEYS di .env)
  - Setiap request sukses → key index maju 1 (true round-robin load balancing)
  - Jika key aktif mendapat error 401 / 402 / 429 → otomatis ganti ke key berikutnya
  - Jika timeout → coba key berikutnya
  - Jika semua key sudah dicoba dan tetap gagal → return error
"""
import asyncio
import threading

import httpx

from core.config import settings

_BASE_URL      = "https://api.nanobananaapi.ai/api/v1"
_POLL_INTERVAL = 3    # detik antar polling
_MAX_POLL      = 20   # max ~60 detik timeout per key

# ── Key rotation state (thread-safe) ─────────────────────────────────────────
_key_lock  = threading.Lock()
_key_index = 0          # indeks key yang sedang dipakai


def _get_next_key_index(current_index: int, total: int) -> int:
    """Hitung indeks key berikutnya (round-robin)."""
    return (current_index + 1) % total


def _get_key_at(index: int) -> str:
    """Ambil key pada indeks tertentu."""
    keys = settings.NANOBANANA_KEY_LIST
    if not keys:
        return ""
    return keys[index % len(keys)]


def _advance_key() -> int:
    """
    Maju ke key berikutnya secara thread-safe.
    Return indeks baru setelah advance.
    """
    global _key_index
    keys = settings.NANOBANANA_KEY_LIST
    if not keys:
        return 0
    with _key_lock:
        _key_index = (_key_index + 1) % len(keys)
        new_index = _key_index
    return new_index


def _headers(api_key: str) -> dict:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


# ── Custom exceptions ─────────────────────────────────────────────────────────
class InsufficientCreditError(RuntimeError):
    """Raised when a key has insufficient credits — should trigger key rotation."""
    pass


# ── Error codes yang memicu rotasi key ───────────────────────────────────────
_ROTATE_ON_STATUS = {401, 402, 429}


async def _submit_task(prompt: str, image_size: str, api_key: str) -> str:
    """Submit generate task, return taskId."""
    payload = {
        "prompt": prompt,
        "type": "TEXTTOIAMGE",        # typo dari API-nya memang begitu
        "callBackUrl": "https://placeholder.invalid/callback",
        "numImages": 1,
        "image_size": image_size,
        "negative_prompt": (
            "humans, people, faces, nudity, nsfw, violence, body parts, "
            "person, man, woman, child, realistic human, portrait, skin, "
            "sexual content, gore, explicit"
        ),
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{_BASE_URL}/nanobanana/generate",
            json=payload,
            headers=_headers(api_key),
        )
        resp.raise_for_status()
        data = resp.json()

    if data.get("code") != 200:
        msg = data.get("msg", str(data))
        # Deteksi pesan kredit habis → trigger rotasi key
        if "insufficient" in msg.lower() or "credit" in msg.lower() or "top up" in msg.lower():
            raise InsufficientCreditError(f"NanoBanana submit error: {msg}")
        raise RuntimeError(f"NanoBanana submit error: {msg}")

    task_id = data["data"]["taskId"]
    return task_id


async def _poll_task(task_id: str, api_key: str) -> dict:
    """
    Poll task sampai selesai.
    Return data dict dari response saat SUCCESS.
    """
    async with httpx.AsyncClient(timeout=30) as client:
        for _ in range(_MAX_POLL):
            resp = await client.get(
                f"{_BASE_URL}/nanobanana/record-info",
                params={"taskId": task_id},
                headers=_headers(api_key),
            )
            resp.raise_for_status()
            body = resp.json()

            if body.get("code") != 200:
                raise RuntimeError(f"NanoBanana poll error: {body.get('msg', body)}")

            task_data = body["data"]
            flag = str(task_data.get("successFlag", "0"))

            if flag == "1":           # SUCCESS
                return task_data
            elif flag in ("2", "3"):  # FAILED
                err_msg = task_data.get("errorMessage", "Unknown error")
                raise RuntimeError(f"NanoBanana generation failed: {err_msg}")

            # flag == "0" → masih GENERATING, tunggu lalu poll lagi
            await asyncio.sleep(_POLL_INTERVAL)

    raise TimeoutError("NanoBanana: generation timeout setelah 60 detik.")


async def _download_image_bytes(url: str) -> tuple[bytes, str]:
    """Download gambar dari URL, return (raw_bytes, content_type)."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "image/png").split(";")[0].strip()
        return resp.content, content_type


async def generate_image(prompt: str, image_size: str = "1:1") -> dict:
    """
    Generate gambar via NanoBanana API dengan rotasi key round-robin otomatis.

    Strategi:
      - Ambil snapshot indeks saat ini (thread-safe)
      - Coba tiap key satu per satu mulai dari indeks tersebut
      - Jika berhasil → advance key (agar request berikutnya mulai dari key selanjutnya)
      - Jika gagal (401/402/429/timeout) → langsung coba key berikutnya
      - Jika semua key gagal → return error

    Return: { success, image_bytes, content_type, task_id, message }
    """
    global _key_index

    keys = settings.NANOBANANA_KEY_LIST
    if not keys:
        return {
            "success": False,
            "image_bytes": None,
            "content_type": None,
            "task_id": None,
            "message": (
                "NANOBANANA_API_KEYS belum diset. "
                "Isi API key di backend/.env (gunakan NANOBANANA_API_KEYS untuk multi-key)"
            ),
        }

    total_keys = len(keys)

    # Snapshot indeks awal secara thread-safe
    with _key_lock:
        start_index = _key_index

    last_error_msg = ""

    # Coba semua key satu per satu, mulai dari indeks saat ini (round-robin)
    for attempt in range(total_keys):
        current_index = (start_index + attempt) % total_keys
        api_key = keys[current_index]
        key_label = f"key #{current_index + 1}/{total_keys} (...{api_key[-6:]})"

        try:
            print(f"[NanoBanana] 🚀 Attempt {attempt + 1}/{total_keys} menggunakan {key_label}")

            # Step 1 — submit task
            task_id = await _submit_task(prompt, image_size, api_key)

            # Step 2 — polling sampai selesai
            task_data = await _poll_task(task_id, api_key)

            # Step 3 — ambil URL gambar
            response_obj = task_data.get("response", {})
            image_raw_url = (
                response_obj.get("resultImageUrl")
                or response_obj.get("originImageUrl")
            )

            if not image_raw_url:
                return {
                    "success": False,
                    "image_bytes": None,
                    "content_type": None,
                    "task_id": task_id,
                    "message": "NanoBanana tidak mengembalikan URL gambar.",
                }

            # Step 4 — download raw bytes
            image_bytes, content_type = await _download_image_bytes(image_raw_url)

            # ✅ Berhasil → advance key index agar request berikutnya pakai key selanjutnya
            with _key_lock:
                _key_index = (current_index + 1) % total_keys

            print(f"[NanoBanana] ✅ Berhasil dengan {key_label} → next key #{_key_index + 1}")
            return {
                "success": True,
                "image_bytes": image_bytes,
                "content_type": content_type,
                "task_id": task_id,
                "message": "Image generated successfully",
            }

        except TimeoutError:
            # Timeout = server sedang sibuk, coba key berikutnya
            last_error_msg = f"Key {key_label} timeout (server sibuk)."
            print(f"[NanoBanana] ⏱️  {last_error_msg} → coba key berikutnya...")
            # Lanjut ke attempt berikutnya (loop increment otomatis)

        except httpx.HTTPStatusError as e:
            status = e.response.status_code

            if status == 401:
                last_error_msg = f"Key {key_label} tidak valid (401 Unauthorized)."
            elif status == 402:
                last_error_msg = f"Key {key_label} kredit habis (402 Payment Required)."
            elif status == 429:
                last_error_msg = f"Key {key_label} rate limit (429 Too Many Requests)."
            else:
                # Error lain (500, dll) — bukan masalah key, langsung return
                msg = f"NanoBanana HTTP error {status}: {e.response.text[:200]}"
                return {
                    "success": False,
                    "image_bytes": None,
                    "content_type": None,
                    "task_id": None,
                    "message": msg,
                }

            print(f"[NanoBanana] ⚠️  {last_error_msg} → coba key berikutnya...")
            # Lanjut ke attempt berikutnya (loop increment otomatis)

        except InsufficientCreditError as e:
            # Kredit habis → coba key berikutnya
            last_error_msg = f"Key {key_label} kredit habis: {str(e)[:100]}"
            print(f"[NanoBanana] 💸 {last_error_msg} → coba key berikutnya...")
            # Lanjut ke attempt berikutnya (loop increment otomatis)

        except RuntimeError as e:
            # Error lain dari logic NanoBanana (bukan HTTP, bukan kredit) — langsung return
            return {
                "success": False,
                "image_bytes": None,
                "content_type": None,
                "task_id": None,
                "message": f"NanoBanana error: {str(e)[:200]}",
            }

        except Exception as e:
            return {
                "success": False,
                "image_bytes": None,
                "content_type": None,
                "task_id": None,
                "message": f"NanoBanana unexpected error: {str(e)[:200]}",
            }

    # Semua key sudah dicoba dan gagal
    print(f"[NanoBanana] ❌ Semua {total_keys} key gagal.")
    return {
        "success": False,
        "image_bytes": None,
        "content_type": None,
        "task_id": None,
        "message": (
            f"Semua {total_keys} NanoBanana API key tidak tersedia "
            f"(habis kredit / tidak valid / timeout). "
            f"Error terakhir: {last_error_msg}"
        ),
    }
