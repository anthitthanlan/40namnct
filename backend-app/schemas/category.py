from pydantic import BaseModel, Field
from typing import Optional

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = ""
    order: Optional[int] = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

class CategoryResponse(CategoryBase):
    id: str
    slug: str
    createdAt: str = Field(alias="createdAt")
    updatedAt: str = Field(alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True
