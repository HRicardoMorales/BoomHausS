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

// 4) Creamos la app de Express
const app = express();

// ✅ (Producción) si deployás detrás de proxy (Render/Railway/Vercel/NGINX)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// 5) Conectamos a la base de datos
connectDB();

// ✅ Helmet: headers de seguridad
// Importante: como servís /uploads y el frontend está en otro origen,
// seteamos crossOriginResourcePolicy a "cross-origin" para que las imágenes no se bloqueen.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// ✅ CORS (permite frontend)
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];

// Si querés varios, podés setear CLIENT_URLS separados por coma
if (process.env.CLIENT_URLS) {
  process.env.CLIENT_URLS.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((o) => allowedOrigins.push(o));
}

app.use(
  cors({
    origin: function (origin, cb) {
      // Permite requests sin origin (Postman, curl)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error('CORS bloqueado para este origen: ' + origin));
    },
    credentials: true
  })
);

// ✅ Limitar tamaño de JSON (anti abuso)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(cookieParser());

// ✅ Rate limit (anti spam / brute force)
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

// Aplicamos limiters
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/orders', ordersLimiter);

// ✅ Servir comprobantes / uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 7) Rutas
app.use('/api/health', healthRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/auth', authRoutes);

// 8) Middleware de errores (siempre al final)
app.use(errorHandler);

// 9) Exportamos la app
module.exports = app;
