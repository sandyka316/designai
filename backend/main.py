import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.redis import get_redis, close_redis
from database.session import engine, AsyncSessionLocal
from database.base import Base
from routes import generate, recommendation, dashboard, search, analytics, credits, evolve, ratings, bi, deep_learning, vsm_search, limits, auth_route

# Import semua model agar Base.metadata mengetahui tabel yang ada
import models  # noqa: F401

# Guest user UUID — sama dengan yang dipakai di routes
_GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def _ensure_guest_user() -> None:
    """Pastikan guest user ada di tabel users (untuk mode tanpa auth)."""
    from sqlalchemy import select
    from models.user import User

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == _GUEST_USER_ID))
        if result.scalar_one_or_none() is None:
            guest = User(
                id=_GUEST_USER_ID,
                email="guest@designai.local",
                username="guest",
                hashed_password="not-used-guest-account",
                is_active=True,
                is_verified=True,
                credits_total=50,
                credits_used=0,
            )
            session.add(guest)
            await session.commit()
            print("[DesignAI] Guest user created in database.")
        else:
            print("[DesignAI] Guest user already exists.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────────
    print(f"[DesignAI] Starting in '{settings.APP_ENV}' mode...")

    # Inisialisasi tabel DB (hanya untuk dev; production pakai alembic upgrade head)
    if settings.APP_ENV == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[DesignAI] Database tables ready.")

    # Seed guest user supaya FK constraint pada generation_history tidak gagal
    await _ensure_guest_user()

    # Ping Redis untuk verifikasi koneksi
    try:
        redis = get_redis()
        await redis.ping()
        print("[DesignAI] Redis connected.")
    except Exception as e:
        print(f"[DesignAI] WARNING: Redis not available — {e}")

    yield

    # ── Shutdown ───────────────────────────────────────────────────────────────
    await engine.dispose()
    await close_redis()
    print("[DesignAI] Backend shut down cleanly.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for DesignAI — AI-powered design generation & recommendations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router, prefix="/api/generate", tags=["Generate"])
app.include_router(recommendation.router, prefix="/api/recommendation", tags=["Recommendation"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(credits.router, prefix="/api/credits", tags=["Credits"])
app.include_router(evolve.router, prefix="/api/evolve", tags=["Evolve"])
app.include_router(ratings.router, prefix="/api/ratings", tags=["Ratings"])
app.include_router(bi.router, prefix="/api/bi", tags=["Business Intelligence"])
app.include_router(deep_learning.router, prefix="/api/dl", tags=["Deep Learning"])
app.include_router(vsm_search.router, prefix="/api/vsm-search", tags=["Vector Space Model"])
app.include_router(limits.router, prefix="/api/limits", tags=["Limits"])
app.include_router(auth_route.router, prefix="/api/auth", tags=["Auth"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "DesignAI API is running"}


@app.get("/health", tags=["Health"])
async def health():
    # Cek Redis
    redis_ok = False
    try:
        redis = get_redis()
        await redis.ping()
        redis_ok = True
    except Exception:
        pass

    return {
        "status": "healthy",
        "database": "postgresql",
        "redis": "connected" if redis_ok else "unavailable",
        "env": settings.APP_ENV,
    }
