import { useNavigate } from "react-router";
import { useAuth } from "../../shared/context/AuthContext";
import { useTotem } from "../../shared/context/TotemContext";
import Logo from "../../assets/logo_negro.webp";

export default function AdminHeader() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { totems, selectedId, setSelectedId } = useTotem();

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 shrink-0">
      <img src={Logo} alt="Logo UTN" className="h-10" draggable={false} />

      {isAuthenticated && (
        <>
          <div className="relative">
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                navigate("/admin");
              }}
              className="appearance-none px-4 py-2 pr-10 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-2xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              {totems.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre || `Tótem #${t.id}`}
                </option>
              ))}
              {totems.length === 0 && <option value="">Sin tótems</option>}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          <span className="text-sm text-gray-500">
            Bienvenido,{" "}
            <span className="font-semibold text-gray-900">
              {user?.username}
            </span>
          </span>
        </>
      )}
    </header>
  );
}
