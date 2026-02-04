"""
Auth routes: register, login. Plus optional me + history.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Activity
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


# --- Request/Response schemas ---
class RegisterBody(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)) -> dict:
    """Register a new user."""
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin,
        },
    }


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)) -> dict:
    """Login: returns JWT and user info."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin,
        },
    }


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    """Current user profile (requires auth)."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_admin": user.is_admin,
    }

@router.delete("/history/clear")
def clear_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.query(Activity).filter(Activity.user_id == user.id).delete()
    db.commit()
    return {"cleared": True}


@router.get("/history")
def history(
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list:
    """User activity history (upload, download, delete)."""
    activities = (
        db.query(Activity)
        .filter(Activity.user_id == user.id)
        .order_by(Activity.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": a.id,
            "action": a.action,
            "filename": a.filename,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in activities
    ]
