"""
Auth Core — JWT token creation & validation
==========================================
Backend membuat JWT sendiri (python-jose + SECRET_KEY dari config).
Token payload: { sub: str(user.id), email: str, iat, exp }

Flow:
  Register / Login / Google-Sync → backend buat token
  Frontend simpan token sebagai accessToken di NextAuth session
  Setiap API request → frontend kirim "Authorization: Bearer <token>"
  Backend decode → cari user di DB → inject ke endpoint
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from database.session import get_db
from models.user import User

# ─── Password hashing ────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash password dengan bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verifikasi password terhadap hash."""
    return pwd_context.verify(plain, hashed)


# ─── JWT token ───────────────────────────────────────────────────────────────

def create_access_token(user_id: uuid.UUID, email: str) -> str:
    """
    Buat JWT access token dengan payload:
      sub   = str(user_id)
      email = user email
      iat   = waktu dibuat
      exp   = waktu expired (dari settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ─── FastAPI dependency ───────────────────────────────────────────────────────

async def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency — validasi JWT dari header Authorization.
    Raise HTTP 401 jika:
      - Header tidak ada
      - Token invalid / expired
      - User tidak ditemukan di DB
      - Akun dinonaktifkan
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau sudah expired. Silakan login kembali.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header diperlukan. Silakan login terlebih dahulu.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        token = authorization.removeprefix("Bearer ").strip()
        if not token:
            raise credentials_exception
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id_str: Optional[str] = payload.get("sub")
        if not user_id_str:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda telah dinonaktifkan.",
        )
    return user
