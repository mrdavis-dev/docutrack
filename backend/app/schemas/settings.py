import re
from typing import Optional
from pydantic import BaseModel, field_validator

HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class SettingsOut(BaseModel):
    brand_color: Optional[str]
    logo_url: Optional[str]  # derived — GET /settings/logo, not the raw file path
    portal_title: Optional[str]
    portal_subtitle: Optional[str]

    class Config:
        from_attributes = True


class SettingsColorUpdate(BaseModel):
    brand_color: str

    @field_validator("brand_color")
    @classmethod
    def valid_hex(cls, v: str) -> str:
        if not HEX_RE.match(v):
            raise ValueError("brand_color debe ser un hex de 6 dígitos, ej. #2563EB")
        return v.upper()


class SettingsTitleUpdate(BaseModel):
    portal_title: str
    portal_subtitle: Optional[str] = None

    @field_validator("portal_title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El título no puede estar vacío")
        return v
