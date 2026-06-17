"""
Debug script untuk cek koneksi R2 dan URL yang dihasilkan.
Jalankan: python debug_r2.py
"""
import asyncio
import sys
import os

# Pastikan bisa import dari backend/
sys.path.insert(0, os.path.dirname(__file__))

from core.config import settings

def main():
    print("=" * 60)
    print("R2 Configuration Debug")
    print("=" * 60)
    print(f"R2_ACCOUNT_ID       : {settings.R2_ACCOUNT_ID[:8]}..." if settings.R2_ACCOUNT_ID else "R2_ACCOUNT_ID       : (KOSONG)")
    print(f"R2_ACCESS_KEY_ID    : {settings.R2_ACCESS_KEY_ID[:8]}..." if settings.R2_ACCESS_KEY_ID else "R2_ACCESS_KEY_ID    : (KOSONG)")
    print(f"R2_SECRET_ACCESS_KEY: {settings.R2_SECRET_ACCESS_KEY[:8]}..." if settings.R2_SECRET_ACCESS_KEY else "R2_SECRET_ACCESS_KEY: (KOSONG)")
    print(f"R2_BUCKET_NAME      : {settings.R2_BUCKET_NAME}")
    print(f"R2_PUBLIC_URL       : {settings.R2_PUBLIC_URL}")
    print(f"R2_ENDPOINT_URL     : {settings.R2_ENDPOINT_URL}")
    print(f"R2_ENABLED          : {settings.R2_ENABLED}")
    print()

    if not settings.R2_ENABLED:
        print("❌ R2 TIDAK ENABLED - salah satu credential kosong!")
        return

    # Simulasi URL yang akan dihasilkan
    example_key = "images/2026/06/16/hd_12345678-abcd-efgh-ijkl-mnopqrstuvwx.png"
    base_url = settings.R2_PUBLIC_URL.rstrip("/")
    example_url = f"{base_url}/{example_key}"
    print(f"✅ Contoh URL yang akan digenerate:")
    print(f"   {example_url}")
    print()

    # Test upload file kecil ke R2
    print("Mencoba upload test file ke R2...")
    try:
        import boto3
        from botocore.config import Config

        client = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )

        # Buat pixel PNG 1x1 transparan (valid PNG kecil)
        tiny_png = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk length + type
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # width=1, height=1
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,  # bit depth, color, etc.
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC,
            0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82,  # IEND
        ])

        test_key = "debug-test/test-pixel.png"

        # Step 1: Upload
        print(f"  Upload ke bucket '{settings.R2_BUCKET_NAME}' key '{test_key}'...")
        client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=test_key,
            Body=tiny_png,
            ContentType="image/png",
        )
        print("  ✅ Upload berhasil!")

        # Step 2: Cek public URL
        public_url = f"{base_url}/{test_key}"
        print(f"  Public URL: {public_url}")

        # Step 3: Test akses public URL via HTTP
        print(f"  Mencoba akses public URL...")
        import urllib.request
        try:
            req = urllib.request.Request(public_url, method="HEAD")
            req.add_header("User-Agent", "DesignAI-Debug/1.0")
            with urllib.request.urlopen(req, timeout=10) as response:
                status = response.status
                print(f"  ✅ Public URL dapat diakses! HTTP {status}")
                ct = response.headers.get("Content-Type", "unknown")
                print(f"     Content-Type: {ct}")
        except Exception as http_err:
            print(f"  ❌ Public URL TIDAK dapat diakses: {http_err}")
            print()
            print("  💡 KEMUNGKINAN PENYEBAB:")
            print("     1. Domain 'designai.unesa.dev' belum diarahkan ke R2 bucket")
            print("        → Cek Cloudflare Dashboard > R2 > Bucket 'tugas' > Custom Domains")
            print("     2. Bucket belum diset sebagai 'public'")
            print("        → Cek Cloudflare Dashboard > R2 > Bucket 'tugas' > Settings")
            print("     3. Domain salah / belum aktif")

        # Step 4: Cleanup
        print()
        print(f"  Menghapus file test...")
        client.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=test_key)
        print(f"  ✅ File test dihapus.")

    except Exception as e:
        print(f"  ❌ Error: {e}")
        print()
        print("  💡 KEMUNGKINAN PENYEBAB:")
        print("     - R2 credentials (Access Key / Secret) salah")
        print("     - Bucket name salah")
        print("     - Network error")


if __name__ == "__main__":
    main()
