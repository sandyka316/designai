"""
analytics.py — Data Mining endpoints
=====================================
1. GET /api/analytics/clusters    → K-Means clustering dari prompt (TF-IDF)
2. GET /api/analytics/associations → Apriori association rules dari history per-user
3. GET /api/analytics/trends       → Trend analysis (top keywords per minggu)
"""

import re
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_user
from database.session import get_db
from models.generation import GenerationHistory
from models.user import User

router = APIRouter()

# _GUEST_USER_ID dihapus — sekarang pakai current_user dari token

# ── Stopwords bahasa Inggris + Indonesia minimal ─────────────────────────────
_STOPWORDS = {
    # English common
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "this", "that", "these", "those", "it", "its",
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "they",
    "their", "what", "which", "who", "how", "when", "where", "not", "no",
    "can", "just", "very", "really", "also", "about", "into", "over",
    "after", "before", "more", "some", "any", "all", "each", "every",
    "both", "such", "than", "too", "only", "so", "like", "then",
    # English - generic action verbs / meta words (bukan kata desain)
    "make", "create", "generate", "image", "photo", "picture",
    "draw", "render", "show", "display", "add", "put",
    "use", "using", "based", "look", "looks", "looking", "want", "need",
    "please", "give", "get", "new", "good", "nice",
    "beautiful", "pretty", "amazing", "great", "best", "high", "quality",
    "resolution", "detailed", "detail", "details", "realistic", "ultra",
    "super", "highly",
    # Kata noise dari enhanced prompt Gemini (studio/product shot descriptor)
    "studio", "product", "background", "professional", "lighting", "clean",
    "presentation", "focus", "texture", "fabric", "visible", "white",
    "featuring", "inspired", "depicts", "captured", "perfectly", "beneath",
    "across", "scattered", "filled", "elements", "scene", "under", "across",
    # Indonesian - umum / filler words
    "yang", "dan", "atau", "di", "ke", "dari", "untuk", "dengan", "adalah",
    "ini", "itu", "pada", "dalam", "tidak", "ada", "buat", "bikin",
    "sebuah", "saya", "aku", "kamu", "nya", "juga", "sudah", "belum",
    "akan", "bisa", "harus", "mau", "ingin", "tolong", "coba", "dong",
    "nih", "sih", "kan", "lah", "ya", "deh", "aja", "banget",
    # Indonesian - generic action verbs & kata generic (bukan kata desain)
    "buatkan", "buatin", "bikinin", "tampilkan", "tunjukkan", "kasih",
    "gambarkan", "seperti", "bertema", "bergaya", "bergambar",
    "warna", "warni", "gambar", "desain", "tema",
    "sebagus", "mungkin", "berwarna", "tasnya", "berdasarkan", "buatlah",
}

# ── Kata yang SELALU dianggap kata desain penting (tidak boleh di-filter) ────
# Kata ini mungkin ada di stopwords bahasa umum tapi penting untuk konteks desain
_DESIGN_KEYWORDS = {
    "bag", "tote", "tas", "kaos", "shirt", "sepatu", "sneakers", "shoes",
    "floral", "pattern", "print", "minimalist", "elegant", "dark", "navy",
    "black", "blue", "red", "gold", "white", "sky", "night", "star", "starry",
    "cyberpunk", "futuristic", "neon", "vintage", "modern", "casual",
    "luxury", "premium", "canvas", "graphic", "artwork", "castle",
}


def _tokenize(text: str) -> list[str]:
    """Lowercase + hanya kata alfabetik, panjang ≥ 3, bukan stopword.
    Kata di _DESIGN_KEYWORDS selalu lolos meski ada di stopwords."""
    words = re.findall(r"[a-zA-Z]{3,}", text.lower())
    return [w for w in words if w in _DESIGN_KEYWORDS or w not in _STOPWORDS]


def _tokenize_short(text: str) -> list[str]:
    """Tokenize khusus untuk original prompt (pendek, 3-10 kata).
    Lebih agresif mempertahankan kata desain."""
    words = re.findall(r"[a-zA-ZÀ-ɏ]{2,}", text.lower())
    result = []
    seen = set()
    for w in words:
        if w in seen:
            continue
        seen.add(w)
        if w in _DESIGN_KEYWORDS:
            result.append(w)
        elif w not in _STOPWORDS and len(w) >= 3:
            result.append(w)
    return result


def _label_cluster(prompts: list[str]) -> str:
    """Beri nama cluster dari kata paling sering muncul."""
    tokens: list[str] = []
    for p in prompts:
        tokens.extend(_tokenize(p))
    if not tokens:
        return "Misc"
    top = Counter(tokens).most_common(2)
    return " & ".join(w.capitalize() for w, _ in top)


