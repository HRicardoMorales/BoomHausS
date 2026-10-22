// backend/src/app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// ✅ Seguridad mínima
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { isDbReady } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/requestLogger');

const productsRoutes = require('./routes/products.routes');
const healthRoutes = require('./routes/health.routes');
const ordersRoutes = require('./routes/orders.routes');
const authRoutes = require('./routes/auth.routes');
const webhooksRoutes = require('./routes/webhooks.router');
const paymentsRoutes = require('./routes/payments.routes');
const couponsRoutes = require('./routes/coupons.routes');
const metricsRoutes = require('./routes/metrics');
const trackRoutes   = require('./routes/track.routes');

const abandonedCarts = require('./routes/abandonedCarts.routes');
const logger = require('./utils/logger').child('app');

const app = express();

app.set('trust proxy', 1);

// Access log + X-Request-Id (ver middlewares/requestLogger.js)
app.use(requestLogger);
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
    'https://amelor.com.ar',
    'https://www.amelor.com.ar',
    // dominios anteriores: se mantienen mientras redirijan a la tienda
    'https://boomhauss.com.ar',
    'https://www.boomhauss.com.ar',
    'https://boomhauss-frontend.vercel.app',
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

    // ✅ previews de Vercel de ESTE proyecto (scope ricardo-morales-projects)
    // ej: boom-haus-s-git-nightly-portfolio-ricardo-morales-projects.vercel.app
    if (
      protocol === 'https:' &&
      hostname.startsWith('boom-haus-') &&
      hostname.endsWith('-ricardo-morales-projects.vercel.app')
    ) return true;

    // ✅ si tenés el dominio production estable (recomendado)
    if (hostname === 'boom-haus.vercel.app') return true;

    return false;
  } catch {
    return false;
  }
}

const corsOptions = {
  // Antes era una lista fija que no incluía amelor.com.ar ni las previews;
  // ahora usa isAllowedOrigin (exactos + CLIENT_URL(S) + previews del proyecto).
  origin(origin, cb) {
    cb(null, isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
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

// ✅ DB readiness gate: si Mongoose no esta conectada, cortamos con 503
// + Retry-After en vez de dejar que la request cuelgue 30s buscando
// server selection. /api/health es el unico endpoint bajo /api que
// bypassa el gate — ahi decimos EL estado real de la BD (ver
// health.routes.js). El middleware corre despues de los rate limiters
// (evita que un DDoS por 503s escape del limit).
//
// Webhooks (MP, futuros): tambien se gatean con 503. Es lo correcto —
// MP reintenta ante 5xx con backoff exponencial (ver docs de MP), asi
// que un 503 NO significa notificacion perdida, solo diferida. Cuando
// Mongo vuelva, MP reintentara y procesaremos el pago con normalidad.
// Log especial con marca [WEBHOOK] para que se pueda auditar despues
// de una caida: grep "DB gate 503 [WEBHOOK]" en Render logs.
app.use('/api', (req, res, next) => {
    // req.path aca es relativo al mount ('/api'), asi que llegan cosas como
    // '/health', '/products', '/orders/card-payment', etc.
    if (req.path === '/health' || req.path.startsWith('/health/')) return next();
    if (isDbReady()) return next();

    const isWebhook = req.path.startsWith('/webhooks/');
    const tag = isWebhook ? 'DB gate 503 [WEBHOOK — proveedor reintentará]' : 'DB gate 503';
    logger.warn(`${tag} ${req.method} /api${req.path}`, {
        readyState: mongoose.connection.readyState,
        reqId: req.id,
    });

    res.set('Retry-After', '5');
    return res.status(503).json({
        ok: false,
        message: 'Base de datos no disponible temporalmente. Reintentá en unos segundos.',
        retry_after: 5,
    });
});

// ✅ uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ✅ routes
app.use('/api/health', healthRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/track',   trackRoutes);
app.use('/api/abandoned-cart',  abandonedCarts.captureRouter);
app.use('/api/abandoned-carts', abandonedCarts.adminRouter);

// ✅ errors al final
app.use(errorHandler);

// (Se removio /ping — redundante con /api/health, que ahora es el health
// check real y refleja el estado de la BD. Si algun servicio externo
// pinguea /ping esperando 200, cambiar a /api/health.)

module.exports = app;
