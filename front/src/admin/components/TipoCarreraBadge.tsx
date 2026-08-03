const TIPO_CONFIG: Record<string, { label: string; bg: string; text: string }> =
  {
    grado: { label: "Grado", bg: "bg-blue-100", text: "text-blue-700" },
    tecnica: {
      label: "Tecnicatura",
      bg: "bg-green-100",
      text: "text-green-700",
    },
    posgrado: {
      label: "Posgrado",
      bg: "bg-purple-100",
      text: "text-purple-700",
    },
    diplomatura: {
      label: "Diplomatura",
      bg: "bg-orange-100",
      text: "text-orange-700",
    },
  };

export default function TipoCarreraBadge({
  tipo,
  className = "",
}: {
  tipo: string;
  className?: string;
}) {
  const config = TIPO_CONFIG[tipo] || TIPO_CONFIG.grado;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.text} ${className}`}
    >
      {config.label}
    </span>
  );
}
