from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class AdminLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: Dict[str, Any]

class AdminCreate(BaseModel):
    username: str
    password: str
    fullName: str = Field(alias="fullName")
    title: Optional[str] = "Thầy/Cô"
    role: Optional[str] = "system_manager"

    class Config:
        populate_by_name = True

class AdminResponse(BaseModel):
    id: str
    username: str
    fullName: str = Field(alias="fullName")
    title: str
    role: str
    createdAt: str = Field(alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True

class ActionLogResponse(BaseModel):
    id: str
    action: str
    entityId: Optional[str] = Field(None, alias="entityId")
    adminName: str = Field(alias="adminName")
    adminRole: str = Field(alias="adminRole")
    details: str
    createdAt: str = Field(alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True
