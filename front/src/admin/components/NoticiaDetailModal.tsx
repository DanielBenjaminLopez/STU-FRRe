import { useEffect } from "react";
import type { Noticia } from "../../shared/api/noticias";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface NoticiaDetailModalProps {
  noticia: Noticia;
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
            <span className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
              {noticia.origen === "scraping" ? "UTN FRRe" : "Manual"}
            </span>
            <span className="text-sm text-gray-400">
              {formatDate(noticia.fecha_publicacion)}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 leading-snug">
            {noticia.titulo}
          </h2>

          <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
            {noticia.contenido}
          </p>
        </div>

        <div className="flex justify-end px-8 pb-8 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-2.5 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
