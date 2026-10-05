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

async def save_uploaded_file(file: UploadFile, subfolder: str = "media") -> dict:
    original_filename = file.filename or "file.bin"
    ext = os.path.splitext(original_filename)[1].lower()
    if not ext:
        ext = ".jpg"

    safe_name = f"{uuid.uuid4().hex}{ext}"
    content = await file.read()
    
    s3 = get_s3_client()
    if s3 and settings.R2_BUCKET_MEDIA:
        # Upload to R2
        s3.put_object(
            Bucket=settings.R2_BUCKET_MEDIA,
            Key=safe_name,
            Body=content,
            ContentType=file.content_type or "application/octet-stream"
        )
        web_url = f"{settings.R2_PUBLIC_URL_MEDIA}/{safe_name}"
        file_path = f"r2://{settings.R2_BUCKET_MEDIA}/{safe_name}"
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
        "content_type": file.content_type,
    }
