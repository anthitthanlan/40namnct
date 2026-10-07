import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.services.storage import ensure_upload_dirs
from app.routers import (
    auth,
    posts,
    members,
    invitations,
    media,
    ocr,
    admin,
    config,
    categories,
    email,
)
from app.models.email_template import EmailTemplate

# 1. Initialize Database Tables
Base.metadata.create_all(bind=engine)

# 2. Ensure Upload Folders on Disk
upload_dir = ensure_upload_dirs()

# 3. Create FastAPI App
app = FastAPI(
    title="40 Năm NCT - Backend API",
    description="Hệ thống Backend FastAPI cho Lễ Kỷ Niệm 40 Năm Trường THPT Nguyễn Công Trứ (1986 - 2026)",
    version="1.0.0",
)

# 4. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list if settings.cors_list else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Serve Uploaded Static Files from Local Server Disk
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# 6. Include API Routers
app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(members.router)
app.include_router(invitations.router)
app.include_router(media.router)
app.include_router(ocr.router)
app.include_router(admin.router)
app.include_router(config.router)
app.include_router(categories.router)
app.include_router(email.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "40namnct-backend",
        "version": "1.0.0",
        "docs_url": "/docs",
        "uploads_url": "/uploads",
    }

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import sys
    from pathlib import Path
    # Tự động thêm thư mục gốc dự án vào sys.path để tránh lỗi ModuleNotFoundError: No module named 'app'
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=False)

