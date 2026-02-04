"""
Admin dashboard APIs: global stats, user list, etc.
"""

from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func

from fastapi import APIRouter, Depends

from app.database import get_db
from app.models import User, File, Activity
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
) -> dict:
    """Admin dashboard: total users, total files, total storage, recent activity count."""
    total_users = db.query(User).count()
    total_files = db.query(File).count()
    total_storage = db.query(func.sum(File.size_bytes)).scalar() or 0
    recent_activities = db.query(Activity).count()  # or filter by last 7 days
    return {
        "total_users": total_users,
        "total_files": total_files,
        "total_storage_bytes": total_storage,
        "total_storage_mb": round(total_storage / (1024 * 1024), 2),
        "recent_activities": recent_activities,
    }


@router.get("/users")
def admin_users(
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
) -> List[dict]:
    """List all users (for admin)."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "is_admin": u.is_admin,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]
