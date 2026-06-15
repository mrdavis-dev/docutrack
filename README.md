# DocuCars — Sistema de Gestión de Trámites Vehiculares

MVP para gestión de solicitudes de trámites vehiculares con portal cliente y dashboard administrativo.

## Inicio rápido

```bash
# Clonar / posicionarse en el directorio
cd docucars

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales reales

# Levantar todo
docker compose up --build
```

| Servicio | URL |
|---|---|
| Portal cliente | http://localhost:3000 |
| Dashboard admin | http://localhost:3000/admin |
| API docs (Swagger) | http://localhost:8000/docs |

## Variables de entorno (`backend/.env`)

| Variable | Descripción | Requerido |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | Sí |
| `BREVO_API_KEY` | API key de Brevo para emails | Para emails |
| `SMTP_FROM` | Correo remitente | Para emails |
| `SMTP_FROM_NAME` | Nombre remitente | No |
| `BUSINESS_EMAIL` | Correo que recibe alertas y nuevos casos | Para emails |
| `ADMIN_USERNAME` | Usuario del dashboard | Sí |
| `ADMIN_PASSWORD` | Contraseña del dashboard | Sí |
| `UPLOAD_DIR` | Ruta de uploads en el contenedor | No (default `/app/uploads`) |
| `SLA_MINUTES` | Minutos antes de alerta SLA | No (default `60`) |
| `SLA_CHECK_INTERVAL` | Segundos entre revisiones SLA | No (default `300`) |

## Credenciales por defecto

- Usuario: `admin`
- Contraseña: `admin123`

**Cambiar en `.env` antes de producción.**

## Flujo operativo

1. Cliente llena formulario en portal y sube 4 documentos
2. Sistema crea caso con estado `NUEVO`
3. Email automático al negocio + confirmación al cliente (requiere Brevo)
4. Admin revisa en dashboard, cambia estado, agrega notas
5. Si el caso lleva >60 min en `NUEVO` sin atender → alerta por email

## Tipos de trámite

- Renovación de placa
- Traspaso
- Revisado
- Duplicado

## Estados del caso

`NUEVO` → `PENDIENTE_REVISION` → `EN_PROCESO` → `FINALIZADO`

O también: `DOCUMENTOS_INCOMPLETOS`, `CANCELADO`

## Stack

- **Frontend**: React + Vite + TailwindCSS + React Router + Axios
- **Backend**: FastAPI + SQLAlchemy + Pydantic + Alembic
- **DB**: PostgreSQL 16
- **Emails**: Brevo API
- **Storage**: Volumen Docker (`uploads_data`)
- **Infra**: Docker Compose

## Comandos útiles

```bash
# Solo backend (dev local)
cd backend && uvicorn main:app --reload

# Crear nueva migración
docker compose exec backend alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones
docker compose exec backend alembic upgrade head

# Logs
docker compose logs -f backend
```