# ─────────────────────────────────────────────────────────────────────────────
# 1. K-MEANS CLUSTERING
# ─────────────────────────────────────────────────────────────────────────────
CLUSTER_COLORS = [
    {"bg": "#7c6dfa", "text": "#ffffff", "name": "Violet"},
    {"bg": "#06b6d4", "text": "#ffffff", "name": "Cyan"},
    {"bg": "#f59e0b", "text": "#ffffff", "name": "Amber"},
    {"bg": "#10b981", "text": "#ffffff", "name": "Emerald"},
    {"bg": "#ef4444", "text": "#ffffff", "name": "Rose"},
    {"bg": "#8b5cf6", "text": "#ffffff", "name": "Purple"},
]


@router.get("/clusters")
async def get_clusters(
    k: int = 4,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Clustering desain menggunakan TF-IDF + K-Means.
    Parameter k: jumlah cluster (default 4, min 2, max 6).
    """
    k = max(2, min(k, 6))

    # Ambil semua prompt sukses
    stmt = (
        select(GenerationHistory)
        .where(
            GenerationHistory.user_id == current_user.id,
            GenerationHistory.status == "success",
        )
        .order_by(GenerationHistory.created_at.desc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    if len(records) < 4:
        return {
            "clusters": [],
            "total_items": len(records),
            "message": "Minimal 4 generasi sukses dibutuhkan untuk clustering.",
        }

    prompts = [r.prompt for r in records]
    ids = [str(r.id) for r in records]
    image_urls = [r.image_url for r in records]
    created_ats = [r.created_at for r in records]

    # TF-IDF Vectorization
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.cluster import KMeans
        from sklearn.preprocessing import normalize

        vectorizer = TfidfVectorizer(
            max_features=200,
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
        )
        X = vectorizer.fit_transform(prompts)
        X_norm = normalize(X)

        # Sesuaikan k dengan jumlah data
        k_actual = min(k, len(prompts))

        km = KMeans(n_clusters=k_actual, random_state=42, n_init=10, max_iter=300)
        labels = km.fit_predict(X_norm)

    except Exception as e:
        return {"clusters": [], "error": str(e), "total_items": len(records)}

    # Kelompokkan hasil per cluster
    cluster_map: dict[int, list[dict]] = defaultdict(list)
    for idx, label in enumerate(labels):
        cluster_map[int(label)].append(
            {
                "id": ids[idx],
                "prompt": prompts[idx],
                "image_url": image_urls[idx],
                "created_at": created_ats[idx].isoformat() if created_ats[idx] else None,
            }
        )

    clusters = []
    for cluster_id in sorted(cluster_map.keys()):
        items = cluster_map[cluster_id]
        cluster_prompts = [i["prompt"] for i in items]
        color = CLUSTER_COLORS[cluster_id % len(CLUSTER_COLORS)]
        clusters.append(
            {
                "id": cluster_id,
                "label": _label_cluster(cluster_prompts),
                "count": len(items),
                "color": color,
                "items": items[:6],  # Tampilkan max 6 item per cluster di frontend
            }
        )

    return {
        "clusters": clusters,
        "total_items": len(records),
        "k": k_actual,
        "message": f"Berhasil mengelompokkan {len(records)} desain ke dalam {k_actual} cluster.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2. APRIORI ASSOCIATION RULES
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/associations")
async def get_associations(
    min_support: float = 0.1,
    min_confidence: float = 0.5,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Apriori association rules: keyword mana yang sering muncul bersama.
    Setiap 'transaksi' = satu prompt (bag of tokens).
    Hasilnya: 'User yang generate X juga sering generate Y'.
    """
    # Ambil semua prompt sukses (semua user, lebih representatif)
    stmt = (
        select(GenerationHistory)
        .where(GenerationHistory.status == "success")
        .order_by(GenerationHistory.created_at.desc())
        .limit(500)  # batasi 500 record terbaru
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    if len(records) < 5:
        return {
            "rules": [],
            "total_transactions": len(records),
            "message": "Minimal 5 generasi dibutuhkan untuk menemukan association rules.",
        }

    # Bangun transactions: pakai prompt ORIGINAL (pendek, bukan enhanced Gemini)
    # agar kata desain benar-benar sering overlap antar transaksi
    transactions = []
    for r in records:
        # Skip prompt yang terlalu panjang (>120 karakter) — kemungkinan enhanced
        # Gemini prompt yang tersimpan di kolom prompt karena enhanced_prompt = NULL
        raw_prompt = r.prompt
        if len(raw_prompt) > 120:
            # Coba pakai enhanced_prompt sebagai fallback untuk ambil original
            # Jika tidak ada, skip record ini dari Apriori
            continue

        tokens = list(set(_tokenize_short(raw_prompt)))
        # Batasi max 8 token per transaksi — prompt panjang (enhanced Gemini)
        # yang tersimpan di kolom prompt akan punya banyak token noise.
        # Prioritaskan _DESIGN_KEYWORDS dulu, lalu sisanya
        design_toks = [t for t in tokens if t in _DESIGN_KEYWORDS]
        other_toks  = [t for t in tokens if t not in _DESIGN_KEYWORDS]
        tokens = (design_toks + other_toks)[:8]
        if len(tokens) >= 2:
            transactions.append(tokens)

    if len(transactions) < 5:
        return {
            "rules": [],
            "total_transactions": len(transactions),
            "message": "Data tidak cukup beragam untuk Apriori.",
        }

    try:
        import pandas as pd
        from mlxtend.preprocessing import TransactionEncoder
        from mlxtend.frequent_patterns import apriori, association_rules

        te = TransactionEncoder()
        te_array = te.fit(transactions).transform(transactions)
        df = pd.DataFrame(te_array, columns=te.columns_)

        # Hitung min_support adaptif berdasarkan jumlah transaksi
        # Dengan 15 transaksi: kata muncul 2x = support 2/15 ≈ 0.13
        # Dengan 10 transaksi: kata muncul 2x = support 2/10 = 0.20
        n = len(transactions)
        # Support = kata muncul minimal 2x dari total transaksi
        adaptive_support = max(0.1, 2.0 / n)

        frequent_itemsets = apriori(
            df,
            min_support=adaptive_support,
            use_colnames=True,
            max_len=3,
        )

        # Jika masih kosong, turunkan ke 1 kemunculan
        if frequent_itemsets.empty:
            frequent_itemsets = apriori(
                df,
                min_support=max(0.05, 1.0 / n),
                use_colnames=True,
                max_len=3,
            )

        if frequent_itemsets.empty:
            return {
                "rules": [],
                "total_transactions": len(transactions),
                "message": "Tidak ditemukan pola berulang. Coba generate lebih banyak desain dengan tema serupa.",
            }

        # Coba confidence dari tinggi ke rendah (tanpa num_itemsets — tidak semua versi mlxtend support)
        def _try_rules(fi, threshold):
            try:
                return association_rules(fi, metric="confidence", min_threshold=threshold, num_itemsets=len(fi))
            except TypeError:
                return association_rules(fi, metric="confidence", min_threshold=threshold)

        rules_df = _try_rules(frequent_itemsets, 0.5)
        if rules_df.empty:
            rules_df = _try_rules(frequent_itemsets, 0.3)
        if rules_df.empty:
            rules_df = _try_rules(frequent_itemsets, 0.1)

        # ── Sort lebih adil: prioritaskan rules dengan support tinggi (banyak data)
        # Score = support × confidence × min(lift, 3.0)
        # → Rules dari data banyak & relevan lebih diprioritaskan
        # → Rules dari 1-2 data langka (lift sangat tinggi) tidak mendominasi
        rules_df["relevance_score"] = (
            rules_df["support"]
            * rules_df["confidence"]
            * rules_df["lift"].clip(upper=3.0)
        )
        rules_df = rules_df.sort_values("relevance_score", ascending=False)

        # Deduplikasi: hindari rules yang "terbalik" (A→B dan B→A) di top 10
        seen_pairs: set = set()
        unique_rules = []
        for _, row in rules_df.iterrows():
            ant = frozenset(row["antecedents"])
            con = frozenset(row["consequents"])
            pair = frozenset([ant, con])
            if pair not in seen_pairs:
                seen_pairs.add(pair)
                unique_rules.append(row)
            if len(unique_rules) >= 10:
                break

        rules = []
        for row in unique_rules:
            antecedents = list(row["antecedents"])
            consequents = list(row["consequents"])
            rules.append(
                {
                    "if_you_like": antecedents,
                    "you_might_also_like": consequents,
                    "support": round(float(row["support"]), 3),
                    "confidence": round(float(row["confidence"]), 3),
                    "lift": round(float(row["lift"]), 3),
                    "description": (
                        f"User yang generate tentang "
                        f"'{', '.join(antecedents)}' "
                        f"juga sering generate tentang "
                        f"'{', '.join(consequents)}' "
                        f"(confidence: {row['confidence']:.0%})"
                    ),
                }
            )

        return {
            "rules": rules,
            "total_transactions": len(transactions),
            "frequent_itemsets_count": len(frequent_itemsets),
            "message": f"Ditemukan {len(rules)} association rules dari {len(transactions)} transaksi.",
        }

    except Exception as e:
        return {"rules": [], "error": str(e), "total_transactions": len(records)}


# ─────────────────────────────────────────────────────────────────────────────
# 3. TREND ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/trends")
async def get_trends(days: int = 30, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """
    Trend Analysis: mining kata/tema yang sedang tren.
    - Top keywords global
    - Perbandingan minggu ini vs minggu lalu
    - Top models digunakan
    - Aktivitas harian (7 hari terakhir)
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Ambil semua record dalam periode
    stmt = (
        select(GenerationHistory)
        .where(
            GenerationHistory.status == "success",
            GenerationHistory.created_at >= since,
        )
        .order_by(GenerationHistory.created_at.asc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    if not records:
        return {
            "top_keywords": [],
            "trending_up": [],
            "weekly_comparison": [],
            "daily_activity": [],
            "top_models": [],
            "total_in_period": 0,
            "message": f"Belum ada data dalam {days} hari terakhir.",
        }

    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    # Pisahkan minggu ini vs minggu lalu dengan memastikan timezone konsisten
    def _make_aware(dt):
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt

    this_week = [r for r in records if _make_aware(r.created_at) >= week_ago]
    last_week = [r for r in records if two_weeks_ago <= _make_aware(r.created_at) < week_ago]

    # ── Top keywords global (dari prompt ORIGINAL user, bukan enhanced Gemini) ──
    all_tokens: list[str] = []
    for r in records:
        all_tokens.extend(_tokenize_short(r.prompt))
    keyword_freq = Counter(all_tokens)
    top_keywords = [
        {"keyword": kw, "count": cnt, "pct": round(cnt / max(len(records), 1) * 100, 1)}
        for kw, cnt in keyword_freq.most_common(15)
    ]

    # ── Trending up (dari prompt original) ──
    this_week_tokens: list[str] = []
    for r in this_week:
        this_week_tokens.extend(_tokenize_short(r.prompt))
    last_week_tokens: list[str] = []
    for r in last_week:
        last_week_tokens.extend(_tokenize_short(r.prompt))

    this_freq = Counter(this_week_tokens)
    last_freq = Counter(last_week_tokens)

    trending_up = []
    for kw, cnt in this_freq.most_common(20):
        prev = last_freq.get(kw, 0)
        if cnt > prev:
            growth = cnt - prev
            pct_growth = round((growth / max(prev, 1)) * 100, 0) if prev > 0 else None
            trending_up.append(
                {
                    "keyword": kw,
                    "this_week": cnt,
                    "last_week": prev,
                    "growth": growth,
                    "pct_growth": pct_growth,
                    "is_new": prev == 0,
                }
            )
    trending_up = sorted(trending_up, key=lambda x: x["growth"], reverse=True)[:8]

    # ── Weekly comparison (top keywords minggu ini vs lalu) ──
    weekly_comparison = []
    top_this = [kw for kw, _ in this_freq.most_common(8)]
    for kw in top_this:
        weekly_comparison.append(
            {
                "keyword": kw,
                "this_week": this_freq.get(kw, 0),
                "last_week": last_freq.get(kw, 0),
            }
        )

    # ── Daily activity (7 hari terakhir) ──
    # Ambil dari records langsung (sudah difilter by `since` / 30 hari)
    # Buat 7 hari terakhir sebagai key (UTC konsisten)
    daily_counts: dict[str, int] = {}
    for i in range(7):
        day = (now - timedelta(days=6 - i)).strftime("%Y-%m-%d")
        daily_counts[day] = 0

    # Iterasi semua records dalam periode (bukan hanya this_week)
    # karena this_week bisa sempit tergantung kapan user generate
    all_period_records = records  # sudah include semua 30 hari
    for r in all_period_records:
        day_str = _make_aware(r.created_at).strftime("%Y-%m-%d")
        if day_str in daily_counts:
            daily_counts[day_str] += 1

    daily_activity = [
        {
            "date": date,
            "label": datetime.strptime(date, "%Y-%m-%d").strftime("%a"),
            "count": count,
        }
        for date, count in daily_counts.items()
    ]

    # ── Top models ──
    model_counter = Counter(r.model_used.split("/")[0].upper() for r in records)
    top_models = [
        {"model": model, "count": cnt, "pct": round(cnt / max(len(records), 1) * 100, 1)}
        for model, cnt in model_counter.most_common(5)
    ]

    return {
        "top_keywords": top_keywords,
        "trending_up": trending_up,
        "weekly_comparison": weekly_comparison,
        "daily_activity": daily_activity,
        "top_models": top_models,
        "total_in_period": len(records),
        "this_week_count": len(this_week),
        "last_week_count": len(last_week),
        "period_days": days,
        "message": f"Analisis {len(records)} desain dalam {days} hari terakhir.",
    }
