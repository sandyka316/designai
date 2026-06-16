"""
vsm_search.py — Vector Space Model Semantic Search Route
=========================================================
GET /api/vsm-search?q={query}&limit={n}&min_score={threshold}

Flow:
1. Encode query text → 512-dim CLIP embedding
2. Ambil semua design dengan embedding dari DB
3. Hitung cosine similarity di Python (numpy)
4. Return top-K hasil diurutkan by similarity score
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text

from database.session import AsyncSessionLocal
from services.vsm_service import encode_text, rank_by_similarity, similarity_label

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("")
async def vsm_search(
    q: str = Query(..., min_length=1, max_length=500, description="Query pencarian semantik"),
    limit: int = Query(10, ge=1, le=50, description="Jumlah hasil maksimal"),
    min_score: float = Query(0.0, ge=0.0, le=1.0, description="Minimum similarity score (0.0–1.0)"),
    status_filter: Optional[str] = Query(None, description="Filter status: 'success' atau 'failed'"),
):
    """
    Semantic Design Search menggunakan Vector Space Model (CLIP embeddings).
    
    - Mencari design berdasarkan kemiripan makna/semantik, bukan hanya keyword
    - Query "minimalist dark poster" akan menemukan design dengan prompt serupa
      meski tidak ada kata yang sama persis
    - Hasil diurutkan dari yang paling mirip (similarity_score mendekati 1.0)
    """
    logger.info(f"[VSM] Search query: '{q}', limit={limit}, min_score={min_score}")
    
    # ── 1. Encode query ──────────────────────────────────────────────────────
    try:
        query_embedding = encode_text(q)
    except Exception as e:
        logger.error(f"[VSM] Gagal encode query: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal encode query: {str(e)[:100]}")
    
    # ── 2. Ambil semua design dengan embedding dari DB ───────────────────────
    async with AsyncSessionLocal() as session:
        try:
            where_clause = "WHERE embedding IS NOT NULL"
            if status_filter:
                where_clause += f" AND status = :status_filter"
            
            query_sql = text(f"""
                SELECT
                    id::text,
                    prompt,
                    enhanced_prompt,
                    image_url,
                    status,
                    model_used,
                    rating,
                    generation_time_ms,
                    created_at,
                    embedding
                FROM generation_history
                {where_clause}
                ORDER BY created_at DESC
            """)
            
            params = {}
            if status_filter:
                params["status_filter"] = status_filter
            
            result = await session.execute(query_sql, params)
            rows = result.mappings().all()
            
        except Exception as e:
            logger.error(f"[VSM] DB error: {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)[:100]}")
    
    if not rows:
        return {
            "query": q,
            "total_corpus": 0,
            "results": [],
            "message": "Belum ada design dengan embedding. Jalankan generate_embeddings.py terlebih dahulu.",
        }
    
    # Convert ke list of dict untuk VSM ranking
    documents = []
    for row in rows:
        doc = dict(row)
        # Convert datetime ke string
        if doc.get("created_at"):
            doc["created_at"] = doc["created_at"].isoformat()
        documents.append(doc)
    
    # ── 3. Hitung cosine similarity & ranking ────────────────────────────────
    ranked = rank_by_similarity(
        query_embedding=query_embedding,
        documents=documents,
        embedding_key="embedding",
        top_k=limit,
        min_score=min_score,
    )
    
    # ── 4. Format response ───────────────────────────────────────────────────
    results = []
    for rank_idx, doc in enumerate(ranked, 1):
        score = doc["similarity_score"]
        results.append({
            "rank": rank_idx,
            "id": doc["id"],
            "prompt": doc["prompt"],
            "enhanced_prompt": doc.get("enhanced_prompt"),
            "image_url": doc.get("image_url"),
            "status": doc.get("status"),
            "model_used": doc.get("model_used"),
            "rating": doc.get("rating"),
            "generation_time_ms": doc.get("generation_time_ms"),
            "created_at": doc.get("created_at"),
            "similarity_score": score,
            "similarity_percent": round(score * 100, 1),
            "similarity_label": similarity_label(score),
        })
    
    logger.info(f"[VSM] Found {len(results)} results from {len(documents)} corpus docs")
    
    return {
        "query": q,
        "query_embedding_dim": len(query_embedding),
        "total_corpus": len(documents),
        "total_results": len(results),
        "min_score_filter": min_score,
        "results": results,
    }


@router.get("/stats")
async def vsm_stats():
    """Statistik corpus untuk VSM search."""
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(text("""
                SELECT
                    COUNT(*) as total,
                    COUNT(embedding) as with_embedding,
                    COUNT(*) - COUNT(embedding) as without_embedding,
                    COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
                    COUNT(CASE WHEN embedding IS NOT NULL AND status = 'success' THEN 1 END) as success_with_embedding
                FROM generation_history
            """))
            stats = dict(result.mappings().one())
            
            return {
                "corpus_total": stats["total"],
                "corpus_with_embedding": stats["with_embedding"],
                "corpus_without_embedding": stats["without_embedding"],
                "success_designs": stats["success_count"],
                "success_with_embedding": stats["success_with_embedding"],
                "embedding_coverage_percent": round(
                    (stats["with_embedding"] / stats["total"] * 100) if stats["total"] > 0 else 0,
                    1
                ),
                "model": "openai/clip-vit-base-patch32",
                "embedding_dim": 512,
                "similarity_metric": "cosine similarity",
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
