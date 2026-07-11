// backend/src/routes/meta.routes.js
// POST /api/meta/initiate-checkout — early CAPI InitiateCheckout fired
// at the same moment as the browser Pixel, before an order is created.
// This closes the CAPI coverage gap caused by abandoned checkouts.

const express = require('express');
const rateLimit = require('express-rate-limit');
// const { sendEarlyInitiateCheckoutEvent } = require('../services/metaCapi'); // META DESACTIVADO

const router = express.Router();

// 10 requests per IP per minute — blocks spam without affecting real users
const metaLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Demasiadas solicitudes. Intentá de nuevo en un minuto.' },
});

router.post('/initiate-checkout', metaLimiter, async (req, res) => {
    const { metaEventId, fbp, fbc, value, currency } = req.body || {};

    const numValue = Number(value);
    if (!Number.isFinite(numValue) || numValue <= 0) {
        return res.status(400).json({ ok: false, error: 'value debe ser un número positivo.' });
    }
    if (currency !== 'ARS') {
        return res.status(400).json({ ok: false, error: 'currency debe ser "ARS".' });
    }

    // META DESACTIVADO
    // sendEarlyInitiateCheckoutEvent({
    //     metaEventId:     metaEventId     || undefined,
    //     fbp:             fbp             || undefined,
    //     fbc:             fbc             || undefined,
    //     value:           numValue,
    //     currency:        'ARS',
    //     clientIp:        req.ip          || undefined,
    //     clientUserAgent: req.headers['user-agent'] || undefined,
    // }).catch(e => console.warn('⚠️ Meta CAPI early InitiateCheckout error:', e?.message || e));

    return res.json({ ok: true });
});

module.exports = router;
