import { useEffect } from "react";
import { useFavicon } from "../shared/hooks/useFavicon";
import TotemRoutes from "./Routes";

export default function TotemApp() {
  useFavicon("/favicon-totem.png");
  useEffect(() => {
    document.title = "Tótem FRRe";
  }, []);
  return <TotemRoutes />;
}
