// backend/src/services/metaCapi.js
// Meta Conversions API — envía eventos server-side con deduplicación por
// event_id compartido con el Pixel del navegador.
//
// ── Regla de único origen ────────────────────────────────────────────────────
// Un solo camino server-side por evento por acción del usuario:
//   Purchase              → sale de este servicio, invocado desde los flujos
//                            reales de orden (orders.controller COD/transfer,
//                            orders.routes card-payment, mercadopagoWebhook MP).
//   PageView / ViewContent / AddToCart / InitiateCheckout / AddPaymentInfo
//                          → salen por POST /api/track desde el frontend,
//                            invocado por trackWithCapi() en metaPixel.js con
//                            el MISMO eventID que el fbq() del navegador.
//
// No exponemos helpers server-side para funnel events (ViewContent, etc.) para
// evitar dobles disparos con event_id distinto (que Meta no puede deduplicar).
//
// ── Contrato de deduplicación ────────────────────────────────────────────────
//   Purchase:         event_id = "purchase_<orderId>"     — determinístico,
//                     mismo string en browser Pixel y CAPI.
//   Otros:            event_id = UUID generado en el navegador y reenviado
//                     por /api/track al server sin modificar.
//
// ── Activación ───────────────────────────────────────────────────────────────
// Env vars requeridas (Render):
//   META_PIXEL_ID        — ID del Pixel
//   META_CAPI_TOKEN      — token de acceso (Events Manager → Configuración →
//                          Conversions API → Generar token de acceso)
//   CAPI_ENABLED         — "true" para enviar realmente; cualquier otro valor
//                          logea el evento sin enviar (modo dry-run)
//   META_TEST_EVENT_CODE — (opcional) código de "Probar eventos"

const crypto = require('crypto');
const https  = require('https');

const PIXEL_ID        = process.env.META_PIXEL_ID;
const CAPI_TOKEN      = process.env.META_CAPI_TOKEN;
const CAPI_ENABLED    = process.env.CAPI_ENABLED === 'true';
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || null;
const API_VERSION     = 'v23.0';

// ─── SHA-256 (lowercase + trim antes de hashear, como exige Meta) ─────────────
function sha256(str) {
    if (str === null || str === undefined || str === '') return undefined;
    return crypto.createHash('sha256').update(String(str).toLowerCase().trim()).digest('hex');
}

// ─── Normalización de teléfono para Argentina ─────────────────────────────────
// Meta requiere E.164 sin '+'. Argentina: 54 + código de área sin 0 + número.
// Móviles: idealmente incluyen el '9' después del 54 (ej: 54 9 11 ...). Si el
// número entra sin el 9 (típico "011 1234-5678"), lo dejamos como 54 + resto:
// Meta acepta ambas variantes y lo importante es la consistencia con lo que
// el usuario declara en formularios de otros lados. No inventamos dígitos.
function normalizePhone(phone) {
    if (!phone) return undefined;
    let digits = String(phone).replace(/\D/g, '');
    if (!digits || digits.length < 6) return undefined;
    if (digits.startsWith('54')) return digits;
    if (digits.startsWith('0'))  digits = digits.slice(1);
    return '54' + digits;
}

// ─── Construir user_data hasheado ────────────────────────────────────────────
// Recibe un objeto plano con los campos disponibles. Devuelve el shape que
// espera Meta CAPI en user_data.
function buildUserData(userData) {
    if (!userData || typeof userData !== 'object') return { country: sha256('ar') };

    const u = {};

    // Campos que Meta exige hasheados (SHA-256 de lowercase + trim)
    if (userData.email)      u.em          = sha256(userData.email);
    if (userData.phone)      u.ph          = sha256(normalizePhone(userData.phone));
    if (userData.firstName)  u.fn          = sha256(userData.firstName);
    if (userData.lastName)   u.ln          = sha256(userData.lastName);
    if (userData.city)       u.ct          = sha256(userData.city);
    if (userData.state)      u.st          = sha256(userData.state);
    if (userData.zip)        u.zp          = sha256(userData.zip);
    if (userData.externalId) u.external_id = sha256(userData.externalId);
    u.country = sha256(userData.country || 'ar');

    // Campos que NO se hashean (Meta los usa directamente)
    if (userData.clientIp)  u.client_ip_address = userData.clientIp;
    if (userData.userAgent) u.client_user_agent = userData.userAgent;
    if (userData.fbp)       u.fbp = userData.fbp;
    if (userData.fbc)       u.fbc = userData.fbc;

    return u;
}

