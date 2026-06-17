from pydantic import BaseModel, Field
from typing import Literal


class StatItem(BaseModel):
    label: str
    value: str
    change: str


class ActivityItem(BaseModel):
    id: str
    prompt: str
    model: str
    time: str
    status: Literal["success", "failed"]


class GalleryItem(BaseModel):
    id: str
    prompt: str
    image_url: str | None = None
    color: str
    time: str


class DashboardResponse(BaseModel):
    stats: list[StatItem]
    recent_activity: list[ActivityItem]
    gallery_items: list[GalleryItem]
    saved_prompts: list[str]
    credits_used: int
    credits_total: int
