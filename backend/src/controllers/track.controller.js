// backend/src/controllers/track.controller.js
// POST /api/track — recibe eventos de funnel disparados por el navegador
// (Pixel) y los reenvía a Meta Conversions API con el MISMO event_id para
// que Meta los deduplique.
//
// Contrato de dedup: el frontend (metaPixel.js → trackWithCapi) llama a
// fbq('track', name, params, { eventID }) y a POST /api/track con ese mismo
// eventID en el body. Meta hace el match server↔browser y cuenta uno solo.
//
// Purchase NO está en la allowlist: Purchase server-side sale exclusivamente
// de los flujos de orden reales (orders.controller / mercadopagoWebhook /
// card-payment) usando sendPurchaseEvent(). Aceptar Purchase por /api/track
// permitiría a un cliente inflar conversiones con value arbitrario.

const { sendEvent } = require('../services/metaCapi');

const ALLOWED_EVENTS = new Set([
    'PageView',
    'ViewContent',
    'AddToCart',
    'InitiateCheckout',
    'AddPaymentInfo',
]);

async function trackEvent(req, res) {
    try {
        const {
            eventName,
            eventId,
            eventSourceUrl,
            customData = {},
            userData   = {},
            fbp,
            fbc,
        } = req.body || {};

        if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
            return res.status(400).json({ ok: false, message: 'event_name no permitido.' });
        }

        // IP real del cliente (detrás del proxy de Render / Vercel).
        // X-Forwarded-For puede traer una lista "client, proxy1, proxy2" — la
        // primera es la del cliente.
        const clientIp =
            (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
            req.socket?.remoteAddress ||
            undefined;

        const userAgent = req.headers['user-agent'] || undefined;

        // Sanear customData: nunca aceptar Purchase (aunque el eventName ya
        // esté validado, defensa en profundidad si algún día se agrega Purchase
        // a la allowlist por error). No hay campos sensibles a filtrar más allá
        // de lo que Meta valida en su ingesta.
        const safeCustomData = { ...customData };

        sendEvent(eventName, {
            eventId,
            sourceUrl: eventSourceUrl || req.headers.referer || '',
            userData: {
                ...userData,
                clientIp,
                userAgent,
                ...(fbp ? { fbp } : {}),
                ...(fbc ? { fbc } : {}),
            },
            customData: safeCustomData,
        });

        return res.json({ ok: true });
    } catch (err) {
        console.error('[/api/track] Error inesperado:', err.message);
        return res.status(500).json({ ok: false });
    }
}

module.exports = { trackEvent };
