import { useAuth } from "../../shared/context/AuthContext";
import AdminHeader from "../components/AdminHeader";
import Sidebar from "../components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {isAuthenticated && <AdminHeader />}
      <div className="flex flex-1 overflow-hidden">
        {isAuthenticated && <Sidebar />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
