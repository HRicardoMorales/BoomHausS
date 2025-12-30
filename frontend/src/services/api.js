// frontend/src/services/api.js
import axios from "axios";
import { clearAuth, getStoredAuth } from "../utils/auth";

// 🔍 DEBUG: Esto nos dirá la verdad en la consola del navegador (F12)
console.log("--- DEBUGGING API ---");
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("MODO DEV:", import.meta.env.DEV);

const PROD_FALLBACK = "https://boomhauss.onrender.com/api";

// ⚠️ CAMBIO FUERTE: Quitamos la opción de localhost del fallback temporalmente.
// Si esto falla, debería intentar conectar a Render, NO a localhost.
const baseURL =
    (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
    PROD_FALLBACK; // 👈 Forzamos Render si falla la variable

console.log("BaseURL final usada:", baseURL);

const api = axios.create({
    baseURL,
    timeout: 15000,
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