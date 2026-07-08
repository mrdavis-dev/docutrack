import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ClientPortal from "./pages/ClientPortal";
import AdminDashboard from "./pages/AdminDashboard";
import CaseDetail from "./pages/CaseDetail";
import ServiceTypeManager from "./pages/ServiceTypeManager";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientPortal />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/cases/:id" element={<CaseDetail />} />
        <Route path="/admin/services" element={<ServiceTypeManager />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
