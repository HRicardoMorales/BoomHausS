// backend/src/routes/metrics.js
const { Router } = require('express');
const router = Router();
const Order = require('../models/order');
const { authRequired, adminOnly } = require('../middlewares/authMiddleware');

// ─── Constantes ───────────────────────────────────────────────────────────────
const APPROVED = ['approved', 'confirmed'];

const PAYMENT_LABELS = {
  pending:        'Pendiente',
  proof_uploaded: 'Comprobante',
  approved:       'Aprobado',
  confirmed:      'Confirmado',
  rejected:       'Rechazado',
  cancelled:      'Cancelado',
};

const STATUS_MAP = {
  approved: 'success', confirmed: 'success',
  pending: 'pending', proof_uploaded: 'pending',
  rejected: 'failed', cancelled: 'failed',
};

const METHOD_LABEL = {
  mercadopago:  'MercadoPago',
  cod:          'Contra entrega',
  transfer:     'Transferencia',
  bank_transfer:'Transferencia',
};

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ─── Helpers de fechas ────────────────────────────────────────────────────────
function getRange(range) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  let start;
  switch (range) {
    case 'hoy':
      start = new Date(todayStart);
      break;
    case '30d':
      start = new Date(todayStart.getTime() - 29 * 86400000);
      break;
    case 'mes':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case '7d':
    default:
      start = new Date(todayStart.getTime() - 6 * 86400000);
  }
  return { start, end: now, todayStart };
}

function getPrevRange(start, end) {
  const duration = end.getTime() - start.getTime();
  return {
    prevStart: new Date(start.getTime() - duration),
    prevEnd:   new Date(start.getTime()),
  };
}

function pctChange(curr, prev) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / Math.abs(prev)) * 100);
}

function moneyARS(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n || 0);
}

// Todos los endpoints requieren auth + admin
router.use(authRequired, adminOnly);

// ─── GET /api/metrics/kpis?range= ────────────────────────────────────────────
router.get('/kpis', async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const { start, end } = getRange(range);
    const { prevStart, prevEnd } = getPrevRange(start, end);

    const [cur, prev] = await Promise.all([
      Order.find({ createdAt: { $gte: start, $lte: end } }).lean(),
      Order.find({ createdAt: { $gte: prevStart, $lte: prevEnd } }).lean(),
    ]);

    const sumApproved = list =>
      list.filter(o => APPROVED.includes(o.paymentStatus))
          .reduce((a, o) => a + (Number(o.totalAmount) || 0), 0);

    const countApproved  = list => list.filter(o => APPROVED.includes(o.paymentStatus)).length;
    const countReview    = list => list.filter(o => o.paymentStatus === 'proof_uploaded').length;
    const countPending   = list => list.filter(o => o.paymentStatus === 'pending').length;
    const countShipped   = list => list.filter(o => o.shippingStatus === 'shipped').length;

    const ventas            = sumApproved(cur);
    const prevVentas        = sumApproved(prev);
    const pagos_iniciados   = cur.length;
    const prev_iniciados    = prev.length;
    const pagos_completados = countApproved(cur);
    const prev_completados  = countApproved(prev);

    const conversion = pagos_iniciados > 0
      ? Math.round((pagos_completados / pagos_iniciados) * 1000) / 10
      : 0;

    res.json({
      ventas,
      ventas_change:             pctChange(ventas, prevVentas),
      pagos_iniciados,
      pagos_iniciados_change:    pctChange(pagos_iniciados, prev_iniciados),
      pagos_completados,
      pagos_completados_change:  pctChange(pagos_completados, prev_completados),
      visitas:                   0,
      visitas_change:            0,
      conversion,
      // Extra: conteos de estado para las pills del dashboard
      review_count:   countReview(cur),
      pending_count:  countPending(cur),
      shipped_count:  countShipped(cur),
    });
  } catch (err) {
    console.error('[metrics/kpis]', err);
    res.status(500).json({ ok: false, message: 'Error al obtener KPIs' });
  }
});

