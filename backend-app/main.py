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

def ensure_database_schema(engine_obj):
    from sqlalchemy import inspect, text
    try:
        with engine_obj.begin() as conn:
            inspector = inspect(conn)
            tables = inspector.get_table_names()
            if "invitations" in tables:
                columns = [c["name"] for c in inspector.get_columns("invitations")]
                if "email_sent" not in columns:
                    conn.execute(text("ALTER TABLE invitations ADD COLUMN email_sent BOOLEAN DEFAULT 0"))
                if "email_sent_at" not in columns:
                    conn.execute(text("ALTER TABLE invitations ADD COLUMN email_sent_at VARCHAR(64)"))
                if "checkin_entries" not in columns:
                    conn.execute(text("ALTER TABLE invitations ADD COLUMN checkin_entries JSON DEFAULT '[]'"))
                
                if "action_logs" in tables:
                    conn.execute(text("""
                        UPDATE invitations
                        SET email_sent = 1
                        WHERE id IN (
                            SELECT DISTINCT entity_id FROM action_logs
                            WHERE entity_id IS NOT NULL AND details LIKE '%Gửi email%'
                        ) AND (email_sent IS NULL OR email_sent = 0)
                    """))

            if "media" in tables:
                media_columns = [c["name"] for c in inspector.get_columns("media")]
                if "title" not in media_columns:
                    conn.execute(text("ALTER TABLE media ADD COLUMN title VARCHAR(255)"))

                # Backfill tên album cho 10 nhóm feed cũ dựa trên thư mục lưu trữ
                backfill_mappings = [
                    ("%/12A2_1995/%", "Lớp 12A2 (1995)"),
                    ("%/Le_Ra_Truong/%", "Lễ Ra Trường"),
                    ("%/Tiet_hoc_cuoi/%", "Tiết Học Cuối"),
                    ("%/an_con_tho_12A5_va_ma_ao_ang_y/%", "Đàn Con Thơ 12A5 - Kỷ Yếu & Đà Lạt"),
                    ("%/12A8__2000-2003__mot_thoi_e_nh/%", "12A8 (2000 - 2003) - Một Thời Để Nhớ"),
                    ("%/Truoc_ky_thi_tot_nghiep_cua_kh/%", "Trước Kỳ Thi Tốt Nghiệp"),
                    ("%/Hinh_ngay_oi_ten_truong/%", "Hình Ngày Đổi Tên Trường"),
                    ("%/Anh_ki_niem_nien_hoc_khoa_1992/%", "Ảnh Kỷ Niệm Niên Khóa 1992"),
                    ("%/Lien_hoan_nam_cuoi_cap_1995/%", "Liên Hoan Năm Cuối Cấp 1995"),
                    ("%/untitled/%", "Kỷ Niệm 20/11 Lớp 12A4"),
                ]
                for pattern, title_val in backfill_mappings:
                    conn.execute(
                        text("UPDATE media SET title = :t WHERE (title IS NULL OR title = '') AND file LIKE :p"),
                        {"t": title_val, "p": pattern}
                    )

            if "categories" in tables:
                cat = conn.execute(text("SELECT id FROM categories WHERE slug = 'cau-chuyen-thanh-xuan' OR name = 'Câu chuyện thanh xuân'")).first()
                cat_id = None
                if not cat:
                    import uuid
                    from datetime import datetime, timezone
                    cat_id = str(uuid.uuid4())
                    now_iso = datetime.now(timezone.utc).isoformat()
                    conn.execute(
                        text("INSERT INTO categories (id, slug, name, description, `order`, created_at, updated_at) VALUES (:id, :slug, :name, :description, :order, :created_at, :updated_at)"),
                        {
                            "id": cat_id,
                            "slug": "cau-chuyen-thanh-xuan",
                            "name": "Câu chuyện thanh xuân",
                            "description": "Nơi lưu giữ những câu chuyện, ký ức và dòng hồi tưởng thanh xuân của các thế hệ Thầy và Trò Nguyễn Công Trứ.",
                            "order": 1,
                            "created_at": now_iso,
                            "updated_at": now_iso
                        }
                    )
                else:
                    cat_id = cat[0]

                if "posts" in tables and cat_id:
                    conn.execute(
                        text("UPDATE posts SET category_id = :cat_id WHERE (category_id IS NULL OR category_id = '') AND source = 'user'"),
                        {"cat_id": cat_id}
                    )
    except Exception as e:
        print(f"Warning: ensure_database_schema encountered an issue: {e}")

ensure_database_schema(engine)

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

