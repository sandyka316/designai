"""Schemas untuk Neural Network Rating Prediction."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class RatingPredictRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000)


class RatingPredictResponse(BaseModel):
    predicted_rating: int          # 1–5
    confidence: float              # 0.0–1.0
    label: str                     # "Bagus", "Sangat Bagus", dll
    score: float                   # raw score
    reasoning: str
    mode: Literal["heuristic", "neural_network"]
    trained_samples: int
    needs_more_data: int           # berapa data lagi untuk NN


class RatingSubmitRequest(BaseModel):
    generation_id: str
    rating: int = Field(..., ge=1, le=5)
    reason: str = Field(default="", max_length=500)


class RatingSubmitResponse(BaseModel):
    success: bool
    message: str
    trained_samples: int
    retrained: bool = False
