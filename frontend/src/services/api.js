// frontend/src/services/api.js
import axios from "axios";
import { clearAuth, getStoredAuth } from "../utils/auth";

// 🚀 CONFIGURACIÓN ÚNICA (Backend en Render)
// Esta es la única URL que usará el sistema, sin importar dónde estés.
export const baseURL = "https://boomhauss.onrender.com/api";

console.log("🔗 API Conectada exclusivamente a:", baseURL);

const api = axios.create({
    baseURL,
    // Aumentamos el tiempo de espera a 45s porque Render gratuito se "duerme"
    timeout: 45000, 
});

// ----------------------------------------------------------------------
// INTERCEPTORES (Seguridad)
// ----------------------------------------------------------------------

// 1. Request: Inyectar Token si existe
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

// 2. Response: Manejar sesión expirada (Error 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        if (status === 401) {
            console.warn("🔒 Sesión expirada. Redirigiendo a login...");
            clearAuth();
            const current = window.location.pathname || "";
            // Evitamos recargas infinitas si ya estamos en login
            if (!current.startsWith("/login") && !current.startsWith("/admin")) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// ----------------------------------------------------------------------
// WARM-UP (Despertar servidor de Render)
// ----------------------------------------------------------------------
export async function warmUpApi() {
    try {
        console.log("⏳ Contactando a Render para despertar el servidor...");
        // Intentamos un endpoint ligero
        await api.get("/products?limit=1"); 
        console.log("✅ Servidor Render respondió.");
        return true;
    } catch (e) {
        console.error("⚠️ El servidor de Render parece apagado o lento:", e.message);
        return false;
    }
}

export default api;