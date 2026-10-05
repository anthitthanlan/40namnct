from sqlalchemy import Column, String, Text, Boolean, DateTime
from datetime import datetime, timezone
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

class Post(Base):
    __tablename__ = "posts"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(String(500), nullable=False)
    excerpt = Column(Text, default="")
    content = Column(Text, default="")
    author = Column(String(255), default="")
    author_role = Column(String(255), default="")
    source = Column(String(50), default="admin")  # "admin" | "user"
    status = Column(String(50), default="published")  # "published" | "pending" | "rejected" | "draft"
    pinned = Column(Boolean, default=False)
    cover = Column(String(500), nullable=True)
    category_id = Column(String(64), nullable=True)
    created_at = Column(String(64), default=utc_now_iso)
    updated_at = Column(String(64), default=utc_now_iso, onupdate=utc_now_iso)
