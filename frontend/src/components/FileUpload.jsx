import { useRef } from "react";

export const DOCUMENT_TYPES = [
  { key: "foto_frontal", label: "Foto frontal", hint: "Frente del vehículo visible" },
  { key: "foto_lateral", label: "Foto lateral", hint: "Lado del vehículo visible" },
  { key: "registro_unico", label: "Registro único", hint: "Documento oficial de registro" },
  { key: "poliza", label: "Póliza de seguro", hint: "Póliza vigente" },
];

const ACCEPT = ".jpg,.jpeg,.png,.pdf";
const MAX_SIZE = 10 * 1024 * 1024;

function FileIcon() {
  return (
    <svg className="w-5 h-5 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default function FileUpload({ files, setFiles, errors }) {
  const inputRefs = useRef({});

  function handleFileSelect(docKey, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      alert(`"${file.name}" supera el límite de 10 MB.`);
      return;
    }
    setFiles((prev) => ({ ...prev, [docKey]: file }));
    e.target.value = "";
  }

  function handleDrop(docKey, e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      alert(`"${file.name}" supera el límite de 10 MB.`);
      return;
    }
    setFiles((prev) => ({ ...prev, [docKey]: file }));
  }

  function removeFile(docKey) {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[docKey];
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">
        Documentos requeridos
        <span className="ml-1.5 text-xs font-normal text-gray-400">
          {Object.keys(files).length} / {DOCUMENT_TYPES.length} cargados
        </span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DOCUMENT_TYPES.map(({ key, label, hint }) => {
          const file = files[key];
          const hasError = errors?.[key];

          return (
            <div
              key={key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(key, e)}
              onClick={() => !file && inputRefs.current[key]?.click()}
              className={`
                relative rounded-xl border-2 border-dashed p-4 transition-all duration-150
                ${file
                  ? "border-emerald-300 bg-emerald-50 cursor-default"
                  : hasError
                  ? "border-red-300 bg-red-50 cursor-pointer hover:border-red-400"
                  : "border-gray-200 bg-gray-50 cursor-pointer hover:border-brand-400 hover:bg-brand-50"
                }
              `}
            >
              <input
                ref={(el) => (inputRefs.current[key] = el)}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={(e) => handleFileSelect(key, e)}
              />

              {file ? (
                <div className="flex items-start gap-3">
                  <FileIcon />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm text-gray-800 truncate font-medium">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <CheckIcon />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(key); }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-2 py-2">
                  <UploadIcon />
                  <div>
                    <p className={`text-sm font-medium ${hasError ? "text-red-600" : "text-gray-700"}`}>{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                  </div>
                  <p className={`text-xs ${hasError ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {hasError ? "Requerido · " : ""}JPG, PNG o PDF · máx. 10 MB
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
