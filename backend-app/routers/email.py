from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, EmailStr
import httpx
from typing import List, Optional
from app.config import settings
from app.services.auth_service import get_current_admin

router = APIRouter(prefix="/api/email", tags=["Email"])

class EmailAttachment(BaseModel):
    filename: str
    content: str  # base64

class EmailRequest(BaseModel):
    to: List[str]
    subject: str
    html: str
    from_email: Optional[str] = "Thư mời <bantochuc@40namnctru.nctitc.io.vn>"
    attachments: Optional[List[EmailAttachment]] = None
    
async def send_resend_email_task(to: List[str], subject: str, html: str, from_email: str, attachments: Optional[List[dict]] = None):
    if not settings.RESEND_API_KEY:
        print("RESEND_API_KEY is not configured.")
        return
        
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": from_email,
        "to": to,
        "subject": subject,
        "html": html
    }
    if attachments:
        payload["attachments"] = attachments
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            print(f"Email sent successfully to {to}")
        except httpx.HTTPStatusError as e:
            print(f"Failed to send email: {e.response.text}")
        except Exception as e:
            print(f"Error sending email: {e}")

@router.post("/send")
async def send_email(
    request: EmailRequest, 
    background_tasks: BackgroundTasks,
    # NOTE: In a real app, you might want to protect this with an internal secret 
    # or ensure it's only called from your frontend server. For now, since it's an internal proxy, 
    # we don't strictly require Admin auth if the frontend needs to trigger emails on public actions (like user registration).
    # If it's ONLY for admin actions, uncomment the dependency below:
    # admin = Depends(get_current_admin)
):
    if not settings.RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Chưa cấu hình RESEND_API_KEY trên server.")
        
    background_tasks.add_task(
        send_resend_email_task,
        [email.strip() for email in request.to if email.strip()],
        request.subject,
        request.html,
        request.from_email,
        [a.model_dump() for a in request.attachments] if request.attachments else None,
    )
    
    return {"success": True, "message": "Email is queued for sending"}

from app.database import get_db
from sqlalchemy.orm import Session
from app.models.email_template import EmailTemplate
from app.schemas.email_template import EmailTemplateCreate, EmailTemplateUpdate, EmailTemplateResponse

@router.get("/templates", response_model=List[EmailTemplateResponse])
def get_templates(db: Session = Depends(get_db)):
    return db.query(EmailTemplate).order_by(EmailTemplate.created_at.desc()).all()

@router.post("/templates", response_model=EmailTemplateResponse)
def create_template(tpl: EmailTemplateCreate, db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    new_tpl = EmailTemplate(**tpl.dict())
    db.add(new_tpl)
    db.commit()
    db.refresh(new_tpl)
    return new_tpl

@router.put("/templates/{id}", response_model=EmailTemplateResponse)
def update_template(id: str, tpl: EmailTemplateUpdate, db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    db_tpl = db.query(EmailTemplate).filter(EmailTemplate.id == id).first()
    if not db_tpl:
        raise HTTPException(status_code=404, detail="Mẫu không tồn tại")
    for key, value in tpl.dict().items():
        setattr(db_tpl, key, value)
    db.commit()
    db.refresh(db_tpl)
    return db_tpl

@router.delete("/templates/{id}")
def delete_template(id: str, db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    db_tpl = db.query(EmailTemplate).filter(EmailTemplate.id == id).first()
    if not db_tpl:
        raise HTTPException(status_code=404, detail="Mẫu không tồn tại")
    db.delete(db_tpl)
    db.commit()
    return {"success": True, "message": "Đã xóa mẫu email"}
