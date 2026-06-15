from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://docucars:docucars@db:5432/docucars"
    BREVO_API_KEY: str = ""
    SMTP_FROM: str = "noreply@docucars.com"
    SMTP_FROM_NAME: str = "DocuCars"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    BUSINESS_EMAIL: str = ""
    UPLOAD_DIR: str = "/app/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    SLA_MINUTES: int = 60
    SLA_CHECK_INTERVAL: int = 300  # 5 minutes

    class Config:
        env_file = ".env"


settings = Settings()
