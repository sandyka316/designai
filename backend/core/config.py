from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
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
    GEMINI_API_KEY: str = ""

    # Replicate (image generation: FLUX / Stable Diffusion)
    REPLICATE_API_TOKEN: str = ""

    # NanoBanana API (image generation: FLUX via nanobananaapi.ai)
    NANOBANANA_API_KEY: str = ""

    # Auth / JWT
    SECRET_KEY: str = "change-this-to-a-strong-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 hari

    # Rate limiting (requests per window)
    RATE_LIMIT_GENERATE: int = 10       # max 10 generate per window
    RATE_LIMIT_WINDOW_SECONDS: int = 60  # per 1 menit

    # Cache TTL
    CACHE_DASHBOARD_TTL: int = 60       # cache dashboard 60 detik


settings = Settings()
