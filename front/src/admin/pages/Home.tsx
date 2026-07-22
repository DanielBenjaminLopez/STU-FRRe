import { useTotem } from "../../shared/context/TotemContext";
import { Link } from "react-router";
import TotemPreview from "../components/TotemPreview";

export default function Home() {
  const { totems, selectedId, setSelectedId } = useTotem();

  const otherTotems = totems.filter((t) => String(t.id) !== selectedId);

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-hidden">
        <TotemPreview />
      </div>

      <div className="w-72 shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">
          Otros tótems
        </h3>
        <div className="flex flex-col gap-2">
          {otherTotems.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(String(t.id))}
              className="flex flex-col gap-1 p-4 text-left border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <span className="text-sm font-semibold text-gray-900 truncate">
                {t.nombre || `Tótem #${t.id}`}
              </span>
              <span className="text-xs text-gray-400 truncate">
                {t.espacio_nombre || "Sin ubicación"}
              </span>
              <div className="flex gap-2 mt-1">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    t.activo
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.activo ? "Activo" : "Inactivo"}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    t.vinculado
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.vinculado ? "Vinculado" : "Sin vincular"}
                </span>
              </div>
            </button>
          ))}

          {otherTotems.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              No hay otros tótems
            </p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link
            to="/admin/vincular"
            className="block w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors"
          >
            Vincular nuevo tótem
          </Link>
        </div>
      </div>
    </div>
  );
}
