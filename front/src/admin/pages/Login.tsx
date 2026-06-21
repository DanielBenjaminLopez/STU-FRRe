import { useState } from "react";
import { redirect } from "react-router";
import { useAuth } from "../../shared/context/AuthContext";
import Logo from "../../assets/logo_negro.webp";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      redirect("/admin/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-8 bg-white p-12 rounded-4xl shadow-lg max-w-100 w-full"
      >
        <img src={Logo} alt="Logo" className="w-60" draggable={false} />

        <div className="flex flex-col gap-4 w-full">
          <label className="flex flex-col gap-1 text-lg">
            Usuario
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 text-lg"
              required
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1 text-lg">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 text-lg"
              required
            />
          </label>
        </div>

        {error && <span className="text-red-500 text-base">{error}</span>}

        <button
          type="submit"
          className="bg-black text-white text-xl font-semibold px-8 py-3 rounded-2xl w-full cursor-pointer"
        >
          Iniciar sesión
        </button>
      </form>
    </div>
  );
}
