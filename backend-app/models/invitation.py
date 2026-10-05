from sqlalchemy import Column, String, Integer, Boolean, Text, JSON
from datetime import datetime, timezone
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    code = Column(String(64), unique=True, index=True, nullable=False)
    member_id = Column(String(64), index=True, nullable=False)
    nien_khoa = Column(String(50), nullable=True)
    type = Column(String(50), default="individual")  # "individual" | "group"
    attendee_name = Column(String(255), nullable=False)
    size = Column(String(20), nullable=True)
    quantity = Column(Integer, default=1)
    sizes = Column(JSON, default=dict)  # {"S": 1, "M": 2}
    snacks = Column(Integer, default=0)
    amount = Column(Integer, default=0)
    status = Column(String(50), default="pending")  # pending, confirmed, rejected, etc.
    note = Column(Text, default="")
    
    # Payment & Receipt & OCR
    payment_claimed_at = Column(String(64), nullable=True)
    receipt_url = Column(String(500), nullable=True)
    ocr_result = Column(JSON, nullable=True)
    receipt_attempts = Column(JSON, default=list)
    last_session_id = Column(String(128), nullable=True)
    
    # Checkin & Shirts
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(String(64), nullable=True)
    shirt_received = Column(Boolean, default=False)
    shirt_received_at = Column(String(64), nullable=True)
    
    created_at = Column(String(64), default=utc_now_iso)
    updated_at = Column(String(64), default=utc_now_iso, onupdate=utc_now_iso)
