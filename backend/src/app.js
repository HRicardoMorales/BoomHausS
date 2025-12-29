// backend/src/app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// ✅ Seguridad mínima
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

const productsRoutes = require('./routes/products.routes');
const healthRoutes = require('./routes/health.routes');
const ordersRoutes = require('./routes/orders.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

connectDB();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// ✅ CORS (permite frontend: local + Vercel prod + previews)
const allowedExact = new Set(
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.CLIENT_URL, // por si lo usás
  ].filter(Boolean)
);

// Opcional: agregar varios por env separados por coma
if (process.env.CLIENT_URLS) {
  process.env.CLIENT_URLS.split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .forEach((o) => allowedExact.add(o));
}

// ✅ Permitir previews de Vercel del proyecto (evita que se rompa cuando cambia el deploy URL)
function isAllowedOrigin(origin) {
  if (!origin) return true; // Postman/curl

  // exactos
  if (allowedExact.has(origin)) return true;

  // por hostname (para Vercel previews)
  try {
    const { hostname, protocol } = new URL(origin);

    // solo http/https
    if (protocol !== 'http:' && protocol !== 'https:') return false;

    // ✅ permite cualquier dominio de Vercel que empiece con boom-haus-
    // ej: boom-haus-xxxxx-ricardo-morales-projects.vercel.app
    if (hostname.startsWith('boom-haus-') && hostname.endsWith('.vercel.app')) return true;

    // ✅ si tenés el dominio production estable (recomendado)
    if (hostname === 'boom-haus.vercel.app') return true;

    return false;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error('CORS bloqueado para este origen: ' + origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ✅ Rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiadas solicitudes. Probá de nuevo en unos minutos.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiados intentos. Esperá 15 minutos y probá de nuevo.' }
});
const ordersLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiadas acciones en pedidos. Probá en unos minutos.' }
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/orders', ordersLimiter);

// ✅ uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ✅ routes
app.use('/api/health', healthRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/auth', authRoutes);

// ✅ errors al final
app.use(errorHandler);

module.exports = app;