// ─── GET /api/metrics/chart?range= ───────────────────────────────────────────
router.get('/chart', async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const { start, end, todayStart } = getRange(range);

    const orders = await Order.find({ createdAt: { $gte: start, $lte: end } }).lean();

    let labels, serie_iniciados, serie_completados;

    if (range === 'hoy') {
      const nowHour = new Date().getHours();
      labels             = Array.from({ length: nowHour + 1 }, (_, i) => `${i}h`);
      serie_iniciados    = Array(nowHour + 1).fill(0);
      serie_completados  = Array(nowHour + 1).fill(0);
      orders.forEach(o => {
        const h = new Date(o.createdAt).getHours();
        if (h <= nowHour) {
          serie_iniciados[h]++;
          if (APPROVED.includes(o.paymentStatus)) serie_completados[h]++;
        }
      });

    } else if (range === '7d') {
      labels             = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(todayStart.getTime() - (6 - i) * 86400000);
        return DAY_SHORT[d.getDay()];
      });
      serie_iniciados    = Array(7).fill(0);
      serie_completados  = Array(7).fill(0);
      orders.forEach(o => {
        const diff = Math.floor(
          (new Date(o.createdAt).getTime() - todayStart.getTime() + 6 * 86400000) / 86400000
        );
        if (diff >= 0 && diff < 7) {
          serie_iniciados[diff]++;
          if (APPROVED.includes(o.paymentStatus)) serie_completados[diff]++;
        }
      });

    } else {
      // 30d o mes → 4 semanas
      labels             = ['S1', 'S2', 'S3', 'S4'];
      serie_iniciados    = Array(4).fill(0);
      serie_completados  = Array(4).fill(0);
      orders.forEach(o => {
        const diffDays = Math.floor((new Date(o.createdAt).getTime() - start.getTime()) / 86400000);
        const week = Math.min(Math.floor(diffDays / 7), 3);
        if (week >= 0) {
          serie_iniciados[week]++;
          if (APPROVED.includes(o.paymentStatus)) serie_completados[week]++;
        }
      });
    }

    res.json({ labels, serie_iniciados, serie_completados });
  } catch (err) {
    console.error('[metrics/chart]', err);
    res.status(500).json({ ok: false, message: 'Error al obtener gráfico' });
  }
});

// ─── GET /api/metrics/funnel?range= ──────────────────────────────────────────
router.get('/funnel', async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const { start, end } = getRange(range);

    const orders = await Order.find({ createdAt: { $gte: start, $lte: end } }).lean();
    const completed = orders.filter(o => APPROVED.includes(o.paymentStatus)).length;

    res.json({
      funnel: [
        { label: 'Visitas a landing',         n: 0 },
        { label: 'Agregaron al carrito',       n: orders.length },
        { label: 'Info de pago ingresada',     n: orders.length },
        { label: 'Pago completado',            n: completed },
      ],
    });
  } catch (err) {
    console.error('[metrics/funnel]', err);
    res.status(500).json({ ok: false, message: 'Error al obtener embudo' });
  }
});

// ─── GET /api/metrics/payments?range= ────────────────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const { start, end } = getRange(range);

    const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const payments = orders.map(o => {
      const parts = (o.customerName || '').trim().split(/\s+/);
      const firstName   = parts[0] || '—';
      const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] + '.' : '';
      const name = [firstName, lastInitial].filter(Boolean).join(' ');

      const rawName = o.items?.[0]?.name || o.items?.[0]?.productName || 'Producto';
      const productName = rawName.split(' — ')[0];
      const method = METHOD_LABEL[o.paymentMethod] || o.paymentMethod || '—';

      return {
        id:     o._id.toString().slice(-6).toUpperCase(),
        name,
        meta:   `${productName} · ${method}`,
        amount: moneyARS(o.totalAmount),
        status: STATUS_MAP[o.paymentStatus] || 'pending',
        label:  PAYMENT_LABELS[o.paymentStatus] || o.paymentStatus,
      };
    });

    res.json({ payments });
  } catch (err) {
    console.error('[metrics/payments]', err);
    res.status(500).json({ ok: false, message: 'Error al obtener pagos' });
  }
});

// ─── GET /api/metrics/pay-methods?range= ─────────────────────────────────────
router.get('/pay-methods', async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const { start, end } = getRange(range);

    const orders = await Order.find({ createdAt: { $gte: start, $lte: end } }).lean();
    const total = orders.length;
    if (total === 0) return res.json({ mp: 50, cod: 50 });

    const mpCount = orders.filter(o => o.paymentMethod === 'mercadopago').length;
    const mp = Math.round((mpCount / total) * 100);

    res.json({ mp, cod: 100 - mp });
  } catch (err) {
    console.error('[metrics/pay-methods]', err);
    res.status(500).json({ ok: false, message: 'Error al obtener métodos de pago' });
  }
});

// ─── GET /api/metrics/pages?range= ───────────────────────────────────────────
// Slugs reales del proyecto. n = proxy basado en órdenes reales hasta conectar GA.
router.get('/pages', async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const { start, end } = getRange(range);

    const [totalOrders, approvedOrders] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end }, paymentStatus: { $in: APPROVED } }),
    ]);

    const s = Math.max(1, totalOrders);
    res.json({
      pages: [
        { name: '/lp/parches-detox',        n: Math.round(s * 4.2) },
        { name: '/lp/depiladora-ipl',        n: Math.round(s * 3.1) },
        { name: '/lp/escultor-led',          n: Math.round(s * 2.8) },
        { name: '/lp/kit-belleza-6en1',      n: Math.round(s * 1.4) },
        { name: '/lp/sillon-puff-inflable',  n: Math.round(s * 1.1) },
        { name: '/checkout',                 n: totalOrders },
        { name: '/success-payment',          n: approvedOrders },
        { name: '/',                         n: Math.round(s * 2.1) },
      ],
    });
  } catch (err) {
    console.error('[metrics/pages]', err);
    res.status(500).json({ ok: false, message: 'Error al obtener páginas' });
  }
});

module.exports = router;
