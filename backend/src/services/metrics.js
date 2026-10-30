// backend/src/services/metrics.js
//
// Métricas del dashboard admin calculadas EN MongoDB. Antes cada endpoint
// hacía `Order.find(rango).lean()` y sumaba en JS: traía todos los pedidos
// del período a memoria (en /kpis, dos períodos). Ahora:
//
//   - /kpis  → un solo `aggregate` que agrupa período actual y anterior.
//   - /chart → `aggregate` agrupado por hora/día en la zona horaria de la
//              tienda (≤ 31 filas, sin importar cuántos pedidos haya).
//   - /payments → los 10 últimos con proyección (solo los campos que se usan).
//
// Los días se cortan en hora argentina: el servidor corre en UTC (Render) y
// `setHours(0)` hacía que "Hoy" arrancara a las 21:00 del día anterior.
//
// Pipelines y armado de respuestas son funciones puras (testeables sin Mongo);
// el contrato JSON es el mismo que consume `components/admin/home/metrics.js`.

const Order = require('../models/order');

const STORE_TZ = 'America/Argentina/Buenos_Aires';
const DAY_MS = 86400000;
const RANGES = ['hoy', '7d', '30d', 'mes'];
const APPROVED = ['approved', 'confirmed'];

const PAYMENT_LABELS = {
  pending: 'Pendiente',
  proof_uploaded: 'Comprobante',
  approved: 'Aprobado',
  confirmed: 'Confirmado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
};

const STATUS_MAP = {
  approved: 'success', confirmed: 'success',
  pending: 'pending', proof_uploaded: 'pending',
  rejected: 'failed', cancelled: 'failed',
};

const METHOD_LABEL = {
  mercadopago: 'MercadoPago',
  cod: 'Contra entrega',
  transfer: 'Transferencia',
  bank_transfer: 'Transferencia',
};

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const ars = new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
});

// ─── Fechas en la zona de la tienda ──────────────────────────────────────────

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STORE_TZ,
  year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric',
  hourCycle: 'h23', timeZoneName: 'longOffset',
});

// { y, m (1-12), d, h, offsetMin } del instante `date` visto en STORE_TZ.
function zonedParts(date) {
  const p = Object.fromEntries(partsFormatter.formatToParts(date).map((x) => [x.type, x.value]));
  const off = /GMT([+-])(\d{2}):(\d{2})/.exec(p.timeZoneName);
  const offsetMin = off ? (off[1] === '-' ? -1 : 1) * (Number(off[2]) * 60 + Number(off[3])) : 0;
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour), offsetMin };
}

// Instante UTC de las 00:00 del día civil (y, m, d) en STORE_TZ. Date.UTC
// normaliza días fuera de rango (d = 0 → último del mes anterior).
function zonedMidnight(y, m, d) {
  const guess = Date.UTC(y, m - 1, d);
  const first = guess - zonedParts(new Date(guess)).offsetMin * 60000;
  // Segunda pasada por si el offset cambia entre la suposición y el resultado (DST).
  return new Date(guess - zonedParts(new Date(first)).offsetMin * 60000);
}

// 'YYYY-MM-DD' del día civil (sirve para comparar con $dateToString).
function dayKey(y, m, d) {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.toISOString().slice(0, 10);
}

function getRange(range, now = new Date()) {
  const { y, m, d } = zonedParts(now);
  const todayStart = zonedMidnight(y, m, d);
  let startDay;
  switch (range) {
    case 'hoy': startDay = [y, m, d]; break;
    case '30d': startDay = [y, m, d - 29]; break;
    case 'mes': startDay = [y, m, 1]; break;
    case '7d':
    default: startDay = [y, m, d - 6];
  }
  const start = zonedMidnight(...startDay);
  const end = new Date(now);
  const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
  return { start, end, todayStart, prevStart, prevEnd: start, startKey: dayKey(...startDay), today: { y, m, d } };
}

function pctChange(curr, prev) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / Math.abs(prev)) * 100);
}

// ─── Pipelines (puros) ───────────────────────────────────────────────────────

const isApproved = { $in: ['$paymentStatus', APPROVED] };
const countIf = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });
const amount = { $convert: { input: '$totalAmount', to: 'double', onError: 0, onNull: 0 } };

function kpisPipeline({ start, end, prevStart }) {
  return [
    { $match: { createdAt: { $gte: prevStart, $lte: end } } },
    {
      $group: {
        _id: { $cond: [{ $gte: ['$createdAt', start] }, 'cur', 'prev'] },
        iniciados: { $sum: 1 },
        completados: countIf(isApproved),
        ventas: { $sum: { $cond: [isApproved, amount, 0] } },
        review: countIf({ $eq: ['$paymentStatus', 'proof_uploaded'] }),
        pending: countIf({ $eq: ['$paymentStatus', 'pending'] }),
        shipped: countIf({ $eq: ['$shippingStatus', 'shipped'] }),
      },
    },
  ];
}

