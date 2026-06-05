from pydantic import BaseModel, Field
from typing import Annotated


class RecommendationResponse(BaseModel):
    success: bool
    dominant_colors: list[str] = Field(description="Hex color codes dari warna dominan gambar")
    style: str = Field(description="Gaya/style yang terdeteksi dari gambar")
    key_elements: str = Field(description="Elemen utama yang terdeteksi di gambar")
    mood: str = Field(description="Mood/suasana gambar")
    recommended_use: str = Field(description="Rekomendasi penggunaan produk yang cocok")
    keywords: list[str] = Field(description="Kata kunci yang diekstrak dari gambar")
    generated_prompt: str = Field(description="Prompt AI siap pakai berdasarkan analisis gambar")
    message: str = "OK"
