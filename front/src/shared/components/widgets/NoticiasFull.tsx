import { useNoticias } from "../../hooks/useNoticias";
import type { ContenidoFeed } from "../../api/noticias";
import { NoticiaListSkeleton } from "../ui/Skeleton";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function NoticiaCard({ item }: { item: ContenidoFeed }) {
  const badgeLabel =
    item.tipo === "evento"
      ? (item.tipo_evento ?? "Evento")
      : item.origen === "scraping"
        ? "UTN FRRe"
        : "Noticia";

  const badgeColor =
    item.tipo === "evento"
      ? "bg-green-100 text-green-800 border-green-200"
      : item.origen === "scraping"
        ? "bg-blue-100 text-blue-800 border-blue-200"
        : "bg-purple-100 text-purple-800 border-purple-200";

  return (
    <div className="group flex flex-col w-full rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        {item.imagen_url ? (
          <>
            <img
              src={item.imagen_url}
              alt={item.titulo}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                const wrapper = (e.target as HTMLImageElement).closest(
                  ".relative",
                );
                if (wrapper) wrapper.classList.add("!bg-gray-100");
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeColor} backdrop-blur-sm bg-white/80`}
        >
          {badgeLabel}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <p className="text-xs font-medium text-gray-400">
          {formatDate(item.fecha)}
        </p>
        <h2 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
          {item.titulo}
        </h2>
        {item.contenido && (
          <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mt-0.5">
            {item.contenido}
          </p>
        )}
      </div>
    </div>
  );
}

export default function NoticiasFull({ onClose }: { onClose: () => void }) {
  const { feed, loading, error } = useNoticias();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center w-full h-full rounded-4xl">
      <div className="flex flex-col bg-white/80 border border-gray-200 backdrop-blur-2xl w-full h-full overflow-hidden rounded-4xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-linear-to-br from-purple-300/50 to-purple-300/60">
          <div>
            <h1 className="text-xl font-bold">Noticias y eventos</h1>
            {!loading && !error && feed.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {feed.length} publicaciones
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shadow-xs text-sm font-medium bg-white/50 border border-gray-200 px-8 py-1 rounded-2xl hover:bg-white/80 transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && <NoticiaListSkeleton count={4} />}

          {error && (
            <div className="flex items-center justify-center h-full">
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && feed.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-400">
                No hay noticias para mostrar
              </span>
            </div>
          )}

          {!loading && !error && feed.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {feed.map((item) => (
                <NoticiaCard key={`${item.tipo}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
