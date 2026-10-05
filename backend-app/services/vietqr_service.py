from urllib.parse import urlencode
from app.config import settings

def get_vietqr_url(amount: int, add_info: str) -> str:
    bin_code = settings.PAY_BANK_BIN or "970436"
    account = settings.PAY_BANK_ACCOUNT or "2772998715"
    account_name = settings.PAY_BANK_NAME or "LAI NHAT PHONG"
    
    query = urlencode({
        "amount": str(amount),
        "addInfo": add_info,
        "accountName": account_name
    })
    return f"https://img.vietqr.io/image/{bin_code}-{account}-compact2.webp?{query}"
