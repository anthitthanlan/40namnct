from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.member import Member
from app.schemas.member import MemberCreate, MemberResponse
from app.services.auth_service import get_current_admin

router = APIRouter(prefix="/api/members", tags=["Members"])

def normalize_phone(phone: str) -> str:
    cleaned = "".join(filter(str.isdigit, phone))
    if cleaned.startswith("84") and len(cleaned) >= 10:
        cleaned = "0" + cleaned[2:]
    return cleaned

@router.get("", response_model=List[MemberResponse])
def get_members(
    phone: Optional[str] = None,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    query = db.query(Member)
    if phone:
        query = query.filter(Member.phone == normalize_phone(phone))
    members = query.order_by(Member.created_at.desc()).all()
    return [
        MemberResponse(
            id=m.id,
            name=m.name,
            phone=m.phone,
            email=m.email or "",
            createdAt=m.created_at
        ) for m in members
    ]

@router.post("", response_model=MemberResponse)
def create_or_get_member(member_in: MemberCreate, db: Session = Depends(get_db)):
    phone = normalize_phone(member_in.phone)
    existing = db.query(Member).filter(Member.phone == phone).first()
    if existing:
        return MemberResponse(
            id=existing.id,
            name=existing.name,
            phone=existing.phone,
            email=existing.email or "",
            createdAt=existing.created_at
        )
    
    new_member = Member(
        name=member_in.name,
        phone=phone,
        email=member_in.email or "",
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return MemberResponse(
        id=new_member.id,
        name=new_member.name,
        phone=new_member.phone,
        email=new_member.email or "",
        createdAt=new_member.created_at
    )

@router.delete("/{id}")
def delete_member(
    id: str,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    member = db.query(Member).filter(Member.id == id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Không tìm thấy thành viên")
    db.delete(member)
    db.commit()
    return {"success": True, "id": id}
