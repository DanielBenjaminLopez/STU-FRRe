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

function NoticiaRow({ item }: { item: ContenidoFeed }) {
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
    <div className="flex gap-4 items-start w-full p-4 border border-gray-200 bg-white/50 rounded-2xl">
      {item.imagen_url && (
        <img
          src={item.imagen_url}
          alt=""
          className="shrink-0 w-24 h-24 object-cover rounded-2xl"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div className="flex flex-col justify-center gap-2 items-start min-w-0 flex-1">
        <div className="flex gap-2 items-center">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full border ${badgeColor}`}
          >
            {badgeLabel}
          </span>
          <span className="text-xs font-medium text-gray-400">
            {formatDate(item.fecha)}
          </span>
        </div>
        <span className="text-sm font-semibold line-clamp-1">
          {item.titulo}
        </span>
        {item.contenido && (
          <span className="text-xs font-normal text-gray-500 line-clamp-2">
            {item.contenido}
          </span>
        )}
      </div>
    </div>
  );
}

export default function NoticiasFull({ onClose }: { onClose: () => void }) {
  const { feed, loading, error } = useNoticias();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center w-full h-full bg-black/50 p-8">
      <div className="flex flex-col bg-white/70 backdrop-blur-md w-full h-full overflow-hidden rounded-4xl">
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <h1 className="text-xl font-semibold">Noticias y eventos</h1>
          <button
            type="button"
            onClick={onClose}
            className="shadow-xs text-sm font-medium bg-white/50 border border-gray-200 px-8 py-1 rounded-2xl"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
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
            <div className="flex flex-col gap-3">
              {feed.map((item) => (
                <NoticiaRow key={`${item.tipo}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
