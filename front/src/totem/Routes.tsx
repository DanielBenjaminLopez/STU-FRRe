import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";

export default function TotemRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/onboarding" element={<Onboarding />} />
    </Routes>
  );
}
