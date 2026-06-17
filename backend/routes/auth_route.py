"""
Route: /api/auth
================
Register, Login (email+password), Google Sync.

POST /api/auth/register     → daftar akun baru
POST /api/auth/login        → login email+password, return JWT
POST /api/auth/google-sync  → sinkron user Google ke DB, return JWT
"""
from __future__ import annotations

import re
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import create_access_token, hash_password, verify_password
from database.session import get_db
from models.user import User

router = APIRouter()


# ─── Request / Response schemas ───────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str
    name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Email tidak valid")
        return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) < 3:
            raise ValueError("Username minimal 3 karakter")
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username hanya boleh huruf, angka, dan underscore")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password minimal 6 karakter")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleSyncRequest(BaseModel):
    email: str
    name: Optional[str] = None
    image: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    username: str
    name: Optional[str] = None
    credits_total: int = 50


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Daftar akun baru dengan email + password.
    Return JWT token yang langsung bisa dipakai.
    """
    # Cek email sudah terdaftar
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar. Silakan login atau gunakan email lain.",
        )

    # Cek username sudah terdaftar
    existing_u = await db.execute(select(User).where(User.username == body.username))
    if existing_u.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username sudah dipakai. Silakan pilih username lain.",
        )

    user = User(
        email=body.email,
        username=body.username,
        hashed_password=hash_password(body.password),
        is_active=True,
        is_verified=False,
        credits_total=50,
        credits_used=0,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id, user.email)
    return AuthResponse(
        access_token=token,
        user_id=str(user.id),
        email=user.email,
        username=user.username,
        name=body.name or body.username,
        credits_total=user.credits_total,
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Login dengan email + password.
    Return JWT token untuk digunakan di Authorization header.
    """
    email = body.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda telah dinonaktifkan.",
        )

    token = create_access_token(user.id, user.email)
    return AuthResponse(
        access_token=token,
        user_id=str(user.id),
        email=user.email,
        username=user.username,
        name=user.username,
        credits_total=user.credits_total,
    )


@router.post("/google-sync", response_model=AuthResponse)
async def google_sync(body: GoogleSyncRequest, db: AsyncSession = Depends(get_db)):
    """
    Dipanggil NextAuth setelah user login Google.
    Cari user berdasarkan email Google; jika belum ada, buat otomatis.
    Return backend JWT token.
    """
    email = body.email.strip().lower()

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        # Generate username unik dari email
        base = re.sub(r"[^a-z0-9]", "", email.split("@")[0].lower()) or "user"
        username = base
        counter = 1
        while True:
            exists = await db.execute(select(User).where(User.username == username))
            if not exists.scalar_one_or_none():
                break
            username = f"{base}{counter}"
            counter += 1

        user = User(
            email=email,
            username=username,
            hashed_password="google-oauth-no-password",
            is_active=True,
            is_verified=True,   # Google sudah verifikasi email
            credits_total=50,
            credits_used=0,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(user.id, user.email)
    return AuthResponse(
        access_token=token,
        user_id=str(user.id),
        email=user.email,
        username=user.username,
        name=body.name or user.username,
        credits_total=user.credits_total,
    )
