from pydantic import BaseModel, Field
from typing import Optional, Literal

PostStatus = Literal["published", "pending", "rejected", "draft"]
PostSource = Literal["admin", "user"]

class PostBase(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: Optional[str] = ""
    content: Optional[str] = ""
    author: Optional[str] = ""
    authorRole: Optional[str] = Field("", alias="authorRole")
    source: PostSource = "admin"
    status: PostStatus = "published"
    pinned: bool = False
    cover: Optional[str] = None
    categoryId: Optional[str] = Field(None, alias="categoryId")

    class Config:
        populate_by_name = True

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    authorRole: Optional[str] = Field(None, alias="authorRole")
    source: Optional[PostSource] = None
    status: Optional[PostStatus] = None
    pinned: Optional[bool] = None
    cover: Optional[str] = None
    categoryId: Optional[str] = Field(None, alias="categoryId")

    class Config:
        populate_by_name = True

class PostResponse(PostBase):
    id: str
    createdAt: str = Field(alias="createdAt")
    updatedAt: str = Field(alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True
