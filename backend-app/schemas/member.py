from pydantic import BaseModel, Field
from typing import Optional

class MemberBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""

class MemberCreate(MemberBase):
    pass

class MemberResponse(MemberBase):
    id: str
    createdAt: str = Field(alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True
