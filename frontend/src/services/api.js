// frontend/src/services/api.js
import axios from "axios";
import { clearAuth, getStoredAuth } from "../utils/auth";

// ✅ Backend de producción (Render)
const PROD_API = "https://boomhauss.onrender.com/api";

// ✅ Si VITE_API_URL existe, úsala. Si no existe:
// - en PROD => Render
// - en DEV  => localhost
export const baseURL =
  (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
  (import.meta.env.PROD ? PROD_API : "http://localhost:4000/api");

// (opcional) log útil
console.log("API base:", baseURL);

const api = axios.create({
  baseURL,
  // ✅ Render puede tardar por cold-start. Subimos timeout.
  timeout: 30000,
});

// ✅ Request interceptor: agrega token si existe
api.interceptors.request.use(
  (config) => {
    const { token } = getStoredAuth();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor: si 401, desloguea y manda a login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      clearAuth();
      const current = window.location.pathname || "";
      if (!current.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
