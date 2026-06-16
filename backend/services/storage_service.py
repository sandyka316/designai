"""
Storage Service — Cloudflare R2 (S3-compatible)

Tanggung jawab:
  - Upload bytes gambar ke R2 bucket
  - Return public URL gambar yang sudah diupload
  - Delete object dari R2 (opsional, untuk cleanup)

Semua operasi dijalankan secara async via asyncio.to_thread()
karena boto3 bersifat synchronous.
"""
import asyncio
import uuid
from datetime import datetime

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from core.config import settings


def _get_s3_client():
    """Buat boto3 S3 client yang dikonfigurasi untuk Cloudflare R2."""
    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",  # R2 pakai "auto"
        config=Config(
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "standard"},
        ),
    )


def _build_object_key(model_id: str, file_ext: str = "png") -> str:
    """
    Buat path object di bucket.
    Format: images/YYYY/MM/DD/<uuid>.<ext>
    Contoh: images/2026/06/08/a1b2c3d4-....png
    """
    now = datetime.utcnow()
    date_path = now.strftime("%Y/%m/%d")
    unique_id = uuid.uuid4()
    # sanitize model_id agar aman sebagai path segment
    safe_model = model_id.replace("/", "-").replace(":", "-")
    return f"images/{date_path}/{safe_model}_{unique_id}.{file_ext}"


def _upload_sync(image_bytes: bytes, object_key: str, content_type: str) -> None:
    """Upload bytes ke R2 (synchronous — dijalankan via asyncio.to_thread)."""
    client = _get_s3_client()
    client.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=object_key,
        Body=image_bytes,
        ContentType=content_type,
        # Cache-Control agar browser/CDN bisa cache gambar
        CacheControl="public, max-age=31536000, immutable",
    )


def _delete_sync(object_key: str) -> None:
    """Delete object dari R2 (synchronous — dijalankan via asyncio.to_thread)."""
    client = _get_s3_client()
    client.delete_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=object_key,
    )


async def upload_image(
    image_bytes: bytes,
    model_id: str = "hd",
    content_type: str = "image/png",
) -> dict:
    """
    Upload gambar ke Cloudflare R2.

    Args:
        image_bytes:  Raw bytes gambar dari NanoBanana
        model_id:     Model yang dipakai (untuk penamaan path)
        content_type: MIME type gambar (default: image/png)

    Returns:
        {
            "success": bool,
            "url": str | None,      # Public URL gambar
            "object_key": str | None,
            "message": str,
        }
    """
    if not settings.R2_ENABLED:
        return {
            "success": False,
            "url": None,
            "object_key": None,
            "message": (
                "Cloudflare R2 belum dikonfigurasi. "
                "Isi R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, "
                "dan R2_PUBLIC_URL di backend/.env"
            ),
        }

    # Deteksi ekstensi dari content_type
    ext_map = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
    }
    file_ext = ext_map.get(content_type.split(";")[0].strip(), "png")

    object_key = _build_object_key(model_id, file_ext)

    try:
        await asyncio.to_thread(_upload_sync, image_bytes, object_key, content_type)

        # Susun public URL: strip trailing slash dari PUBLIC_URL
        base_url = settings.R2_PUBLIC_URL.rstrip("/")
        public_url = f"{base_url}/{object_key}"

        return {
            "success": True,
            "url": public_url,
            "object_key": object_key,
            "message": "Upload ke R2 berhasil",
        }

    except (BotoCoreError, ClientError) as e:
        error_msg = str(e)
        # Beri pesan yang lebih spesifik untuk error umum
        if "InvalidAccessKeyId" in error_msg or "SignatureDoesNotMatch" in error_msg:
            msg = "R2: Access Key atau Secret Key tidak valid. Periksa backend/.env"
        elif "NoSuchBucket" in error_msg:
            msg = f"R2: Bucket '{settings.R2_BUCKET_NAME}' tidak ditemukan. Buat bucket di Cloudflare Dashboard."
        elif "AccessDenied" in error_msg:
            msg = "R2: Akses ditolak. Pastikan API Token punya izin 'Object Read & Write'."
        else:
            msg = f"R2 upload error: {error_msg[:200]}"

        return {
            "success": False,
            "url": None,
            "object_key": None,
            "message": msg,
        }

    except Exception as e:
        return {
            "success": False,
            "url": None,
            "object_key": None,
            "message": f"R2 upload unexpected error: {str(e)[:200]}",
        }


async def delete_image(object_key: str) -> dict:
    """
    Hapus gambar dari R2 berdasarkan object key.

    Returns:
        { "success": bool, "message": str }
    """
    if not settings.R2_ENABLED:
        return {"success": False, "message": "R2 tidak dikonfigurasi."}

    try:
        await asyncio.to_thread(_delete_sync, object_key)
        return {"success": True, "message": f"Object '{object_key}' berhasil dihapus dari R2."}

    except (BotoCoreError, ClientError) as e:
        return {"success": False, "message": f"R2 delete error: {str(e)[:200]}"}

    except Exception as e:
        return {"success": False, "message": f"R2 delete unexpected error: {str(e)[:200]}"}
