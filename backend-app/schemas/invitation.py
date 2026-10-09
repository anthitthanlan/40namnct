from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class InvitationBase(BaseModel):
    memberId: str = Field(alias="memberId")
    nienKhoa: Optional[str] = Field(None, alias="nienKhoa")
    type: str = "individual"  # "individual" | "group"
    attendeeName: str = Field(alias="attendeeName")
    size: Optional[str] = None
    quantity: int = 1
    sizes: Dict[str, int] = Field(default_factory=dict)
    snacks: int = 0
    amount: int = 0
    status: str = "pending"
    note: Optional[str] = ""

    class Config:
        populate_by_name = True

class InvitationCreate(InvitationBase):
    code: Optional[str] = None

class InvitationUpdate(BaseModel):
    status: Optional[str] = None
    size: Optional[str] = None
    attendeeName: Optional[str] = Field(None, alias="attendeeName")
    nienKhoa: Optional[str] = Field(None, alias="nienKhoa")
    sizes: Optional[Dict[str, int]] = None
    snacks: Optional[int] = None
    amount: Optional[int] = None
    note: Optional[str] = None
    checkedIn: Optional[bool] = Field(None, alias="checkedIn")
    shirtReceived: Optional[bool] = Field(None, alias="shirtReceived")
    memberEmail: Optional[str] = Field(None, alias="memberEmail")

    class Config:
        populate_by_name = True

class InvitationResponse(InvitationBase):
    id: str
    code: str
    paymentClaimedAt: Optional[str] = Field(None, alias="paymentClaimedAt")
    receiptUrl: Optional[str] = Field(None, alias="receiptUrl")
    ocrResult: Optional[Dict[str, Any]] = Field(None, alias="ocrResult")
    receiptAttempts: Optional[List[Dict[str, Any]]] = Field(default_factory=list, alias="receiptAttempts")
    lastSessionId: Optional[str] = Field(None, alias="lastSessionId")
    checkedIn: bool = Field(False, alias="checkedIn")
    checkedInAt: Optional[str] = Field(None, alias="checkedInAt")
    shirtReceived: bool = Field(False, alias="shirtReceived")
    shirtReceivedAt: Optional[str] = Field(None, alias="shirtReceivedAt")
    createdAt: str = Field(alias="createdAt")
    updatedAt: str = Field(alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True
