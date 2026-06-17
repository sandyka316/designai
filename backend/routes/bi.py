"""
bi.py — Business Intelligence Admin Dashboard endpoints
=========================================================
1. GET  /api/bi/summary   → BI summary: tren generate, top keywords, conversion rate
2. GET  /api/bi/export    → Export data ke CSV (download)
"""

import csv
import io
import re
from collections import Counter
from datetime import datetime, timezone, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from models.generation import GenerationHistory
from models.user import User

router = APIRouter()

# ── Stopwords minimal untuk keyword extraction ────────────────────────────────
_STOPWORDS = {
    "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
    "from","is","are","was","were","be","been","have","has","had","do","does",
    "did","will","would","could","should","may","might","this","that","these",
    "those","it","its","i","me","my","we","our","you","your","he","she","they",
    "their","what","which","who","how","when","where","not","no","can","just",
    "very","really","also","about","make","create","generate","image","photo",
    "picture","draw","render","show","display","add","put","use","using","based",
    "look","want","need","please","give","get","new","good","nice","beautiful",
    "pretty","amazing","great","best","high","quality","resolution","detailed",
    "detail","realistic","ultra","super","highly","studio","product","background",
    "professional","lighting","clean","yang","dan","atau","di","ke","dari",
    "untuk","dengan","adalah","ini","itu","pada","dalam","tidak","ada","buat",
    "bikin","sebuah","saya","aku","kamu","nya","juga","sudah","akan","bisa",
    "mau","ingin","tolong","coba","dong","buatkan","gambarkan","warna","warni",
    "gambar","desain","tema","mungkin","berwarna","berdasarkan","buatlah",
}

def _extract_keywords(text: str) -> list[str]:
    """Extract meaningful keywords dari prompt (max 120 char = prompt asli)."""
    if len(text) > 120:
        return []
    words = re.findall(r"[a-zA-Z]{3,}", text.lower())
    return [w for w in words if w not in _STOPWORDS]


