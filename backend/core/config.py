import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Selalu cari .env di direktori yang sama dengan file config.py ini (backend/)
_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    APP_ENV: str = "development"
    APP_NAME: str = "DesignAI Backend"

    # PostgreSQL
    POSTGRES_USER: str = "designai"
    POSTGRES_PASSWORD: str = "designai_secret"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "designai_db"

    @property
    def DATABASE_URL(self) -> str:
        """Async PostgreSQL URL untuk SQLAlchemy."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Sync PostgreSQL URL — dipakai oleh Alembic env.py."""
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = "redis_secret"
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self) -> str:
        return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Gemini (teks: enhance prompt, analisis, chat)
    # GEMINI_API_KEY  → key tunggal (legacy, masih didukung sebagai fallback)
    # GEMINI_API_KEYS → daftar key dipisah koma untuk rotasi otomatis
    GEMINI_API_KEY: str = ""
    GEMINI_API_KEYS: str = ""   # "key1,key2,key3,..."

    @property
    def GEMINI_KEY_LIST(self) -> list[str]:
        """
        Kembalikan list semua Gemini API key yang valid (tidak kosong).
        Prioritas: GEMINI_API_KEYS (multi), lalu GEMINI_API_KEY (single).
        """
        keys: list[str] = []
        if self.GEMINI_API_KEYS:
            keys = [k.strip() for k in self.GEMINI_API_KEYS.split(",") if k.strip()]
        if not keys and self.GEMINI_API_KEY:
            keys = [self.GEMINI_API_KEY.strip()]
        return keys

    # Replicate (image generation: FLUX / Stable Diffusion)
    REPLICATE_API_TOKEN: str = ""

    # NanoBanana API (image generation: FLUX via nanobananaapi.ai)
    # NANOBANANA_API_KEY  → key tunggal (legacy, masih didukung sebagai fallback)
    # NANOBANANA_API_KEYS → daftar key dipisah koma untuk rotasi otomatis
    NANOBANANA_API_KEY: str = ""
    NANOBANANA_API_KEYS: str = ""   # "key1,key2,key3,..."

    @property
    def NANOBANANA_KEY_LIST(self) -> list[str]:
        """
        Kembalikan list semua API key yang valid (tidak kosong).
        Prioritas: NANOBANANA_API_KEYS (multi), lalu NANOBANANA_API_KEY (single).
        """
        keys: list[str] = []
        if self.NANOBANANA_API_KEYS:
            keys = [k.strip() for k in self.NANOBANANA_API_KEYS.split(",") if k.strip()]
        if not keys and self.NANOBANANA_API_KEY:
            keys = [self.NANOBANANA_API_KEY.strip()]
        return keys

    # Cloudflare R2 (object storage — S3-compatible)
    R2_ACCOUNT_ID: str = ""          # Cloudflare Account ID
    R2_ACCESS_KEY_ID: str = ""       # R2 API Token → Access Key ID
    R2_SECRET_ACCESS_KEY: str = ""   # R2 API Token → Secret Access Key
    R2_BUCKET_NAME: str = "designai-images"
    R2_PUBLIC_URL: str = ""          # https://pub-xxx.r2.dev  atau custom domain

    @property
    def R2_ENDPOINT_URL(self) -> str:
        """S3-compatible endpoint URL untuk boto3."""
        return f"https://{self.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

    @property
    def R2_ENABLED(self) -> bool:
        """True jika semua credential R2 sudah diset."""
        return bool(
            self.R2_ACCOUNT_ID
            and self.R2_ACCESS_KEY_ID
            and self.R2_SECRET_ACCESS_KEY
            and self.R2_PUBLIC_URL
        )

    # Auth / JWT
    SECRET_KEY: str = "change-this-to-a-strong-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 hari

    # NextAuth secret (sama dengan NEXTAUTH_SECRET di frontend .env.local)
    NEXTAUTH_SECRET: str = "design-ai-secret-key-2024-xk9mP2qL8nR5vT3w"

    # Rate limiting (requests per window)
    RATE_LIMIT_GENERATE: int = 10       # max 10 generate per window
    RATE_LIMIT_WINDOW_SECONDS: int = 60  # per 1 menit

    # Cache TTL
    CACHE_DASHBOARD_TTL: int = 60       # cache dashboard 60 detik


settings = Settings()
