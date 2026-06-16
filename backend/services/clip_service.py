"""
clip_service.py — CLIP-based Prompt-Image Alignment Scorer
============================================================
Menggunakan OpenAI CLIP (via Hugging Face transformers) untuk mengukur
seberapa cocok hasil gambar dengan prompt yang diberikan.

Score: 0–100 (cosine similarity antara text embedding dan image embedding)
"""

from __future__ import annotations

import io
import logging
from functools import lru_cache
from typing import Optional

import requests
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

logger = logging.getLogger(__name__)

# ── Model singleton (lazy load, hanya download sekali) ──────────────────────

_MODEL_NAME = "openai/clip-vit-base-patch32"
_model: Optional[CLIPModel] = None
_processor: Optional[CLIPProcessor] = None


def _load_model() -> tuple[CLIPModel, CLIPProcessor]:
    """Load CLIP model & processor (singleton — hanya sekali per proses)."""
    global _model, _processor
    if _model is None or _processor is None:
        logger.info("[CLIP] Loading CLIP model from Hugging Face...")
        _model = CLIPModel.from_pretrained(_MODEL_NAME)
        _processor = CLIPProcessor.from_pretrained(_MODEL_NAME)
        _model.eval()
        logger.info("[CLIP] Model loaded successfully.")
    return _model, _processor


# ── Main scoring function ────────────────────────────────────────────────────

def score_prompt_image_alignment(
    prompt: str,
    image_url: str,
) -> dict:
    """
    Hitung skor kesesuaian antara prompt (text) dan gambar (image URL).

    Returns:
        {
            "score": float,          # 0.0–100.0
            "score_raw": float,      # cosine similarity sebelum scaling
            "label": str,            # "Excellent" / "Good" / "Fair" / "Poor"
            "interpretation": str,   # penjelasan skor
            "model": str,            # nama model yang dipakai
        }
    """
    try:
        model, processor = _load_model()

        # ── Download gambar ──────────────────────────────────────────────────
        try:
            # Handle base64 data URL
            if image_url.startswith("data:image"):
                import base64
                header, b64data = image_url.split(",", 1)
                img_bytes = base64.b64decode(b64data)
                image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            else:
                resp = requests.get(image_url, timeout=15)
                resp.raise_for_status()
                image = Image.open(io.BytesIO(resp.content)).convert("RGB")
        except Exception as e:
            logger.error(f"[CLIP] Failed to load image: {e}")
            return _error_result(f"Gagal memuat gambar: {str(e)[:80]}")

        # ── Batasi panjang prompt (CLIP max 77 tokens) ───────────────────────
        short_prompt = prompt[:200]

        # ── Proses dengan CLIP ────────────────────────────────────────────────
        with torch.no_grad():
            inputs = processor(
                text=[short_prompt],
                images=image,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=77,
            )

            outputs = model(**inputs)

            # Cosine similarity antara image features dan text features
            image_embeds = outputs.image_embeds  # [1, 512]
            text_embeds = outputs.text_embeds    # [1, 512]

            # Normalize
            image_embeds = image_embeds / image_embeds.norm(dim=-1, keepdim=True)
            text_embeds = text_embeds / text_embeds.norm(dim=-1, keepdim=True)

            similarity = (image_embeds @ text_embeds.T).item()  # -1 to 1

        # ── Scale ke 0–100 ───────────────────────────────────────────────────
        # CLIP cosine similarity biasanya berkisar 0.1–0.4 untuk gambar yang relevan
        # Scale: (similarity - 0.0) / 0.5 * 100, clamp ke [0, 100]
        score = float(max(0.0, min(100.0, (similarity / 0.5) * 100)))

        label, interpretation = _interpret_score(score)

        logger.info(f"[CLIP] score={score:.1f} (raw={similarity:.4f}) for prompt='{short_prompt[:40]}...'")

        return {
            "score": round(score, 1),
            "score_raw": round(similarity, 4),
            "label": label,
            "interpretation": interpretation,
            "model": _MODEL_NAME,
            "error": None,
        }

    except Exception as e:
        logger.exception(f"[CLIP] Unexpected error: {e}")
        return _error_result(str(e)[:100])


def _interpret_score(score: float) -> tuple[str, str]:
    """Kembalikan label dan interpretasi berdasarkan skor."""
    if score >= 75:
        return "Excellent", "Gambar sangat sesuai dengan prompt. Hasil generation berkualitas tinggi."
    elif score >= 55:
        return "Good", "Gambar cukup sesuai dengan prompt. Elemen utama terpresentasi dengan baik."
    elif score >= 35:
        return "Fair", "Gambar agak sesuai dengan prompt. Beberapa elemen mungkin tidak terpresentasi."
    elif score >= 15:
        return "Poor", "Gambar kurang sesuai dengan prompt. Pertimbangkan untuk re-generate dengan prompt lebih spesifik."
    else:
        return "Very Poor", "Gambar tidak sesuai dengan prompt. Disarankan untuk memperbaiki prompt dan re-generate."


def _error_result(msg: str) -> dict:
    return {
        "score": None,
        "score_raw": None,
        "label": "Error",
        "interpretation": msg,
        "model": _MODEL_NAME,
        "error": msg,
    }
