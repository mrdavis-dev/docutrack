# Plan: Trámites dinámicos con campos configurables

## Context

Actualmente los trámites (ServiceType) están hardcodeados como enum en Python y los 4 documentos requeridos están hardcodeados en el componente FileUpload. El negocio necesita poder crear/editar/eliminar trámites y definir qué campos (archivos o texto) requiere cada uno, sin tocar código.

Respuestas del usuario:
- CRUD completo de trámites + campos desde admin
- Campos: archivos (PDF/img) Y texto libre
- Trámites desactivados solo afectan nuevos casos, no históricos

---

## Approach: mínimo cambio que funciona

### 1. DB — 2 tablas nuevas

```sql
-- Trámite configurable (reemplaza el enum ServiceType)
CREATE TABLE service_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,          -- "Renovación de placa"
  slug VARCHAR UNIQUE NOT NULL,   -- "renovacion_placa"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Campos requeridos por trámite
CREATE TABLE service_fields (
  id SERIAL PRIMARY KEY,
  service_type_id INT REFERENCES service_types(id) ON DELETE CASCADE,
  label VARCHAR NOT NULL,         -- "Póliza de seguro"
  field_key VARCHAR NOT NULL,     -- "poliza" (usado como document_type)
  field_type VARCHAR NOT NULL,    -- "file" | "text"
  is_required BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);
```

`Document.document_type` ya es VARCHAR, sin cambios.
`Case.service_type` cambia de enum → VARCHAR (slug del trámite), o mejor: FK a `service_types.id`.

### 2. Migration

- Nueva migración Alembic: crea `service_types` + `service_fields`
- Migra datos existentes: inserta los 4 trámites actuales con sus 4 docs hardcodeados
- Cambia columna `cases.service_type` de enum → VARCHAR (guarda slug)
- Elimina el enum `ServiceType` de Postgres

### 3. Backend

**Nuevos archivos:**
- `app/models/service.py` — modelos `ServiceType` (tabla), `ServiceField`
- `app/routers/services.py` — CRUD admin de trámites y campos
- `app/schemas/service.py` — schemas Pydantic

**Cambios existentes:**
- `app/models/case.py` — `Case.service_type` VARCHAR, eliminar `ServiceType` enum
- `app/schemas/case.py` — `CaseCreate.service_type` pasa a `str` (slug o id)
- `app/routers/cases.py` — validar que el slug existe en DB al crear caso
- `main.py` — incluir nuevo router

**Endpoints nuevos (todos admin-auth):**
```
GET    /service-types          # listar activos (también público para el portal)
POST   /service-types          # crear
PATCH  /service-types/{id}     # editar
DELETE /service-types/{id}     # soft-delete (is_active=false)

GET    /service-types/{id}/fields   # listar campos
POST   /service-types/{id}/fields   # agregar campo
PATCH  /service-fields/{id}         # editar campo
DELETE /service-fields/{id}         # eliminar campo
```

`GET /service-types` sin auth (el portal cliente lo necesita).

### 4. Frontend

**Nuevos componentes:**
- `pages/ServiceTypeManager.jsx` — CRUD de trámites y sus campos (dentro del admin)
- Ruta: `/admin/services`

**Cambios existentes:**
- `pages/ClientPortal.jsx` — cargar trámites desde API en vez de lista hardcodeada; step 2 renderiza los campos dinámicos
- `components/FileUpload.jsx` — recibe `fields` prop (array de `{field_key, label, field_type}`) en vez de lista fija
- `services/api.js` — agregar llamadas a `/service-types` y CRUD de campos
- `pages/AdminDashboard.jsx` — link a `/admin/services`
- `App.jsx` — nueva ruta `/admin/services`

### 5. Inicialización con datos

Al correr la migración, seed automático con los 4 trámites y sus 4 documentos actuales para no romper lo existente.

---

## Archivos críticos a modificar

| Archivo | Cambio |
|---|---|
| `backend/app/models/case.py` | `service_type` → VARCHAR |
| `backend/app/schemas/case.py` | `service_type: str` |
| `backend/app/routers/cases.py` | validar service_type existe |
| `backend/main.py` | incluir router services |
| `frontend/src/components/FileUpload.jsx` | aceptar `fields` prop dinámica |
| `frontend/src/pages/ClientPortal.jsx` | cargar trámites dinámicos + render campos |
| `frontend/src/services/api.js` | endpoints de service types |
| `frontend/src/App.jsx` | ruta `/admin/services` |

**Archivos nuevos:**
- `backend/app/models/service.py`
- `backend/app/routers/services.py`
- `backend/app/schemas/service.py`
- `backend/alembic/versions/0002_service_types.py`
- `frontend/src/pages/ServiceTypeManager.jsx`

---

## Verificación

1. `docker compose up --build` — sin errores
2. `docker compose exec backend alembic upgrade head` — migración aplica + seed
3. Admin: crear trámite nuevo con 1 campo archivo + 1 campo texto
4. Portal: seleccionar ese trámite → ver los campos dinámicos → subir/llenar → crear caso OK
5. Casos viejos siguen apareciendo en admin con sus datos intactos
