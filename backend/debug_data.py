"""
Script verifikasi logika baru analytics.py
Jalankan dari folder backend: python debug_data.py
"""
import asyncio
import re
from datetime import datetime, timezone, timedelta
from collections import Counter

from sqlalchemy import select
from database.session import AsyncSessionLocal
from models.generation import GenerationHistory

# ── Copy logika terbaru dari analytics.py ────────────────────────────────────
_STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "this", "that", "these", "those", "it", "its",
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "they",
    "their", "what", "which", "who", "how", "when", "where", "not", "no",
    "can", "just", "very", "really", "also", "about", "into", "over",
    "after", "before", "more", "some", "any", "all", "each", "every",
    "both", "such", "than", "too", "only", "so", "like", "then",
    "make", "create", "generate", "image", "photo", "picture",
    "draw", "render", "show", "display", "add", "put",
    "use", "using", "based", "look", "looks", "looking", "want", "need",
    "please", "give", "get", "new", "good", "nice",
    "beautiful", "pretty", "amazing", "great", "best", "high", "quality",
    "resolution", "detailed", "detail", "details", "realistic", "ultra",
    "super", "highly",
    "studio", "product", "background", "professional", "lighting", "clean",
    "presentation", "focus", "texture", "fabric", "visible", "white",
    "featuring", "inspired", "depicts", "captured", "perfectly", "beneath",
    "across", "scattered", "filled", "elements", "scene", "under",
    "yang", "dan", "atau", "di", "ke", "dari", "untuk", "dengan", "adalah",
    "ini", "itu", "pada", "dalam", "tidak", "ada", "buat", "bikin",
    "sebuah", "saya", "aku", "kamu", "nya", "juga", "sudah", "belum",
    "akan", "bisa", "harus", "mau", "ingin", "tolong", "coba", "dong",
    "nih", "sih", "kan", "lah", "ya", "deh", "aja", "banget",
    "buatkan", "buatin", "bikinin", "tampilkan", "tunjukkan", "kasih",
    "gambarkan", "seperti", "bertema", "bergaya", "bergambar",
    "warna", "warni", "gambar", "desain", "tema",
    "sebagus", "mungkin", "berwarna", "tasnya", "berdasarkan", "buatlah",
}

_DESIGN_KEYWORDS = {
    "bag", "tote", "tas", "kaos", "shirt", "sepatu", "sneakers", "shoes",
    "floral", "pattern", "print", "minimalist", "elegant", "dark", "navy",
    "black", "blue", "red", "gold", "white", "sky", "night", "star", "starry",
    "cyberpunk", "futuristic", "neon", "vintage", "modern", "casual",
    "luxury", "premium", "canvas", "graphic", "artwork", "castle",
}


def _tokenize_short(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z]{2,}", text.lower())
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


async def main():
    async with AsyncSessionLocal() as session:
        stmt = select(GenerationHistory).where(
            GenerationHistory.status == "success"
        ).order_by(GenerationHistory.created_at.desc()).limit(500)
        result = await session.execute(stmt)
        records = result.scalars().all()

        print(f"\n{'='*60}")
        print(f"SUCCESS RECORDS: {len(records)}")
        print(f"{'='*60}")

        # ── Simulasi Top Keywords (logika baru) ──
        print("\n📊 TOP KEYWORDS (dari prompt original, logika baru):")
        all_tokens = []
        for r in records:
            toks = _tokenize_short(r.prompt)
            all_tokens.extend(toks)
        for kw, cnt in Counter(all_tokens).most_common(15):
            print(f"  '{kw}': {cnt}x")

        # ── Simulasi Transactions untuk Apriori ──
        print(f"\n🔗 TRANSACTIONS untuk Apriori (max 8 token, design keywords diprioritaskan):")
        transactions = []
        for r in records:
            all_toks = list(set(_tokenize_short(r.prompt)))
            design_toks = [t for t in all_toks if t in _DESIGN_KEYWORDS]
            other_toks  = [t for t in all_toks if t not in _DESIGN_KEYWORDS]
            tokens = (design_toks + other_toks)[:8]
            if len(tokens) >= 2:
                transactions.append(tokens)
                print(f"  {tokens}")
            else:
                print(f"  ⚠️ SKIP (<2 token): '{r.prompt[:60]}' → {tokens}")

        print(f"\n  Total valid transactions: {len(transactions)}")
        n = len(transactions)
        adaptive_support = max(0.1, 2.0 / n)
        print(f"  Adaptive min_support: {adaptive_support:.3f} (={2}/{n} = muncul ≥2x)")

        # ── Simulasi Apriori ──
        print(f"\n🧮 SIMULASI APRIORI:")
        try:
            import pandas as pd
            from mlxtend.preprocessing import TransactionEncoder
            from mlxtend.frequent_patterns import apriori, association_rules

            te = TransactionEncoder()
            te_array = te.fit(transactions).transform(transactions)
            df = pd.DataFrame(te_array, columns=te.columns_)

            fi = apriori(df, min_support=adaptive_support, use_colnames=True, max_len=3)
            print(f"  Frequent itemsets (support≥{adaptive_support:.2f}): {len(fi)}")
            if fi.empty:
                fi = apriori(df, min_support=max(0.05, 1.0/n), use_colnames=True, max_len=3)
                print(f"  Retry → frequent itemsets: {len(fi)}")

            def _try_rules(fi, threshold):
                try:
                    return association_rules(fi, metric="confidence", min_threshold=threshold, num_itemsets=len(fi))
                except TypeError:
                    return association_rules(fi, metric="confidence", min_threshold=threshold)

            if not fi.empty:
                print(f"\n  Top frequent itemsets:")
                for _, row in fi.sort_values("support", ascending=False).head(10).iterrows():
                    print(f"    {set(row['itemsets'])} → support={row['support']:.2f}")

                rules_df = _try_rules(fi, 0.5)
                if rules_df.empty:
                    rules_df = _try_rules(fi, 0.3)
                if rules_df.empty:
                    rules_df = _try_rules(fi, 0.1)

                print(f"\n  Rules ditemukan: {len(rules_df)}")
                for _, row in rules_df.sort_values("lift", ascending=False).head(5).iterrows():
                    print(f"    {set(row['antecedents'])} → {set(row['consequents'])} "
                          f"(conf={row['confidence']:.0%}, lift={row['lift']:.2f})")
            else:
                print("  ❌ Tidak ada frequent itemsets!")

        except Exception as e:
            import traceback
            print(f"  ❌ Error: {e}")
            traceback.print_exc()

        # ── Simulasi Daily Activity ──
        print(f"\n📅 DAILY ACTIVITY (7 hari terakhir, UTC):")
        now = datetime.now(timezone.utc)

        def make_aware(dt):
            return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt

        daily_counts: dict[str, int] = {}
        for i in range(7):
            day = (now - timedelta(days=6 - i)).strftime("%Y-%m-%d")
            daily_counts[day] = 0

        for r in records:
            day_str = make_aware(r.created_at).strftime("%Y-%m-%d")
            if day_str in daily_counts:
                daily_counts[day_str] += 1

        for day, cnt in daily_counts.items():
            bar = "█" * cnt if cnt > 0 else "·"
            print(f"  {day}: {cnt:2d} {bar}")


asyncio.run(main())
