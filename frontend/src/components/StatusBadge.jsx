const STATUS_CONFIG = {
  NUEVO: {
    label: "Nuevo",
    dot: "bg-blue-500",
    className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  },
  PENDIENTE_REVISION: {
    label: "Pendiente revisión",
    dot: "bg-amber-500",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  DOCUMENTOS_INCOMPLETOS: {
    label: "Docs incompletos",
    dot: "bg-orange-500",
    className: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  },
  EN_PROCESO: {
    label: "En proceso",
    dot: "bg-violet-500",
    className: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  },
  FINALIZADO: {
    label: "Finalizado",
    dot: "bg-emerald-500",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  CANCELADO: {
    label: "Cancelado",
    dot: "bg-red-500",
    className: "bg-red-50 text-red-700 ring-1 ring-red-200",
  },
};

export default function StatusBadge({ status, alertSent }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    dot: "bg-gray-400",
    className: "bg-gray-50 text-gray-600 ring-1 ring-gray-200",
  };

  return (
    <span className={`badge ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      {config.label}
      {alertSent && (
        <span title="Alerta SLA enviada" className="ml-0.5">⚠️</span>
      )}
    </span>
  );
}
