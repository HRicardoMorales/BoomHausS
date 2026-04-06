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
const webhooksRoutes = require('./routes/webhooks.router');
const paymentsRoutes = require('./routes/payments.routes');

const AbandonedCart = require('./models/AbandonedCart');

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

// Busca donde tengas configurado 'cors' y cámbialo por esto:

const corsOptions = {
  origin: [
    "http://localhost:5173",                 // Tu PC local
    "https://boomhauss-frontend.vercel.app", // Tu link viejo de Vercel
    "https://boomhauss.com.ar",              // 👈 ESTE ES EL NUEVO QUE FALTABA
    "https://www.boomhauss.com.ar"           // El mismo con www
  ],
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

// ✅ uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ✅ routes
app.use('/api/health', healthRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/payments', paymentsRoutes);

// ──────────────────────────────────────────────────────────────
//  CARRITOS ABANDONADOS
// ──────────────────────────────────────────────────────────────

// POST /api/abandoned-cart  (captura silenciosa desde el checkout)
app.post('/api/abandoned-cart', async (req, res) => {
  try {
    const {
      email, phone, name,
      address, city, province, postalCode,
      items, total, totalItems,
      step, landingSource, paymentMethod,
    } = req.body || {};

    // Necesitamos al menos un dato de contacto para identificar al cliente
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').replace(/[^\d+]/g, '');
    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ ok: false, error: 'Falta contacto' });
    }

    // Buscar registro existente: primero por teléfono, si no por email
    let existing = null;
    if (cleanPhone) {
      existing = await AbandonedCart.findOne({ phone: cleanPhone });
    }
    if (!existing && cleanEmail) {
      existing = await AbandonedCart.findOne({ email: cleanEmail });
    }

    // Solo guardamos campos que realmente llegaron (para no borrar datos previos)
    const setFields = {};
    if (cleanEmail) setFields.email = cleanEmail;
    if (cleanPhone) setFields.phone = cleanPhone;
    if (name)        setFields.name = String(name).trim();
    if (address)     setFields.address = String(address).trim();
    if (city)        setFields.city = String(city).trim();
    if (province)    setFields.province = String(province).trim();
    if (postalCode)  setFields.postalCode = String(postalCode).trim();
    if (Array.isArray(items) && items.length) {
      setFields.items = items;
      setFields.totalItems = totalItems != null
        ? Number(totalItems)
        : items.reduce((a, it) => a + (Number(it?.quantity) || 0), 0);
    }
    if (total != null)        setFields.totalAmount = Number(total) || 0;
    if (step)                 setFields.step = String(step);
    if (landingSource)        setFields.landingSource = String(landingSource);
    if (paymentMethod)        setFields.paymentMethod = String(paymentMethod);
    // Si vuelve a interactuar, lo reactivamos como pendiente
    setFields.recovered = false;

    if (existing) {
      await AbandonedCart.findByIdAndUpdate(existing._id, { $set: setFields });
    } else {
      await AbandonedCart.create(setFields);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('❌ Error guardando carrito abandonado:', error);
    res.status(500).json({ ok: false, error: 'Error' });
  }
});

// GET /api/abandoned-carts  (listar — query: ?all=1, ?limit=100)
app.get('/api/abandoned-carts', async (req, res) => {
  try {
    const showAll = req.query.all === '1' || req.query.all === 'true';
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const query = showAll ? {} : { recovered: false };

    const carts = await AbandonedCart.find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit);
    res.json({ ok: true, data: carts });
  } catch (error) {
    console.error('❌ Error listando abandoned carts:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener carritos' });
  }
});

// POST /api/abandoned-carts/:id/recover  (marcar como recuperado/descartado)
app.post('/api/abandoned-carts/:id/recover', async (req, res) => {
  try {
    await AbandonedCart.findByIdAndUpdate(req.params.id, {
      recovered: true,
      recoveredAt: new Date(),
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Error' });
  }
});

// POST /api/abandoned-carts/:id/reopen  (volver a pendiente)
app.post('/api/abandoned-carts/:id/reopen', async (req, res) => {
  try {
    await AbandonedCart.findByIdAndUpdate(req.params.id, {
      recovered: false,
      recoveredAt: null,
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Error' });
  }
});

// POST /api/abandoned-carts/:id/contacted  (registrar que fue contactado)
app.post('/api/abandoned-carts/:id/contacted', async (req, res) => {
  try {
    await AbandonedCart.findByIdAndUpdate(req.params.id, {
      contactedAt: new Date(),
      ...(req.body?.notes ? { adminNotes: String(req.body.notes) } : {}),
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Error' });
  }
});

// DELETE /api/abandoned-carts/:id
app.delete('/api/abandoned-carts/:id', async (req, res) => {
  try {
    await AbandonedCart.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Error' });
  }
});
// ✅ errors al final
app.use(errorHandler);

// Ruta para mantener vivo el servidor (Ping)
app.get("/ping", (req, res) => {
  res.status(200).send("Pong! El backend esta despierto 🥩");
});

module.exports = app;
