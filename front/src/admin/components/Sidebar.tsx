import { NavLink } from "react-router";
import { useAuth } from "../../shared/context/AuthContext";

const navItems = [
  { to: "/admin", label: "Inicio", end: true },
  { to: "/admin/carreras", label: "Carreras" },
  { to: "/admin/materias", label: "Materias" },
  { to: "/admin/horarios", label: "Horarios" },
  { to: "/admin/mesas-examen", label: "Mesas de examen" },
  { to: "/admin/noticias", label: "Noticias" },
  { to: "/admin/eventos", label: "Eventos" },
  { to: "/admin/avisos", label: "Avisos" },
  { to: "/admin/plantillas", label: "Plantillas" },
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

      <div className="px-4 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={logout}
          className="w-full text-xs font-medium text-gray-400 hover:text-red-500 transition-colors text-center"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
