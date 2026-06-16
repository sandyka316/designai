import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from models.generation import GenerationHistory
from models.user import User
from schemas.dashboard import DashboardResponse, StatItem, ActivityItem, GalleryItem

router = APIRouter()

# Guest user UUID — sementara sebelum auth
_GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def _time_ago(dt: datetime) -> str:
    """Konversi datetime ke string relatif: '2 mins ago', '3 hours ago', dst."""
    now = datetime.now(timezone.utc)
    # Pastikan dt aware
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        m = seconds // 60
        return f"{m} min{'s' if m > 1 else ''} ago"
    elif seconds < 86400:
        h = seconds // 3600
        return f"{h} hour{'s' if h > 1 else ''} ago"
    elif seconds < 172800:
        return "Yesterday"
    else:
        d = seconds // 86400
        return f"{d} days ago"


@router.get("", response_model=DashboardResponse)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """
    Ambil semua data dashboard dari database:
    stats, recent activity, gallery, dan saved prompts.
    """

    # ── Query dasar: semua history milik guest user ───────────────────────────
    stmt_all = select(GenerationHistory).where(
        GenerationHistory.user_id == _GUEST_USER_ID
    )
    result_all = await db.execute(stmt_all)
    all_records = result_all.scalars().all()

    total_generated = len(all_records)
    success_records = [r for r in all_records if r.status == "success"]
    saved_count = len(success_records)  # semua sukses dianggap tersimpan

    # Rata-rata generation time
    if success_records:
        avg_ms = sum(r.generation_time_ms for r in success_records) / len(success_records)
        avg_time_str = f"{avg_ms / 1000:.1f}s"
    else:
        avg_time_str = "—"

    # ── User credits ──────────────────────────────────────────────────────────
    user_stmt = select(User).where(User.id == _GUEST_USER_ID)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()
    credits_total = user.credits_total if user else 50
    credits_used = total_generated  # 1 generate = 1 kredit
    credits_left = max(0, credits_total - credits_used)

    # ── Stats ─────────────────────────────────────────────────────────────────
    # Hitung berapa generate dalam 7 hari terakhir
    from datetime import timedelta
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    weekly_count = sum(
        1 for r in all_records
        if (r.created_at.replace(tzinfo=timezone.utc) if r.created_at.tzinfo is None else r.created_at) >= week_ago
    )

    stats = [
        StatItem(label="Total Generated", value=str(total_generated), change=f"+{weekly_count} this week"),
        StatItem(label="Credits Left", value=str(credits_left), change=f"of {credits_total} total"),
        StatItem(label="Saved Designs", value=str(saved_count), change=f"+{weekly_count} this week"),
        StatItem(label="Avg. Gen Time", value=avg_time_str, change="per image"),
    ]

    # ── Recent activity (10 terbaru) ──────────────────────────────────────────
    recent_stmt = (
        select(GenerationHistory)
        .where(GenerationHistory.user_id == _GUEST_USER_ID)
        .order_by(GenerationHistory.created_at.desc())
        .limit(10)
    )
    recent_result = await db.execute(recent_stmt)
    recent_records = recent_result.scalars().all()

    recent_activity = [
        ActivityItem(
            id=str(r.id),
            prompt=r.prompt[:80] + ("..." if len(r.prompt) > 80 else ""),
            model=r.model_used.split("/")[0].upper(),
            time=_time_ago(r.created_at),
            status=r.status,  # type: ignore[arg-type]
        )
        for r in recent_records
    ]

    # ── Gallery (20 terbaru yang sukses & punya gambar) ───────────────────────
    gallery_stmt = (
        select(GenerationHistory)
        .where(
            GenerationHistory.user_id == _GUEST_USER_ID,
            GenerationHistory.status == "success",
            GenerationHistory.image_url.isnot(None),
        )
        .order_by(GenerationHistory.created_at.desc())
        .limit(20)
    )
    gallery_result = await db.execute(gallery_stmt)
    gallery_records = gallery_result.scalars().all()

    # Warna gradient cycling untuk card gallery
    _COLORS = [
        "from-amber-900/40 to-orange-900/20",
        "from-blue-900/40 to-cyan-900/20",
        "from-pink-900/40 to-rose-900/20",
        "from-purple-900/40 to-violet-900/20",
        "from-green-900/40 to-teal-900/20",
        "from-yellow-900/40 to-amber-900/20",
        "from-slate-800/60 to-gray-900/20",
        "from-lime-900/40 to-green-900/20",
    ]

    gallery_items = [
        GalleryItem(
            id=str(r.id),
            prompt=r.prompt[:60] + ("..." if len(r.prompt) > 60 else ""),
            image_url=r.image_url,
            color=_COLORS[i % len(_COLORS)],
            time=_time_ago(r.created_at),
        )
        for i, r in enumerate(gallery_records)
    ]

    # ── Saved prompts (5 prompt sukses terbaru) ───────────────────────────────
    saved_prompts = [
        r.prompt for r in recent_records
        if r.status == "success"
    ][:5]

    return DashboardResponse(
        stats=stats,
        recent_activity=recent_activity,
        gallery_items=gallery_items,
        saved_prompts=saved_prompts,
        credits_used=credits_used,
        credits_total=credits_total,
    )


@router.delete("/generation/{generation_id}")
async def delete_generation(
    generation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Hapus satu record GenerationHistory berdasarkan ID.
    Hanya bisa hapus milik guest user saat ini.
    """
    try:
        gen_uuid = uuid.UUID(generation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID tidak valid.")

    # Cari record
    stmt = select(GenerationHistory).where(
        GenerationHistory.id == gen_uuid,
        GenerationHistory.user_id == _GUEST_USER_ID,
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Gambar tidak ditemukan.")

    await db.delete(record)
    await db.commit()

    return {"success": True, "message": "Gambar berhasil dihapus."}
