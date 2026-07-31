import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Logo from "../../assets/logo_negro.webp";
import { createTotem } from "../../shared/api/totems";
import { useTotemWebSocket } from "../../shared/hooks/useTotemWebSocket";

// TODO(SCRUM-70): PENDIENTE — el código guardado puede quedar "fantasma" en el
// backend (tótem borrado o ya vinculado en otra sesión) y el kiosco lo muestra
// hasta VIGENCIA_HORAS sin validarlo. Hoy solo se auto-regenera si la conexión
// WebSocket es rechazada; queda pendiente un botón "Regenerar código" o la
// validación del código contra el backend antes de mostrarlo.
const AUTH_TOKEN_KEY = "auth_token";
const CODIGO_KEY = "totem_codigo_vinculacion";
const TIMESTAMP_KEY = "totem_codigo_timestamp";
const VIGENCIA_HORAS = 1;

function getStoredCode(): string | null {
  const codigo = localStorage.getItem(CODIGO_KEY);
  const timestamp = localStorage.getItem(TIMESTAMP_KEY);
  if (!codigo || !timestamp) return null;

  const elapsed = Date.now() - Number(timestamp);
  if (elapsed > VIGENCIA_HORAS * 3600 * 1000) {
    localStorage.removeItem(CODIGO_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
    return null;
  }
  return codigo;
}

function storeCode(codigo: string) {
  localStorage.setItem(CODIGO_KEY, codigo);
  localStorage.setItem(TIMESTAMP_KEY, String(Date.now()));
}

function clearCode() {
  localStorage.removeItem(CODIGO_KEY);
  localStorage.removeItem(TIMESTAMP_KEY);
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [codigo, setCodigo] = useState<string | null>(() => getStoredCode());
  const [error, setError] = useState("");

  const { lastMessage, rejected } = useTotemWebSocket(codigo);

  useEffect(() => {
    if (localStorage.getItem(AUTH_TOKEN_KEY)) {
      navigate("/", { replace: true });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecking(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (lastMessage?.type === "vinculado") {
      clearCode();
      if (lastMessage.access) {
        localStorage.setItem(AUTH_TOKEN_KEY, lastMessage.access as string);
      }
      navigate("/", { replace: true });
    }
  }, [lastMessage, navigate]);

  useEffect(() => {
    if (rejected) {
      clearCode();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCodigo(null);
    }
  }, [rejected]);

  useEffect(() => {
    if (codigo) return;
    if (checking) return;

    let cancelled = false;

    createTotem()
      .then(({ codigo_vinculacion }) => {
        if (!cancelled) {
          storeCode(codigo_vinculacion);
          setCodigo(codigo_vinculacion);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError("Error al obtener código. Intente nuevamente.");
      });

    return () => {
      cancelled = true;
    };
  }, [codigo, checking]);

  if (checking) return null;

  const handleReintentar = () => {
    setError("");
    setCodigo(null);
  };

  if (error) {
    return (
      <div className="flex flex-col max-w-270 h-480 mx-auto border-x border-gray-200 p-16 gap-16">
        <div className="flex flex-col justify-center items-center w-full gap-16">
          <img src={Logo} alt="Logo" className="w-80" draggable={false} />
          <span className="text-3xl text-red-500">{error}</span>
          <button
            onClick={handleReintentar}
            className="bg-black text-white text-xl font-semibold px-8 py-3 rounded-2xl cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-270 h-480 mx-auto border-x border-gray-200 p-16 gap-16">
      <div className="flex flex-col justify-center items-center w-full gap-16">
        <img src={Logo} alt="Logo" className="w-80" draggable={false} />
        <div className="flex flex-col items-center gap-4">
          <span className="text-3xl">Su código de emparejamiento es:</span>
          <span className="text-8xl font-bold">{codigo ?? "Cargando..."}</span>
        </div>

        <div className="flex flex-col items-center gap-4 bg-gray-100 px-8 py-16 rounded-4xl max-w-175">
          <span className="text-2xl">
            Para vincular este tótem, siga los siguientes pasos:
            <ol className="list-decimal ml-8">
              <li>
                Ingrese al <strong>panel de administración</strong> del Sistema
                de Tótems Universitarios desde una PC o dispositivo móvil.
              </li>
              <li>
                Seleccione <strong>Vincular nuevo tótem</strong>.
              </li>
              <li>
                Escriba el <strong>código de emparejamiento</strong>{" "}
                proporcionado.
              </li>
            </ol>
          </span>
        </div>
      </div>
    </div>
  );
}
