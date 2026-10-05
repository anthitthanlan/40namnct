from sqlalchemy import Column, String, Integer
from app.database import Base
from app.models.post import generate_uuid, utc_now_iso

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), default="")
    order = Column(Integer, default=0)
    created_at = Column(String(64), default=utc_now_iso)
    updated_at = Column(String(64), default=utc_now_iso, onupdate=utc_now_iso)
