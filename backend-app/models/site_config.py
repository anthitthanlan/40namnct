from sqlalchemy import Column, String, JSON
from app.database import Base

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True)
    value = Column(JSON, nullable=False)
