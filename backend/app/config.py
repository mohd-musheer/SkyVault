"""
ALL keys, URLs, and environment configuration in ONE place.
"""

import os

# ---------------------------------------------------------------------------
# Database (Supabase PostgreSQL)
# ---------------------------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check backend/.env")

# ---------------------------------------------------------------------------
# JWT Authentication
# ---------------------------------------------------------------------------

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24

# ---------------------------------------------------------------------------
# Supabase Storage
# ---------------------------------------------------------------------------

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "cloud-files")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Supabase credentials missing in .env")

# ---------------------------------------------------------------------------
# File rules
# ---------------------------------------------------------------------------

MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_BYTES", 50 * 1024 * 1024))

_raw_ext = os.getenv("ALLOWED_EXTENSIONS", "")
ALLOWED_EXTENSIONS = (
    [e.strip().lower() for e in _raw_ext.split(",") if e.strip()]
    or None
)

# ---------------------------------------------------------------------------
# App / CORS
# ---------------------------------------------------------------------------

APP_NAME = "Cloud Drive"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

print("SUPABASE_URL:", bool(SUPABASE_URL))
print("SUPABASE_SERVICE_KEY:", bool(SUPABASE_SERVICE_KEY))
