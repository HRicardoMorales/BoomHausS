// frontend/src/services/api.js
import axios from "axios";
import { clearAuth, getStoredAuth } from "../utils/auth";

// ✅ Si Vercel NO inyecta la env en build, esto evita que producción use localhost.
const PROD_FALLBACK = "https://boomhauss.onrender.com/api";
const DEV_FALLBACK = "http://localhost:4000/api";

// Vite define import.meta.env.DEV true solo en dev (npm run dev)
export const baseURL =
    (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
    (import.meta.env.DEV ? DEV_FALLBACK : PROD_FALLBACK);

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
