import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Encabezado from "../../shared/components/widgets/Encabezado";
import Horarios from "../../shared/components/widgets/Horarios";
import Examenes from "../../shared/components/widgets/Examenes";
import Calendar from "../../shared/components/widgets/Calendar";
import Mapa from "../../shared/components/widgets/Mapa";
import { useTotemScale, TOTEM_WIDTH, TOTEM_HEIGHT } from "../../shared/hooks/useTotemScale";

const AUTH_TOKEN_KEY = "auth_token";

export default function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const { containerRef, scale } = useTotemScale();

  useEffect(() => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      navigate("/onboarding", { replace: true });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecking(false);
    }
  }, [navigate]);

  if (checking) return null;

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div
        className="shrink-0 bg-white border border-gray-200 rounded-3xl overflow-hidden"
        style={{
          width: TOTEM_WIDTH,
          height: TOTEM_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <div className="flex flex-col w-full h-full p-16 gap-16">
          <Encabezado />
          <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-6 gap-4">
            <Horarios />
            <Examenes />
            <Calendar />
            <Mapa />
          </div>
        </div>
      </div>
    </div>
  );
}
