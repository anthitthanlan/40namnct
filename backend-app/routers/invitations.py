from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import random
import string

from app.database import get_db
from app.models.invitation import Invitation
from app.models.member import Member
from app.models.admin import ActionLog
from app.schemas.invitation import InvitationCreate, InvitationUpdate, InvitationResponse
from app.services.auth_service import get_current_admin, require_super_admin
from app.services.storage import delete_uploaded_file
from app.services.vietqr_service import get_vietqr_url

router = APIRouter(prefix="/api/invitations", tags=["Invitations"])

UNIT_PRICE = 500000

def generate_invitation_code(db: Session) -> str:
    # Lấy số lượng ticket hiện tại để làm số thứ tự
    count = db.query(Invitation).count() + 1
    seq_str = f"{count:03d}"
    while True:
        random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
        code = f"NCT19862026-{seq_str}{random_str}"
        if not db.query(Invitation).filter(Invitation.code == code).first():
            return code

def to_response(inv: Invitation) -> InvitationResponse:
    return InvitationResponse(
        id=inv.id,
        code=inv.code,
        memberId=inv.member_id,
        nienKhoa=inv.nien_khoa,
        type=inv.type,
        attendeeName=inv.attendee_name,
        size=inv.size,
        quantity=inv.quantity,
        sizes=inv.sizes or {},
        snacks=inv.snacks,
        amount=inv.amount,
        status=inv.status,
        note=inv.note or "",
        paymentClaimedAt=inv.payment_claimed_at,
        receiptUrl=inv.receipt_url,
        ocrResult=inv.ocr_result,
        receiptAttempts=inv.receipt_attempts or [],
        lastSessionId=inv.last_session_id,
        checkedIn=inv.checked_in,
        checkedInAt=inv.checked_in_at,
        shirtReceived=inv.shirt_received,
        shirtReceivedAt=inv.shirt_received_at,
        createdAt=inv.created_at,
        updatedAt=inv.updated_at
    )

