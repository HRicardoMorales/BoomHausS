// backend/src/routes/track.routes.js
// POST /api/track — endpoint único para funnel events browser→server.
// Ver track.controller.js para el contrato de dedup con el Pixel.

const { Router } = require('express');
const rateLimit  = require('express-rate-limit');
const { trackEvent } = require('../controllers/track.controller');

const router = Router();

// Rate limit propio: 200 req / 10 min por IP (independiente del limiter global).
// Un usuario navegando activamente puede disparar 5-10 funnel events por
// minuto (PageView por cambio de ruta, ViewContent en detalle, AddToCart,
// InitiateCheckout). 200/10min deja margen amplio y bloquea spam.
const trackLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, message: 'Rate limit de tracking superado. Intentá en unos minutos.' },
});

router.post('/', trackLimiter, trackEvent);

module.exports = router;
