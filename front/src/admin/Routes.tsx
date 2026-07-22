import { Routes, Route } from "react-router";
import ProtectedRoute from "../shared/components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import VincularTotem from "./pages/VincularTotem";
import CarrerasPage from "./pages/CarrerasPage";
import MateriasPage from "./pages/MateriasPage";
import HorariosPage from "./pages/HorariosPage";
import MesasExamenPage from "./pages/MesasExamenPage";
import NoticiasPage from "./pages/NoticiasPage";
import EventosPage from "./pages/EventosPage";
import AvisosPage from "./pages/AvisosPage";

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
      <Route
        path="/carreras"
        element={
          <ProtectedRoute>
            <CarrerasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/materias"
        element={
          <ProtectedRoute>
            <MateriasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/horarios"
        element={
          <ProtectedRoute>
            <HorariosPage />
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
        path="/eventos"
        element={
          <ProtectedRoute>
            <EventosPage />
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
    </Routes>
  );
}
