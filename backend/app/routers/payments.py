import base64
import logging
from pathlib import Path
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case, Document, Payment
from app.schemas.case import PaymentOut
from app.utils.files import save_file
from app.utils.auth import require_admin
from app.services.email import send_payment_receipt

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cases/{case_id}/payments", tags=["payments"])


@router.get("", response_model=List[PaymentOut])
def list_payments(case_id: int, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    if not db.query(Case).filter(Case.id == case_id).first():
        raise HTTPException(status_code=404, detail="Case not found")
    return db.query(Payment).filter(Payment.case_id == case_id).order_by(Payment.created_at).all()


@router.post("", response_model=PaymentOut, status_code=201)
async def create_payment(
    case_id: int,
    amount: Decimal = Form(...),
    method: Optional[str] = Form(None),
    note: Optional[str] = Form(None),
    receipt: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")
    if case.total_amount is not None:
        paid_so_far = sum((p.amount for p in case.payments), Decimal("0"))
        remaining = case.total_amount - paid_so_far
        if amount > remaining:
            raise HTTPException(status_code=400, detail=f"El abono excede el saldo pendiente (${remaining})")

    receipt_doc_id = None
    if receipt is not None:
        original_name, file_path = await save_file(receipt, case_id)
        doc = Document(case_id=case_id, document_type="comprobante_pago", file_name=original_name, file_path=file_path)
        db.add(doc)
        db.flush()  # get doc.id without a second round trip
        receipt_doc_id = doc.id

    payment = Payment(case_id=case_id, amount=amount, method=method, note=note, receipt_document_id=receipt_doc_id)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    logger.info("Payment #%d registered for case #%d — %s", payment.id, case_id, amount)
    return payment


@router.post("/{payment_id}/send-receipt")
def send_receipt_email(case_id: int, payment_id: int, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    payment = db.query(Payment).filter(Payment.id == payment_id, Payment.case_id == case_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if not payment.receipt_document_id:
        raise HTTPException(status_code=400, detail="Este abono no tiene comprobante adjunto")

    doc = db.query(Document).filter(Document.id == payment.receipt_document_id).first()
    path = Path(doc.file_path) if doc else None
    if not doc or not path.exists():
        raise HTTPException(status_code=404, detail="Comprobante no encontrado en disco")

    case = db.query(Case).filter(Case.id == case_id).first()
    content_b64 = base64.b64encode(path.read_bytes()).decode()
    sent = send_payment_receipt(case_id, case.customer_name, case.email, payment.amount, doc.file_name, content_b64)
    if not sent:
        raise HTTPException(status_code=502, detail="No se pudo enviar el correo (revisa BREVO_API_KEY)")
    return {"status": "sent"}
