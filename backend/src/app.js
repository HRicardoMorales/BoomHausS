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

// ✅ CORS (Render/Vercel + Local)
// - FRONTEND_URL: 1 solo origen (ej: https://tu-front.vercel.app)
// - CORS_ORIGINS: varios separados por coma (ej: https://a.com,https://b.com)
const baseClient =
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  'http://localhost:5173';

const allowedOrigins = new Set([
  baseClient,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

const extra =
  process.env.CORS_ORIGINS ||
  process.env.CLIENT_URLS ||
  '';

extra
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .forEach(o => allowedOrigins.add(o));

app.use(
  cors({
    origin: function (origin, cb) {
      // Permite requests sin origin (Postman, curl)
      if (!origin) return cb(null, true);

      if (allowedOrigins.has(origin)) return cb(null, true);

      return cb(new Error('CORS bloqueado para este origen: ' + origin));
    },
    credentials: true
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
