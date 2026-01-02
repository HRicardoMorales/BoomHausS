// frontend/src/services/api.js
import axios from "axios";
import { clearAuth, getStoredAuth } from "../utils/auth";

// ------------------------------------------------------------------
// BASE URL
// - Si querés que tome .env cuando existe, dejalo así.
// - Si preferís FORZAR Render sí o sí, dejá la constante fija.
// ------------------------------------------------------------------

// ✅ Opción A (recomendada): usa env si existe, si no cae a Render
export const baseURL =
    import.meta.env?.VITE_API_URL || "https://boomhauss.onrender.com/api";

// ✅ Opción B (forzar 100% Render) - descomentá si querés sí o sí fijo
// export const baseURL = "https://boomhauss.onrender.com/api";

console.log("🔥 API baseURL:", baseURL);

const api = axios.create({
    baseURL,
    timeout: 45000, // ✅ antes 15000 -> evita fallo por cold start en Render
});

// ✅ Helper: “despertar” backend (llamalo al cargar Checkout/Home si querés)
export function warmUpApi() {
    // si tu ruta health es /api/health, acá va "/health" porque baseURL ya incluye "/api"
    return api.get("/health").catch(() => { });
}

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

// ✅ Response interceptor:
// - Si 401 => desloguea
// - Si timeout => reintenta 1 vez (muy útil con Render “frío”)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        const cfg = error?.config || {};

        // ✅ 401 -> logout
        if (status === 401) {
            clearAuth();

            const current = window.location.pathname || "";
            if (!current.startsWith("/login")) {
                window.location.href = "/login";
            }

            return Promise.reject(error);
        }

        // ✅ Retry 1 vez si fue timeout (ECONNABORTED)
        if (error?.code === "ECONNABORTED" && !cfg.__retry) {
            try {
                cfg.__retry = true;
                cfg.timeout = 45000; // asegura timeout alto en retry también
                return await api.request(cfg);
            } catch (e) {
                return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
