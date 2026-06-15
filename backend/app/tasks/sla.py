import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.case import Case, CaseStatus
from app.services.email import send_sla_alert
from app.config import settings

logger = logging.getLogger(__name__)


def check_sla():
    db: Session = SessionLocal()
    try:
        threshold = datetime.utcnow() - timedelta(minutes=settings.SLA_MINUTES)
        overdue = (
            db.query(Case)
            .filter(
                Case.status == CaseStatus.NUEVO,
                Case.created_at <= threshold,
                Case.alert_sent == False,
            )
            .all()
        )
        for case in overdue:
            elapsed = int((datetime.utcnow() - case.created_at).total_seconds() / 60)
            logger.warning("SLA breach: case #%d (%d min elapsed)", case.id, elapsed)
            send_sla_alert(case.id, case.customer_name, case.plate, elapsed)
            case.alert_sent = True
        if overdue:
            db.commit()
            logger.info("SLA check: %d alerts sent", len(overdue))
        else:
            logger.debug("SLA check: no breaches")
    except Exception as e:
        logger.error("SLA task error: %s", e)
        db.rollback()
    finally:
        db.close()
