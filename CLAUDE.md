# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

DocuCars — vehicle registration case management MVP. Clients submit service requests with documents; admins review and update case status. Background SLA checker sends email alerts for stale cases.

## Commands

### Full Stack (Docker)
```bash
docker compose up --build          # Start all services (postgres, backend, frontend)
docker compose logs -f backend     # Stream backend logs
```

### Database Migrations
```bash
docker compose exec backend alembic upgrade head
docker compose exec backend alembic revision --autogenerate -m "description"
```

### Frontend Dev (port 3000, proxies /api to backend)
```bash
cd frontend && npm run dev
npm run build
```

### Backend Dev (standalone)
```bash
cd backend && uvicorn main:app --reload
```

No test suite exists yet.

## Architecture

### Services (Docker Compose)
- **postgres** — PostgreSQL 16, persistent volume `postgres_data`
- **backend** — FastAPI on port 8000; runs `alembic upgrade head` on startup
- **frontend** — Vite build served by Nginx on port 3000; proxies `/api/*` → backend

### Backend (`backend/`)
- `main.py` — app entry, CORS, lifespan (DB init + APScheduler startup)
- `app/models/case.py` — SQLAlchemy models: `Case`, `Document`, `CaseStatus` enum, `ServiceType` enum
- `app/routers/cases.py` — case CRUD; admin endpoints require HTTP Basic Auth
- `app/routers/files.py` — file upload (POST `/upload`) and download (GET `/files/{document_id}`)
- `app/tasks/sla.py` — APScheduler job every 300s; alerts on NUEVO cases older than SLA_MINUTES
- `app/services/email.py` — Brevo transactional email templates
- `app/utils/auth.py` — HTTP Basic Auth dependency (admin only)

**Case lifecycle:** `NUEVO → PENDIENTE_REVISION → EN_PROCESO → FINALIZADO` (also `DOCUMENTOS_INCOMPLETOS`, `CANCELADO`)

Client endpoints (case creation, file upload) have no auth. All admin endpoints require Basic Auth.

### Frontend (`frontend/src/`)
- `App.jsx` — routes: `/` (ClientPortal), `/admin` (AdminDashboard), `/admin/cases/:id` (CaseDetail)
- `services/api.js` — Axios instance; all API calls centralized here
- `pages/` — three pages mirroring the routes above
- `components/` — FileUpload (4-doc uploader), StatusBadge, TimeElapsed

TailwindCSS uses a custom `brand` color palette defined in `tailwind.config.js`.

## Configuration

Backend reads from `backend/.env` (see `backend/.env.example`):
```
DATABASE_URL          # postgres connection
BREVO_API_KEY         # email service
BUSINESS_EMAIL        # SLA alert recipient
ADMIN_USERNAME / ADMIN_PASSWORD   # dashboard credentials (default: admin/admin123)
UPLOAD_DIR            # file storage (default /app/uploads)
SLA_MINUTES           # alert threshold (default 60)
SLA_CHECK_INTERVAL    # background job interval seconds (default 300)
```

Files stored in Docker volume `uploads_data` mounted at `UPLOAD_DIR`.
