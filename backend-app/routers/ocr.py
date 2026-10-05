from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import os

from app.database import get_db
from app.models.invitation import Invitation
from app.services.storage import save_uploaded_file
from app.services.ocr_service import extract_receipt_info, verify_match

router = APIRouter(prefix="/api/ocr", tags=["OCR"])

@router.post("/verify-receipt")
async def verify_receipt(
    file: UploadFile = File(...),
    invitationId: str = Form(...),
    db: Session = Depends(get_db)
):
    inv = db.query(Invitation).filter(Invitation.id == invitationId).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin thư mời")

    # 1. Save receipt directly to server disk under /uploads/receipts
    saved = await save_uploaded_file(file, subfolder="receipts")
    receipt_url = saved["url"]

    # 2. Read image content for OCR
    with open(saved["path"], "rb") as f:
        image_bytes = f.read()

    # 3. Run AI OCR
    ocr_raw = await extract_receipt_info(
        image_bytes=image_bytes,
        mime_type=file.content_type or "image/jpeg"
    )

    # 4. Verify match against invitation
    match_result = verify_match(
        ocr=ocr_raw,
        expected_amount=inv.amount,
        expected_code=inv.code
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    attempt_entry = {
        "url": receipt_url,
        "ocrResult": ocr_raw,
        "matchResult": match_result,
        "createdAt": now_iso
    }

    # 5. Update invitation in database
    inv.receipt_url = receipt_url
    inv.ocr_result = ocr_raw
    attempts = list(inv.receipt_attempts or [])
    attempts.append(attempt_entry)
    inv.receipt_attempts = attempts[-3:] # keep last 3 attempts

    # If confidence is high, record payment claimed
    if match_result["confidence"] == "high":
        inv.payment_claimed_at = now_iso

    db.commit()
    db.refresh(inv)

    return {
        "success": True,
        "receiptUrl": receipt_url,
        "ocrResult": ocr_raw,
        "matchResult": match_result
    }
