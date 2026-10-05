import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.admin import Admin

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_password(password: str, salt: Optional[str] = None) -> str:
    s = salt or secrets.token_hex(16)
    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=s.encode("utf-8"),
        n=16384,
        r=8,
        p=1,
        maxmem=33554432,
        dklen=64
    ).hex()
    return f"{s}:{derived}"

def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash or ":" not in stored_hash:
        return False
    parts = stored_hash.split(":", 1)
    salt, target_hash = parts[0], parts[1]
    computed = hash_password(password, salt=salt).split(":", 1)[1]
    return secrets.compare_digest(computed, target_hash)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def authenticate_admin(db: Session, username: str, password: str) -> Optional[Dict[str, Any]]:
    # 1. Super Admin fallback from environment
    if (
        settings.SUPER_ADMIN_USERNAME
        and username == settings.SUPER_ADMIN_USERNAME
        and password == settings.SUPER_ADMIN_PASSWORD
    ):
        return {
            "id": "super-admin",
            "username": settings.SUPER_ADMIN_USERNAME,
            "fullName": "Quản trị viên Cấp cao",
            "title": "Super Admin",
            "role": "super_admin",
        }

    # 2. Database Admin
    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin and verify_password(password, admin.password_hash):
        return {
            "id": admin.id,
            "username": admin.username,
            "fullName": admin.full_name,
            "title": admin.title,
            "role": admin.role,
        }

    return None

def get_current_admin(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chưa đăng nhập hoặc token không hợp lệ",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token đã hết hạn hoặc không hợp lệ",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    role = payload.get("role")
    
    if user_id == "super-admin":
        return {
            "id": "super-admin",
            "username": settings.SUPER_ADMIN_USERNAME,
            "fullName": "Quản trị viên Cấp cao",
            "title": "Super Admin",
            "role": "super_admin",
        }

    admin = db.query(Admin).filter(Admin.id == user_id).first()
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin không tồn tại")

    return {
        "id": admin.id,
        "username": admin.username,
        "fullName": admin.full_name,
        "title": admin.title,
        "role": admin.role,
    }

def require_super_admin(current_admin: Dict[str, Any] = Depends(get_current_admin)) -> Dict[str, Any]:
    if current_admin.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Super Admin mới có quyền thực hiện thao tác này"
        )
    return current_admin
