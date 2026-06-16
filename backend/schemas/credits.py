"""Schemas untuk Fuzzy Logic Credit Scoring."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class ActivityMetricsResponse(BaseModel):
    generations_this_week: int
    success_rate: float
    avg_prompt_length: float
    days_since_last_gen: int


class MembershipResponse(BaseModel):
    tidak_aktif: float
    kurang_aktif: float
    cukup_aktif: float
    sangat_aktif: float


class ModifierResponse(BaseModel):
    quality: float
    recency: float


class FuzzyCreditResponse(BaseModel):
    bonus_credits: int
    activity_label: Literal["tidak_aktif", "kurang_aktif", "cukup_aktif", "sangat_aktif"]
    activity_score: float
    membership: MembershipResponse
    modifiers: ModifierResponse
    reasoning: str
    input_metrics: ActivityMetricsResponse
    credits_awarded: bool
    new_credits_total: int | None = None
    message: str = "OK"
