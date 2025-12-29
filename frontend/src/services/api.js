// frontend/src/services/api.js
import axios from "axios";
import { clearAuth, getStoredAuth } from "../utils/auth";

// ✅ Siempre por defecto a /api (Vercel lo proxya a Render con vercel.json)
export const baseURL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

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
            if (!current.startsWith("/login")) window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default api;
