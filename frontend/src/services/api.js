// frontend/src/services/api.js
import axios from "axios";
import { clearAuth, getStoredAuth } from "../utils/auth";

function normalizeBase(url) {
    if (!url) return "";
    return String(url).trim().replace(/\/+$/, ""); // saca slash final
}

// Si te pasan "https://dominio.com" lo convertimos a "https://dominio.com/api"
function ensureApiSuffix(url) {
    const base = normalizeBase(url);
    if (!base) return base;
    return base.endsWith("/api") ? base : `${base}/api`;
}

// ✅ Named export (así no vuelve a fallar "baseURL is not exported")
export const baseURL = ensureApiSuffix(
    import.meta.env.VITE_API_URL || "https://boomhauss.onrender.com/api"
);

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
