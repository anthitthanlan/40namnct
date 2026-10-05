from pydantic import BaseModel
from typing import Optional, Literal

class OcrVerifyRequest(BaseModel):
    invitationId: str
    expectedAmount: int
    expectedCode: str

class OcrRawResultSchema(BaseModel):
    amount: Optional[int] = None
    content: Optional[str] = None
    time: Optional[str] = None
    transactionId: Optional[str] = None
    transactionStatus: Literal["success", "pending", "failed", "unknown"] = "unknown"
    trustScore: Optional[int] = None
    rawText: Optional[str] = ""
    provider: str = "mock"

class MatchResultSchema(BaseModel):
    confidence: Literal["high", "low", "mismatch", "system_error"] = "low"
    amountMatch: bool = False
    contentMatch: bool = False
    extractedAmount: Optional[int] = None
    extractedContent: Optional[str] = None
    extractedTime: Optional[str] = None
    note: str = ""

class ReceiptVerifyResponse(BaseModel):
    ocrResult: OcrRawResultSchema
    matchResult: MatchResultSchema
    receiptUrl: str
