from sqlalchemy import Column, String, Text, JSON
from datetime import datetime, timezone
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

class Admin(Base):
    __tablename__ = "admins"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), default="")
    title = Column(String(50), default="Thầy/Cô")
    role = Column(String(50), default="system_manager")
    password_hash = Column(String(255), nullable=False)
    logs = Column(JSON, default=list)
    created_at = Column(String(64), default=utc_now_iso)
    updated_at = Column(String(64), default=utc_now_iso, onupdate=utc_now_iso)

class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    action = Column(String(100), nullable=False)
    entity_id = Column(String(64), index=True, nullable=True)
    admin_name = Column(String(255), default="")
    admin_role = Column(String(50), default="")
    details = Column(Text, default="")
    created_at = Column(String(64), default=utc_now_iso)
