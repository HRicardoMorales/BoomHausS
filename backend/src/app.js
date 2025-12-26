// backend/src/app.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

// ✅ Seguridad mínima
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");

const productsRoutes = require("./routes/products.routes");
const healthRoutes = require("./routes/health.routes");
const ordersRoutes = require("./routes/orders.routes");
const authRoutes = require("./routes/auth.routes");

// 4) Creamos la app de Express
const app = express();

// ✅ (Producción) si deployás detrás de proxy (Render/Railway/Vercel/NGINX)
app.set("trust proxy", 1);
app.disable("x-powered-by");

// 5) Conectamos a la base de datos
connectDB();

// ✅ Helmet: headers de seguridad
app.use(
  helmet({
    // para que /uploads (imágenes) se puedan ver desde el frontend en otro dominio
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* =========================
   ✅ CORS ROBUSTO
   - Soporta CORS_ORIGINS (recomendado)
   - Soporta CLIENT_URL / CLIENT_URLS (compatibilidad)
   - Normaliza origin (sin trailing slash)
========================= */
function normalizeOrigin(origin) {
  try {
    return new URL(origin).origin; // e.g. https://xxx.vercel.app
  } catch {
    return origin;
  }
}

const allowedOrigins = new Set();

// ✅ Recomendado: CORS_ORIGINS="http://localhost:5173,https://tuapp.vercel.app,https://tubackend..."
if (process.env.CORS_ORIGINS) {
  process.env.CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeOrigin)
    .forEach((o) => allowedOrigins.add(o));
}

// ✅ Compatibilidad: CLIENT_URL / CLIENT_URLS
const clientUrl = process.env.CLIENT_URL;
if (clientUrl) allowedOrigins.add(normalizeOrigin(clientUrl));

if (process.env.CLIENT_URLS) {
  process.env.CLIENT_URLS.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeOrigin)
    .forEach((o) => allowedOrigins.add(o));
}

// ✅ Defaults locales
allowedOrigins.add("http://localhost:5173");
allowedOrigins.add("http://127.0.0.1:5173");

const corsOptions = {
  origin: function (origin, cb) {
    // Permite requests sin origin (Postman, curl)
    if (!origin) return cb(null, true);

    const o = normalizeOrigin(origin);

    if (allowedOrigins.has(o)) return cb(null, true);

    // ✅ Opcional: permitir previews de Vercel de tu proyecto (si no querés, borrá este bloque)
    if (o.endsWith(".vercel.app") && o.includes("boom-haus")) return cb(null, true);

    return cb(new Error("CORS bloqueado para este origen: " + o));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// ✅ Preflight
app.options(/.*/, cors(corsOptions));


/* =========================
   Parsers
========================= */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

/* =========================
   Rate limit
========================= */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Demasiadas solicitudes. Probá de nuevo en unos minutos." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Demasiados intentos. Esperá 15 minutos y probá de nuevo." },
});

const ordersLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Demasiadas acciones en pedidos. Probá en unos minutos." },
});

// Aplicamos limiters
app.use("/api", generalLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/orders", ordersLimiter);

/* =========================
   Static uploads
========================= */
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

/* =========================
   Routes
========================= */
app.use("/api/health", healthRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/auth", authRoutes);

// 8) Middleware de errores (siempre al final)
app.use(errorHandler);

// 9) Exportamos la app
module.exports = app;
