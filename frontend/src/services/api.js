import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({ baseURL: BASE_URL });

const SESSION_KEY = "dc_admin_auth";

// Restore auth from sessionStorage on module load
const _saved = sessionStorage.getItem(SESSION_KEY);
if (_saved) {
  try {
    api.defaults.auth = JSON.parse(_saved);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function setAdminAuth(username, password) {
  api.defaults.auth = { username, password };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, password }));
}

export function clearAdminAuth() {
  delete api.defaults.auth;
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAdminAuthed() {
  return !!api.defaults.auth;
}

// Cases
export const createCase = (data) => api.post("/cases", data);
export const listCases = (params) => api.get("/cases", { params });
export const getCase = (id) => api.get(`/cases/${id}`);
export const updateCaseStatus = (id, data) => api.patch(`/cases/${id}/status`, data);

// Files
export const uploadFiles = (formData) =>
  api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const getFileUrl = (documentId) => `${BASE_URL}/files/${documentId}`;

// Service Types (public read, admin write)
export const listServiceTypes = (includeInactive = false) =>
  api.get("/service-types", { params: includeInactive ? { include_inactive: true } : {} });
export const createServiceType = (data) => api.post("/service-types", data);
export const updateServiceType = (id, data) => api.patch(`/service-types/${id}`, data);
export const deleteServiceType = (id) => api.delete(`/service-types/${id}`);

export const listServiceFields = (stId) => api.get(`/service-types/${stId}/fields`);
export const createServiceField = (stId, data) => api.post(`/service-types/${stId}/fields`, data);
export const updateServiceField = (fieldId, data) => api.patch(`/service-fields/${fieldId}`, data);
export const deleteServiceField = (fieldId) => api.delete(`/service-fields/${fieldId}`);
