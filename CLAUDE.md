# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Docutrack — vehicle registration case management app. Clients submit service requests with documents; admins review, update case status, track payments/abonos, and send payment receipts by email. Background SLA checker sends email alerts for stale cases.

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
- **backend** — FastAPI on port 8000; runs `alembic upgrade head` on startup, then uvicorn; has a healthcheck hitting `/health`
- **frontend** — Vite build served by Nginx on port 3000; proxies `/api/*` → backend; waits on backend's healthcheck

### Auth — DB-backed, not hardcoded
Admin accounts live entirely in the `users` table (bcrypt password hashes) with server-side `sessions` (opaque token, revocable, TTL 12h). There are no hardcoded or `.env`-configured admin credentials read at runtime.

- `app/models/user.py` — `User`, `Session` models
- `app/utils/auth.py` — `require_admin` dependency validates the `Authorization: Bearer <token>` header against the `sessions` table on every request (checks `revoked_at` and `expires_at`); `hash_password`/`verify_password` (bcrypt)
- `app/routers/auth.py` — `POST /auth/login`, `POST /auth/logout` (revokes the session — this is the real logout, not just clearing client state), `GET/POST /users`, `PATCH /users/{id}/deactivate` (also revokes that user's active sessions immediately)
- First admin account is created once by migration `0005_users_sessions.py`, seeded from `SEED_ADMIN_USERNAME`/`SEED_ADMIN_PASSWORD` env vars (only read at migration time, never by the app). Every account after that is created via `POST /users`.
- Frontend (`services/api.js`): `login()`/`logout()` store only the bearer token in `sessionStorage`; a response interceptor clears it on any 401. `RequireAdmin` in `App.jsx` re-checks auth on the browser's `pageshow` event (not just on mount) so a bfcache-restored page after logout re-validates instead of silently allowing stale access — the actual invalidation, though, is the revoked session on the server; the client-side check is only UX.

### Backend (`backend/`)
- `main.py` — app entry, CORS (origins from `CORS_ORIGINS_RAW` env, comma-separated), lifespan (APScheduler startup). Schema is owned by Alembic, not `create_all`.
- `app/models/case.py` — `Case` (includes `total_amount`, set by admin only — never by the client), `Document`, `Payment` (abonos, optionally linked to a receipt `Document`), `CaseStatus` enum
- `app/models/service.py` — `ServiceType`/`ServiceField`: trámite types are DB-driven and admin-configurable (not a hardcoded enum), each with dynamic required fields
- `app/models/user.py` — `User`, `Session` (see Auth above)
- `app/routers/cases.py` — case CRUD; `GET /cases` supports `status` filter and `q` (searches customer name/phone via `ILIKE`); `PATCH /cases/{id}/total` sets the trámite total (admin-only)
- `app/routers/payments.py` — abonos: create (with optional receipt upload, validated against remaining balance if `total_amount` is set), list, `POST .../send-receipt` emails the receipt as an attachment
- `app/routers/files.py` — file upload (POST `/upload`) and download/view (GET `/files/{document_id}`, served `inline` so the frontend can preview instead of forcing a browser download)
- `app/routers/auth.py` — see Auth above
- `app/tasks/sla.py` — APScheduler job every `SLA_CHECK_INTERVAL`s; alerts on `NUEVO` cases older than `SLA_MINUTES`
- `app/services/email.py` — Brevo transactional email templates, supports attachments (used for payment receipts)
- All admin endpoints require `Authorization: Bearer <token>` via `require_admin`

**Case lifecycle:** `NUEVO → PENDIENTE_REVISION → EN_PROCESO → FINALIZADO` (also `DOCUMENTOS_INCOMPLETOS`, `CANCELADO`)

Client endpoints (case creation, file upload) have no auth. All admin endpoints require a valid session.

### Frontend (`frontend/src/`)
- `App.jsx` — routes: `/` (ClientPortal), `/admin` (AdminDashboard), `/admin/cases/:id` (CaseDetail), `/admin/services` (ServiceTypeManager), `/admin/users` (UserManager). All admin routes except `/admin` itself are wrapped in `RequireAdmin`.
- `services/api.js` — Axios instance; all API calls centralized here; owns token storage/auth state and the blob-fetch helper (`fetchFileBlob`) used for authenticated document viewing (a plain `<a href>` can't carry the bearer token)
- `pages/` — ClientPortal, AdminDashboard, CaseDetail, ServiceTypeManager, UserManager
- `components/` — FileUpload (multi-doc uploader driven by the trámite's dynamic fields), StatusBadge, TimeElapsed

TailwindCSS uses a custom `brand` color palette defined in `tailwind.config.js`.

## Configuration

Backend reads from `backend/.env` (see `backend/.env.example`):
```
DATABASE_URL          # postgres connection
BREVO_API_KEY         # email service
BUSINESS_EMAIL        # SLA alert / new-case recipient
UPLOAD_DIR            # file storage (default /app/uploads)
SLA_MINUTES           # alert threshold (default 60)
SLA_CHECK_INTERVAL    # background job interval seconds (default 300)
CORS_ORIGINS_RAW      # comma-separated allowed frontend origins
ENV                   # development | production
SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD   # only read once, by migration 0005, to create the first admin account
```

Files stored in Docker volume `uploads_data` mounted at `UPLOAD_DIR`.
