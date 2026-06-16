"""Quick Apriori test - jalankan: python quick_apriori.py"""
import asyncio, re
from sqlalchemy import select
from database.session import AsyncSessionLocal
from models.generation import GenerationHistory

_STOPWORDS = {
    "a","an","the","and","or","but","in","on","at","to","for","of","with","by","from",
    "is","are","was","were","be","been","have","has","had","do","does","did","will",
    "would","could","should","may","might","this","that","these","those","it","its",
    "i","me","my","we","our","you","your","he","she","they","their","what","which",
    "who","how","when","where","not","no","can","just","very","really","also","about",
    "make","create","generate","image","photo","draw","render","show","use","using",
    "based","look","want","need","please","give","get","new","good","nice","beautiful",
    "pretty","amazing","great","best","high","quality","resolution","detailed","detail",
    "realistic","ultra","super","highly","studio","product","background","professional",
    "lighting","clean","focus","texture","fabric","featuring","yang","dan","atau","di",
    "ke","dari","untuk","dengan","adalah","ini","itu","pada","dalam","tidak","ada",
    "buat","bikin","sebuah","saya","aku","kamu","nya","juga","sudah","akan","bisa",
    "mau","ingin","tolong","coba","dong","buatkan","gambarkan","seperti","warna","warni",
    "gambar","desain","tema","mungkin","berwarna","berdasarkan","buatlah",
}
_DESIGN_KEYWORDS = {
    "bag","tote","tas","kaos","shirt","sepatu","sneakers","shoes","floral","pattern",
    "print","minimalist","elegant","dark","navy","black","blue","red","gold","white",
    "sky","night","star","starry","cyberpunk","futuristic","neon","vintage","modern",
    "casual","luxury","premium","canvas","graphic","artwork","castle",
}

def tokenize(text):
    words = re.findall(r"[a-zA-Z]{2,}", text.lower())
    result, seen = [], set()
    for w in words:
        if w in seen: continue
        seen.add(w)
        if w in _DESIGN_KEYWORDS or (w not in _STOPWORDS and len(w) >= 3):
            result.append(w)
    return result

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(GenerationHistory)
            .where(GenerationHistory.status == "success")
            .order_by(GenerationHistory.created_at.desc()).limit(500)
        )
        records = result.scalars().all()

    transactions = []
    for r in records:
        toks = list(set(tokenize(r.prompt)))
        design = [t for t in toks if t in _DESIGN_KEYWORDS]
        other  = [t for t in toks if t not in _DESIGN_KEYWORDS]
        tokens = (design + other)[:8]
        if len(tokens) >= 2:
            transactions.append(tokens)

    n = len(transactions)
    print(f"Transactions: {n}")
    print(f"Support threshold: {max(0.1, 2.0/n):.3f}")
    print()

    import pandas as pd
    from mlxtend.preprocessing import TransactionEncoder
    from mlxtend.frequent_patterns import apriori, association_rules

    te = TransactionEncoder()
    te_arr = te.fit(transactions).transform(transactions)
    df = pd.DataFrame(te_arr, columns=te.columns_)

    sup = max(0.1, 2.0/n)
    fi = apriori(df, min_support=sup, use_colnames=True, max_len=3)
    print(f"Frequent itemsets at sup={sup:.3f}: {len(fi)}")

    if fi.empty:
        fi = apriori(df, min_support=max(0.05, 1.0/n), use_colnames=True, max_len=3)
        print(f"Retry lower support: {len(fi)} itemsets")

    if fi.empty:
        print("NO FREQUENT ITEMSETS FOUND")
        return

    print("\nTop frequent itemsets:")
    for _, row in fi.sort_values("support", ascending=False).head(10).iterrows():
        items = set(row["itemsets"])
        count = round(row["support"] * n)
        print(f"  {items}  support={row['support']:.2f} ({count}/{n}x)")

    def try_rules(fi, threshold):
        try:
            return association_rules(fi, metric="confidence", min_threshold=threshold, num_itemsets=len(fi))
        except TypeError:
            return association_rules(fi, metric="confidence", min_threshold=threshold)

    for conf in [0.5, 0.3, 0.1]:
        rules_df = try_rules(fi, conf)
        if not rules_df.empty:
            print(f"\nRules at confidence>={conf}: {len(rules_df)} rules found")
            for _, row in rules_df.sort_values("lift", ascending=False).head(8).iterrows():
                print(f"  {set(row['antecedents'])} -> {set(row['consequents'])}  conf={row['confidence']:.0%} lift={row['lift']:.2f}")
            break
    else:
        print("\nNO RULES FOUND at any confidence level")

asyncio.run(main())
