from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database import get_db
from app.models.site_config import Setting
from app.services.auth_service import get_current_admin

router = APIRouter(prefix="/api/config", tags=["Config"])

DEFAULT_CONFIG = {
    "school": {
        "name": "Trường THPT Nguyễn Công Trứ",
        "address": "97 Quang Trung, Phường Thông Tây Hội, Thành phố Hồ Chí Minh (Phường 8, Quận Gò Vấp cũ)",
        "phone": "(028) 38941546",
        "email": "thptnguyencongtru@hcm.edu.vn",
        "website": "thptnguyencongtru.hcm.edu.vn"
    },
    "event": {
        "name": "Lễ kỷ niệm 40 năm thành lập trường (1986 - 2026)",
        "date": "2026-11-08",
        "dateDisplay": "08/11/2026",
        "tagline": "Ngày Trở Về"
    },
    "developer": {
        "name": "CLB Tin học Nguyễn Công Trứ",
        "organization": "Đoàn Trường THPT Nguyễn Công Trứ",
        "description": "Đơn vị thực hiện website kỉ niệm 40 năm",
        "fanpage": "https://www.facebook.com/clb.Tin.nct",
        "email": "clb.tinhocnct.itc@gmail.com"
    }
}

@router.get("")
def get_site_config(db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.key == "site_config").first()
    if setting:
        return setting.value
    return DEFAULT_CONFIG

@router.post("")
def update_site_config(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    setting = db.query(Setting).filter(Setting.key == "site_config").first()
    if not setting:
        setting = Setting(key="site_config", value=payload)
        db.add(setting)
    else:
        setting.value = payload
    db.commit()
    return {"success": True, "config": setting.value}
