import logging
import mimetypes
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case, Document
from app.schemas.case import DocumentOut
from app.utils.files import save_file
from app.utils.auth import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(tags=["files"])

REQUIRED_DOC_TYPES = [
    "foto_frontal",
    "foto_lateral",
    "registro_unico",
    "poliza",
]


@router.post("/upload", response_model=List[DocumentOut], status_code=201)
async def upload_files(
    case_id: int = Form(...),
    document_types: List[str] = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if len(files) != len(document_types):
        raise HTTPException(status_code=400, detail="files and document_types count mismatch")

    saved = []
    for file, doc_type in zip(files, document_types):
        if doc_type not in REQUIRED_DOC_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid document_type: {doc_type}")
        original_name, file_path = await save_file(file, case_id)
        doc = Document(
            case_id=case_id,
            document_type=doc_type,
            file_name=original_name,
            file_path=file_path,
        )
        db.add(doc)
        saved.append(doc)

    db.commit()
    for d in saved:
        db.refresh(d)
    logger.info("Uploaded %d files for case #%d", len(saved), case_id)
    return saved


@router.get("/files/{document_id}")
def download_file(
    document_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    path = Path(doc.file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    media_type, _ = mimetypes.guess_type(str(path))
    return FileResponse(
        path=str(path),
        media_type=media_type or "application/octet-stream",
        filename=doc.file_name,
        content_disposition_type="inline",  # let the frontend decide view vs download; attachment forces a browser download prompt
    )
