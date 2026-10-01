import { motion } from "motion/react";
import { useNoticias } from "../hooks/useNoticias";
import type { ContenidoFeed } from "../api/noticias";
import { NoticiaListSkeleton } from "../../../shared/components/ui/Skeleton";
import {
  overlayContainerVariants,
  overlayPanelVariants,
} from "../../widgets/overlayMotion";

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
      ? "bg-amber-100 text-amber-800 border-amber-200"
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
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
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
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center justify-center h-6 px-3 text-xs font-semibold rounded-full border ${badgeColor} backdrop-blur-sm bg-white/80 shadow-xs`}
          >
            {badgeLabel}
          </span>
          {item.espacio_nombre && (
            <span className="inline-flex items-center justify-center gap-1.5 h-6 px-3 text-xs font-semibold rounded-full border border-amber-200 bg-amber-50/90 text-amber-900 shadow-xs backdrop-blur-sm">
              <svg
                className="w-3 h-3 text-amber-700 shrink-0"
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
              {item.espacio_nombre}
            </span>
          )}
        </div>
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

export default function NoticiasFull({
  onClose,
  filter = "scraping",
  title = "Noticias",
}: {
  onClose: () => void;
  filter?: "all" | "scraping" | "creados";
  title?: string;
}) {
  const { feed, loading, error } = useNoticias({ filter });

  return (
    <motion.div
      variants={overlayContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center w-full h-full rounded-4xl"
    >
      <motion.div
        variants={overlayPanelVariants}
        className="flex flex-col bg-white/80 border border-gray-200 backdrop-blur-2xl w-full h-full overflow-hidden rounded-4xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-linear-to-br from-purple-300/50 to-purple-300/60">
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
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
      </motion.div>
    </motion.div>
  );
}
