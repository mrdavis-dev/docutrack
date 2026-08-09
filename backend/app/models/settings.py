from sqlalchemy import Column, Integer, String
from app.database import Base


class AppSettings(Base):
    """Single-row table (id is always 1) holding admin-editable branding.
    Read publicly (client portal needs it too); written admin-only."""
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, default=1)
    brand_color = Column(String(7), nullable=True)  # "#RRGGBB", falls back to the built-in default
    logo_path = Column(String(500), nullable=True)  # server-side file path, like Document.file_path
    logo_file_name = Column(String(255), nullable=True)
    portal_title = Column(String(100), nullable=True)  # shown on the client portal header, falls back to "Docutrack"
    portal_subtitle = Column(String(200), nullable=True)
