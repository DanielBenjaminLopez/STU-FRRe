import { useEffect } from "react";
import { AuthProvider } from "../shared/context/AuthContext";
import { TotemProvider } from "../shared/context/TotemContext";
import { useFavicon } from "../shared/hooks/useFavicon";
import AdminLayout from "./layouts/AdminLayout";
import AdminRoutes from "./Routes";

export default function AdminApp() {
  useFavicon("/favicon-totem.png");
  useEffect(() => {
    document.title = "Panel Admin · FRRe";
  }, []);
  return (
    <AuthProvider>
      <TotemProvider>
        <AdminLayout>
          <AdminRoutes />
        </AdminLayout>
      </TotemProvider>
    </AuthProvider>
  );
}
