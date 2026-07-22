import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import CampusMap from "./pages/Mapa";

export default function TotemRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/onboarding" element={<Onboarding />} />\
      <Route path="/mapa" element={<CampusMap />} />
    </Routes>
  );
}
