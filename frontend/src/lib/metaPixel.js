function genEventId() {
  try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch (_) {}
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function track(eventName, params = {}) {
  if (typeof window === "undefined") return;

  const fbq = window.fbq;
  if (typeof fbq !== "function") {
    console.warn("[MetaPixel] fbq no está listo todavía:", eventName);
    return;
  }

  const eventID = genEventId();
  fbq("track", eventName, params, { eventID });
}

export function trackPageView(pathname) {
  if (typeof window === "undefined") return;

  const fbq = window.fbq;
  if (typeof fbq !== "function") return;

  // PageView para SPA
  fbq("track", "PageView");

  // (Opcional) Si querés ver rutas en Analytics como evento custom:
  // fbq("trackCustom", "VirtualPageView", { path: pathname });
}
