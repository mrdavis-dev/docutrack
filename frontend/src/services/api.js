import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({ baseURL: BASE_URL });

const TOKEN_KEY = "dc_admin_token";

function applyToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

applyToken(sessionStorage.getItem(TOKEN_KEY));

export async function login(username, password) {
  const { data } = await api.post("/auth/login", { username, password });
  sessionStorage.setItem(TOKEN_KEY, data.token);
  applyToken(data.token);
  return data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    /* token already invalid server-side — fine, we're clearing it anyway */
  }
  sessionStorage.removeItem(TOKEN_KEY);
  applyToken(null);
}

export function isAdminAuthed() {
  return !!sessionStorage.getItem(TOKEN_KEY);
}

// Server is the real source of truth for session validity: any 401 (revoked/expired
// session — including a token replayed from a bfcache-restored page after logout) clears
// the local token immediately, so isAdminAuthed() reflects reality on the very next check.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY);
      applyToken(null);
    }
    return Promise.reject(err);
  }
);

// Cases
export const createCase = (data) => api.post("/cases", data);
export const listCases = (params) => api.get("/cases", { params });
export const getCase = (id) => api.get(`/cases/${id}`);
export const updateCaseStatus = (id, data) => api.patch(`/cases/${id}/status`, data);
export const updateCaseTotal = (id, total_amount) => api.patch(`/cases/${id}/total`, { total_amount });

// Files
export const uploadFiles = (formData) =>
  api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const getFileUrl = (documentId) => `${BASE_URL}/files/${documentId}`;
// A plain <a href> wouldn't carry the Authorization header. Fetch through axios
// (which does) and hand back a blob: URL instead.
export const fetchFileBlob = (documentId) =>
  api.get(`/files/${documentId}`, { responseType: "blob" });

// Service Types (public read, admin write)
export const listServiceTypes = (includeInactive = false) =>
  api.get("/service-types", { params: includeInactive ? { include_inactive: true } : {} });
export const createServiceType = (data) => api.post("/service-types", data);
export const updateServiceType = (id, data) => api.patch(`/service-types/${id}`, data);
export const deleteServiceType = (id) => api.delete(`/service-types/${id}`);

// Payments (abonos)
export const listPayments = (caseId) => api.get(`/cases/${caseId}/payments`);
export const createPayment = (caseId, formData) =>
  api.post(`/cases/${caseId}/payments`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const sendPaymentReceipt = (caseId, paymentId) =>
  api.post(`/cases/${caseId}/payments/${paymentId}/send-receipt`);

export const listServiceFields = (stId) => api.get(`/service-types/${stId}/fields`);
export const createServiceField = (stId, data) => api.post(`/service-types/${stId}/fields`, data);
export const updateServiceField = (fieldId, data) => api.patch(`/service-fields/${fieldId}`, data);
export const deleteServiceField = (fieldId) => api.delete(`/service-fields/${fieldId}`);

// Admin users
export const listUsers = () => api.get("/users");
export const createUser = (data) => api.post("/users", data);
export const deactivateUser = (userId) => api.patch(`/users/${userId}/deactivate`);

// Branding (public read, admin write)
export const getSettings = () => api.get("/settings");
export const updateBrandColor = (brand_color) => api.put("/settings/color", { brand_color });
export const updateLogo = (file) => {
  const fd = new FormData();
  fd.append("logo", file);
  return api.put("/settings/logo", fd, { headers: { "Content-Type": "multipart/form-data" } });
};
export const getLogoUrl = () => `${BASE_URL}/settings/logo`;
export const updateTitle = (portal_title, portal_subtitle) =>
  api.put("/settings/title", { portal_title, portal_subtitle });