@router.get("", response_model=List[InvitationResponse])
def get_invitations(
    status: Optional[str] = None,
    member_id: Optional[str] = None,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    query = db.query(Invitation)
    if status:
        query = query.filter(Invitation.status == status)
    if member_id:
        query = query.filter(Invitation.member_id == member_id)
    invitations = query.order_by(Invitation.created_at.desc()).all()
    return [to_response(i) for i in invitations]

@router.get("/public-stats")
def public_stats(db: Session = Depends(get_db)):
    """Số liệu tổng hợp công khai (không chứa thông tin cá nhân) cho trang chủ."""
    rows = db.query(Invitation).filter(Invitation.status == "confirmed").all()
    return {
        "orderCount": len(rows),
        "attendeeCount": sum((r.quantity or 1) for r in rows),
        "memberCount": len({r.member_id for r in rows}),
        "totalAmount": sum((r.amount or 0) for r in rows),
    }

@router.get("/search")
def search_invitations(
    q: str = Query(..., description="Mã thư mời hoặc số điện thoại"),
    db: Session = Depends(get_db)
):
    clean_q = q.strip().upper()
    
    # 1. Search by Code
    inv_by_code = db.query(Invitation).filter(Invitation.code == clean_q).all()
    if inv_by_code:
        return {"items": [to_response(i) for i in inv_by_code]}
    
    # 2. Search by Member Phone
    phone_clean = "".join(filter(str.isdigit, q))
    if phone_clean.startswith("84"):
        phone_clean = "0" + phone_clean[2:]
        
    members = db.query(Member).filter(Member.phone == phone_clean).all()
    if members:
        member_ids = [m.id for m in members]
        invitations = db.query(Invitation).filter(Invitation.member_id.in_(member_ids)).all()
        return {"items": [to_response(i) for i in invitations]}

    return {"items": []}

@router.get("/{id_or_code}", response_model=InvitationResponse)
def get_invitation(id_or_code: str, db: Session = Depends(get_db)):
    inv = db.query(Invitation).filter((Invitation.id == id_or_code) | (Invitation.code == id_or_code.upper())).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Không tìm thấy thư mời")
    return to_response(inv)

@router.post("", response_model=InvitationResponse)
def create_invitation(inv_in: InvitationCreate, db: Session = Depends(get_db)):
    # Check registration limit (350 shirts max)
    total_quantity = db.query(func.sum(Invitation.quantity)).filter(Invitation.status != "rejected").scalar() or 0
    if total_quantity + inv_in.quantity > 350:
        raise HTTPException(status_code=400, detail=f"Đã vượt quá số lượng đăng ký. Chỉ còn trống {350 - total_quantity} suất.")

    code = inv_in.code or generate_invitation_code(db)
    
    # Calculate amount: snacks * UNIT_PRICE
    calculated_amount = inv_in.snacks * UNIT_PRICE if inv_in.snacks > 0 else 0

    new_inv = Invitation(
        code=code,
        member_id=inv_in.memberId,
        nien_khoa=inv_in.nienKhoa,
        type=inv_in.type,
        attendee_name=inv_in.attendeeName,
        size=inv_in.size,
        quantity=inv_in.quantity,
        sizes=inv_in.sizes,
        snacks=inv_in.snacks,
        amount=calculated_amount,
        status="pending",
        note=inv_in.note or "",
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)
    return to_response(new_inv)

@router.patch("/{id}", response_model=InvitationResponse)
def update_invitation(
    id: str,
    update_data: InvitationUpdate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    inv = db.query(Invitation).filter(Invitation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Không tìm thấy thư mời")

    now_iso = datetime.now(timezone.utc).isoformat()
    changes = update_data.model_dump(exclude_unset=True)

    if "status" in changes and changes["status"] is not None:
        inv.status = changes["status"]
        if changes["status"] == "confirmed" and not inv.payment_claimed_at:
            inv.payment_claimed_at = now_iso
            
    if "checkedIn" in changes and changes["checkedIn"] is not None:
        inv.checked_in = changes["checkedIn"]
        inv.checked_in_at = now_iso if changes["checkedIn"] else None
        
    if "shirtReceived" in changes and changes["shirtReceived"] is not None:
        inv.shirt_received = changes["shirtReceived"]
        inv.shirt_received_at = now_iso if changes["shirtReceived"] else None

    if "note" in changes and changes["note"] is not None:
        inv.note = changes["note"]
        
    if "size" in changes and changes["size"] is not None:
        inv.size = changes["size"]

    if "attendeeName" in changes and changes["attendeeName"] is not None:
        inv.attendee_name = changes["attendeeName"]
        
    if "nienKhoa" in changes and changes["nienKhoa"] is not None:
        inv.nien_khoa = changes["nienKhoa"]
        
    if "memberEmail" in changes and changes["memberEmail"] is not None:
        from app.models.member import Member
        member = db.query(Member).filter(Member.id == inv.member_id).first()
        if member:
            member.email = changes["memberEmail"]

    # Log action
    log = ActionLog(
        action="update_invitation",
        entity_id=inv.id,
        admin_name=admin.get("fullName", "Admin"),
        admin_role=admin.get("role", "admin"),
        details=f"Cập nhật thư mời {inv.code}: {list(changes.keys())}"
    )
    db.add(log)
    db.commit()
    db.refresh(inv)
    return to_response(inv)

@router.get("/{id}/vietqr")
def get_invitation_vietqr(id: str, db: Session = Depends(get_db)):
    inv = db.query(Invitation).filter(Invitation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Không tìm thấy thư mời")
    
    qr_url = get_vietqr_url(amount=inv.amount, add_info=inv.code)
    return {"qrUrl": qr_url, "amount": inv.amount, "code": inv.code}

@router.delete("/{id}")
async def delete_invitation(
    id: str,
    db: Session = Depends(get_db),
    admin = Depends(require_super_admin)
):
    inv = db.query(Invitation).filter(Invitation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Không tìm thấy thư mời")
    
    # Xóa ảnh hóa đơn chính
    if inv.receipt_url:
        await delete_uploaded_file(inv.receipt_url, subfolder="receipts")
    
    # Xóa các ảnh hóa đơn trong lịch sử attempts
    if inv.receipt_attempts:
        for attempt in inv.receipt_attempts:
            if 'url' in attempt and attempt['url']:
                await delete_uploaded_file(attempt['url'], subfolder="receipts")
                
    db.delete(inv)
    db.commit()
    return {"success": True, "id": id}
