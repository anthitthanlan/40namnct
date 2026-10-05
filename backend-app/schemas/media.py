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
    status: str
    createdAt: str = Field(alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True
