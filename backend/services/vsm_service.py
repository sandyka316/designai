"""
vsm_service.py — Vector Space Model untuk Semantic Design Search
================================================================
Menggunakan CLIP text encoder untuk mengubah prompt menjadi 512-dim vector,
lalu menghitung cosine similarity untuk pencarian semantik.

Tidak membutuhkan pgvector — embedding disimpan sebagai JSON text di PostgreSQL,
cosine similarity dihitung di Python menggunakan numpy.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

import numpy as np
import torch
from transformers import CLIPModel, CLIPProcessor

logger = logging.getLogger(__name__)

_MODEL_NAME = "openai/clip-vit-base-patch32"
_model: Optional[CLIPModel] = None
_processor: Optional[CLIPProcessor] = None


def _load_model() -> tuple[CLIPModel, CLIPProcessor]:
    """Load CLIP model & processor (singleton)."""
    global _model, _processor
    if _model is None or _processor is None:
        logger.info("[VSM] Loading CLIP model...")
        _model = CLIPModel.from_pretrained(_MODEL_NAME)
        _processor = CLIPProcessor.from_pretrained(_MODEL_NAME)
        _model.eval()
        logger.info("[VSM] CLIP model loaded.")
    return _model, _processor


def encode_text(text: str) -> list[float]:
    """
    Encode teks menjadi 512-dim normalized vector menggunakan CLIP text encoder.
    
    Returns:
        list[float] — 512 elemen, sudah L2-normalized
    """
    model, processor = _load_model()
    
    # Truncate ke max CLIP token length
    short_text = text[:300]
    
    with torch.no_grad():
        # Gunakan processor dengan dummy image agar bisa pakai model(**inputs)
        # Atau gunakan model.text_model langsung untuk text-only encoding
        inputs = processor(
            text=[short_text],
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=77,
        )
        
        # Ambil hanya text inputs (input_ids, attention_mask)
        text_inputs = {
            k: v for k, v in inputs.items()
            if k in ("input_ids", "attention_mask")
        }
        
        # Gunakan text_model langsung → dapat last_hidden_state → pool → normalize
        text_outputs = model.text_model(**text_inputs)
        # pooler_output adalah representasi [CLS] yang sudah di-pool
        pooled = text_outputs.pooler_output  # shape: [1, 512]
        
        # Proyeksikan dengan text_projection (sama seperti get_text_features internals)
        if hasattr(model, "text_projection") and model.text_projection is not None:
            pooled = model.text_projection(pooled)
        
        # L2 normalize
        text_features = pooled / pooled.norm(dim=-1, keepdim=True)
    
    return text_features[0].tolist()


def embedding_to_json(embedding: list[float]) -> str:
    """Serialize embedding list ke JSON string untuk disimpan di DB."""
    return json.dumps(embedding)


def json_to_embedding(json_str: str) -> np.ndarray:
    """Deserialize JSON string dari DB ke numpy array."""
    return np.array(json.loads(json_str), dtype=np.float32)


def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """
    Hitung cosine similarity antara dua vector.
    Karena keduanya sudah L2-normalized, cukup dot product.
    """
    return float(np.dot(vec_a, vec_b))


def rank_by_similarity(
    query_embedding: list[float],
    documents: list[dict],
    embedding_key: str = "embedding",
    top_k: int = 10,
    min_score: float = 0.0,
) -> list[dict]:
    """
    Ranking dokumen berdasarkan cosine similarity dengan query.
    
    Args:
        query_embedding: Vector query (512-dim, normalized)
        documents: List of dict, tiap dict punya field embedding (JSON string)
        embedding_key: Key nama field embedding di dokumen
        top_k: Jumlah hasil teratas yang dikembalikan
        min_score: Filter dokumen dengan similarity di bawah threshold
    
    Returns:
        List dokumen dengan field tambahan 'similarity_score', sorted descending
    """
    query_vec = np.array(query_embedding, dtype=np.float32)
    
    scored = []
    for doc in documents:
        emb_json = doc.get(embedding_key)
        if not emb_json:
            continue
        
        try:
            doc_vec = json_to_embedding(emb_json)
            score = cosine_similarity(query_vec, doc_vec)
            
            if score >= min_score:
                doc_copy = {**doc, "similarity_score": round(score, 4)}
                scored.append(doc_copy)
        except Exception as e:
            logger.warning(f"[VSM] Gagal hitung similarity untuk doc {doc.get('id', '?')}: {e}")
            continue
    
    # Sort descending by similarity
    scored.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    return scored[:top_k]


def similarity_label(score: float) -> str:
    """Label kualitas similarity score."""
    if score >= 0.85:
        return "Very High"
    elif score >= 0.70:
        return "High"
    elif score >= 0.55:
        return "Medium"
    elif score >= 0.40:
        return "Low"
    else:
        return "Very Low"
