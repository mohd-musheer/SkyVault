"""
Database connection and session management.
Supabase PostgreSQL compatible.
"""

from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import DATABASE_URL


def _ensure_sslmode_require(url: str) -> str:
  """
  Supabase requires SSL. Ensure `sslmode=require` is present in the DSN.
  We don't mutate DATABASE_URL itself, only the engine URL.
  """
  try:
    url_obj = make_url(url)
  except Exception:
    # If parsing fails, fall back to the original URL.
    return url

  if url_obj.drivername.startswith("postgres") and "sslmode" not in url_obj.query:
    query = dict(url_obj.query)
    query["sslmode"] = "require"
    url_obj = url_obj.set(query=query)
  return str(url_obj)


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={
        "connect_timeout": 10
    }
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
