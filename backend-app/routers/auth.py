from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.admin import AdminLogin, TokenResponse, AdminResponse
from app.services.auth_service import (
    authenticate_admin,
    create_access_token,
    get_current_admin
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(creds: AdminLogin, db: Session = Depends(get_db)):
    admin = authenticate_admin(db, creds.username, creds.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác"
        )
    
    token = create_access_token({
        "sub": admin["id"],
        "username": admin["username"],
        "role": admin["role"],
        "fullName": admin["fullName"],
        "title": admin["title"],
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": admin
    }

@router.get("/me")
def get_me(current_admin = Depends(get_current_admin)):
    return current_admin
