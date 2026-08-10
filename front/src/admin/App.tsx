import { AuthProvider } from "../shared/context/AuthContext";
import { TotemProvider } from "../shared/context/TotemContext";
import AdminLayout from "./layouts/AdminLayout";
import AdminRoutes from "./Routes";

export default function AdminApp() {
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
