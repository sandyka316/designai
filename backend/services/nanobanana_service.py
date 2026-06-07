"""
NanoBanana API Service — Image generation via nanobananaapi.ai

Alur (async task):
  1. POST /api/v1/nanobanana/generate  → dapat taskId
  2. Polling GET /api/v1/nanobanana/record-info?taskId=...  → tunggu sampai SUCCESS
  3. Return resultImageUrl → download → base64
"""
import asyncio
import base64

import httpx

from core.config import settings

_BASE_URL = "https://api.nanobananaapi.ai/api/v1"
_POLL_INTERVAL = 3      # detik antar polling
_MAX_POLL       = 40    # max ~120 detik timeout


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.NANOBANANA_API_KEY}",
        "Content-Type": "application/json",
    }


async def _submit_task(prompt: str, image_size: str = "1:1") -> str:
    """Submit generate task, return taskId."""
    payload = {
        "prompt": prompt,
        "type": "TEXTTOIAMGE",        # typo dari API-nya memang begitu
        "callBackUrl": "https://placeholder.invalid/callback",  # wajib diisi, tapi kita pakai polling
        "numImages": 1,
        "image_size": image_size,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{_BASE_URL}/nanobanana/generate",
            json=payload,
            headers=_headers(),
        )
        resp.raise_for_status()
        data = resp.json()

    if data.get("code") != 200:
        raise RuntimeError(f"NanoBanana submit error: {data.get('msg', data)}")

    task_id = data["data"]["taskId"]
    return task_id


async def _poll_task(task_id: str) -> dict:
    """
    Poll task sampai selesai.
    Return data dict dari response saat SUCCESS.
    """
    async with httpx.AsyncClient(timeout=30) as client:
        for _ in range(_MAX_POLL):
            resp = await client.get(
                f"{_BASE_URL}/nanobanana/record-info",
                params={"taskId": task_id},
                headers=_headers(),
            )
            resp.raise_for_status()
            body = resp.json()

            if body.get("code") != 200:
                raise RuntimeError(f"NanoBanana poll error: {body.get('msg', body)}")

            task_data = body["data"]
            flag = str(task_data.get("successFlag", "0"))

            if flag == "1":       # SUCCESS
                return task_data
            elif flag in ("2", "3"):  # FAILED
                err_msg = task_data.get("errorMessage", "Unknown error")
                raise RuntimeError(f"NanoBanana generation failed: {err_msg}")

            # flag == "0" → masih GENERATING, tunggu lalu poll lagi
            await asyncio.sleep(_POLL_INTERVAL)

    raise TimeoutError("NanoBanana: generation timeout setelah 120 detik.")


async def _download_as_base64(url: str) -> str:
    """Download gambar dari URL dan encode ke base64 data URI."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        mime = resp.headers.get("content-type", "image/png").split(";")[0]
        b64 = base64.b64encode(resp.content).decode("utf-8")
        return f"data:{mime};base64,{b64}"


async def generate_image(prompt: str, image_size: str = "1:1") -> dict:
    """
    Generate gambar via NanoBanana API.
    Return: { success, image_url, task_id, message }
    """
    if not settings.NANOBANANA_API_KEY:
        return {
            "success": False,
            "image_url": None,
            "task_id": None,
            "message": (
                "NANOBANANA_API_KEY belum diset. "
                "Isi API key di backend/.env"
            ),
        }

    try:
        # Step 1 — submit task
        task_id = await _submit_task(prompt, image_size)

        # Step 2 — polling sampai selesai
        task_data = await _poll_task(task_id)

        # Step 3 — ambil URL gambar (prefer resultImageUrl, fallback originImageUrl)
        response_obj = task_data.get("response", {})
        image_raw_url = (
            response_obj.get("resultImageUrl")
            or response_obj.get("originImageUrl")
        )

        if not image_raw_url:
            return {
                "success": False,
                "image_url": None,
                "task_id": task_id,
                "message": "NanoBanana tidak mengembalikan URL gambar.",
            }

        # Step 4 — download dan encode ke base64
        image_b64 = await _download_as_base64(image_raw_url)

        return {
            "success": True,
            "image_url": image_b64,
            "task_id": task_id,
            "message": "Image generated successfully",
        }

    except TimeoutError as e:
        return {
            "success": False,
            "image_url": None,
            "task_id": None,
            "message": str(e),
        }
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        if status == 401:
            msg = "NANOBANANA_API_KEY tidak valid. Periksa API key di backend/.env."
        elif status == 402:
            msg = "NanoBanana: kredit habis. Top up di dashboard nanobananaapi.ai."
        elif status == 429:
            msg = "NanoBanana: rate limit. Coba lagi sebentar."
        else:
            msg = f"NanoBanana HTTP error {status}: {e.response.text[:200]}"
        return {
            "success": False,
            "image_url": None,
            "task_id": None,
            "message": msg,
        }
    except Exception as e:
        return {
            "success": False,
            "image_url": None,
            "task_id": None,
            "message": f"NanoBanana error: {str(e)[:200]}",
        }
