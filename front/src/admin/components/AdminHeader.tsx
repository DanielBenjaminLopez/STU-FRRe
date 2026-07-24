import { useAuth } from "../../shared/context/AuthContext";
import { useTotem } from "../../shared/context/TotemContext";
import Logo from "../../assets/logo_negro.webp";

export default function AdminHeader() {
  const { user, isAuthenticated } = useAuth();
  const { totems, selectedId, setSelectedId } = useTotem();

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 shrink-0">
      <img src={Logo} alt="Logo UTN" className="h-10" draggable={false} />

      {isAuthenticated && (
        <>
          <div className="flex items-center gap-2">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-2xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              {totems.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre || `Tótem #${t.id}`}
                </option>
              ))}
              {totems.length === 0 && <option value="">Sin tótems</option>}
            </select>
          </div>

          <span className="text-sm text-gray-500">
            Bienvenido,{" "}
            <span className="font-semibold text-gray-900">{user?.username}</span>
          </span>
        </>
      )}
    </header>
  );
}