// ─── POST nativo a graph.facebook.com (sin dependencias extra) ───────────────
function postToMeta(payload) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const options = {
            hostname: 'graph.facebook.com',
            path: `/${API_VERSION}/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                let parsed;
                try { parsed = JSON.parse(data); } catch { parsed = { raw: data }; }

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(parsed);
                } else {
                    const err = new Error(`Meta CAPI HTTP ${res.statusCode}`);
                    err.statusCode = res.statusCode;
                    err.body = parsed;
                    reject(err);
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(new Error('Meta CAPI timeout')); });
        req.write(body);
        req.end();
    });
}

// ─── 1 reintento con backoff ante error 5xx / red ────────────────────────────
async function sendWithRetry(payload, attempt = 0) {
    try {
        const result = await postToMeta(payload);
        console.log(`[CAPI] ✅ events_received=${result.events_received}`);
        return result;
    } catch (err) {
        // 4xx = error de datos → logueamos y NO reintentamos (reintentar no lo arregla)
        if (err.statusCode && err.statusCode < 500) {
            console.error('[CAPI] ❌ Error 4xx de Meta (revisar payload):',
                JSON.stringify(err.body));
            return;
        }
        // 5xx / red → un reintento con 1.5s de backoff
        if (attempt < 1) {
            await new Promise(r => setTimeout(r, 1500));
            return sendWithRetry(payload, attempt + 1);
        }
        console.error('[CAPI] ❌ Error de red/servidor tras reintento:', err.message);
    }
}

// ─── API pública ─────────────────────────────────────────────────────────────

// sendEvent — genérico, usado por /api/track (funnel events).
//
// eventName   String   'ViewContent' | 'AddToCart' | 'InitiateCheckout' | etc.
// options:
//   eventId     String   MISMO que el pasado al fbq() del navegador.
//   userData    Object   { email, phone, firstName, ... fbp, fbc, clientIp, userAgent }
//   customData  Object   { value, currency, content_ids, content_type, num_items }
//   sourceUrl   String   URL donde ocurrió el evento
//
// Fire-and-forget: nunca throwea al caller.
function sendEvent(eventName, { eventId, userData = {}, customData = {}, sourceUrl = '' } = {}) {
    if (!CAPI_ENABLED) {
        console.log(`[CAPI disabled] ${eventName} event_id=${eventId || '—'}`);
        return;
    }

    if (!PIXEL_ID || !CAPI_TOKEN) {
        console.warn('[CAPI] Faltan META_PIXEL_ID o META_CAPI_TOKEN — evento ignorado');
        return;
    }

    const payload = {
        data: [{
            event_name:       eventName,
            event_time:       Math.floor(Date.now() / 1000),
            event_id:         eventId || undefined,
            event_source_url: sourceUrl || undefined,
            action_source:    'website',
            user_data:        buildUserData(userData),
            custom_data:      Object.keys(customData).length ? customData : undefined,
        }],
        ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
    };

    sendWithRetry(payload).catch(() => {}); // fire-and-forget
}

// sendPurchaseEvent — wrapper específico para Purchase.
//
// order          Orden persistida en BD. Debe tener purchaseEventId, totalAmount,
//                items, customer* y (idealmente) fbp/fbc/clientIp/clientUserAgent.
// ctx (opcional) { ip, userAgent } — fallback si la orden no los tiene guardados
//                (por ejemplo el card-payment flow que dispara desde el mismo
//                request del cliente).
//
// El value se lee SIEMPRE de order.totalAmount (lo persistido = lo cobrado).
// Cuando el sistema de precios pase de shadow a enforce, order.totalAmount será
// el recalculado por el server, lo cual sigue siendo correcto (= lo cobrado).
function sendPurchaseEvent(order, ctx = {}) {
    if (!order?._id) {
        console.warn('[CAPI] sendPurchaseEvent: orden sin _id — ignorado');
        return;
    }

    const orderId = String(order._id);
    const eventId = order.purchaseEventId || `purchase_${orderId}`;

    const nameParts = String(order.customerName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName  = nameParts.slice(1).join(' ') || '';

    sendEvent('Purchase', {
        eventId,
        userData: {
            email:      order.customerEmail || undefined,
            phone:      order.customerPhone || undefined,
            firstName:  firstName || undefined,
            lastName:   lastName  || undefined,
            externalId: orderId,
            fbp:        order.fbp || undefined,
            fbc:        order.fbc || undefined,
            clientIp:   order.clientIp        || ctx.ip        || undefined,
            userAgent:  order.clientUserAgent || ctx.userAgent || undefined,
        },
        customData: {
            currency:     'ARS',
            value:        order.totalAmount, // ver comentario del contrato del value arriba
            num_items:    order.totalItems,
            content_ids:  (order.items || []).map(it => String(it.productId || '')).filter(Boolean),
            contents:     (order.items || []).map(it => ({
                id:       String(it.productId || ''),
                quantity: Number(it.quantity) || 1,
            })),
            content_type: 'product',
            order_id:     orderId,
        },
    });
}

module.exports = { sendEvent, sendPurchaseEvent, buildUserData };
