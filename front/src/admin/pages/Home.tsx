import { Link } from "react-router";
import { useAuth } from "../../shared/context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8 gap-8">
      <div className="flex items-center gap-4">
        <h1 className="text-4xl font-bold">Panel de Administración</h1>
        <span className="text-gray-500 text-lg">({user?.username})</span>
      </div>

      <div className="flex gap-4">
        <Link
          to="/admin/vincular"
          className="bg-black text-white text-xl font-semibold px-8 py-4 rounded-2xl"
        >
          Vincular nuevo tótem
        </Link>

        <button
          onClick={logout}
          className="bg-gray-200 text-lg font-semibold px-6 py-4 rounded-2xl cursor-pointer"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
