import logging
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case, Document, CaseStatus
from app.models.service import ServiceType
from app.schemas.case import CaseCreate, CaseOut, CaseList, CaseStatusUpdate
from app.services.email import send_new_case_business, send_confirmation_client
from app.utils.auth import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cases", tags=["cases"])


@router.post("", response_model=CaseOut, status_code=201)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    if not db.query(ServiceType).filter(ServiceType.slug == payload.service_type, ServiceType.is_active == True).first():
        raise HTTPException(status_code=400, detail="Tipo de trámite inválido")
    case = Case(**payload.model_dump())
    db.add(case)
    db.commit()
    db.refresh(case)
    logger.info("Case #%d created — %s %s", case.id, case.plate, case.service_type)
    try:
        send_new_case_business(case.id, case.customer_name, case.plate, case.service_type)
        send_confirmation_client(case.id, case.customer_name, case.email, case.service_type)
    except Exception as e:
        logger.error("Email error on case creation: %s", e)
    return case


@router.get("", response_model=List[CaseList])
def list_cases(
    skip: int = 0,
    limit: int = 100,
    status: CaseStatus = None,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    q = db.query(Case)
    if status:
        q = q.filter(Case.status == status)
    cases = q.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for c in cases:
        item = CaseList(
            id=c.id,
            created_at=c.created_at,
            customer_name=c.customer_name,
            phone=c.phone,
            email=c.email,
            plate=c.plate,
            service_type=c.service_type,
            status=c.status,
            alert_sent=c.alert_sent,
            last_status_update=c.last_status_update,
            document_count=len(c.documents),
        )
        result.append(item)
    return result


@router.get("/{case_id}", response_model=CaseOut)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/{case_id}/status", response_model=CaseOut)
def update_status(
    case_id: int,
    payload: CaseStatusUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case.status = payload.status
    case.last_status_update = datetime.utcnow()
    if payload.internal_notes:
        existing = case.internal_notes or ""
        ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
        case.internal_notes = f"{existing}\n[{ts}] {payload.internal_notes}".strip()
    db.commit()
    db.refresh(case)
    logger.info("Case #%d status -> %s", case_id, payload.status)
    return case
