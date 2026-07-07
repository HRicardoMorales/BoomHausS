// frontend/src/lib/metaPixel.js
//
// Wrapper de Meta Pixel para BoomHausS / Amelor.
//
// Reglas que aplicamos acá:
//
// 1. PageView se dispara en init (index.html) y en cada cambio de ruta SPA
//    via trackPageView desde App.jsx. NO disparar manualmente desde otros
//    componentes.
//
// 2. Purchase es el evento más sensible. Se dispara solo a través de
//    trackPurchase(orderId, params). Características:
//      - Requiere orderId obligatorio (no se puede disparar sin contexto).
//      - Guard en localStorage por orderId (cross-tab, persiste 30 días).
//      - eventID determinístico = "purchase_<orderId>". Permite que Meta
//        deduplique nativamente si el evento llega 2 veces (browser + CAPI,
//        o reintentos).
//
// 3. Otros eventos (AddToCart, InitiateCheckout, etc.) usan track() con
//    eventID random — esos eventos se pueden disparar varias veces sin
//    problema porque no representan conversiones únicas.

// Meta tracking desactivado el 2026-07-06 por migración a Shopify. Poner en true para reactivar.
const META_TRACKING_ENABLED = typeof window !== 'undefined' && window.META_TRACKING_ENABLED === true;

function genEventId() {
  try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch (_) {}
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Tiempo de vida del guard de Purchase en localStorage (30 días).
const PURCHASE_GUARD_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Optional eventID: pass a pre-generated ID to deduplicate against a CAPI server event.
// If omitted, a random ID is generated (fine for events without server-side counterpart).
export function track(eventName, params = {}, eventID) {
  if (!META_TRACKING_ENABLED) return;
  if (typeof window === "undefined") return;

  const fbq = window.fbq;
  if (typeof fbq !== "function") {
    console.warn("[MetaPixel] fbq no está listo todavía:", eventName);
    return;
  }

  const eid = eventID || genEventId();
  fbq("track", eventName, params, { eventID: eid });
}

export function trackPageView(pathname) {
  if (!META_TRACKING_ENABLED) return;
  if (typeof window === "undefined") return;

  const fbq = window.fbq;
  if (typeof fbq !== "function") return;

  fbq("track", "PageView");
}

/**
 * Dispara el evento Purchase con deduplicación robusta.
 *
 * Reglas:
 *  - orderId es OBLIGATORIO. Sin él no se dispara (evita Purchase fantasma).
 *  - Si ya se disparó Purchase para este orderId en este browser dentro de
 *    los últimos 30 días, NO se vuelve a disparar.
 *  - eventID = "purchase_<orderId>" para que Meta pueda deduplicar contra
 *    otros canales (CAPI) o reintentos del mismo browser.
 *
 * params típicos: { value, currency, content_ids, num_items, content_type }
 */
export function trackPurchase(orderId, params = {}) {
  if (!META_TRACKING_ENABLED) return;
  if (typeof window === "undefined") return;

  if (!orderId) {
    console.warn("[MetaPixel] trackPurchase llamado SIN orderId — ignorado.");
    return;
  }

  const guardKey = `mp_purchase_${orderId}`;
  try {
    const raw = localStorage.getItem(guardKey);
    if (raw) {
      const ts = Number(raw);
      if (Number.isFinite(ts) && Date.now() - ts < PURCHASE_GUARD_TTL_MS) {
        console.log("[MetaPixel] Purchase ya disparado para orderId:", orderId, "— se omite duplicado.");
        return;
      }
    }
  } catch (_) {
    // localStorage puede fallar en modo incógnito de algunos browsers;
    // si falla, seguimos adelante (el guard de evento por eventID en Meta
    // sigue protegiendo).
  }

  const fbq = window.fbq;
  if (typeof fbq !== "function") {
    console.warn("[MetaPixel] fbq no está listo todavía: Purchase para", orderId);
    return;
  }

  const eventID = `purchase_${orderId}`;

  try { localStorage.setItem(guardKey, String(Date.now())); } catch (_) {}

  fbq("track", "Purchase", {
    ...params,
    // currency siempre presente para que Meta no descarte el evento
    currency: params.currency || "ARS",
  }, { eventID });
}
