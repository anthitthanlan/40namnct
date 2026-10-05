from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.media import MediaItem
from app.schemas.media import MediaResponse
from app.services.storage import save_uploaded_file
from app.services.auth_service import get_current_admin

router = APIRouter(prefix="/api/media", tags=["Media"])

@router.get("", response_model=List[MediaResponse])
def get_media(
    status: Optional[str] = "approved",
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MediaItem)
    if status and status != "all":
        query = query.filter(MediaItem.status == status)
    if year:
        query = query.filter(MediaItem.year == year)
    items = query.order_by(MediaItem.created_at.desc()).all()
    return [
        MediaResponse(
            id=m.id,
            file=m.file,
            url=m.url,
            kind=m.kind,
            size=m.size,
            year=m.year,
            month=m.month,
            author=m.author or "",
            authorRole=m.author_role or "",
            caption=m.caption or "",
            status=m.status,
            createdAt=m.created_at
        ) for m in items
    ]

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    year: int = Form(2026),
    month: int = Form(11),
    author: str = Form(""),
    authorRole: str = Form(""),
    caption: str = Form(""),
    db: Session = Depends(get_db)
):
    # Save file directly to server disk
    saved = await save_uploaded_file(file, subfolder="media")
    kind = "video" if file.content_type and "video" in file.content_type else "image"

    media_record = MediaItem(
        file=saved["filename"],
        url=saved["url"],
        kind=kind,
        size=saved["size"],
        year=year,
        month=month,
        author=author,
        author_role=authorRole,
        caption=caption,
        status="approved"
    )
    db.add(media_record)
    db.commit()
    db.refresh(media_record)

    return {
        "success": True,
        "id": media_record.id,
        "url": media_record.url,
        "filename": media_record.file
    }

@router.patch("/{id}/status")
def update_media_status(
    id: str,
    status: str = Form(...),
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    item = db.query(MediaItem).filter(MediaItem.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy file media")
    item.status = status
    db.commit()
    return {"success": True, "status": item.status}

@router.delete("/{id}")
def delete_media_item(
    id: str,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    item = db.query(MediaItem).filter(MediaItem.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy file media")
    db.delete(item)
    db.commit()
    return {"success": True, "id": id}
