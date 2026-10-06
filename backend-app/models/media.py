from sqlalchemy import Column, String, Integer, Text
from datetime import datetime, timezone
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

class MediaItem(Base):
    __tablename__ = "media"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    file = Column(String(255), nullable=False)
    url = Column(String(500), nullable=True)
    kind = Column(String(50), default="image")  # "image" | "video"
    size = Column(Integer, default=0)
    year = Column(Integer, default=2026)
    month = Column(Integer, default=11)
    author = Column(String(255), default="")
    author_role = Column(String(255), default="")
    caption = Column(Text, default="")
    media_type = Column(String(50), default="media")
    status = Column(String(50), default="approved")  # "pending" | "approved" | "rejected"
    created_at = Column(String(64), default=utc_now_iso)
