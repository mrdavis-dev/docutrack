import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from app.models.case import Case, Document  # noqa: F401 — ensure models registered
from app.models.service import ServiceType, ServiceField  # noqa: F401
from app.models.user import User, Session  # noqa: F401
from app.models.settings import AppSettings  # noqa: F401
from app.routers import cases, files, payments, auth, settings as settings_router
from app.routers import services
from app.tasks.sla import check_sla
from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ponytail: schema is owned by alembic (run before uvicorn starts, see docker-compose command).
    # create_all here would mask a failed/drifted migration.
    scheduler.add_job(check_sla, "interval", seconds=settings.SLA_CHECK_INTERVAL, id="sla_check")
    scheduler.start()
    logger.info("SLA scheduler started — interval %ds", settings.SLA_CHECK_INTERVAL)
    yield
    scheduler.shutdown()


app = FastAPI(
    title="Docutrack API",
    description="Sistema de gestión de trámites vehiculares",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(files.router)
app.include_router(services.router)
app.include_router(payments.router)
app.include_router(settings_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
