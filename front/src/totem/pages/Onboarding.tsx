import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Logo from "../../assets/logo_negro.webp";
import {
  ApiError,
  clearTotemToken,
  setTotemToken,
} from "../../shared/api/client";
import { createTotem, fetchTotemMe } from "../../shared/api/totems";
import { useTotemWebSocket } from "../../shared/hooks/useTotemWebSocket";
import { TotemStageCSS } from "../../shared/components/TotemStage";

const CODIGO_KEY = "totem_codigo_vinculacion";
const TIMESTAMP_KEY = "totem_codigo_timestamp";
const VIGENCIA_MINUTOS = 5;
const VIGENCIA_SEGUNDOS = VIGENCIA_MINUTOS * 60;

function getRemainingSeconds(): number {
  const timestamp = localStorage.getItem(TIMESTAMP_KEY);
  if (!timestamp) return VIGENCIA_SEGUNDOS;
  const elapsed = Math.floor((Date.now() - Number(timestamp)) / 1000);
  return Math.max(0, VIGENCIA_SEGUNDOS - elapsed);
}

function formatTiempo(totalSegundos: number): string {
  const mins = Math.floor(totalSegundos / 60);
  const secs = totalSegundos % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getStoredCode(): string | null {
  const codigo = localStorage.getItem(CODIGO_KEY);
  const timestamp = localStorage.getItem(TIMESTAMP_KEY);
  if (!codigo || !timestamp) return null;

  const elapsed = Date.now() - Number(timestamp);
  if (elapsed > VIGENCIA_MINUTOS * 60 * 1000) {
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
  const [segundosRestantes, setSegundosRestantes] = useState<number>(() =>
    getRemainingSeconds(),
  );
  const [error, setError] = useState("");

  const { lastMessage, rejected } = useTotemWebSocket(codigo);

  useEffect(() => {
    if (!codigo) return;

    setSegundosRestantes(getRemainingSeconds());

    const interval = setInterval(() => {
      const remaining = getRemainingSeconds();
      setSegundosRestantes(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        clearCode();
        setCodigo(null);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [codigo]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchTotemMe();
        if (!cancelled) navigate("/", { replace: true });
      } catch (err) {
        if (
          err instanceof ApiError &&
          (err.status === 401 || err.status === 403)
        ) {
          if (err.message === "Tótem desactivado") {
            if (!cancelled) navigate("/", { replace: true });
            return;
          }
          clearTotemToken();
        }
        if (!cancelled) {
          setChecking(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (lastMessage?.type === "vinculado") {
      clearCode();
      if (lastMessage.access) {
        setTotemToken(lastMessage.access as string);
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
      <TotemStageCSS className="bg-white">
        <div className="flex flex-col items-center justify-center w-full h-full p-16 gap-16">
          <div className="flex flex-col justify-center items-center w-full gap-16">
            <img src={Logo} alt="Logo" className="w-80" draggable={false} />
            <span className="text-3xl text-red-500">{error}</span>
            <button
              onClick={handleReintentar}
              className="bg-gray-900 hover:bg-gray-800 text-white text-xl font-semibold px-8 py-3.5 rounded-2xl cursor-pointer transition-colors shadow-sm"
            >
              Reintentar
            </button>
          </div>
        </div>
      </TotemStageCSS>
    );
  }

  return (
    <TotemStageCSS className="bg-white">
      <div className="flex flex-col items-center justify-center w-full h-full p-16 gap-12">
        <div className="flex flex-col justify-center items-center w-full gap-22">
          <img src={Logo} alt="Logo" className="w-80" draggable={false} />

          {/* Sección de Código de vinculación (sin tarjeta exterior) */}
          <div className="flex flex-col items-center justify-center gap-6">
            <span className="text-2xl font-medium text-gray-500 tracking-wide">
              Código de vinculación
            </span>

            {/* Casillas individuales grises sobre fondo blanco con animación escalonada */}
            <div
              className="flex items-center justify-center gap-3 sm:gap-4 my-2"
              aria-label={`Código: ${codigo ?? "Cargando"}`}
            >
              <span className="sr-only">{codigo ?? "Cargando..."}</span>
              {(codigo ? codigo.split("") : ["-", "-", "-", "-", "-"]).map(
                (char, index) => (
                  <div
                    key={`${codigo ?? "loading"}-${index}`}
                    className="w-20 h-28 bg-gray-50 border border-gray-200 rounded-3xl shadow-sm flex items-center justify-center text-7xl font-bold font-mono text-gray-900 animate-code-fade"
                    style={{
                      animationDelay: `${index * 60}ms`,
                      animationFillMode: "backwards",
                    }}
                  >
                    {char}
                  </div>
                ),
              )}
            </div>

            {codigo && (
              <div
                key={`badge-${codigo}`}
                className="flex items-center gap-4 bg-gray-50 border border-gray-200 px-6 py-3 rounded-full animate-code-fade shadow-sm"
              >
                {/* Gráfico de torta relleno que va perdiendo porciones */}
                <svg
                  className="w-10 h-10 -rotate-90 transform shrink-0 overflow-visible"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                >
                  {/* Plato / base de la torta vacía */}
                  <circle
                    cx="16"
                    cy="16"
                    r="15"
                    className="fill-white stroke-gray-300"
                    strokeWidth="1"
                  />
                  {/* Porción de la torta que se va consumiendo en sentido horario */}
                  <circle
                    cx="16"
                    cy="16"
                    r="8"
                    fill="transparent"
                    className={`transition-all duration-1000 ease-linear ${
                      segundosRestantes < 60 ? "text-amber-500" : "text-gray-900"
                    }`}
                    stroke="currentColor"
                    strokeWidth="16"
                    strokeDasharray="50.2655"
                    strokeDashoffset={
                      -50.2655 * (1 - segundosRestantes / VIGENCIA_SEGUNDOS)
                    }
                  />
                </svg>
                <span
                  className={`text-lg font-semibold tabular-nums transition-colors ${
                    segundosRestantes < 60 ? "text-amber-600" : "text-gray-700"
                  }`}
                >
                  Expira en {formatTiempo(segundosRestantes)}
                </span>
              </div>
            )}
          </div>

          {/* Tarjeta de instrucciones */}
          <div className="flex flex-col items-center gap-4 bg-gray-50 border border-gray-200/80 p-10 rounded-4xl w-full max-w-175">
            <span className="text-2xl text-gray-800">
              Para vincular este tótem, siga los siguientes pasos:
              <ol className="list-decimal ml-8 mt-3 space-y-2 text-gray-700">
                <li>
                  Ingrese al <strong>panel de administración</strong> del
                  Sistema de Tótems Universitarios desde una PC o dispositivo
                  móvil.
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

          <button
            onClick={handleReintentar}
            className="bg-gray-900 hover:bg-gray-800 text-white text-xl font-semibold px-8 py-3.5 rounded-2xl cursor-pointer transition-colors shadow-sm"
          >
            Regenerar código
          </button>
        </div>
      </div>
    </TotemStageCSS>
  );
}
