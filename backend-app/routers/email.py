from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, EmailStr
import httpx
from typing import List, Optional
from app.config import settings
from app.services.auth_service import get_current_admin

router = APIRouter(prefix="/api/email", tags=["Email"])

class EmailRequest(BaseModel):
    to: List[str]
    subject: str
    html: str
    from_email: Optional[str] = "Thư mời <bantochuc@40namnctru.nctitc.io.vn>"
    
async def send_resend_email_task(to: List[str], subject: str, html: str, from_email: str):
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
        request.from_email
    )
    
    return {"success": True, "message": "Email is queued for sending"}
