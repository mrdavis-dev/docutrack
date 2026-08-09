import logging
import mimetypes
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.settings import AppSettings
from app.models.user import User
from app.schemas.settings import SettingsOut, SettingsColorUpdate, SettingsTitleUpdate
from app.utils.files import save_logo
from app.utils.auth import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["settings"])


def _get_or_create(db: Session) -> AppSettings:
    row = db.query(AppSettings).filter(AppSettings.id == 1).first()
    if not row:
        row = AppSettings(id=1)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _to_out(row: AppSettings) -> SettingsOut:
    return SettingsOut(
        brand_color=row.brand_color,
        logo_url="/settings/logo" if row.logo_path else None,
        portal_title=row.portal_title,
        portal_subtitle=row.portal_subtitle,
    )


@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    """Public — the client portal needs branding too, no auth required."""
    return _to_out(_get_or_create(db))


@router.get("/logo")
def get_logo(db: Session = Depends(get_db)):
    """Public — served inline so it can be used directly as an <img src>."""
    row = _get_or_create(db)
    if not row.logo_path:
        raise HTTPException(status_code=404, detail="No logo set")
    path = Path(row.logo_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Logo file not found on disk")
    media_type, _ = mimetypes.guess_type(str(path))
    return FileResponse(path=str(path), media_type=media_type or "application/octet-stream", content_disposition_type="inline")


@router.put("/color", response_model=SettingsOut)
def update_color(payload: SettingsColorUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = _get_or_create(db)
    row.brand_color = payload.brand_color
    db.commit()
    db.refresh(row)
    logger.info("Brand color updated -> %s", row.brand_color)
    return _to_out(row)


@router.put("/title", response_model=SettingsOut)
def update_title(payload: SettingsTitleUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = _get_or_create(db)
    row.portal_title = payload.portal_title
    row.portal_subtitle = payload.portal_subtitle.strip() if payload.portal_subtitle else None
    db.commit()
    db.refresh(row)
    logger.info("Portal title updated -> %s", row.portal_title)
    return _to_out(row)


@router.put("/logo", response_model=SettingsOut)
async def update_logo(logo: UploadFile = File(...), db: Session = Depends(get_db), _: User = Depends(require_admin)):
    row = _get_or_create(db)
    old_path = row.logo_path
    original_name, file_path = await save_logo(logo)
    row.logo_path = file_path
    row.logo_file_name = original_name
    db.commit()
    db.refresh(row)
    if old_path and old_path != file_path:
        Path(old_path).unlink(missing_ok=True)  # replaced — don't leak the old file forever
    logger.info("Logo updated -> %s", original_name)
    return _to_out(row)
