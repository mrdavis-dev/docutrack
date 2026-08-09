import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { updateBrandColor, updateLogo, updateTitle } from "../services/api";
import { useBranding } from "../services/BrandingContext";
import { applyBrandColor } from "../services/branding";
import Logo from "../components/Logo";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export default function BrandingManager() {
  const { logoUrl, title, subtitle, refresh } = useBranding();
  const [color, setColor] = useState("#2563EB");
  const [colorErr, setColorErr] = useState("");
  const [savingColor, setSavingColor] = useState(false);
  const [savedColor, setSavedColor] = useState(false);

  const [logoErr, setLogoErr] = useState("");
  const [savingLogo, setSavingLogo] = useState(false);

  const [titleForm, setTitleForm] = useState({ title: "", subtitle: "" });
  const [titleErr, setTitleErr] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [savedTitle, setSavedTitle] = useState(false);

  // seed the editable form once the real values load from context
  useEffect(() => {
    setTitleForm({ title, subtitle });
  }, [title, subtitle]);

  async function handleSaveTitle(e) {
    e.preventDefault();
    if (!titleForm.title.trim()) {
      setTitleErr("El título no puede estar vacío");
      return;
    }
    setSavingTitle(true);
    setTitleErr("");
    try {
      await updateTitle(titleForm.title.trim(), titleForm.subtitle.trim() || undefined);
      await refresh();
      setSavedTitle(true);
      setTimeout(() => setSavedTitle(false), 2500);
    } catch (err) {
      setTitleErr(err?.response?.data?.detail || "No se pudo guardar el título");
    } finally {
      setSavingTitle(false);
    }
  }

  async function handleSaveColor(e) {
    e.preventDefault();
    if (!HEX_RE.test(color)) {
      setColorErr("Usa un código hex de 6 dígitos, ej. #2563EB");
      return;
    }
    setSavingColor(true);
    setColorErr("");
    try {
      await updateBrandColor(color);
      applyBrandColor(color); // apply immediately, no reload needed
      setSavedColor(true);
      setTimeout(() => setSavedColor(false), 2500);
    } catch (err) {
      setColorErr(err?.response?.data?.detail || "No se pudo guardar el color");
    } finally {
      setSavingColor(false);
    }
  }

  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingLogo(true);
    setLogoErr("");
    try {
      await updateLogo(file);
      await refresh(); // reloads logoUrl (cache-busted) so the new logo shows right away
    } catch (err) {
      setLogoErr(err?.response?.data?.detail || "No se pudo subir el logo");
    } finally {
      setSavingLogo(false);
      e.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="w-7 h-7" iconSize="w-4 h-4" />
            <span className="font-bold text-gray-900">Logo y color de marca</span>
          </div>
          <Link to="/admin" className="btn-ghost text-sm">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Logo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Logo</h2>
          <div className="flex items-center gap-4">
            <Logo size="w-16 h-16" iconSize="w-8 h-8" />
            <div>
              <label className="btn-secondary text-sm cursor-pointer inline-flex">
                {savingLogo ? "Subiendo..." : "Cambiar logo"}
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg"
                  className="hidden"
                  disabled={savingLogo}
                  onChange={handleLogoChange}
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">PNG, JPG o SVG. Máx 10MB.</p>
              {logoErr && <p className="text-xs text-red-600 mt-1">{logoErr}</p>}
            </div>
          </div>
          {!logoUrl && (
            <p className="text-xs text-gray-400 mt-3">
              Sin logo propio todavía — se muestra el ícono por defecto.
            </p>
          )}
        </div>

        {/* Portal title */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Título del portal de cliente</h2>
          <form onSubmit={handleSaveTitle} className="space-y-3">
            <div>
              <label className="form-label">Título</label>
              <input
                className="form-input"
                placeholder="Docutrack"
                value={titleForm.title}
                onChange={(e) => setTitleForm((p) => ({ ...p, title: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div>
              <label className="form-label">Subtítulo (opcional)</label>
              <input
                className="form-input"
                placeholder="Trámites vehiculares rápidos y seguros"
                value={titleForm.subtitle}
                onChange={(e) => setTitleForm((p) => ({ ...p, subtitle: e.target.value }))}
                maxLength={200}
              />
            </div>
            <button type="submit" disabled={savingTitle} className="btn-primary">
              {savingTitle ? "Guardando..." : "Guardar"}
            </button>
          </form>
          {titleErr && <p className="text-xs text-red-600 mt-2">{titleErr}</p>}
          {savedTitle && <p className="text-xs text-emerald-600 mt-2">Título actualizado ✓</p>}
          <p className="text-xs text-gray-400 mt-3">
            Se muestra en el encabezado del portal donde los clientes crean sus solicitudes.
          </p>
        </div>

        {/* Color */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Color de marca</h2>
          <form onSubmit={handleSaveColor} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-40">
              <label className="form-label">Código hex</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={HEX_RE.test(color) ? color : "#2563eb"}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                  title="Elegir color"
                />
                <input
                  className="form-input font-mono"
                  placeholder="#2563EB"
                  value={color}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  maxLength={7}
                />
              </div>
            </div>
            <button type="submit" disabled={savingColor} className="btn-primary">
              {savingColor ? "Guardando..." : "Guardar"}
            </button>
          </form>
          {colorErr && <p className="text-xs text-red-600 mt-2">{colorErr}</p>}
          {savedColor && <p className="text-xs text-emerald-600 mt-2">Color actualizado ✓</p>}
          <p className="text-xs text-gray-400 mt-3">
            Aplica en botones y acentos de todo el sistema, portal cliente incluido.
          </p>
        </div>
      </main>
    </div>
  );
}
