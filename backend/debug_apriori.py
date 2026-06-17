"""
Debug Apriori dengan data aktual dari DB.
Jalankan: python debug_apriori.py
"""
import asyncio
import re
from collections import Counter
from sqlalchemy import select
from database.session import AsyncSessionLocal
from models.generation import GenerationHistory

_STOPWORDS = {
    "a","an","the","and","or","but","in","on","at","to","for",
    "of","with","by","from","is","are","was","were","be","been",
    "have","has","had","do","does","did","will","would","could",
    "should","may","might","this","that","these","those","it","its",
    "i","me","my","we","our","you","your","he","she","they",
    "their","what","which","who","how","when","where","not","no",
    "can","just","very","really","also","about","into","over",
    "after","before","more","some","any","all","each","every",
    "both","such","than","too","only","so","like","then",
    "make","create","generate","image","photo","picture",
    "draw","render","show","display","add","put",
    "use","using","based","look","looks","looking","want","need",
    "please","give","get","new","good","nice",
    "beautiful","pretty","amazing","great","best","high","quality",
    "resolution","detailed","detail","details","realistic","ultra",
    "super","highly",
    "studio","product","background","professional","lighting","clean",
    "presentation","focus","texture","fabric","visible","white",
    "featuring","inspired","depicts","captured","perfectly","beneath",
    "across","scattered","filled","elements","scene","under","across",
    "yang","dan","atau","di","ke","dari","untuk","dengan","adalah",
    "ini","itu","pada","dalam","tidak","ada","buat","bikin",
    "sebuah","saya","aku","kamu","nya","juga","sudah","belum",
    "akan","bisa","harus","mau","ingin","tolong","coba","dong",
    "nih","sih","kan","lah","ya","deh","aja","banget",
    "buatkan","buatin","bikinin","tampilkan","tunjukkan","kasih",
    "gambarkan","seperti","bertema","bergaya","bergambar",
    "warna","warni","gambar","desain","tema",
    "sebagus","mungkin","berwarna","tasnya","berdasarkan","buatlah",
}

_DESIGN_KEYWORDS = {
    "bag","tote","tas","kaos","shirt","sepatu","sneakers","shoes",
    "floral","pattern","print","minimalist","elegant","dark","navy",
    "black","blue","red","gold","white","sky","night","star","starry",
    "cyberpunk","futuristic","neon","vintage","modern","casual",
    "luxury","premium","canvas","graphic","artwork","castle",
}


def _tokenize_short(text):
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

        print(f"\n{'='*65}")
        print(f"  Total success records: {len(records)}")
        print(f"{'='*65}")

        # Bangun transactions
        transactions = []
        print("\n📋 Transactions yang terbentuk:")
        for r in records:
            all_toks = list(set(_tokenize_short(r.prompt)))
            design_toks = [t for t in all_toks if t in _DESIGN_KEYWORDS]
            other_toks  = [t for t in all_toks if t not in _DESIGN_KEYWORDS]
            tokens = (design_toks + other_toks)[:8]
            prompt_short = r.prompt[:50]
            if len(tokens) >= 2:
                transactions.append(tokens)
                print(f"  ✅ {tokens}  ← '{prompt_short}'")
            else:
                print(f"  ⚠️  SKIP (<2 tokens): {tokens}  ← '{prompt_short}'")

        print(f"\n  Total valid transactions: {len(transactions)}")
        n = len(transactions)
        adaptive_support = max(0.1, 2.0 / n)
        print(f"  Adaptive min_support: {adaptive_support:.3f} (kata muncul ≥ {2/adaptive_support:.0f}x dari {n} transaksi)")

        if len(transactions) < 5:
            print("\n  ❌ Kurang dari 5 transaksi valid! Apriori tidak bisa jalan.")
            return

        # Run Apriori
        print(f"\n🧮 Menjalankan Apriori...")
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
                lower_support = max(0.05, 1.0 / n)
                fi = apriori(df, min_support=lower_support, use_colnames=True, max_len=3)
                print(f"  Retry lower support={lower_support:.2f}: {len(fi)} itemsets")

            if fi.empty:
                print("  ❌ Tidak ada frequent itemsets! Data kurang beragam.")
                print("\n  💡 Solusi: Generate lebih banyak prompt dengan kata yang SAMA tapi tema berbeda.")
                return

            print(f"\n  Top Frequent Itemsets:")
            for _, row in fi.sort_values("support", ascending=False).head(10).iterrows():
                print(f"    {set(row['itemsets'])} → support={row['support']:.2f} ({row['support']*n:.0f}/{n}x)")

            def _try_rules(fi, threshold):
                try:
                    return association_rules(fi, metric="confidence", min_threshold=threshold, num_itemsets=len(fi))
                except TypeError:
                    return association_rules(fi, metric="confidence", min_threshold=threshold)

            rules_df = _try_rules(fi, 0.5)
            if rules_df.empty:
                rules_df = _try_rules(fi, 0.3)
            if rules_df.empty:
                rules_df = _try_rules(fi, 0.1)

            print(f"\n  Association Rules ditemukan: {len(rules_df)}")
            for _, row in rules_df.sort_values("lift", ascending=False).head(8).iterrows():
                ant = set(row["antecedents"])
                con = set(row["consequents"])
                print(f"    {ant} → {con}  (conf={row['confidence']:.0%}, lift={row['lift']:.2f})")

            if rules_df.empty:
                print("  ❌ Tidak ada rules yang cukup kuat!")
                print("  💡 Kata-kata terlalu sering muncul bersama → perlu variasi lebih.")

        except Exception as e:
            import traceback
            print(f"  ❌ Error: {e}")
            traceback.print_exc()


asyncio.run(main())
