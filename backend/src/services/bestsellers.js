// backend/src/services/bestsellers.js
//
// "Más vendidos" de verdad: agregado sobre pedidos pagos (aprobados por MP o
// confirmados por el admin) de los últimos WINDOW_DAYS días. Solo lectura:
// no toca el flujo de órdenes ni el de pagos.
//
// La API devuelve solo el ORDEN de los productos (ids/slugs), nunca las
// unidades: el volumen de ventas no tiene por qué ser público.

const Order = require('../models/order');

const WINDOW_DAYS = 90;
const LIMIT = 12;
const CACHE_TTL_MS = 10 * 60 * 1000; // la home no necesita el dato al segundo

const PAID_MATCH = { paymentStatus: { $in: ['approved', 'confirmed'] } };

// Pipeline puro (testeable sin Mongo).
function bestsellersPipeline(now = new Date(), { windowDays = WINDOW_DAYS, limit = LIMIT } = {}) {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  return [
    { $match: { ...PAID_MATCH, createdAt: { $gte: since } } },
    { $unwind: '$items' },
    { $match: { 'items.productId': { $nin: [null, ''] } } },
    {
      $group: {
        _id: { $toString: '$items.productId' },
        units: { $sum: { $ifNull: ['$items.quantity', 1] } },
        orders: { $sum: 1 },
      },
    },
    { $sort: { units: -1, orders: -1, _id: 1 } },
    { $limit: limit },
  ];
}

let cache = { at: 0, ids: null };

async function getBestsellerIds({ now = new Date(), OrderModel = Order, useCache = true } = {}) {
  if (useCache && cache.ids && now.getTime() - cache.at < CACHE_TTL_MS) return cache.ids;
  const rows = await OrderModel.aggregate(bestsellersPipeline(now));
  const ids = rows.map((r) => r._id);
  cache = { at: now.getTime(), ids };
  return ids;
}

function resetBestsellersCache() {
  cache = { at: 0, ids: null };
}

module.exports = { bestsellersPipeline, getBestsellerIds, resetBestsellersCache, WINDOW_DAYS };
