import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getCase, updateCaseStatus, getFileUrl } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import TimeElapsed from "../components/TimeElapsed";

const SERVICE_LABELS = {
  RENOVACION_PLACA: "Renovación de placa",
  TRASPASO: "Traspaso",
  REVISADO: "Revisado",
  DUPLICADO: "Duplicado",
};

const DOC_LABELS = {
  foto_frontal: "Foto frontal",
  foto_lateral: "Foto lateral",
  registro_unico: "Registro único",
  poliza: "Póliza de seguro",
};

const DOC_ICONS = {
  foto_frontal: (
    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
  foto_lateral: (
    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
  registro_unico: (
    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  poliza: (
    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
};

const STATUS_LABELS = {
  NUEVO: "Nuevo",
  PENDIENTE_REVISION: "Pendiente revisión",
  DOCUMENTOS_INCOMPLETOS: "Docs incompletos",
  EN_PROCESO: "En proceso",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);

// Parse "[\n[2024-01-15 10:30] texto\n[2024-01-16 09:00] otro" into entries
function parseNotes(raw) {
  if (!raw) return [];
  const lines = raw.split("\n").filter(Boolean);
  const entries = [];
  for (const line of lines) {
    const match = line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\] (.+)$/);
    if (match) {
      entries.push({ ts: match[1], text: match[2] });
    } else {
      entries.push({ ts: null, text: line });
    }
  }
  return entries;
}

export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const fetchCase = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getCase(id);
      setCaseData(data);
      setNewStatus(data.status);
    } catch {
      setCaseData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const { data } = await updateCaseStatus(id, {
        status: newStatus,
        internal_notes: note.trim() || undefined,
      });
      setCaseData(data);
      setNewStatus(data.status);
      setNote("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setSaveError(err?.response?.data?.detail || "Error al guardar. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">Cargando caso...</span>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="font-semibold text-gray-700">Caso no encontrado</p>
        <Link to="/admin" className="btn-secondary text-sm">
          ← Volver al dashboard
        </Link>
      </div>
    );
  }

  const noteEntries = parseNotes(caseData.internal_notes);
  const statusChanged = newStatus !== caseData.status;

  // ── DETAIL ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / breadcrumb */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm">
          <Link to="/admin" className="btn-ghost py-1 px-2 -ml-2 text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Dashboard
          </Link>
          <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold text-gray-900">Caso #{caseData.id}</span>
          <span className="ml-1">
            <StatusBadge status={caseData.status} alertSent={caseData.alert_sent} />
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT: info + docs + notes ───────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Customer card */}
            <div className="card">
              <p className="section-title">Información del cliente</p>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">{caseData.customer_name}</h2>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-5 mt-2.5">
                    <a
                      href={`mailto:${caseData.email}`}
                      className="text-sm text-brand-600 hover:underline flex items-center gap-1.5 min-w-0"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <span className="truncate">{caseData.email}</span>
                    </a>
                    <a
                      href={`tel:${caseData.phone}`}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      {caseData.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hace <span className="ml-1"><TimeElapsed createdAt={caseData.created_at} /></span>
                </div>
              </div>

              {/* Meta grid */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: "Placa", value: caseData.plate, mono: true },
                  { label: "Trámite", value: SERVICE_LABELS[caseData.service_type] || caseData.service_type },
                  {
                    label: "Registrado",
                    value: new Date(caseData.created_at).toLocaleString("es", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    }),
                  },
                  {
                    label: "Último cambio",
                    value: new Date(caseData.last_status_update).toLocaleString("es", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    }),
                  },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <p className={`text-sm font-semibold text-gray-800 ${mono ? "font-mono tracking-widest" : ""}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {caseData.comments && (
                <div className="mt-4 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 flex gap-2">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Comentario del cliente: </span>
                    {caseData.comments}
                  </div>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="card">
              <p className="section-title">Documentos adjuntos ({caseData.documents.length})</p>
              {caseData.documents.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">Sin documentos adjuntos</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {caseData.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/40 transition-all"
                    >
                      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                        {DOC_ICONS[doc.document_type] || (
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {DOC_LABELS[doc.document_type] || doc.document_type}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{doc.file_name}</p>
                      </div>
                      <a
                        href={getFileUrl(doc.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        title="Descargar documento"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3" />
                        </svg>
                        Ver
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Internal notes history */}
            {noteEntries.length > 0 && (
              <div className="card">
                <p className="section-title">Historial de notas ({noteEntries.length})</p>
                <div className="space-y-2.5">
                  {noteEntries.map((entry, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-1 bg-brand-200 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        {entry.ts && (
                          <p className="text-xs text-gray-400 font-mono mb-1">{entry.ts}</p>
                        )}
                        <p className="text-sm text-gray-700 leading-relaxed">{entry.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: actions panel ────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="card lg:sticky lg:top-[68px]">
              <p className="section-title">Actualizar caso</p>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Estado</label>
                  <select
                    className={`form-input ${statusChanged ? "border-brand-400 ring-2 ring-brand-100" : ""}`}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  {statusChanged && (
                    <p className="text-xs text-brand-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Cambio pendiente de guardar
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Nota interna{" "}
                    <span className="font-normal text-gray-400">(opcional)</span>
                  </label>
                  <textarea
                    className="form-input resize-none"
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Escribe una nota para el equipo..."
                  />
                  <p className="text-xs text-gray-400 mt-1">Se agregará con fecha y hora al historial.</p>
                </div>

                {saveError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {saveError}
                  </div>
                )}

                {saved && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Cambios guardados correctamente
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary w-full"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Guardando...
                    </>
                  ) : "Guardar cambios"}
                </button>

                <div className="border-t border-gray-100 pt-3">
                  <Link to="/admin" className="btn-ghost w-full justify-center text-gray-400 hover:text-gray-600">
                    ← Volver al dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
