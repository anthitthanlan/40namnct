from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models.invitation import Invitation
from app.models.member import Member
from app.models.admin import Admin, ActionLog
from app.models.post import Post
from app.schemas.admin import (
    AdminCreate,
    AdminResponse,
    ActionLogResponse,
    ActionLogCreate,
    ActionLogPaginationResponse
)
from app.services.auth_service import (
    get_current_admin,
    require_super_admin,
    hash_password
)


router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    total_invitations = db.query(Invitation).count()
    confirmed_invitations = db.query(Invitation).filter(Invitation.status == "confirmed").count()
    checked_in_count = db.query(Invitation).filter(Invitation.checked_in == True).count()
    shirt_received_count = db.query(Invitation).filter(Invitation.shirt_received == True).count()
    
    total_revenue = db.query(func.sum(Invitation.amount)).filter(Invitation.status == "confirmed").scalar() or 0
    total_members = db.query(Member).count()
    total_posts = db.query(Post).count()

    # Size aggregation & attendees (chỉ tính thư mời đã duyệt - status == "confirmed")
    invitations = db.query(Invitation).filter(Invitation.status == "confirmed").all()
    size_counts: Dict[str, int] = {}
    total_attendees = 0
    total_snacks = 0

    for inv in invitations:
        total_attendees += (inv.quantity or 1)
        total_snacks += (inv.snacks or 0)
        if inv.type == "individual" and inv.size:
            size_counts[inv.size] = size_counts.get(inv.size, 0) + 1
        elif inv.type == "group" and inv.sizes:
            for s, q in inv.sizes.items():
                size_counts[s] = size_counts.get(s, 0) + int(q)

    return {
        "overview": {
            "totalInvitations": total_invitations,
            "confirmedInvitations": confirmed_invitations,
            "checkedInCount": checked_in_count,
            "shirtReceivedCount": shirt_received_count,
            "totalRevenue": total_revenue,
            "totalMembers": total_members,
            "totalPosts": total_posts,
            "totalAttendees": total_attendees,
            "totalSnacks": total_snacks,
        },
        "sizes": size_counts
    }

@router.get("/accounts", response_model=List[AdminResponse])
def get_admins(db: Session = Depends(get_db), super_admin = Depends(require_super_admin)):
    admins = db.query(Admin).order_by(Admin.created_at.desc()).all()
    return [
        AdminResponse(
            id=a.id,
            username=a.username,
            fullName=a.full_name,
            title=a.title,
            role=a.role,
            createdAt=a.created_at
        ) for a in admins
    ]

from datetime import datetime, timezone

@router.post("/accounts", response_model=AdminResponse)
def create_admin(
    admin_in: AdminCreate,
    db: Session = Depends(get_db),
    super_admin = Depends(require_super_admin)
):
    if db.query(Admin).filter(Admin.username == admin_in.username).first():
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")

    new_admin = Admin(
        username=admin_in.username,
        full_name=admin_in.fullName,
        title=admin_in.title or "Thầy/Cô",
        role=admin_in.role or "system_manager",
        password_hash=hash_password(admin_in.password),
        logs=[{
            "action": "account_created",
            "detail": f"Tạo bởi {super_admin.get('username')}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }]
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return AdminResponse(
        id=new_admin.id,
        username=new_admin.username,
        fullName=new_admin.full_name,
        title=new_admin.title,
        role=new_admin.role,
        createdAt=new_admin.created_at
    )

@router.delete("/accounts/{id}")
def delete_admin(id: str, db: Session = Depends(get_db), super_admin = Depends(require_super_admin)):
    admin = db.query(Admin).filter(Admin.id == id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản admin")
    db.delete(admin)
    db.commit()
    return {"success": True, "message": "Đã xóa tài khoản"}

@router.get("/logs")
def get_action_logs(
    limit: int = 50,
    page: int = 1,
    offset: Optional[int] = None,
    entity_id: Optional[str] = None,
    action: Optional[str] = None,
    search: Optional[str] = None,
    all: bool = False,
    raw: bool = False,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    query = db.query(ActionLog)

    if entity_id:
        query = query.filter(ActionLog.entity_id == entity_id)

    if action:
        query = query.filter(ActionLog.action == action)

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ActionLog.details.ilike(search_pattern),
                ActionLog.admin_name.ilike(search_pattern),
                ActionLog.entity_id.ilike(search_pattern),
                ActionLog.action.ilike(search_pattern)
            )
        )

    total = query.count()
    query = query.order_by(ActionLog.created_at.desc())

    if not all:
        actual_offset = offset if offset is not None else (page - 1) * limit
        logs = query.offset(actual_offset).limit(limit).all()
    else:
        logs = query.all()
        limit = total if total > 0 else 1

    total_pages = (total + limit - 1) // limit if limit > 0 else 1

    items = [
        ActionLogResponse(
            id=l.id,
            action=l.action,
            entityId=l.entity_id,
            adminName=l.admin_name,
            adminRole=l.admin_role,
            details=l.details or "",
            createdAt=l.created_at
        ) for l in logs
    ]

    if raw:
        return items

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages
    }


@router.post("/logs", response_model=ActionLogResponse)
def create_action_log(
    log_in: ActionLogCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    new_log = ActionLog(
        action=log_in.action,
        entity_id=log_in.entityId,
        admin_name=log_in.adminName,
        admin_role=log_in.adminRole,
        details=log_in.details
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return ActionLogResponse(
        id=new_log.id,
        action=new_log.action,
        entityId=new_log.entity_id,
        adminName=new_log.admin_name,
        adminRole=new_log.admin_role,
        details=new_log.details or "",
        createdAt=new_log.created_at
    )
