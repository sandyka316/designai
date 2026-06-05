from fastapi import APIRouter
from schemas.dashboard import DashboardResponse, StatItem, ActivityItem, GalleryItem

router = APIRouter()

# ── Data dummy — ganti dengan query database saat production ──
_STATS = [
    StatItem(label="Total Generated", value="128", change="+12 this week"),
    StatItem(label="Credits Left", value="42", change="of 50 monthly"),
    StatItem(label="Saved Designs", value="24", change="+3 this week"),
    StatItem(label="Avg. Gen Time", value="2.4s", change="faster than avg"),
]

_RECENT_ACTIVITY = [
    ActivityItem(id="1", prompt="Minimalist logo for a coffee brand with earthy tones", model="HD", time="2 mins ago", status="success"),
    ActivityItem(id="2", prompt="Futuristic packaging for a tech startup with neon accents", model="HD", time="1 hour ago", status="success"),
    ActivityItem(id="3", prompt="Elegant UI card for fashion e-commerce dark mode", model="HD", time="3 hours ago", status="success"),
    ActivityItem(id="4", prompt="Bold poster for a music festival with grunge aesthetic", model="HD", time="Yesterday", status="success"),
    ActivityItem(id="5", prompt="Abstract art for a wellness app background", model="HD", time="Yesterday", status="failed"),
]

_GALLERY_ITEMS = [
    GalleryItem(id="1", prompt="Minimalist coffee brand logo", color="from-amber-900/40 to-orange-900/20", time="2 mins ago"),
    GalleryItem(id="2", prompt="Futuristic tech packaging", color="from-blue-900/40 to-cyan-900/20", time="1 hour ago"),
    GalleryItem(id="3", prompt="Fashion e-commerce UI card", color="from-pink-900/40 to-rose-900/20", time="3 hours ago"),
    GalleryItem(id="4", prompt="Music festival poster", color="from-purple-900/40 to-violet-900/20", time="Yesterday"),
    GalleryItem(id="5", prompt="Wellness app background", color="from-green-900/40 to-teal-900/20", time="Yesterday"),
    GalleryItem(id="6", prompt="Luxury perfume packaging", color="from-yellow-900/40 to-amber-900/20", time="2 days ago"),
    GalleryItem(id="7", prompt="Streetwear brand identity", color="from-slate-800/60 to-gray-900/20", time="2 days ago"),
    GalleryItem(id="8", prompt="Organic skincare label", color="from-lime-900/40 to-green-900/20", time="3 days ago"),
]

_SAVED_PROMPTS = [
    "Minimalist logo for a coffee brand",
    "Futuristic packaging for a tech startup",
    "Elegant UI card for fashion e-commerce",
    "Bold poster for a music festival",
]


@router.get("", response_model=DashboardResponse)
async def get_dashboard():
    """
    Ambil semua data dashboard: stats, recent activity, gallery, dan saved prompts.
    """
    return DashboardResponse(
        stats=_STATS,
        recent_activity=_RECENT_ACTIVITY,
        gallery_items=_GALLERY_ITEMS,
        saved_prompts=_SAVED_PROMPTS,
        credits_used=8,
        credits_total=50,
    )
