import { Routes, Route } from "react-router";
import Home from "./pages/Home";

export default function TotemRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
