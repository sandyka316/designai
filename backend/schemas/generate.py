from pydantic import BaseModel, Field
from typing import Literal


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000, description="Text prompt untuk generate gambar")
    model: Literal["hd", "genius", "super-genius"] = Field(default="hd", description="Model yang digunakan")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "prompt": "Minimalist logo for a coffee brand with earthy tones",
                    "model": "hd",
                }
            ]
        }
    }


class GenerateResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    success: bool
    image_url: str | None = None
    prompt_used: str
    enhanced_prompt: str | None = None   # prompt setelah di-enhance oleh Gemini
    model_used: str
    generation_time_ms: int
    message: str = "OK"