# ─────────────────────────────────────────────────────────────────────────────
# 1. BI SUMMARY
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/summary")
async def get_bi_summary(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Business Intelligence Summary:
    - Total generations & success rate
    - Daily trend (30 hari)
    - Top prompt keywords
    - Conversion rate guest → registered user
    - Model usage distribution
    - Average generation time
    - Rating distribution
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # ── Semua generations dalam periode ──────────────────────────────────────
    stmt = (
        select(GenerationHistory)
        .where(GenerationHistory.created_at >= since)
        .order_by(GenerationHistory.created_at.asc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    # ── Semua users ───────────────────────────────────────────────────────────
    users_result = await db.execute(select(User))
    all_users = users_result.scalars().all()

    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    def _aware(dt: datetime) -> datetime:
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt

    # ── Basic stats ───────────────────────────────────────────────────────────
    total = len(records)
    success = [r for r in records if r.status == "success"]
    failed  = [r for r in records if r.status == "failed"]
    success_rate = round(len(success) / max(total, 1) * 100, 1)

    # ── Daily trend (terakhir 30 hari) ────────────────────────────────────────
    daily: dict[str, dict] = {}
    for i in range(days):
        day = (now - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        daily[day] = {"date": day, "label": datetime.strptime(day, "%Y-%m-%d").strftime("%b %d"), "total": 0, "success": 0, "failed": 0}

    for r in records:
        day_str = _aware(r.created_at).strftime("%Y-%m-%d")
        if day_str in daily:
            daily[day_str]["total"] += 1
            if r.status == "success":
                daily[day_str]["success"] += 1
            else:
                daily[day_str]["failed"] += 1

    daily_trend = list(daily.values())

    # ── Weekly comparison ─────────────────────────────────────────────────────
    this_week_records = [r for r in records if _aware(r.created_at) >= week_ago]
    last_week_records = [r for r in records if two_weeks_ago <= _aware(r.created_at) < week_ago]
    this_week_total = len(this_week_records)
    last_week_total = len(last_week_records)
    week_growth = round(
        ((this_week_total - last_week_total) / max(last_week_total, 1)) * 100, 1
    ) if last_week_total > 0 else None

    # ── Top keywords ──────────────────────────────────────────────────────────
    all_keywords: list[str] = []
    for r in success:
        all_keywords.extend(_extract_keywords(r.prompt))
    keyword_counts = Counter(all_keywords)
    top_keywords = [
        {
            "keyword": kw,
            "count": cnt,
            "pct": round(cnt / max(len(success), 1) * 100, 1),
        }
        for kw, cnt in keyword_counts.most_common(20)
    ]

    # ── Weekly keyword trend ──────────────────────────────────────────────────
    this_week_kw: list[str] = []
    for r in this_week_records:
        if r.status == "success":
            this_week_kw.extend(_extract_keywords(r.prompt))
    last_week_kw: list[str] = []
    for r in last_week_records:
        if r.status == "success":
            last_week_kw.extend(_extract_keywords(r.prompt))

    this_freq = Counter(this_week_kw)
    last_freq = Counter(last_week_kw)

    keyword_trend = []
    for kw, cnt in this_freq.most_common(10):
        prev = last_freq.get(kw, 0)
        keyword_trend.append({
            "keyword": kw,
            "this_week": cnt,
            "last_week": prev,
            "growth": cnt - prev,
            "is_new": prev == 0,
        })

    # ── Model usage ───────────────────────────────────────────────────────────
    model_counter = Counter(r.model_used for r in records)
    model_usage = [
        {
            "model": model,
            "count": cnt,
            "pct": round(cnt / max(total, 1) * 100, 1),
        }
        for model, cnt in model_counter.most_common()
    ]

    # ── Avg generation time ───────────────────────────────────────────────────
    if success:
        avg_ms = sum(r.generation_time_ms for r in success) / len(success)
        avg_time_ms = round(avg_ms)
        avg_time_str = f"{avg_ms/1000:.1f}s"
    else:
        avg_time_ms = 0
        avg_time_str = "—"

    # ── Rating distribution ───────────────────────────────────────────────────
    rated = [r for r in success if r.rating is not None]
    rating_dist = {str(i): 0 for i in range(1, 6)}
    for r in rated:
        rating_dist[str(r.rating)] = rating_dist.get(str(r.rating), 0) + 1
    avg_rating = (
        round(sum(r.rating for r in rated) / len(rated), 2) if rated else None
    )

    # ── Conversion rate: guest → registered ──────────────────────────────────
    # Guest user ID yang sudah diketahui
    guest_ids = {"00000000-0000-0000-0000-000000000001"}
    registered_users = [u for u in all_users if str(u.id) not in guest_ids]
    guest_users = [u for u in all_users if str(u.id) in guest_ids]

    # Generations dari registered vs guest
    registered_gen = [r for r in records if str(r.user_id) not in guest_ids]
    guest_gen = [r for r in records if str(r.user_id) in guest_ids]

    total_unique_users = len(all_users)
    registered_count = len(registered_users)
    guest_count = len(guest_users)
    conversion_rate = round(registered_count / max(total_unique_users, 1) * 100, 1)

    # ── Hourly heatmap (jam berapa paling aktif) ──────────────────────────────
    hour_counts = {str(h).zfill(2): 0 for h in range(24)}
    for r in records:
        hour = _aware(r.created_at).strftime("%H")
        hour_counts[hour] = hour_counts.get(hour, 0) + 1

    hourly_activity = [
        {"hour": f"{h}:00", "count": count}
        for h, count in hour_counts.items()
    ]

    return {
        # Summary stats
        "summary": {
            "total_generations": total,
            "total_success": len(success),
            "total_failed": len(failed),
            "success_rate": success_rate,
            "avg_generation_time_ms": avg_time_ms,
            "avg_generation_time_str": avg_time_str,
            "period_days": days,
            "total_users": total_unique_users,
            "registered_users": registered_count,
            "guest_users": guest_count,
            "conversion_rate": conversion_rate,
            "avg_rating": avg_rating,
            "total_rated": len(rated),
        },
        # Weekly comparison
        "weekly": {
            "this_week": this_week_total,
            "last_week": last_week_total,
            "growth_pct": week_growth,
        },
        # Charts data
        "daily_trend": daily_trend,
        "top_keywords": top_keywords,
        "keyword_trend": keyword_trend,
        "model_usage": model_usage,
        "rating_distribution": rating_dist,
        "hourly_activity": hourly_activity,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2. EXPORT CSV
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/export")
async def export_csv(
    days: int = 30,
    format: str = "csv",
    db: AsyncSession = Depends(get_db),
):
    """
    Export generation history ke CSV untuk kebutuhan pelaporan.
    Parameter:
      - days: periode data (default 30 hari)
      - format: 'csv' (default)
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)

    stmt = (
        select(GenerationHistory)
        .where(GenerationHistory.created_at >= since)
        .order_by(GenerationHistory.created_at.desc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    # Buat CSV in-memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "No",
        "ID",
        "User ID",
        "Prompt",
        "Model Used",
        "Status",
        "Generation Time (ms)",
        "Rating",
        "Image URL",
        "Created At (UTC)",
        "Date",
        "Hour",
        "Day of Week",
    ])

    # Data rows
    for i, r in enumerate(records, 1):
        def _aware(dt: datetime) -> datetime:
            return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt

        created = _aware(r.created_at)
        writer.writerow([
            i,
            str(r.id),
            str(r.user_id),
            r.prompt[:200],  # truncate panjang
            r.model_used,
            r.status,
            r.generation_time_ms,
            r.rating if r.rating is not None else "",
            r.image_url or "",
            created.strftime("%Y-%m-%d %H:%M:%S"),
            created.strftime("%Y-%m-%d"),
            created.strftime("%H:00"),
            created.strftime("%A"),
        ])

    # Tambahkan summary di bawah
    writer.writerow([])
    writer.writerow(["=== SUMMARY ==="])
    writer.writerow(["Period", f"Last {days} days"])
    writer.writerow(["Total Records", len(records)])
    writer.writerow(["Success", sum(1 for r in records if r.status == "success")])
    writer.writerow(["Failed", sum(1 for r in records if r.status == "failed")])
    success_records = [r for r in records if r.status == "success"]
    if success_records:
        avg_ms = sum(r.generation_time_ms for r in success_records) / len(success_records)
        writer.writerow(["Avg Generation Time", f"{avg_ms/1000:.1f}s"])
    writer.writerow(["Exported At", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")])

    output.seek(0)

    filename = f"designai_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
