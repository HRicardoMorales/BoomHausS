// backend/src/services/metaCapi.js
// Meta Conversions API — deduplicates Purchase events with browser pixel via matching eventID

const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN;
const GRAPH_API_VERSION = 'v20.0';

function sha256(value) {
    if (!value) return undefined;
    return crypto.createHash('sha256').update(String(value).toLowerCase().trim()).digest('hex');
}

/**
 * Envía un evento Purchase a Meta CAPI.
 * eventID = `purchase_${orderId}` — debe coincidir exactamente con lo que envía metaPixel.js en el browser.
 *
 * @param {Object} order  - Documento de orden de Mongoose (con _id, customerEmail, etc.)
 * @param {Object} [ctx]  - Contexto opcional del request original (ip, userAgent)
 */
async function sendPurchaseEvent(order, { ip, userAgent } = {}) {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
        console.warn('⚠️ Meta CAPI: META_PIXEL_ID o META_CAPI_TOKEN no configurados. Saltando evento.');
        return;
    }

    const orderId = order._id?.toString();
    if (!orderId) {
        console.warn('⚠️ Meta CAPI: orden sin _id, saltando evento.');
        return;
    }

    const eventId = `purchase_${orderId}`;

    const nameParts = (order.customerName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const rawPhone = (order.customerPhone || '').replace(/\D/g, '');

    const userData = {
        ...(order.customerEmail && { em: [sha256(order.customerEmail)] }),
        ...(rawPhone && { ph: [sha256(rawPhone)] }),
        ...(firstName && { fn: [sha256(firstName)] }),
        ...(lastName && { ln: [sha256(lastName)] }),
        ...(ip && { client_ip_address: ip }),
        ...(userAgent && { client_user_agent: userAgent }),
    };

    const payload = {
        data: [
            {
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                event_id: eventId,
                action_source: 'website',
                user_data: userData,
                custom_data: {
                    currency: 'ARS',
                    value: order.totalAmount,
                    num_items: order.totalItems,
                    contents: (order.items || []).map(item => ({
                        id: String(item.productId || ''),
                        quantity: item.quantity,
                    })),
                    content_type: 'product',
                },
            },
        ],
    };

    try {
        const res = await fetch(
            `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );
        const json = await res.json();
        if (!res.ok) {
            console.warn('⚠️ Meta CAPI error response:', JSON.stringify(json));
        } else {
            console.log(`✅ Meta CAPI Purchase enviado — eventID: ${eventId}`);
        }
    } catch (err) {
        console.warn('⚠️ Meta CAPI fetch error:', err?.message || err);
    }
}

module.exports = { sendPurchaseEvent };
