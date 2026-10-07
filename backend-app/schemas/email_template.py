from pydantic import BaseModel
from typing import Optional

class EmailTemplateBase(BaseModel):
    title: str
    subject: str
    content: str

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplateUpdate(EmailTemplateBase):
    pass

class EmailTemplateResponse(EmailTemplateBase):
    id: str
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
