import os
import sys
import shutil
import uuid
import re
import unicodedata
from datetime import datetime

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.invitation import Invitation
from app.models.media import MediaItem
from app.config import settings
from app.services.storage import get_s3_client
from sqlalchemy.orm.attributes import flag_modified
import copy

def main():
    print("Bắt đầu tiến trình Migration và Dọn dẹp TOÀN DIỆN 2 Bucket...")
    
    # 1. Backup DB
    db_path = "app.db"
    backup_path = f"app.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    if os.path.exists(db_path):
        shutil.copy2(db_path, backup_path)
        print(f"✅ Đã sao lưu database thành công: {backup_path}")
    else:
        print("⚠️ Không tìm thấy app.db, có thể đang cấu hình sai DATABASE_URL.")

    db = SessionLocal()
    s3 = get_s3_client()
    if not s3:
        print("❌ S3 client chưa được cấu hình.")
        return

    # Helper to parse object key from URL
    def get_key_from_url(url: str, public_base: str):
        if not url: return None
        if url.startswith(public_base):
            return url[len(public_base):].lstrip("/")
        return None

    def remove_accents(input_str):
        if not input_str: return ""
        return unicodedata.normalize('NFKD', input_str).encode('ASCII', 'ignore').decode('utf-8')

    invitations = db.query(Invitation).all()
    media_items = db.query(MediaItem).all()

    # --- TẬP HỢP CÁC MEDIA HỢP LỆ ---
    valid_media_keys = set()
    for m in media_items:
        key = get_key_from_url(m.url, settings.R2_PUBLIC_URL_MEDIA)
        if key:
            valid_media_keys.add(key)
        elif m.file:
            valid_media_keys.add(m.file)

    # --- KHÔI PHỤC CACHE TỪ BUCKET RECEIPTS ---
    print("\nĐang lấy danh sách file dự phòng từ bucket Receipts...")
    recovery_cache = {}
    paginator = s3.get_paginator('list_objects_v2')
    try:
        for page in paginator.paginate(Bucket=settings.R2_BUCKET_RECEIPT):
            if 'Contents' not in page: continue
            for obj in page['Contents']:
                obj_key = obj['Key']
                match = re.search(r'(NCT19862026-[A-Z0-9]+)', obj_key)
                if match:
                    code = match.group(1)
                    if code not in recovery_cache:
                        recovery_cache[code] = []
                    recovery_cache[code].append(obj_key)
    except Exception as e:
        print(f"Lỗi khi đọc bucket receipt: {e}")

    final_receipt_keys = set()
    migrated_count = 0
    migrated_cache = {} # Cache old key -> {new_key, new_url}

    print("\nĐang quét và chuẩn hóa các biên lai...")
    # 2. Migrate receipts
    for inv in invitations:
        updated = False
        
        def process_receipt_url(url):
            nonlocal updated, migrated_count
            if not url: return url

            key_in_media = get_key_from_url(url, settings.R2_PUBLIC_URL_MEDIA)
            key_in_receipt = get_key_from_url(url, settings.R2_PUBLIC_URL_RECEIPT)
            current_key = key_in_media or key_in_receipt
            
            if not current_key:
                return url # URL ngoài hệ thống (local, http...)
                
            # Tránh xử lý trùng lặp 1 file ảnh
            if current_key in migrated_cache:
                updated = True
                final_receipt_keys.add(migrated_cache[current_key]['new_key'])
                return migrated_cache[current_key]['new_url']
            
            # Tạo tên mới chuẩn format (Không dấu)
            ext = os.path.splitext(current_key)[1].lower()
            if not ext: ext = ".webp"
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            raw_name = inv.attendee_name if inv.attendee_name else ""
            safe_name_str = remove_accents(raw_name)
            safe_orig_name = re.sub(r'[^a-zA-Z0-9_-]', '_', f"{safe_name_str}_{inv.code}") if safe_name_str else inv.code
            tiny_uuid = uuid.uuid4().hex[:4]
            
            new_key = f"{timestamp}_{safe_orig_name}_{tiny_uuid}{ext}"
            new_url = f"{settings.R2_PUBLIC_URL_RECEIPT}/{new_key}"
            
            source_bucket = settings.R2_BUCKET_MEDIA if key_in_media else settings.R2_BUCKET_RECEIPT
            
            try:
                # Tiến hành copy (đổi tên) vào bucket receipt
                s3.copy_object(
                    Bucket=settings.R2_BUCKET_RECEIPT,
                    Key=new_key,
                    CopySource={'Bucket': source_bucket, 'Key': current_key}
                )
                print(f"  + Đã chuẩn hóa: {current_key} -> {new_key}")
                migrated_cache[current_key] = {'new_key': new_key, 'new_url': new_url}
                final_receipt_keys.add(new_key)
                migrated_count += 1
                updated = True
                return new_url
            except Exception as e:
                if "NoSuchKey" in str(e):
                    # Khôi phục từ bucket receipt
                    if inv.code in recovery_cache and len(recovery_cache[inv.code]) > 0:
                        src_key = recovery_cache[inv.code].pop(0)
                        print(f"  * KHÔI PHỤC file bị mất từ: {src_key} -> {new_key}")
                        s3.copy_object(
                            Bucket=settings.R2_BUCKET_RECEIPT,
                            Key=new_key,
                            CopySource={'Bucket': settings.R2_BUCKET_RECEIPT, 'Key': src_key}
                        )
                        migrated_cache[current_key] = {'new_key': new_key, 'new_url': new_url}
                        final_receipt_keys.add(new_key)
                        migrated_count += 1
                        updated = True
                        return new_url
                print(f"  - Lỗi khi copy {current_key}: {e}")
                return url

        # Check main receipt
        if inv.receipt_url:
            inv.receipt_url = process_receipt_url(inv.receipt_url)
            
        # Check attempts
        if inv.receipt_attempts:
            new_attempts = copy.deepcopy(inv.receipt_attempts)
            for attempt in new_attempts:
                if 'url' in attempt:
                    attempt['url'] = process_receipt_url(attempt['url'])
            inv.receipt_attempts = new_attempts
            flag_modified(inv, "receipt_attempts")

        if updated:
            db.commit()

    print(f"✅ Đã chuẩn hóa {migrated_count} ảnh biên lai.")

    # ==========================================
    # 3. QUÉT RÁC TRÊN TOÀN BỘ 2 BUCKET
    # ==========================================
    print("\nĐang quét rác trên BUCKET RECEIPTS...")
    deleted_receipt_garbage = 0
    try:
        for page in paginator.paginate(Bucket=settings.R2_BUCKET_RECEIPT):
            if 'Contents' not in page: continue
            for obj in page['Contents']:
                key = obj['Key']
                # Nếu file trong bucket receipt không có mặt trong final_receipt_keys -> là Rác (ảnh lỗi font cũ, ảnh trùng lặp cũ)
                if key not in final_receipt_keys:
                    s3.delete_object(Bucket=settings.R2_BUCKET_RECEIPT, Key=key)
                    deleted_receipt_garbage += 1
                    print(f"  - Xóa file rác trong receipts: {key}")
    except Exception as e:
        print(f"Lỗi khi dọn bucket receipt: {e}")

    print("\nĐang quét rác trên BUCKET MEDIA...")
    deleted_media_garbage = 0
    kept_media = 0
    try:
        media_paginator = s3.get_paginator('list_objects_v2')
        for page in media_paginator.paginate(Bucket=settings.R2_BUCKET_MEDIA):
            if 'Contents' not in page: continue
            for obj in page['Contents']:
                key = obj['Key']
                # Xóa TẤT CẢ mọi thứ không nằm trong valid_media_keys
                if key not in valid_media_keys:
                    # Bỏ qua không xóa folder rỗng nếu có
                    if not key.endswith('/'):
                        s3.delete_object(Bucket=settings.R2_BUCKET_MEDIA, Key=key)
                        deleted_media_garbage += 1
                        print(f"  - Xóa file rác trong media: {key}")
                else:
                    kept_media += 1
    except Exception as e:
        print(f"Lỗi khi dọn bucket media: {e}")

    print(f"\n🎉 HOÀN TẤT DỌN DẸP TOÀN DIỆN 🎉")
    print(f" - Số file rác đã xóa khỏi bucket Receipts: {deleted_receipt_garbage}")
    print(f" - Số file rác đã xóa khỏi bucket Media: {deleted_media_garbage}")
    print(f" - Số biên lai hợp lệ: {len(final_receipt_keys)}")
    print(f" - Số ảnh media hợp lệ được giữ lại: {kept_media}")

if __name__ == "__main__":
    main()
