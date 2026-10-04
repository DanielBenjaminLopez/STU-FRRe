import { useEffect } from "react";
import TotemRoutes from "./Routes";

export default function TotemApp() {
  useEffect(() => {
    document.title = "Tótem FRRe";
  }, []);
  return <TotemRoutes />;
}
