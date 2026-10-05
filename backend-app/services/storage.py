import os
import uuid
import boto3
from fastapi import UploadFile
from app.config import settings

def ensure_upload_dirs():
    base_dir = os.path.abspath(settings.UPLOAD_DIR)
    os.makedirs(os.path.join(base_dir, "receipts"), exist_ok=True)
    os.makedirs(os.path.join(base_dir, "media"), exist_ok=True)
    os.makedirs(os.path.join(base_dir, "posts"), exist_ok=True)
    return base_dir

def get_s3_client():
    if not settings.R2_ACCOUNT_ID:
        return None
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )

async def save_uploaded_file(file: UploadFile, subfolder: str = "media", custom_name: str = None, bucket_folder: str = "") -> dict:
    original_filename = file.filename or "file.bin"
    ext = os.path.splitext(original_filename)[1].lower()
    if not ext:
        ext = ".jpg"

    content = await file.read()

    # Convert to WebP if it's an image
    content_type = file.content_type or "application/octet-stream"
    if content_type.startswith("image/") and ext not in [".webp", ".gif"]:
        try:
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(content))
            # Convert RGBA to RGB if necessary for WebP saving
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            out_io = io.BytesIO()
            img.save(out_io, format="WEBP", quality=85)
            content = out_io.getvalue()
            ext = ".webp"
            content_type = "image/webp"
        except Exception as e:
            print(f"Error converting to WebP: {e}")

    import re
    from datetime import datetime
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if custom_name:
        safe_orig_name = custom_name
    else:
        safe_orig_name = re.sub(r'[^a-zA-Z0-9_-]', '_', os.path.splitext(original_filename)[0])[:40]
        
    short_uuid = uuid.uuid4().hex[:6] if not custom_name else ""
    # if custom_name is provided, we don't need short_uuid, or we can keep a tiny 4-char one just in case of parallel uploads
    tiny_uuid = uuid.uuid4().hex[:4]
    
    if custom_name:
        safe_name = f"{timestamp}_{safe_orig_name}_{tiny_uuid}{ext}"
    else:
        safe_name = f"{timestamp}_{safe_orig_name}_{short_uuid}{ext}"
    
    s3 = get_s3_client()
    if s3 and settings.R2_BUCKET_MEDIA:
        import asyncio
        
        target_bucket = settings.R2_BUCKET_RECEIPT if subfolder == "receipts" and settings.R2_BUCKET_RECEIPT else settings.R2_BUCKET_MEDIA
        public_url_base = settings.R2_PUBLIC_URL_RECEIPT if subfolder == "receipts" and settings.R2_PUBLIC_URL_RECEIPT else settings.R2_PUBLIC_URL_MEDIA
        
        key = f"{bucket_folder.strip('/')}/{safe_name}" if bucket_folder else safe_name
        
        # Upload to R2 (non-blocking)
        await asyncio.to_thread(
            s3.put_object,
            Bucket=target_bucket,
            Key=key,
            Body=content,
            ContentType=content_type
        )
        web_url = f"{public_url_base}/{key}" if public_url_base else ""
        file_path = f"r2://{target_bucket}/{key}"
    else:
        # Fallback to local
        base_dir = os.path.abspath(settings.UPLOAD_DIR)
        target_folder = os.path.join(base_dir, subfolder)
        os.makedirs(target_folder, exist_ok=True)
        file_path = os.path.join(target_folder, safe_name)
        
        with open(file_path, "wb") as f:
            f.write(content)
        web_url = f"{settings.BASE_URL}/uploads/{subfolder}/{safe_name}"

    return {
        "filename": safe_name,
        "original_name": original_filename,
        "path": file_path,
        "url": web_url,
        "size": len(content),
        "content_type": content_type,
    }

async def delete_uploaded_file(url: str, subfolder: str = "media"):
    if not url: return False
    
    s3 = get_s3_client()
    if s3 and settings.R2_BUCKET_MEDIA:
        target_bucket = settings.R2_BUCKET_RECEIPT if subfolder == "receipts" and settings.R2_BUCKET_RECEIPT else settings.R2_BUCKET_MEDIA
        public_url_base = settings.R2_PUBLIC_URL_RECEIPT if subfolder == "receipts" and settings.R2_PUBLIC_URL_RECEIPT else settings.R2_PUBLIC_URL_MEDIA
        
        if url.startswith(public_url_base):
            key = url[len(public_url_base):].lstrip("/")
            import asyncio
            try:
                await asyncio.to_thread(
                    s3.delete_object,
                    Bucket=target_bucket,
                    Key=key
                )
                return True
            except Exception as e:
                print(f"Lỗi khi xóa file {key}: {e}")
                return False
    return False
