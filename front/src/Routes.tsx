import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";

const TotemApp = lazy(() => import("./totem/App"));
const AdminApp = lazy(() => import("./admin/App"));

export default function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<TotemApp />} />
      </Routes>
    </Suspense>
  );
}
