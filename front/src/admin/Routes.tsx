import { Routes, Route } from "react-router";
import ProtectedRoute from "../shared/components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import VincularTotem from "./pages/VincularTotem";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vincular"
        element={
          <ProtectedRoute>
            <VincularTotem />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
