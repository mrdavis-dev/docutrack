import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  listServiceTypes, createServiceType, updateServiceType, deleteServiceType,
  createServiceField, updateServiceField, deleteServiceField,
} from "../services/api";

const FIELD_TYPES = [
  { value: "file", label: "Archivo (PDF/imagen)" },
  { value: "text", label: "Texto libre" },
];

function slugify(str) {
  return str.toUpperCase().trim().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
}

export default function ServiceTypeManager() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  // new type form
  const [newType, setNewType] = useState({ name: "", slug: "" });
  const [newTypeErr, setNewTypeErr] = useState("");

  // new field form per type
  const [newField, setNewField] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listServiceTypes(true);
      setTypes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreateType(e) {
    e.preventDefault();
    if (!newType.name.trim()) { setNewTypeErr("Nombre requerido"); return; }
    if (!newType.slug.trim()) { setNewTypeErr("Slug requerido"); return; }
    try {
      await createServiceType(newType);
      setNewType({ name: "", slug: "" });
      setNewTypeErr("");
      load();
    } catch (err) {
      setNewTypeErr(err?.response?.data?.detail || "Error al crear");
    }
  }

  async function handleToggleActive(st) {
    await updateServiceType(st.id, { is_active: !st.is_active });
    load();
  }

  async function handleDeleteType(st) {
    if (!confirm(`¿Desactivar "${st.name}"? Los casos existentes no se afectan.`)) return;
    await deleteServiceType(st.id);
    load();
  }

  async function handleCreateField(e, stId) {
    e.preventDefault();
    const f = newField[stId] || {};
    if (!f.label?.trim() || !f.field_key?.trim()) return;
    await createServiceField(stId, {
      label: f.label,
      field_key: f.field_key,
      field_type: f.field_type || "file",
      is_required: f.is_required !== false,
      sort_order: f.sort_order || 0,
    });
    setNewField((prev) => ({ ...prev, [stId]: {} }));
    load();
  }

  async function handleDeleteField(fieldId) {
    if (!confirm("¿Eliminar este campo?")) return;
    await deleteServiceField(fieldId);
    load();
  }

  async function handleToggleRequired(field) {
    await updateServiceField(field.id, { is_required: !field.is_required });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Gestión de Trámites</span>
          </div>
          <Link to="/admin" className="btn-ghost text-sm">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* New service type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Nuevo trámite</h2>
          <form onSubmit={handleCreateType} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <label className="form-label">Nombre</label>
              <input className="form-input" placeholder="Renovación de placa" value={newType.name}
                onChange={(e) => setNewType((p) => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))} />
            </div>
            <div className="flex-1 min-w-32">
              <label className="form-label">Slug (ID único)</label>
              <input className="form-input font-mono text-xs" placeholder="RENOVACION_PLACA"
                value={newType.slug}
                onChange={(e) => setNewType((p) => ({ ...p, slug: slugify(e.target.value) }))} />
            </div>
            <button type="submit" className="btn-primary">Crear</button>
          </form>
          {newTypeErr && <p className="text-red-500 text-xs mt-2">{newTypeErr}</p>}
        </div>

        {/* List */}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
        ) : types.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin trámites configurados.</p>
        ) : (
          types.map((st) => (
            <div key={st.id} className={`bg-white rounded-2xl border shadow-card overflow-hidden transition-all ${st.is_active ? "border-gray-100" : "border-gray-200 opacity-60"}`}>
              {/* Type header */}
              <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === st.id ? null : st.id)}>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{st.name}</p>
                  <p className="text-xs font-mono text-gray-400">{st.slug}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                  {st.is_active ? "Activo" : "Inactivo"}
                </span>
                <span className="text-xs text-gray-400">{st.fields.length} campos</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleToggleActive(st); }}
                  className="btn-ghost text-xs">
                  {st.is_active ? "Desactivar" : "Activar"}
                </button>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === st.id ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>

              {/* Fields */}
              {expanded === st.id && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                  {st.fields.length === 0 && (
                    <p className="text-xs text-gray-400">Sin campos. Agrega al menos uno.</p>
                  )}
                  {st.fields.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 text-sm">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${f.field_type === "file" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                        {f.field_type}
                      </span>
                      <span className="flex-1 text-gray-800">{f.label}</span>
                      <span className="text-xs font-mono text-gray-400">{f.field_key}</span>
                      <button type="button" onClick={() => handleToggleRequired(f)}
                        className={`text-xs px-2 py-0.5 rounded-full border ${f.is_required ? "border-red-200 text-red-500" : "border-gray-200 text-gray-400"}`}>
                        {f.is_required ? "Requerido" : "Opcional"}
                      </button>
                      <button type="button" onClick={() => handleDeleteField(f.id)}
                        className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                    </div>
                  ))}

                  {/* Add field form */}
                  <form onSubmit={(e) => handleCreateField(e, st.id)} className="flex flex-wrap gap-2 items-end pt-2 border-t border-gray-50">
                    <div className="flex-1 min-w-28">
                      <label className="form-label">Etiqueta</label>
                      <input className="form-input text-sm" placeholder="Foto frontal"
                        value={newField[st.id]?.label || ""}
                        onChange={(e) => setNewField((p) => ({ ...p, [st.id]: { ...p[st.id], label: e.target.value, field_key: slugify(e.target.value).toLowerCase() } }))} />
                    </div>
                    <div className="w-36">
                      <label className="form-label">Clave</label>
                      <input className="form-input text-xs font-mono" placeholder="foto_frontal"
                        value={newField[st.id]?.field_key || ""}
                        onChange={(e) => setNewField((p) => ({ ...p, [st.id]: { ...p[st.id], field_key: e.target.value.toLowerCase().replace(/\s+/g, "_") } }))} />
                    </div>
                    <div className="w-40">
                      <label className="form-label">Tipo</label>
                      <select className="form-input text-sm"
                        value={newField[st.id]?.field_type || "file"}
                        onChange={(e) => setNewField((p) => ({ ...p, [st.id]: { ...p[st.id], field_type: e.target.value } }))}>
                        {FIELD_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                      </select>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 cursor-pointer">
                      <input type="checkbox" defaultChecked
                        onChange={(e) => setNewField((p) => ({ ...p, [st.id]: { ...p[st.id], is_required: e.target.checked } }))} />
                      Requerido
                    </label>
                    <button type="submit" className="btn-secondary text-sm">+ Agregar campo</button>
                  </form>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
