// frontend/src/services/api.js
import axios from "axios";

// ✅ 1) Base URL desde env (Vercel/Render)
// ✅ 2) Fallback a localhost SOLO si no existe env
const baseURL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

// Normalizamos por si viene con / al final
const cleanBaseURL = String(baseURL).replace(/\/+$/, "");

const api = axios.create({
  baseURL: cleanBaseURL,
  withCredentials: true,
  timeout: 20000,
});

// Debug útil (solo en dev)
if (import.meta.env.DEV) {
  console.log("[api] baseURL =", cleanBaseURL);
}

export default api;
