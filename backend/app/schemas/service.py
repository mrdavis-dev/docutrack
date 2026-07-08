from typing import List, Optional
from pydantic import BaseModel


class ServiceFieldCreate(BaseModel):
    label: str
    field_key: str
    field_type: str  # "file" | "text"
    is_required: bool = True
    sort_order: int = 0


class ServiceFieldOut(ServiceFieldCreate):
    id: int
    service_type_id: int

    class Config:
        from_attributes = True


class ServiceFieldUpdate(BaseModel):
    label: Optional[str] = None
    field_key: Optional[str] = None
    field_type: Optional[str] = None
    is_required: Optional[bool] = None
    sort_order: Optional[int] = None


class ServiceTypeCreate(BaseModel):
    name: str
    slug: str


class ServiceTypeUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceTypeOut(BaseModel):
    id: int
    name: str
    slug: str
    is_active: bool
    fields: List[ServiceFieldOut] = []

    class Config:
        from_attributes = True
