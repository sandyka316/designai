from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routes import generate, recommendation, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("DesignAI Backend starting...")
    yield
    print("DesignAI Backend shutting down...")


app = FastAPI(
    title="DesignAI Backend",
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


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "DesignAI API is running"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
