"""
File upload, download, storage usage calculation (Supabase Storage).
"""

import os
import uuid
from pathlib import Path
from typing import List, Optional

# --------------------------------------------------
# 🔥 CRITICAL FIX: Disable Render / Docker proxy vars
# --------------------------------------------------
for k in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
    os.environ.pop(k, None)

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from supabase import create_client

from app.database import get_db
from app.models import User, File as FileModel, Activity
from app.auth import get_current_user
from app.config import (
    MAX_FILE_SIZE_BYTES,
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    SUPABASE_BUCKET,
)

# --------------------------------------------------
# ✅ SUPABASE CLIENT (STABLE INIT)
# --------------------------------------------------
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Supabase credentials missing")

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
except Exception as e:
    print(f"CRITICAL: Failed to initialize Supabase client: {e}")
    raise RuntimeError("Supabase client failed to initialize")

# --------------------------------------------------

router = APIRouter(prefix="/api/files", tags=["files"])


# ---------------- ACTIVITY LOGGER ----------------

def log_activity(
    db: Session,
    user_id: int,
    action: str,
    filename: Optional[str] = None,
    file_id: Optional[int] = None,
):
    db.add(
        Activity(
            user_id=user_id,
            action=action,
            filename=filename,
            file_id=file_id,
        )
    )
    db.commit()


# ---------------- LIST FILES ----------------

@router.get("/")
def list_files(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> List[dict]:
    files = (
        db.query(FileModel)
        .filter(FileModel.user_id == user.id)
        .order_by(FileModel.uploaded_at.desc())
        .all()
    )

    return [
        {
            "id": f.id,
            "original_filename": f.original_filename,
            "size_bytes": f.size_bytes,
            "uploaded_at": f.uploaded_at.isoformat(),
        }
        for f in files
    ]


# ---------------- UPLOAD ----------------

@router.post("/upload")
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")

    content = await file.read()
    size = len(content)

    if size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large")

    ext = Path(file.filename).suffix
    stored_name = f"{user.id}/{uuid.uuid4().hex}{ext}"

    try:
        supabase.storage.from_(SUPABASE_BUCKET).upload(
            stored_name,
            content,
            {
                "content-type": file.content_type
                or "application/octet-stream"
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    db_file = FileModel(
        user_id=user.id,
        original_filename=file.filename,
        stored_filename=stored_name,
        size_bytes=size,
        mime_type=file.content_type,
    )

    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    log_activity(db, user.id, "upload", file.filename, db_file.id)

    return {
        "id": db_file.id,
        "original_filename": db_file.original_filename,
        "size_bytes": db_file.size_bytes,
        "uploaded_at": db_file.uploaded_at.isoformat(),
    }


# ---------------- STORAGE USAGE ----------------

@router.get("/storage")
def storage_usage(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    total = (
        db.query(func.sum(FileModel.size_bytes))
        .filter(FileModel.user_id == user.id)
        .scalar()
        or 0
    )

    return {
        "total_bytes": total,
        "total_mb": round(total / (1024 * 1024), 2),
    }


# ---------------- DOWNLOAD ----------------

@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    f = (
        db.query(FileModel)
        .filter(FileModel.id == file_id, FileModel.user_id == user.id)
        .first()
    )

    if not f:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        res = supabase.storage.from_(SUPABASE_BUCKET).create_signed_url(
            f.stored_filename, 60
        )
        url = res.get("signedURL") or res.get("signedUrl")
    except Exception:
        url = None

    if not url:
        raise HTTPException(status_code=404, detail="File missing in storage")

    log_activity(db, user.id, "download", f.original_filename, f.id)

    return {"url": url}


# ---------------- DELETE ----------------

@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    f = (
        db.query(FileModel)
        .filter(FileModel.id == file_id, FileModel.user_id == user.id)
        .first()
    )

    if not f:
        raise HTTPException(status_code=404, detail="File not found")

    # Remove from Supabase (ignore failure)
    try:
        supabase.storage.from_(SUPABASE_BUCKET).remove([f.stored_filename])
    except Exception:
        pass

    # Clear activity FK
    db.query(Activity).filter(Activity.file_id == f.id).update(
        {Activity.file_id: None}
    )

    log_activity(db, user.id, "delete", f.original_filename)

    db.delete(f)
    db.commit()

    return {"deleted": file_id}
