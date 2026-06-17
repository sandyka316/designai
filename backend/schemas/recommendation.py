from pydantic import BaseModel, Field


class ProductResult(BaseModel):
    id: str = Field(description="Identifier produk (dinamis dari AI)")
    label: str = Field(description="Nama produk yang ditampilkan")
    emoji: str = Field(description="Emoji representasi produk")
    prompt: str = Field(description="Prompt AI spesifik untuk produk ini")
    image_url: str | None = Field(default=None, description="URL gambar hasil generate di R2")
    success: bool = Field(default=False, description="Apakah generate image berhasil")


class RecommendationResponse(BaseModel):
    success: bool
    dominant_colors: list[str] = Field(description="Hex color codes dari warna dominan gambar")
    style: str = Field(description="Gaya/style yang terdeteksi dari gambar")
    key_elements: str = Field(description="Elemen utama yang terdeteksi di gambar")
    mood: str = Field(description="Mood/suasana gambar")
    keywords: list[str] = Field(description="Kata kunci yang diekstrak dari gambar")
    products: list[ProductResult] = Field(
        description="3 produk dinamis yang dipilih AI dengan gambar hasil generate"
    )
    message: str = "OK"
