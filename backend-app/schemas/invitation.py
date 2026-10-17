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
    attendees: Optional[List[Dict[str, Any]]] = Field(default_factory=list, alias="attendees")

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
    checkinEntries: Optional[List[Dict[str, Any]]] = Field(None, alias="checkinEntries")
    shirtReceived: Optional[bool] = Field(None, alias="shirtReceived")
    memberEmail: Optional[str] = Field(None, alias="memberEmail")
    memberPhone: Optional[str] = Field(None, alias="memberPhone")
    attendees: Optional[List[Dict[str, Any]]] = Field(None, alias="attendees")
    emailSent: Optional[bool] = Field(None, alias="emailSent")
    emailSentAt: Optional[str] = Field(None, alias="emailSentAt")

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
    checkinEntries: List[Dict[str, Any]] = Field(default_factory=list, alias="checkinEntries")
    shirtReceived: bool = Field(False, alias="shirtReceived")
    shirtReceivedAt: Optional[str] = Field(None, alias="shirtReceivedAt")
    memberPhone: Optional[str] = Field(None, alias="memberPhone")
    emailSent: bool = Field(False, alias="emailSent")
    emailSentAt: Optional[str] = Field(None, alias="emailSentAt")
    createdAt: str = Field(alias="createdAt")
    updatedAt: str = Field(alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True
