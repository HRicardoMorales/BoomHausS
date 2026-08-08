// frontend/src/lib/metaPixel.js
// Meta Pixel wrapper con soporte de deduplicación server-side (CAPI).
//
// ── Origen único por evento ──────────────────────────────────────────────────
// Purchase           → trackPurchase(orderId, params)
//                       Pixel: eventID = "purchase_<orderId>" (determinístico)
//                       CAPI:  server dispara Purchase con el mismo string en
//                              orders.controller / mercadopagoWebhook /
//                              card-payment (ver metaCapi.js).
//                       Guard en localStorage por orderId (30 días) evita
//                       dobles disparos si el usuario recarga SuccessPayment.
//
// PageView           → trackPageView()
//                       Solo Pixel. PageView masivo por CAPI infla ruido sin
//                       aportar señal de conversión.
//
// ViewContent /
// AddToCart /
// InitiateCheckout /
// AddPaymentInfo     → trackWithCapi(name, params, eventID?)
//                       Dispara Pixel y POST /api/track con el MISMO eventID
//                       para que Meta deduplique la pareja server↔browser.
//                       Si no se pasa eventID, se genera uno acá y se usa en
//                       ambos lados.
//
// El snippet base (fbq init) vive en main.jsx y depende de VITE_META_PIXEL_ID.
// Si esa env var no está definida, window.fbq no existe y todas las funciones
// acá son no-op silencioso — nada explota, nada se envía.

import api from '../services/api';

// Guard de Purchase en localStorage — 30 días
const PURCHASE_GUARD_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function generateEventId() {
    try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID(); } catch (_) {}
    return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Lee _fbp / _fbc de document.cookie. Estos NO se hashean — Meta los usa tal cual.
export function getFbCookies() {
    if (typeof document === 'undefined') return { fbp: null, fbc: null };
    try {
        return document.cookie.split(';').reduce((acc, c) => {
            const eq = c.indexOf('=');
            if (eq < 0) return acc;
            const k = c.slice(0, eq).trim();
            const v = c.slice(eq + 1).trim();
            if (k === '_fbp') acc.fbp = v || null;
            if (k === '_fbc') acc.fbc = v || null;
            return acc;
        }, { fbp: null, fbc: null });
    } catch {
        return { fbp: null, fbc: null };
    }
}

function fbqReady() {
    return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

// track — solo Pixel browser. Usar cuando NO se quiere respaldo server-side.
// Reservado para PageView. Para eventos de funnel usar trackWithCapi.
export function track(eventName, params = {}, eventID) {
    if (!fbqReady()) return;
    const eid = eventID || generateEventId();
    window.fbq('track', eventName, params, { eventID: eid });
    return eid;
}

// trackWithCapi — canal canónico de funnel events (ViewContent, AddToCart,
// InitiateCheckout, AddPaymentInfo). Dispara Pixel y hace POST a /api/track
// con el mismo eventID. Meta deduplica por event_id.
export function trackWithCapi(eventName, params = {}, eventID) {
    const eid = eventID || generateEventId();

    if (fbqReady()) {
        window.fbq('track', eventName, params, { eventID: eid });
    }

    const { fbp, fbc } = getFbCookies();
    const sourceUrl = typeof window !== 'undefined' ? window.location.href : '';

    // Fire-and-forget: nunca bloquear al usuario si /api/track falla.
    api.post('/track', {
        eventName,
        eventId:        eid,
        eventSourceUrl: sourceUrl,
        customData:     params,
        ...(fbp ? { fbp } : {}),
        ...(fbc ? { fbc } : {}),
    }).catch(() => {});

    return eid;
}

// trackPageView — dispara PageView del Pixel en cambios de ruta SPA.
// El primer PageView lo dispara main.jsx al inicializar el Pixel.
export function trackPageView() {
    if (!fbqReady()) return;
    window.fbq('track', 'PageView');
}

// trackPurchase — SOLO Purchase browser. El server-side sale de los flujos
// reales de orden (orders.controller / mercadopagoWebhook / card-payment).
//
// Requiere orderId obligatorio (sin él no hay dedup posible).
// eventID = "purchase_<orderId>" — mismo string que sendPurchaseEvent() usa.
// Guard localStorage 30d por orderId para tolerar recargas de SuccessPayment.
export function trackPurchase(orderId, params = {}) {
    if (!fbqReady()) return;
    if (!orderId) {
        console.warn('[MetaPixel] trackPurchase llamado sin orderId — ignorado.');
        return;
    }

    const guardKey = `mp_purchase_${orderId}`;
    try {
        const raw = localStorage.getItem(guardKey);
        if (raw) {
            const ts = Number(raw);
            if (Number.isFinite(ts) && Date.now() - ts < PURCHASE_GUARD_TTL_MS) {
                return; // ya lo disparamos para este orderId hace menos de 30d
            }
        }
    } catch (_) {}

    const eventID = `purchase_${orderId}`;
    try { localStorage.setItem(guardKey, String(Date.now())); } catch (_) {}

    window.fbq('track', 'Purchase', {
        ...params,
        currency:     params.currency     || 'ARS',
        content_type: params.content_type || 'product',
    }, { eventID });

    return eventID;
}
