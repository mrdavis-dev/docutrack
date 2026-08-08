import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { listUsers, createUser, deactivateUser } from "../services/api";

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [createErr, setCreateErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [rowError, setRowError] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateErr("");
    setCreating(true);
    try {
      await createUser(newUser);
      setNewUser({ username: "", password: "" });
      load();
    } catch (err) {
      setCreateErr(err?.response?.data?.detail || "Error al crear usuario");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(u) {
    if (!confirm(`¿Desactivar a "${u.username}"? Perderá acceso al panel de inmediato.`)) return;
    setRowError((p) => ({ ...p, [u.id]: "" }));
    try {
      await deactivateUser(u.id);
      load();
    } catch (err) {
      setRowError((p) => ({ ...p, [u.id]: err?.response?.data?.detail || "No se pudo desactivar" }));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Usuarios administradores</span>
          </div>
          <Link to="/admin" className="btn-ghost text-sm">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* New admin */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Nuevo administrador</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <label className="form-label">Usuario</label>
              <input
                className="form-input"
                value={newUser.username}
                onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="flex-1 min-w-40">
              <label className="form-label">Contraseña (mín. 8 caracteres)</label>
              <input
                type="password"
                className="form-input"
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? "Creando..." : "Crear"}
            </button>
          </form>
          {createErr && <p className="text-red-500 text-xs mt-2">{createErr}</p>}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin usuarios</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {u.username}
                      {!u.is_active && (
                        <span className="ml-2 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Creado {new Date(u.created_at).toLocaleDateString()}
                    </p>
                    {rowError[u.id] && <p className="text-xs text-red-600 mt-1">{rowError[u.id]}</p>}
                  </div>
                  {u.is_active && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(u)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Desactivar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
