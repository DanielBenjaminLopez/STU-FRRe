import { NavLink } from "react-router";
import { useAuth } from "../../shared/context/AuthContext";
import {
  fetchHorarios,
  fetchMaterias,
} from "../../features/horarios/api/horariosAdmin";
import { fetchCarreras } from "../../shared/api/carreras";
import { fetchMesasExamen } from "../../features/examenes/api/mesasExamen";
import { fetchNoticias } from "../../features/noticias/api/noticias";
import { fetchEventos } from "../../features/noticias/api/eventos";
import { fetchEventosCalendario } from "../../features/calendario/api/calendarioAdmin";
import { fetchAvisos } from "../../features/layout/api/avisos";
import { fetchUbicacionesMapa } from "../../features/mapa/api/ubicacionesMapa";
import { fetchPlantillas } from "../../features/widgets/api/plantillas";
import { fetchWidgets } from "../../features/widgets/api/widgets";

function prefetchAll(...promises: Promise<unknown>[]) {
  for (const p of promises) {
    p.catch(() => {});
  }
}

const navItems: {
  to: string;
  label: string;
  end?: boolean;
  prefetch?: () => void;
}[] = [
  {
    to: "/admin",
    label: "Inicio",
    end: true,
    prefetch: () => prefetchAll(fetchPlantillas()),
  },
  {
    to: "/admin/horarios",
    label: "Horarios",
    prefetch: () =>
      prefetchAll(fetchMaterias(), fetchHorarios(), fetchCarreras()),
  },
  {
    to: "/admin/mesas-examen",
    label: "Mesas de examen",
    prefetch: () => prefetchAll(fetchMesasExamen(), fetchCarreras()),
  },
  {
    to: "/admin/noticias",
    label: "Noticias",
    prefetch: () => prefetchAll(fetchNoticias()),
  },
  {
    to: "/admin/eventos",
    label: "Eventos",
    prefetch: () => prefetchAll(fetchEventos()),
  },
  {
    to: "/admin/calendario-avisos",
    label: "Calendario",
    prefetch: () => prefetchAll(fetchEventosCalendario()),
  },
  {
    to: "/admin/avisos",
    label: "Avisos",
    prefetch: () => prefetchAll(fetchAvisos()),
  },
  {
    to: "/admin/ubicaciones-mapa",
    label: "Mapas",
    prefetch: () => prefetchAll(fetchUbicacionesMapa()),
  },
  {
    to: "/admin/plantillas",
    label: "Plantillas",
    prefetch: () => prefetchAll(fetchPlantillas(), fetchWidgets()),
  },
  { to: "/admin/video", label: "Video" },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="flex flex-col w-48 h-full bg-white border-r border-gray-200 shrink-0">
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onMouseEnter={item.prefetch}
                onFocus={item.prefetch}
                className={({ isActive }) =>
                  `block px-4 py-2.5 text-sm font-medium rounded-2xl transition-colors ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center justify-center px-4 h-16 border-t border-gray-200 shrink-0">
        <button
          type="button"
          onClick={logout}
          className="w-full text-sm font-medium text-gray-400 hover:text-red-500 transition-colors text-center cursor-pointer"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
