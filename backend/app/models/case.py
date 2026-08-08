import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.database import Base


class CaseStatus(str, enum.Enum):
    NUEVO = "NUEVO"
    PENDIENTE_REVISION = "PENDIENTE_REVISION"
    DOCUMENTOS_INCOMPLETOS = "DOCUMENTOS_INCOMPLETOS"
    EN_PROCESO = "EN_PROCESO"
    FINALIZADO = "FINALIZADO"
    CANCELADO = "CANCELADO"


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    customer_name = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(200), nullable=False)
    plate = Column(String(20), nullable=False)
    service_type = Column(String(100), nullable=False)
    status = Column(Enum(CaseStatus), default=CaseStatus.NUEVO, nullable=False)
    comments = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=True)  # set by admin, not the client
    alert_sent = Column(Boolean, default=False, nullable=False)
    last_status_update = Column(DateTime, default=datetime.utcnow, nullable=False)

    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="case", cascade="all, delete-orphan", order_by="Payment.created_at")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    document_type = Column(String(100), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("Case", back_populates="documents")


class Payment(Base):
    """An abono (partial or full payment) registered against a case."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(String(50), nullable=True)  # efectivo, transferencia, tarjeta...
    note = Column(String(255), nullable=True)
    receipt_document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("Case", back_populates="payments")
    receipt = relationship("Document")
