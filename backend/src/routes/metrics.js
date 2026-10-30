// backend/src/routes/metrics.js
//
// Dashboard admin. Solo las tres rutas que consume el frontend
// (hooks/admin/useAdminMetrics): /funnel, /pay-methods y /pages se borraron
// porque nadie las llamaba y /pages devolvía visitas inventadas
// (pedidos × 4,2) en lugar de datos reales.

const { Router } = require('express');
const { authRequired, adminOnly } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validate');
const { metricsQuery } = require('../validation/metrics.schemas');
const { getKpis, getChart, getPayments } = require('../controllers/metrics.controller');

const router = Router();

router.use(authRequired, adminOnly, validate({ query: metricsQuery }));

// GET /api/metrics/kpis?range=hoy|7d|30d|mes
router.get('/kpis', getKpis);
// GET /api/metrics/chart?range=
router.get('/chart', getChart);
// GET /api/metrics/payments?range=
router.get('/payments', getPayments);

module.exports = router;
