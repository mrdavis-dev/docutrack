import { useState, useEffect } from "react";
import { createCase, uploadFiles, listServiceTypes } from "../services/api";
import FileUpload from "../components/FileUpload";

const INITIAL_FORM = {
  customer_name: "",
  phone: "",
  email: "",
  plate: "",
  service_type: "",
  comments: "",
};

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStep1(form) {
  const errs = {};
  if (!form.customer_name.trim()) errs.customer_name = "Nombre requerido";
  if (!form.phone.trim()) errs.phone = "Teléfono requerido";
  else if (!PHONE_RE.test(form.phone.trim())) errs.phone = "Formato inválido";
  if (!form.email.trim()) errs.email = "Correo requerido";
  else if (!EMAIL_RE.test(form.email)) errs.email = "Correo inválido";
  if (!form.plate.trim()) errs.plate = "Placa requerida";
  if (!form.service_type) errs.service_type = "Selecciona un trámite";
  return errs;
}

function validateDocs(files, textValues, fields) {
  const errs = {};
  fields.forEach(({ field_key, field_type, is_required }) => {
    if (!is_required) return;
    if (field_type === "file" && !files[field_key]) errs[field_key] = "Requerido";
    if (field_type === "text" && !textValues?.[field_key]?.trim()) errs[field_key] = "Requerido";
  });
  return errs;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="form-error">
      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  );
}

function Stepper({ current }) {
  const steps = ["Datos del trámite", "Documentos"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
                ${done ? "bg-emerald-500 text-white" : active ? "bg-brand-600 text-white ring-4 ring-brand-100" : "bg-gray-100 text-gray-400"}`}>
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : idx}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-brand-700" : done ? "text-emerald-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 rounded ${done ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ClientPortal() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState({});
  const [textValues, setTextValues] = useState({});
  const [errors, setErrors] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [caseId, setCaseId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [serviceTypes, setServiceTypes] = useState([]);

  useEffect(() => {
    listServiceTypes().then(({ data }) => setServiceTypes(data)).catch(() => {});
  }, []);

  const selectedService = serviceTypes.find((s) => s.slug === form.service_type);
  const activeFields = selectedService?.fields || [];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "plate" ? value.toUpperCase() : value }));
    if (name === "service_type") { setFiles({}); setTextValues({}); setFileErrors({}); }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    const errs = validateStep1({ ...form, [name]: value });
    if (errs[name]) setErrors((prev) => ({ ...prev, [name]: errs[name] }));
    else setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function goToStep2() {
    const errs = validateStep1(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const fErrs = validateDocs(files, textValues, activeFields);
    setFileErrors(fErrs);
    if (Object.keys(fErrs).length) return;

    setSubmitting(true);
    try {
      const { data: newCase } = await createCase(form);
      const fd = new FormData();
      fd.append("case_id", newCase.id);
      activeFields.filter((f) => f.field_type === "file").forEach(({ field_key }) => {
        fd.append("files", files[field_key]);
        fd.append("document_types", field_key);
      });
      // Text fields stored as pseudo-documents (file = text blob)
      activeFields.filter((f) => f.field_type === "text").forEach(({ field_key }) => {
        const blob = new Blob([textValues[field_key] || ""], { type: "text/plain" });
        fd.append("files", blob, `${field_key}.txt`);
        fd.append("document_types", field_key);
      });
      await uploadFiles(fd);
      setCaseId(newCase.id);
      setStep("success");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setErrors({ _global: typeof detail === "string" ? detail : "Error al enviar. Intenta nuevamente." });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setForm(INITIAL_FORM);
    setFiles({});
    setTextValues({});
    setErrors({});
    setFileErrors({});
    setStep(1);
    setCaseId(null);
    setCopied(false);
  }

  function copyId() {
    navigator.clipboard.writeText(String(caseId)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 px-4 py-12">
        <div className="card-md max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h2>
          <p className="text-gray-500 text-sm mb-6">Tu trámite fue registrado. Te contactaremos al correo ingresado.</p>
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6">
            <p className="text-xs text-brand-600 font-medium mb-1 uppercase tracking-wide">Número de caso</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-brand-700">#{caseId}</span>
              <button onClick={copyId} className="btn-ghost text-brand-600 hover:bg-brand-100" title="Copiar número">
                {copied ? (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                )}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-6">Guarda este número para dar seguimiento a tu solicitud.</p>
          <button className="btn-primary w-full" onClick={reset}>Nueva solicitud</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">DocuCars</span>
          </div>
          <p className="text-gray-500 text-sm">Trámites vehiculares rápidos y seguros</p>
        </div>

        <div className="card-md">
          <Stepper current={step} />

          {errors._global && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors._global}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="section-title">Información personal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nombre completo <span className="text-red-400">*</span></label>
                    <input className={`form-input ${errors.customer_name ? "form-input-error" : ""}`}
                      name="customer_name" value={form.customer_name} onChange={handleChange} onBlur={handleBlur}
                      placeholder="Juan Pérez" autoComplete="name" />
                    <FieldError msg={errors.customer_name} />
                  </div>
                  <div>
                    <label className="form-label">Teléfono <span className="text-red-400">*</span></label>
                    <input className={`form-input ${errors.phone ? "form-input-error" : ""}`}
                      name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur}
                      placeholder="+1 555 000 0000" autoComplete="tel" type="tel" />
                    <FieldError msg={errors.phone} />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Correo electrónico <span className="text-red-400">*</span></label>
                <input className={`form-input ${errors.email ? "form-input-error" : ""}`}
                  type="email" name="email" value={form.email} onChange={handleChange} onBlur={handleBlur}
                  placeholder="correo@ejemplo.com" autoComplete="email" />
                <FieldError msg={errors.email} />
              </div>

              <div>
                <p className="section-title">Datos del vehículo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Número de placa <span className="text-red-400">*</span></label>
                    <input className={`form-input uppercase tracking-widest ${errors.plate ? "form-input-error" : ""}`}
                      name="plate" value={form.plate} onChange={handleChange} onBlur={handleBlur}
                      placeholder="ABC 123" autoComplete="off" />
                    <FieldError msg={errors.plate} />
                  </div>
                  <div>
                    <label className="form-label">Tipo de trámite <span className="text-red-400">*</span></label>
                    <select className={`form-input ${errors.service_type ? "form-input-error" : ""}`}
                      name="service_type" value={form.service_type} onChange={handleChange} onBlur={handleBlur}>
                      <option value="">Seleccionar...</option>
                      {serviceTypes.map((s) => (
                        <option key={s.slug} value={s.slug}>{s.name}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.service_type} />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Comentarios <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea className="form-input resize-none" name="comments" value={form.comments}
                  onChange={handleChange} rows={3} placeholder="Información adicional sobre el trámite..." />
              </div>

              <div className="pt-2">
                <button type="button" onClick={goToStep2} className="btn-primary w-full">
                  Continuar
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {activeFields.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Este trámite no requiere documentos adicionales.</p>
              ) : (
                <FileUpload
                  fields={activeFields}
                  files={files}
                  setFiles={setFiles}
                  textValues={textValues}
                  setTextValues={setTextValues}
                  errors={fileErrors}
                />
              )}

              {errors._global && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{errors._global}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Atrás
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-[2]">
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </>
                  ) : "Enviar solicitud"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
