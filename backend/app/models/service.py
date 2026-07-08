from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ServiceType(Base):
    __tablename__ = "service_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    fields = relationship("ServiceField", back_populates="service_type", cascade="all, delete-orphan", order_by="ServiceField.sort_order")


class ServiceField(Base):
    __tablename__ = "service_fields"

    id = Column(Integer, primary_key=True, index=True)
    service_type_id = Column(Integer, ForeignKey("service_types.id"), nullable=False)
    label = Column(String(200), nullable=False)
    field_key = Column(String(100), nullable=False)
    field_type = Column(String(20), nullable=False)  # "file" | "text"
    is_required = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    service_type = relationship("ServiceType", back_populates="fields")