function chartPipeline({ start, end }, range) {
  return [
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          $dateToString: {
            date: '$createdAt',
            format: range === 'hoy' ? '%H' : '%Y-%m-%d',
            timezone: STORE_TZ,
          },
        },
        iniciados: { $sum: 1 },
        completados: countIf(isApproved),
      },
    },
  ];
}

// ─── Armado de respuestas (puro) ─────────────────────────────────────────────

const EMPTY_PERIOD = { iniciados: 0, completados: 0, ventas: 0, review: 0, pending: 0, shipped: 0 };

function buildKpis(rows = []) {
  const byId = Object.fromEntries(rows.map((r) => [r._id, r]));
  const cur = { ...EMPTY_PERIOD, ...byId.cur };
  const prev = { ...EMPTY_PERIOD, ...byId.prev };
  const ventas = Math.round(cur.ventas);

  return {
    ventas,
    ventas_change: pctChange(ventas, Math.round(prev.ventas)),
    pagos_iniciados: cur.iniciados,
    pagos_iniciados_change: pctChange(cur.iniciados, prev.iniciados),
    pagos_completados: cur.completados,
    pagos_completados_change: pctChange(cur.completados, prev.completados),
    conversion: cur.iniciados > 0 ? Math.round((cur.completados / cur.iniciados) * 1000) / 10 : 0,
    review_count: cur.review,
    pending_count: cur.pending,
    shipped_count: cur.shipped,
  };
}

function buildChart(rows = [], range, rangeInfo) {
  const byKey = new Map(rows.map((r) => [String(r._id), r]));
  const { today, startKey } = rangeInfo;

  let buckets; // [{ label, keys: [...] }]
  if (range === 'hoy') {
    const nowHour = zonedParts(rangeInfo.end).h;
    buckets = Array.from({ length: nowHour + 1 }, (_, h) => ({
      label: `${h}h`, keys: [String(h).padStart(2, '0')],
    }));
  } else if (range === '7d') {
    buckets = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(Date.UTC(today.y, today.m - 1, today.d - 6 + i));
      return { label: DAY_SHORT[day.getUTCDay()], keys: [day.toISOString().slice(0, 10)] };
    });
  } else {
    // 30d o mes → 4 semanas desde el inicio del rango (la última absorbe el resto).
    buckets = ['S1', 'S2', 'S3', 'S4'].map((label) => ({ label, keys: [] }));
    const startMs = Date.parse(`${startKey}T00:00:00Z`);
    for (const key of byKey.keys()) {
      const diffDays = Math.round((Date.parse(`${key}T00:00:00Z`) - startMs) / DAY_MS);
      if (diffDays >= 0) buckets[Math.min(Math.floor(diffDays / 7), 3)].keys.push(key);
    }
  }

  const sum = (keys, field) => keys.reduce((a, k) => a + (byKey.get(k)?.[field] || 0), 0);
  return {
    labels: buckets.map((b) => b.label),
    serie_iniciados: buckets.map((b) => sum(b.keys, 'iniciados')),
    serie_completados: buckets.map((b) => sum(b.keys, 'completados')),
  };
}

function toPaymentRow(o) {
  const parts = String(o.customerName || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || '—';
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : '';
  const rawName = o.items?.[0]?.name || o.items?.[0]?.productName || 'Producto';

  return {
    id: String(o._id).slice(-6).toUpperCase(),
    name: [firstName, lastInitial].filter(Boolean).join(' '),
    meta: `${String(rawName).split(' — ')[0]} · ${METHOD_LABEL[o.paymentMethod] || o.paymentMethod || '—'}`,
    amount: ars.format(Number(o.totalAmount) || 0),
    status: STATUS_MAP[o.paymentStatus] || 'pending',
    label: PAYMENT_LABELS[o.paymentStatus] || o.paymentStatus,
  };
}

// ─── Consultas ───────────────────────────────────────────────────────────────

async function getKpis(range, { now = new Date(), OrderModel = Order } = {}) {
  const r = getRange(range, now);
  return buildKpis(await OrderModel.aggregate(kpisPipeline(r)));
}

async function getChart(range, { now = new Date(), OrderModel = Order } = {}) {
  const r = getRange(range, now);
  return buildChart(await OrderModel.aggregate(chartPipeline(r, range)), range, r);
}

const PAYMENT_FIELDS = 'customerName items.name items.productName paymentMethod totalAmount paymentStatus';

async function getRecentPayments(range, { now = new Date(), OrderModel = Order } = {}) {
  const { start, end } = getRange(range, now);
  const orders = await OrderModel.find({ createdAt: { $gte: start, $lte: end } })
    .select(PAYMENT_FIELDS)
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  return { payments: orders.map(toPaymentRow) };
}

module.exports = {
  STORE_TZ,
  RANGES,
  getRange,
  zonedParts,
  pctChange,
  kpisPipeline,
  chartPipeline,
  buildKpis,
  buildChart,
  toPaymentRow,
  getKpis,
  getChart,
  getRecentPayments,
};
