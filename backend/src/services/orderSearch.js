// backend/src/services/orderSearch.js
//
// Búsqueda y estadísticas del panel de pedidos, del lado del servidor.
//
// Por qué: con el listado paginado (orderListing.js) el admin ya no tiene
// todos los pedidos en memoria, así que las tarjetas ("Recaudado",
// "A revisar"…) y el buscador calculados en el navegador quedarían
// parciales. Acá se arma el filtro de Mongo para `?q=`/`?status=` y un
// `aggregate` de una sola pasada para las estadísticas.
//
// Todo es puro (sin modelo ni red): el controller pasa el resultado a
// `Order.find`/`Order.aggregate` y los tests lo prueban sin Mongo.

const PAYMENT_STATUSES = Object.freeze([
  'pending', 'proof_uploaded', 'approved', 'confirmed', 'rejected', 'cancelled',
]);

const MAX_QUERY = 80;
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

/** Escapa los metacaracteres: `.*` busca ".*" literal, no "todo". */
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Los mismos campos que filtraba antes el panel en el navegador.
const SEARCH_FIELDS = Object.freeze([
  'customerName', 'customerEmail', 'customerPhone', 'customerDni', 'items.name',
]);

/**
 * `{ q, status }` → filtro de Mongo (o `{}` si no hay nada que filtrar).
 * - `q`: "contiene", sin distinguir mayúsculas, en los campos de contacto
 *   y nombres de producto. Si es un ObjectId completo también busca por `_id`.
 * - `status`: estado de pago exacto; `todos`/vacío no filtra.
 */
function buildOrderFilter({ q, status } = {}, toObjectId = (x) => x) {
  const and = [];

  if (typeof status === 'string' && PAYMENT_STATUSES.includes(status)) {
    and.push({ paymentStatus: status });
  }

  const term = typeof q === 'string' ? q.trim().slice(0, MAX_QUERY) : '';
  if (term) {
    const rx = { $regex: escapeRegex(term), $options: 'i' };
    const or = SEARCH_FIELDS.map((field) => ({ [field]: rx }));
    if (OBJECT_ID_RE.test(term)) or.unshift({ _id: toObjectId(term.toLowerCase()) });
    and.push({ $or: or });
  }

  if (and.length === 0) return {};
  return and.length === 1 ? and[0] : { $and: and };
}

/** Combina dos filtros sin pisar claves (`$or` del cursor y `$or` de la búsqueda). */
function mergeFilters(a, b) {
  const parts = [a, b].filter((f) => f && Object.keys(f).length > 0);
  if (parts.length === 0) return {};
  return parts.length === 1 ? parts[0] : { $and: parts };
}

const countIf = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });
const eq = (field, value) => ({ $eq: [`$${field}`, value] });

/**
 * Pipeline de una sola pasada: un `$group` con todos los contadores.
 * Mismas definiciones que usaban las tarjetas cuando se calculaban en el
 * navegador, para que no cambien de significado al pasar al servidor.
 */
function statsPipeline(match = {}) {
  const pipeline = [];
  if (match && Object.keys(match).length > 0) pipeline.push({ $match: match });
  pipeline.push({
    $group: {
      _id: null,
      count: { $sum: 1 },
      total: { $sum: { $ifNull: ['$totalAmount', 0] } },
      approved: countIf({ $in: ['$paymentStatus', ['approved', 'confirmed']] }),
      review: countIf(eq('paymentStatus', 'proof_uploaded')),
      pending: countIf(eq('paymentStatus', 'pending')),
      shipped: countIf(eq('shippingStatus', 'shipped')),
      delivered: countIf(eq('shippingStatus', 'delivered')),
    },
  });
  return pipeline;
}

const EMPTY_STATS = Object.freeze({
  count: 0, total: 0, approved: 0, review: 0, pending: 0, shipped: 0, delivered: 0,
});

/** Resultado del aggregate → objeto plano con números (sin pedidos → ceros). */
function normalizeStats(rows) {
  const row = Array.isArray(rows) && rows[0] ? rows[0] : {};
  const out = {};
  for (const key of Object.keys(EMPTY_STATS)) {
    const n = Number(row[key]);
    out[key] = Number.isFinite(n) ? n : 0;
  }
  return out;
}

module.exports = {
  PAYMENT_STATUSES,
  MAX_QUERY,
  SEARCH_FIELDS,
  EMPTY_STATS,
  escapeRegex,
  buildOrderFilter,
  mergeFilters,
  statsPipeline,
  normalizeStats,
};
