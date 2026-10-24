// backend/src/validation/metrics.schemas.js
//
// Query de /api/metrics/*: `range` es uno de los períodos que ofrece el
// dashboard. Sin `range` → 7 días (lo que hacía antes); cualquier otro valor
// → 400 en vez de caer en silencio al default.

const { z } = require('zod');
const { RANGES } = require('../services/metrics');

const metricsQuery = z.object({
  range: z
    .enum(RANGES, { error: `Período inválido. Usá: ${RANGES.join(', ')}.` })
    .default('7d'),
});

module.exports = { metricsQuery };
