// frontend/src/services/api.js
import axios from "axios";
import { clearAuth, getStoredAuth } from "../utils/auth";

// 🔍 DEBUG: Logs para ver qué pasa en Vercel
console.log("--- DEBUGGING API ---");
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("MODO DEV:", import.meta.env.DEV);

const PROD_FALLBACK = "https://boomhauss.onrender.com/api";

// ⚠️ CORREGIDO: Agregué 'export' aquí, que era lo que faltaba.
// Quitamos localhost temporalmente para forzar Render.
export const baseURL =
    (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
    PROD_FALLBACK; 

console.log("BaseURL final usada:", baseURL);

const api = axios.create({
    baseURL,
    timeout: 15000,
});

// ✅ Request interceptor
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

// ✅ Response interceptor
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