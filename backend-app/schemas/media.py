from pydantic import BaseModel, Field
from typing import Optional

class MediaResponse(BaseModel):
    id: str
    file: str
    url: Optional[str] = None
    kind: str
    size: int
    year: int
    month: int
    author: str
    authorRole: str = Field(alias="authorRole")
    caption: str
    title: Optional[str] = None
    media_type: str = Field(alias="mediaType", default="media")
    status: str
    createdAt: str = Field(alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True

class MediaUpdate(BaseModel):
    title: Optional[str] = None
    caption: Optional[str] = None
    status: Optional[str] = None
    year: Optional[int] = None
    month: Optional[int] = None
