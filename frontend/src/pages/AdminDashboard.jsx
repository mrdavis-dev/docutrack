import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listCases, setAdminAuth, clearAdminAuth, isAdminAuthed } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import TimeElapsed from "../components/TimeElapsed";

// ponytail: service label fallback — full label map loaded dynamically if needed
const SERVICE_LABELS = {};

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "NUEVO", label: "Nuevo" },
  { value: "PENDIENTE_REVISION", label: "Pendiente" },
  { value: "DOCUMENTOS_INCOMPLETOS", label: "Docs incompletos" },
  { value: "EN_PROCESO", label: "En proceso" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const COLS = ["ID", "Fecha", "Cliente", "Placa", "Trámite", "Estado", "Tiempo", "Docs"];

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {COLS.map((c) => (
        <td key={c} className="px-4 py-4">
          <div className="h-3.5 bg-gray-100 rounded-full animate-pulse" style={{ width: `${55 + (c.length * 11) % 35}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(isAdminAuthed);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.q = search.trim();
      const { data } = await listCases(params);
      setCases(data);
    } catch {
      /* silenced */
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    if (!authed) return;
    const t = setTimeout(loadCases, search ? 300 : 0); // debounce typing only
    return () => clearTimeout(t);
  }, [authed, loadCases, search]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    setAdminAuth(loginForm.username, loginForm.password);
    try {
      await listCases({});
      setAuthed(true);
    } catch (err) {
      clearAdminAuth();
      setLoginError(
        err?.response?.status === 401
          ? "Usuario o contraseña incorrectos"
          : "Error de conexión. Intenta nuevamente."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    clearAdminAuth();
    setAuthed(false);
    setCases([]);
    setLoginForm({ username: "", password: "" });
  }

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="card-md w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-2xl mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">DocuCars</h1>
            <p className="text-sm text-gray-500 mt-1">Panel administrativo</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center flex items-center gap-2 justify-center">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="form-label">Usuario</label>
              <input
                className="form-input"
                value={loginForm.username}
                onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                autoComplete="username"
                placeholder="admin"
                autoFocus
              />
            </div>
            <div>
              <label className="form-label">Contraseña</label>
              <div className="relative">
                <input
                  className="form-input pr-10"
                  type={showPass ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loginLoading} className="btn-primary w-full mt-2">
              {loginLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </>
              ) : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const activeFilter = STATUSES.find((s) => s.value === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">DocuCars</span>
            <span className="text-gray-200 hidden sm:inline">|</span>
            <span className="text-gray-400 text-sm hidden sm:inline">Dashboard</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={loadCases}
              disabled={loading}
              className="btn-ghost"
              title="Actualizar lista"
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <Link to="/admin/services" className="btn-ghost" title="Gestionar trámites">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              <span className="hidden sm:inline">Trámites</span>
            </Link>
            <a href="/" className="btn-ghost" title="Ir al portal cliente">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className="hidden sm:inline">Portal</span>
            </a>
            <button
              onClick={handleLogout}
              className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600"
              title="Cerrar sesión"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Title row + filters */}
        <div className="mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cola de casos</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {loading ? "Cargando..." : `${cases.length} ${cases.length === 1 ? "caso" : "casos"}${activeFilter && activeFilter.value ? ` · ${activeFilter.label}` : ""}`}
              </p>
            </div>
          </div>

          {/* Search by name or phone */}
          <div className="relative max-w-sm">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              className="form-input pl-9"
              placeholder="Buscar por nombre o celular..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status pill filters */}
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`text-xs px-3.5 py-1.5 rounded-full border font-semibold transition-all duration-150 ${
                  statusFilter === s.value
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-brand-300 hover:text-brand-600"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    {COLS.map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
              </table>
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-600 text-base">Sin casos</p>
              <p className="text-sm text-gray-400 mt-1.5 max-w-xs">
                {statusFilter
                  ? `No hay casos con estado "${activeFilter?.label}".`
                  : "Aún no se han registrado solicitudes."}
              </p>
              {statusFilter && (
                <button
                  onClick={() => setStatusFilter("")}
                  className="mt-4 btn-secondary text-sm"
                >
                  Ver todos los casos
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    {COLS.map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider first:pl-5 last:pr-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cases.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/admin/cases/${c.id}`)}
                      className="hover:bg-brand-50/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-4 pl-5">
                        <span className="font-mono text-xs font-semibold text-gray-400">#{c.id}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-xs text-gray-500">
                          {new Date(c.created_at).toLocaleDateString("es", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900 leading-tight text-sm">{c.customer_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.phone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm font-bold text-gray-800 tracking-widest">{c.plate}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-500">{SERVICE_LABELS[c.service_type] || c.service_type}</span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={c.status} alertSent={c.alert_sent} />
                      </td>
                      <td className="px-4 py-4">
                        <TimeElapsed createdAt={c.created_at} compact />
                      </td>
                      <td className="px-4 py-4 pr-5">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
                          </svg>
                          {c.document_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Haz clic en una fila para ver el detalle del caso
        </p>
      </main>
    </div>
  );
}
