from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator
from app.models.case import CaseStatus


class DocumentOut(BaseModel):
    id: int
    case_id: int
    document_type: str
    file_name: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class CaseCreate(BaseModel):
    customer_name: str
    phone: str
    email: EmailStr
    plate: str
    service_type: str  # slug del trámite
    comments: Optional[str] = None

    @field_validator("customer_name", "phone", "plate")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()

    @field_validator("plate")
    @classmethod
    def normalize_plate(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator("service_type")
    @classmethod
    def service_type_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("service_type requerido")
        return v.strip()


class CaseStatusUpdate(BaseModel):
    status: CaseStatus
    internal_notes: Optional[str] = None


class CaseTotalUpdate(BaseModel):
    total_amount: Decimal

    @field_validator("total_amount")
    @classmethod
    def positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El total debe ser mayor a 0")
        return v


class PaymentOut(BaseModel):
    id: int
    case_id: int
    amount: Decimal
    method: Optional[str]
    note: Optional[str]
    receipt_document_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class CaseOut(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime
    customer_name: str
    phone: str
    email: str
    plate: str
    service_type: str
    status: CaseStatus
    comments: Optional[str]
    internal_notes: Optional[str]
    total_amount: Optional[Decimal]
    alert_sent: bool
    last_status_update: datetime
    documents: List[DocumentOut] = []
    payments: List[PaymentOut] = []

    class Config:
        from_attributes = True


class CaseList(BaseModel):
    id: int
    created_at: datetime
    customer_name: str
    phone: str
    email: str
    plate: str
    service_type: str
    status: CaseStatus
    alert_sent: bool
    last_status_update: datetime
    document_count: int = 0

    class Config:
        from_attributes = True
