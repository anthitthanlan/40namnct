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

    # 1. Read original image content for OCR BEFORE saving/converting to WebP
    image_bytes = await file.read()
    await file.seek(0)
    original_mime_type = file.content_type or "image/jpeg"

    # 2. Run AI OCR and Save to Storage concurrently to save time
    import asyncio
    import re
    import unicodedata
    
    def remove_accents(input_str):
        if not input_str: return ""
        s1 = unicodedata.normalize('NFKD', input_str).encode('ASCII', 'ignore').decode('utf-8')
        return s1
        
    # Tạo tên custom cho receipt: [tên ng đăng kí]_[mã định danh]
    raw_name = inv.attendee_name if inv.attendee_name else ""
    safe_name_str = remove_accents(raw_name)
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', f"{safe_name_str}_{inv.code}") if safe_name_str else inv.code
    
    saved_task = save_uploaded_file(file, subfolder="receipts", custom_name=safe_name)
    ocr_task = extract_receipt_info(
        image_bytes=image_bytes,
        mime_type=original_mime_type
    )
    
    saved, ocr_raw = await asyncio.gather(saved_task, ocr_task)
    receipt_url = saved["url"]

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
    ocr_raw["confidence"] = match_result["confidence"]
    ocr_raw["note"] = match_result["note"]
    inv.ocr_result = ocr_raw
    attempts = list(inv.receipt_attempts or [])
    attempts.append(attempt_entry)
    inv.receipt_attempts = attempts[-3:] # keep last 3 attempts

    max_attempts = 3
    attempts_left = max_attempts - len(attempts)

    # Update status based on OCR result
    if match_result["confidence"] == "high":
        inv.payment_claimed_at = now_iso
        inv.status = "confirmed"
    elif attempts_left <= 0:
        inv.status = "pending_approval"

    db.commit()
    db.refresh(inv)

    is_ok = match_result["confidence"] == "high"

    # Determine confidence for frontend
    if is_ok:
        conf = "high"
        msg = "Xác nhận thành công"
    elif attempts_left > 0:
        conf = "mismatch"
        msg = "Không tìm thấy thông tin chuyển khoản khớp với yêu cầu."
    else:
        conf = "mismatch_fallback"
        msg = "Hệ thống không thể tự động xác nhận sau nhiều lần thử. Chúng tôi đã lưu biên lai của bạn và sẽ duyệt thủ công trong thời gian sớm nhất."

    return {
        "ok": is_ok,
        "success": is_ok,
        "confidence": conf,
        "message": msg,
        "attemptsLeft": attempts_left,
        "canRetry": attempts_left > 0,
        "receiptUrl": receipt_url,
        "ocrResult": ocr_raw,
        "matchResult": match_result
    }
