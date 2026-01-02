export function track(eventName, params = {}) {
  if (typeof window === "undefined") return;

  const fbq = window.fbq;
  if (typeof fbq !== "function") {
    console.warn("[MetaPixel] fbq no está listo todavía:", eventName);
    return;
  }

  fbq("track", eventName, params);
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
