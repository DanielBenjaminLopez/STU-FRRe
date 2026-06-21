import { AuthProvider } from "../shared/context/AuthContext";
import AdminRoutes from "./Routes";

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminRoutes />
    </AuthProvider>
  );
}
