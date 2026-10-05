from sqlalchemy import Column, String
from datetime import datetime, timezone
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

class Member(Base):
    __tablename__ = "members"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), index=True, nullable=False)
    email = Column(String(255), default="")
    created_at = Column(String(64), default=utc_now_iso)
