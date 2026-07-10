import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Encabezado from "../../shared/components/widgets/Encabezado";
import Horarios from "../../shared/components/widgets/Horarios";

const AUTH_TOKEN_KEY = "auth_token";

export default function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

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
    <div className="flex flex-col max-w-270 h-480 mx-auto border-x border-gray-200 p-16 gap-16">
      <Encabezado />

      <div className="flex flex-col grow">
        <div className="grid grid-cols-4 gap-4 grid-rows-6 w-full h-full">
          <Horarios />
        </div>
      </div>
    </div>
  );
}
