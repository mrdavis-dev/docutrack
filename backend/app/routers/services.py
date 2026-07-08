from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.service import ServiceType, ServiceField
from app.schemas.service import (
    ServiceTypeCreate, ServiceTypeUpdate, ServiceTypeOut,
    ServiceFieldCreate, ServiceFieldUpdate, ServiceFieldOut,
)
from app.utils.auth import require_admin

router = APIRouter(tags=["services"])


@router.get("/service-types", response_model=List[ServiceTypeOut])
def list_service_types(include_inactive: bool = False, db: Session = Depends(get_db)):
    q = db.query(ServiceType)
    if not include_inactive:
        q = q.filter(ServiceType.is_active == True)
    return q.order_by(ServiceType.id).all()


@router.post("/service-types", response_model=ServiceTypeOut, status_code=201)
def create_service_type(
    payload: ServiceTypeCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    if db.query(ServiceType).filter(ServiceType.slug == payload.slug).first():
        raise HTTPException(400, "Slug ya existe")
    st = ServiceType(**payload.model_dump())
    db.add(st)
    db.commit()
    db.refresh(st)
    return st


@router.patch("/service-types/{st_id}", response_model=ServiceTypeOut)
def update_service_type(
    st_id: int,
    payload: ServiceTypeUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    st = db.query(ServiceType).filter(ServiceType.id == st_id).first()
    if not st:
        raise HTTPException(404, "Trámite no encontrado")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(st, k, v)
    db.commit()
    db.refresh(st)
    return st


@router.delete("/service-types/{st_id}", status_code=204)
def delete_service_type(
    st_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    st = db.query(ServiceType).filter(ServiceType.id == st_id).first()
    if not st:
        raise HTTPException(404, "Trámite no encontrado")
    # ponytail: soft-delete only; hard delete would break case history
    st.is_active = False
    db.commit()


# ── Fields ────────────────────────────────────────────────────────────────────

@router.get("/service-types/{st_id}/fields", response_model=List[ServiceFieldOut])
def list_fields(st_id: int, db: Session = Depends(get_db)):
    return db.query(ServiceField).filter(ServiceField.service_type_id == st_id).order_by(ServiceField.sort_order).all()


@router.post("/service-types/{st_id}/fields", response_model=ServiceFieldOut, status_code=201)
def create_field(
    st_id: int,
    payload: ServiceFieldCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    if not db.query(ServiceType).filter(ServiceType.id == st_id).first():
        raise HTTPException(404, "Trámite no encontrado")
    sf = ServiceField(service_type_id=st_id, **payload.model_dump())
    db.add(sf)
    db.commit()
    db.refresh(sf)
    return sf


@router.patch("/service-fields/{field_id}", response_model=ServiceFieldOut)
def update_field(
    field_id: int,
    payload: ServiceFieldUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    sf = db.query(ServiceField).filter(ServiceField.id == field_id).first()
    if not sf:
        raise HTTPException(404, "Campo no encontrado")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(sf, k, v)
    db.commit()
    db.refresh(sf)
    return sf


@router.delete("/service-fields/{field_id}", status_code=204)
def delete_field(
    field_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    sf = db.query(ServiceField).filter(ServiceField.id == field_id).first()
    if not sf:
        raise HTTPException(404, "Campo no encontrado")
    db.delete(sf)
    db.commit()
