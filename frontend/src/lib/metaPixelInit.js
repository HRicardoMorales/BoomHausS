// frontend/src/lib/metaPixelInit.js
// Inyecta el snippet base del Meta Pixel condicionalmente a VITE_META_PIXEL_ID.
// Se ejecuta una sola vez al arrancar la app (llamado desde main.jsx).
//
// Si VITE_META_PIXEL_ID no está definida (dev local sin config, deploys sin la
// env var), no hace nada — window.fbq queda undefined y todas las funciones
// de metaPixel.js son no-op silencioso.

let initialized = false;

export function initMetaPixel() {
    if (initialized) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const pixelId = import.meta.env.VITE_META_PIXEL_ID;
    if (!pixelId || pixelId === 'META_PIXEL_ID_PLACEHOLDER') {
        console.log('[MetaPixel] VITE_META_PIXEL_ID no configurado — Pixel deshabilitado.');
        return;
    }

    // Snippet oficial de Meta (inline, para que fbq esté listo antes del primer track).
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');

    initialized = true;
}
