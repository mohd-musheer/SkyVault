"""
File upload, download, storage usage calculation (Supabase Storage).
"""

import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, File as FileModel, Activity
from app.auth import get_current_user
from app.config import MAX_FILE_SIZE_BYTES, ALLOWED_EXTENSIONS

from supabase import create_client
import os

# ---------------- SUPABASE ----------------

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "files")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ----------------------------------------

router = APIRouter(prefix="/api/files", tags=["files"])


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
def upload_file(
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")

    ext = Path(file.filename).suffix.lower()

    if ALLOWED_EXTENSIONS and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Extension not allowed: {ext}")

    content = file.file.read()
    size = len(content)

    if size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File too large")

    stored_name = f"{user.id}/{uuid.uuid4().hex}{ext}"

    # ✅ NEW SUPABASE SAFE WAY
    try:
        supabase.storage.from_(SUPABASE_BUCKET).upload(
            stored_name,
            content,
            {"content-type": file.content_type},
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}",
        )

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


# ---------------- DOWNLOAD (AUTO DB CLEAN) ----------------

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

    signed = supabase.storage.from_(SUPABASE_BUCKET).create_signed_url(
        f.stored_filename,
        60,
    )

    # 🔥 THIS IS THE PART YOU ASKED ABOUT
    if signed.error:
        db.delete(f)
        db.commit()
        raise HTTPException(
            status_code=404,
            detail="File removed from cloud. DB cleaned.",
        )

    log_activity(db, user.id, "download", f.original_filename, f.id)

    return {"url": signed.data["signedUrl"]}


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

    # 1️⃣ Remove from Supabase storage
    supabase.storage.from_(SUPABASE_BUCKET).remove([f.stored_filename])

    # 2️⃣ Preserve history, unlink file_id
    db.query(Activity).filter(Activity.file_id == f.id).update(
        {Activity.file_id: None}
    )

    # 3️⃣ LOG DELETE ACTION (🔥 THIS FIX)
    log_activity(
        db,
        user.id,
        action="delete",
        filename=f.original_filename,
        file_id=None,
    )

    # 4️⃣ Delete file record
    db.delete(f)
    db.commit()

    return {"deleted": file_id}
