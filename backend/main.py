import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import engine
from app.models.case import Case, Document  # noqa: F401 — ensure models registered
from app.database import Base
from app.routers import cases, files
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
    Base.metadata.create_all(bind=engine)
    scheduler.add_job(check_sla, "interval", seconds=settings.SLA_CHECK_INTERVAL, id="sla_check")
    scheduler.start()
    logger.info("SLA scheduler started — interval %ds", settings.SLA_CHECK_INTERVAL)
    yield
    scheduler.shutdown()


app = FastAPI(
    title="DocuCars API",
    description="Sistema de gestión de trámites vehiculares",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cases.router)
app.include_router(files.router)


@app.get("/health")
def health():
    return {"status": "ok"}
