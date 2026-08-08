# DocuCars — Sistema de Gestión de Trámites Vehiculares

Gestión de solicitudes de trámites con portal cliente y dashboard administrativo.

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
| `UPLOAD_DIR` | Ruta de uploads en el contenedor | No (default `/app/uploads`) |
| `SLA_MINUTES` | Minutos antes de alerta SLA | No (default `60`) |
| `SLA_CHECK_INTERVAL` | Segundos entre revisiones SLA | No (default `300`) |
| `CORS_ORIGINS_RAW` | Orígenes permitidos del frontend, separados por coma | Sí en producción |
| `ENV` | `development` o `production` | No (default `development`) |
| `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` | Solo se leen una vez, al correr la migración `0005`, para crear la primera cuenta admin | No (default `admin` / `changeme123`) |

## Usuarios y sesiones

Los administradores viven en la base de datos (tabla `users`, contraseñas con bcrypt) — no hay credenciales hardcodeadas ni leídas desde `.env` en tiempo de ejecución. El primer admin se crea una sola vez al correr la migración `0005` (usando `SEED_ADMIN_USERNAME`/`SEED_ADMIN_PASSWORD`); todos los admins siguientes se crean desde el panel `/admin/users`.

Las sesiones son server-side (tabla `sessions`, token opaco con expiración de 12h). Cerrar sesión revoca el token en el servidor de inmediato — no queda reutilizable desde ninguna pestaña ni caché del navegador. Desactivar un usuario revoca todas sus sesiones activas al instante.

**Cambia la contraseña del admin inicial (o crea uno nuevo y desactiva el seed) antes de producción.**

## Flujo operativo

1. Cliente llena formulario en portal y sube los documentos requeridos por el tipo de trámite
2. Sistema crea caso con estado `NUEVO`
3. Email automático al negocio + confirmación al cliente (requiere Brevo)
4. Admin revisa en dashboard (con búsqueda por nombre o celular), cambia estado, agrega notas
5. Admin puede definir el total del trámite y registrar abonos parciales con comprobante; cada comprobante se puede reenviar por correo al cliente
6. Si el caso lleva más de `SLA_MINUTES` en `NUEVO` sin atender → alerta por email

## Tipos de trámite

Configurables desde `/admin/services` (tabla `service_types` + `service_fields`) — no están hardcodeados. Cada tipo de trámite define sus propios campos requeridos (archivo o texto libre).

## Estados del caso

`NUEVO` → `PENDIENTE_REVISION` → `EN_PROCESO` → `FINALIZADO`

O también: `DOCUMENTOS_INCOMPLETOS`, `CANCELADO`

## Stack

- **Frontend**: React + Vite + TailwindCSS + React Router + Axios
- **Backend**: FastAPI + SQLAlchemy + Pydantic + Alembic + bcrypt
- **DB**: PostgreSQL 16
- **Emails**: Brevo API (con soporte de adjuntos, usado para comprobantes de pago)
- **Storage**: Volumen Docker (`uploads_data`)
- **Infra**: Docker Compose (con healthchecks en backend/frontend)

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
