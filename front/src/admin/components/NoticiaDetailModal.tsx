import { useEffect } from "react";
import type { ContenidoFeed } from "../../shared/api/noticias";
import Button from "./Button";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface NoticiaDetailModalProps {
  noticia: ContenidoFeed;
  onClose: () => void;
}

export default function NoticiaDetailModal({
  noticia,
  onClose,
}: NoticiaDetailModalProps) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const isEvento = noticia.tipo === "evento";

  const badgeLabel = isEvento
    ? ["Evento", noticia.tipo_evento, noticia.espacio_nombre]
        .filter(Boolean)
        .join(" · ")
    : noticia.origen === "scraping"
      ? "UTN FRRe"
      : "Manual";

  const badgeColor = isEvento
    ? "text-green-700 bg-green-50"
    : "text-blue-700 bg-blue-50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-4xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {noticia.imagen_url && (
          <div className="relative h-64 shrink-0 overflow-hidden">
            <img
              src={noticia.imagen_url}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <div className="flex flex-col gap-4 p-8 overflow-y-auto flex-1">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${badgeColor}`}
            >
              {badgeLabel}
            </span>
            <span className="text-sm text-gray-400">
              {formatDate(noticia.fecha)}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 leading-snug">
            {noticia.titulo}
          </h2>

          {isEvento && noticia.espacio_nombre && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {noticia.espacio_nombre}
            </div>
          )}

          {isEvento && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDateTime(noticia.fecha)}
            </div>
          )}

          <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
            {noticia.contenido}
          </p>
        </div>

        <div className="flex justify-end px-8 pb-8 pt-2">
          <Button variant="primary" size="md" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
