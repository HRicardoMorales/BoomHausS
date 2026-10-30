// backend/src/services/orderListing.js
//
// Paginación por cursor del listado admin (GET /api/orders).
//
// Por qué cursor y no `?page=N`: con skip/limit, un pedido nuevo que entra
// mientras el admin pasa de página corre todo un lugar y el último de la
// página 1 aparece repetido en la 2. El cursor apunta a un pedido concreto
// ("los anteriores a este"), así que las páginas no se pisan.
//
// El cursor es `<createdAt en ms>_<_id>`: `createdAt` solo no alcanza
// (dos pedidos pueden caer en el mismo milisegundo) y `_id` desempata con
// el mismo orden. Lo sirve el índice { createdAt: -1, _id: -1 } de Order.

const CURSOR_RE = /^(\d{1,15})_([a-f0-9]{24})$/;
const SORT = Object.freeze({ createdAt: -1, _id: -1 });
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function encodeCursor(order) {
  const t = new Date(order?.createdAt).getTime();
  const id = order?._id == null ? '' : String(order._id);
  if (!Number.isFinite(t) || !/^[a-f0-9]{24}$/.test(id)) return null;
  return `${t}_${id}`;
}

/** Devuelve { createdAt: Date, id: string } o null si el cursor no es válido. */
function decodeCursor(cursor) {
  const m = typeof cursor === 'string' ? CURSOR_RE.exec(cursor) : null;
  if (!m) return null;
  const createdAt = new Date(Number(m[1]));
  if (Number.isNaN(createdAt.getTime())) return null;
  return { createdAt, id: m[2] };
}

/** Filtro "estrictamente anterior al cursor" en el orden (createdAt desc, _id desc). */
function beforeCursorFilter({ createdAt, id }, toObjectId = (x) => x) {
  const _id = toObjectId(id);
  return {
    $or: [
      { createdAt: { $lt: createdAt } },
      { createdAt, _id: { $lt: _id } },
    ],
  };
}

/**
 * Arma la página a partir de `limit + 1` documentos leídos: si sobra uno, hay
 * más y el cursor siguiente es el último de los que se devuelven.
 */
function buildPage(docs, limit) {
  const list = Array.isArray(docs) ? docs : [];
  const hasMore = list.length > limit;
  const data = hasMore ? list.slice(0, limit) : list;
  return {
    data,
    nextCursor: hasMore ? encodeCursor(data[data.length - 1]) : null,
  };
}

module.exports = {
  CURSOR_RE,
  SORT,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  encodeCursor,
  decodeCursor,
  beforeCursorFilter,
  buildPage,
};
