import { Routes, Route } from "react-router";
import TotemApp from "./totem/App";
import AdminApp from "./admin/App";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/*" element={<TotemApp />} />
    </Routes>
  );
}
