import os

# JWT secret artık kod içine gömülü değil, ortam değişkeninden okunuyor.
# backend/.env dosyasına JWT_SECRET_KEY ekle (bkz. .env.example).
SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY ortam değişkeni ayarlanmamış. "
        "backend/.env dosyasına JWT_SECRET_KEY=<uzun-rastgele-değer> satırını ekle."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 gün