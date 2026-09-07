import { Routes, Route } from "react-router";
import ProtectedRoute from "../shared/components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MateriasHorariosPage from "./pages/MateriasHorariosPage";
import MesasExamenPage from "./pages/MesasExamenPage";
import NoticiasPage from "./pages/NoticiasPage";
import CalendarioAdminPage from "./pages/CalendarioAdminPage";
import AvisosPage from "./pages/AvisosPage";
import PlantillasPage from "./pages/PlantillasPage";
import UbicacionesMapaPage from "./pages/UbicacionesMapaPage";
import VideoConfigPage from "./pages/VideoConfigPage";

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
        path="/horarios"
        element={
          <ProtectedRoute>
            <MateriasHorariosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mesas-examen"
        element={
          <ProtectedRoute>
            <MesasExamenPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/noticias"
        element={
          <ProtectedRoute>
            <NoticiasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendario-avisos"
        element={
          <ProtectedRoute>
            <CalendarioAdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/avisos"
        element={
          <ProtectedRoute>
            <AvisosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plantillas"
        element={
          <ProtectedRoute>
            <PlantillasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ubicaciones-mapa"
        element={
          <ProtectedRoute>
            <UbicacionesMapaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video"
        element={
          <ProtectedRoute>
            <VideoConfigPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
