import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ClientPortal from "./pages/ClientPortal";
import AdminDashboard from "./pages/AdminDashboard";
import CaseDetail from "./pages/CaseDetail";
import ServiceTypeManager from "./pages/ServiceTypeManager";
import UserManager from "./pages/UserManager";
import { isAdminAuthed } from "./services/api";

// ponytail: guard is just "do we have saved credentials in memory" — the backend's 401 on
// every request is still the real gate. The re-check on "pageshow" matters: after logout,
// pressing Back can restore this exact page from bfcache without React remounting it, so a
// mount-only check would never re-run. pageshow with event.persisted=true is the browser's
// signal that happened, and re-renders this component so the guard fires again.
function RequireAdmin({ children }) {
  const [authed, setAuthed] = useState(isAdminAuthed);

  useEffect(() => {
    const recheck = () => setAuthed(isAdminAuthed());
    window.addEventListener("pageshow", recheck);
    return () => window.removeEventListener("pageshow", recheck);
  }, []);

  return authed ? children : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientPortal />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/cases/:id" element={<RequireAdmin><CaseDetail /></RequireAdmin>} />
        <Route path="/admin/services" element={<RequireAdmin><ServiceTypeManager /></RequireAdmin>} />
        <Route path="/admin/users" element={<RequireAdmin><UserManager /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
