from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://docucars:docucars@db:5432/docucars"
    BREVO_API_KEY: str = ""
    SMTP_FROM: str = "noreply@docucars.com"
    SMTP_FROM_NAME: str = "DocuCars"
    BUSINESS_EMAIL: str = ""
    UPLOAD_DIR: str = "/app/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    SLA_MINUTES: int = 60
    SLA_CHECK_INTERVAL: int = 300  # 5 minutes
    # Comma-separated allowed origins, e.g. "https://app.docucars.com,https://docucars.com"
    CORS_ORIGINS_RAW: str = "http://localhost:3000"
    ENV: str = "development"

    class Config:
        env_file = ".env"

    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS_RAW.split(",") if o.strip()]


settings = Settings()
