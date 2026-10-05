import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    SECRET_KEY: str = "supersecretjwtkey_change_in_production_123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    SUPER_ADMIN_USERNAME: str = "admin"
    SUPER_ADMIN_PASSWORD: str = "admin123456_change_me"
    
    UPLOAD_DIR: str = "./uploads"
    BASE_URL: str = "http://localhost:8000"
    
    # Cloudflare R2
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_MEDIA: str = "40th-anniversary-media"
    R2_PUBLIC_URL_MEDIA: str = "https://media-r2.nct40.poln.id.vn"
    R2_BUCKET_RECEIPT: str = "40th-anniversary-receipts"
    R2_PUBLIC_URL_RECEIPT: str = ""
    
    # Resend Email
    RESEND_API_KEY: str = ""
    
    # Banking
    PAY_BANK_BIN: str = "970422"
    PAY_BANK_ACCOUNT: str = "123456789"
    PAY_BANK_NAME: str = "DOAN TRUONG THPT NGUYEN CONG TRU"
    PAY_BANK_SHORT: str = "MBBank"
    
    # OCR
    AI_OCR_PROVIDER: str = "ollama"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2-vision:11b"
    OLLAMA_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "google/gemma-4-26b-a4b-it"
    OPENROUTER_API_KEY: str = ""
    LMSTUDIO_BASE_URL: str = "http://localhost:1234/v1"
    LMSTUDIO_MODEL: str = "local-model"

    @property
    def cors_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="allow"
    )

settings = Settings()
