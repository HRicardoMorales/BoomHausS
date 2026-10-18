// backend/src/controllers/abandonedCart.controller.js
//
// Carritos abandonados: captura silenciosa desde el checkout (pública) y
// gestión desde el panel de admin. Antes vivía inline en app.js; acá queda
// separado en una función pura que arma el documento (testeable sin Mongo)
// y handlers finos. Los errores inesperados van a `next(err)` y los formatea
// el errorHandler global (Express 5 propaga también los rechazos async).

const AbandonedCart = require('../models/AbandonedCart');

const MAX_ITEMS = 50;
const MAX_TEXT = 300;
const MAX_NOTES = 2000;
const MAX_LIST = 500;
const DEFAULT_LIST = 100;

/** String recortado y acotado; cualquier cosa que no sea texto/número → ''. */
function text(value, max = MAX_TEXT) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).trim().slice(0, max);
}

function finiteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normaliza un ítem del carrito a los campos que muestra el admin.
 * Es un registro informativo: el precio NO se usa para cobrar (eso lo
 * valida el servidor al crear la orden), solo se guarda lo que vio el
 * cliente para poder contactarlo.
 */
function sanitizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = text(raw.name);
  const productId = text(raw.productId, 64);
  if (!name && !productId) return null;
  return {
    productId: productId || null,
    name,
    price: finiteNumber(raw.price) ?? 0,
    quantity: Math.max(1, Math.trunc(finiteNumber(raw.quantity) ?? 1)),
    imageUrl: text(raw.imageUrl, 1000) || null,
  };
}

/**
 * Arma el `$set` a partir del body del checkout.
 * Solo incluye los campos que llegaron, para no pisar datos capturados
 * en un paso anterior. Devuelve `null` si no hay ningún dato de contacto.
 */
function buildCaptureFields(body = {}) {
  const email = text(body.email).toLowerCase();
  const phone = text(body.phone, 40).replace(/[^\d+]/g, '');
  if (!email && !phone) return null;

  const fields = {};
  if (email) fields.email = email;
  if (phone) fields.phone = phone;

  for (const key of ['name', 'address', 'city', 'province', 'postalCode', 'step', 'landingSource', 'paymentMethod']) {
    const value = text(body[key]);
    if (value) fields[key] = value;
  }

  if (Array.isArray(body.items)) {
    const items = body.items.slice(0, MAX_ITEMS).map(sanitizeItem).filter(Boolean);
    if (items.length) {
      fields.items = items;
      fields.totalItems = finiteNumber(body.totalItems)
        ?? items.reduce((sum, it) => sum + it.quantity, 0);
    }
  }

  if (body.total != null) fields.totalAmount = finiteNumber(body.total) ?? 0;

  // Si vuelve a interactuar, lo reactivamos como pendiente.
  fields.recovered = false;
  return fields;
}

// POST /api/abandoned-cart
async function captureAbandonedCart(req, res) {
  const fields = buildCaptureFields(req.body || {});
  if (!fields) return res.status(400).json({ ok: false, message: 'Falta un dato de contacto.' });

  // Mismo cliente = mismo registro: primero por teléfono, si no por email.
  let existing = null;
  if (fields.phone) existing = await AbandonedCart.findOne({ phone: fields.phone }).select('_id');
  if (!existing && fields.email) existing = await AbandonedCart.findOne({ email: fields.email }).select('_id');

  if (existing) await AbandonedCart.updateOne({ _id: existing._id }, { $set: fields });
  else await AbandonedCart.create(fields);

  return res.json({ ok: true });
}

// GET /api/abandoned-carts?all=1&limit=100
async function listAbandonedCarts(req, res) {
  const showAll = req.query.all === '1' || req.query.all === 'true';
  const limit = Math.min(Math.max(Math.trunc(Number(req.query.limit)) || DEFAULT_LIST, 1), MAX_LIST);

  const carts = await AbandonedCart.find(showAll ? {} : { recovered: false })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit);

  return res.json({ ok: true, data: carts });
}

/** Fábrica para las acciones de admin que actualizan un carrito por id. */
function updateCart(buildUpdate) {
  return async function handler(req, res) {
    const cart = await AbandonedCart.findByIdAndUpdate(req.params.id, buildUpdate(req), { new: true });
    if (!cart) return res.status(404).json({ ok: false, message: 'Carrito no encontrado.' });
    return res.json({ ok: true, data: cart });
  };
}

// POST /api/abandoned-carts/:id/recover — recuperado o descartado
const markRecovered = updateCart(() => ({ recovered: true, recoveredAt: new Date() }));

// POST /api/abandoned-carts/:id/reopen — vuelve a pendiente
const reopenCart = updateCart(() => ({ recovered: false, recoveredAt: null }));

// POST /api/abandoned-carts/:id/contacted — registra el contacto (+ nota opcional)
const markContacted = updateCart((req) => {
  const notes = text(req.body?.notes, MAX_NOTES);
  return { contactedAt: new Date(), ...(notes ? { adminNotes: notes } : {}) };
});

// DELETE /api/abandoned-carts/:id
async function deleteAbandonedCart(req, res) {
  const cart = await AbandonedCart.findByIdAndDelete(req.params.id);
  if (!cart) return res.status(404).json({ ok: false, message: 'Carrito no encontrado.' });
  return res.json({ ok: true });
}

module.exports = {
  buildCaptureFields,
  sanitizeItem,
  captureAbandonedCart,
  listAbandonedCarts,
  markRecovered,
  reopenCart,
  markContacted,
  deleteAbandonedCart,
};
