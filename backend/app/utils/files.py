import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "application/pdf"}


def validate_file(file: UploadFile):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed: {ext}")
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Content type not allowed: {file.content_type}")


def get_case_upload_dir(case_id: int) -> Path:
    path = Path(settings.UPLOAD_DIR) / str(case_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_file(file: UploadFile, case_id: int) -> tuple[str, str]:
    """Returns (file_name, file_path)"""
    validate_file(file)
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 10MB.")
    ext = Path(file.filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    upload_dir = get_case_upload_dir(case_id)
    file_path = upload_dir / unique_name
    with open(file_path, "wb") as f:
        f.write(content)
    return file.filename, str(file_path)
