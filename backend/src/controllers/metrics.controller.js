// backend/src/controllers/metrics.controller.js
// Handlers finos: el rango ya llega validado en req.validatedQuery y el
// cálculo vive en services/metrics.js.

const metrics = require('../services/metrics');
const logger = require('../utils/logger').child('metrics');

function handler(name, errorMessage, fn) {
  return async function metricsHandler(req, res) {
    try {
      res.json(await fn(req.validatedQuery.range));
    } catch (err) {
      logger.error(`Error en /api/metrics/${name}`, err, { reqId: req.id });
      res.status(500).json({ ok: false, message: errorMessage });
    }
  };
}

module.exports = {
  getKpis: handler('kpis', 'Error al obtener KPIs', (range) => metrics.getKpis(range)),
  getChart: handler('chart', 'Error al obtener gráfico', (range) => metrics.getChart(range)),
  getPayments: handler('payments', 'Error al obtener pagos', (range) => metrics.getRecentPayments(range)),
};
