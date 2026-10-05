import base64
import json
import re
from typing import Dict, Any, Optional
import httpx
from app.config import settings

SYSTEM_PROMPT = """Bạn là hệ thống OCR chuyên trích xuất thông tin từ ảnh biên lai chuyển khoản ngân hàng Việt Nam.
Nhiệm vụ: Đọc ảnh và trả về JSON với đúng 4 trường bên dưới.
Quy tắc bắt buộc:
1. "amount": Số tiền VND (chỉ ghi số nguyên, ví dụ 500000). Nếu không thấy ghi null.
2. "content": Nội dung/lời nhắn chuyển khoản (giữ nguyên chính xác, không viết hoa/thường lại).
3. "time": Thời gian giao dịch (VD: "14:30 20/09/2026").
4. "transactionId": Mã giao dịch / số tham chiếu (nếu có).
5. "transactionStatus": Trạng thái giao dịch ("success", "pending", "failed", "unknown").
6. "trustScore": Điểm tin cậy ảnh thật (0-100).

Chỉ trả về JSON thuần túy, không kèm giải thích hay markdown:
{"amount": 500000, "content": "NCT12345", "time": "20/09/2026 14:30", "transactionId": "FT123", "transactionStatus": "success", "trustScore": 95}
"""

async def extract_receipt_info(image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    provider = settings.AI_OCR_PROVIDER.lower()

    # 1. Try Ollama (if configured)
    if provider == "ollama" and settings.OLLAMA_BASE_URL:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": SYSTEM_PROMPT,
                        "images": [b64_image],
                        "stream": False,
                        "format": "json"
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    response_text = data.get("response", "")
                    parsed = parse_ocr_json(response_text)
                    parsed["provider"] = "ollama"
                    return parsed
        except Exception as e:
            print(f"[OCR] Ollama error: {e}, falling back...")

    # 2. Try OpenRouter (if API key present)
    if settings.OPENROUTER_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.OPENROUTER_MODEL,
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": SYSTEM_PROMPT},
                                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_image}"}}
                                ]
                            }
                        ],
                        "response_format": {"type": "json_object"}
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = parse_ocr_json(content)
                    parsed["provider"] = "openrouter"
                    return parsed
        except Exception as e:
            print(f"[OCR] OpenRouter error: {e}")

    # Fallback default if AI models are unavailable
    return {
        "amount": None,
        "content": None,
        "time": None,
        "transactionId": None,
        "transactionStatus": "unknown",
        "trustScore": 50,
        "rawText": "AI OCR offline/unconfigured",
        "provider": "mock"
    }

def parse_ocr_json(raw: str) -> Dict[str, Any]:
    try:
        # Match JSON block
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            return {
                "amount": int(data["amount"]) if data.get("amount") is not None else None,
                "content": str(data["content"]).strip() if data.get("content") else None,
                "time": str(data["time"]).strip() if data.get("time") else None,
                "transactionId": str(data["transactionId"]).strip() if data.get("transactionId") else None,
                "transactionStatus": data.get("transactionStatus", "unknown"),
                "trustScore": data.get("trustScore", 80),
                "rawText": raw
            }
    except Exception:
        pass
    return {
        "amount": None,
        "content": None,
        "time": None,
        "transactionId": None,
        "transactionStatus": "unknown",
        "trustScore": None,
        "rawText": raw
    }

def verify_match(ocr: Dict[str, Any], expected_amount: int, expected_code: str) -> Dict[str, Any]:
    extracted_amount = ocr.get("amount")
    extracted_content = (ocr.get("content") or "").upper()
    expected_code_upper = expected_code.upper()

    amount_match = (extracted_amount == expected_amount) if extracted_amount else False
    content_match = (expected_code_upper in extracted_content) if extracted_content else False

    if amount_match and content_match:
        confidence = "high"
        note = "Khớp cả số tiền và nội dung chuyển khoản"
    elif amount_match or content_match:
        confidence = "low"
        note = "Chỉ khớp 1 trong 2 thông tin (số tiền hoặc nội dung)"
    else:
        confidence = "mismatch"
        note = "Không khớp thông tin hoặc ảnh mờ không đọc được"

    return {
        "confidence": confidence,
        "amountMatch": amount_match,
        "contentMatch": content_match,
        "extractedAmount": extracted_amount,
        "extractedContent": ocr.get("content"),
        "extractedTime": ocr.get("time"),
        "note": note
    }
