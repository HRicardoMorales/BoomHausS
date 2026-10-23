// Qué piezas del layout global (cinta, navbar, footer, botón de WhatsApp)
// se muestran en cada ruta. Antes eran cuatro cadenas de `||` en App.jsx;
// acá cada ruta declara solo lo que cambia respecto del default.
//
// Orden de resolución: DEFAULT ← reglas por prefijo (en orden) ← ruta exacta.
// Para sumar una landing con header propio alcanza con una línea en EXACT.

const DEFAULT = Object.freeze({
  marquee: true,
  navbar: true,
  footer: true,
  whatsapp: true,
});

// Landing a pantalla completa: trae header, cinta y cierre propios.
const FULL_BLEED = { marquee: false, footer: false };

const PREFIX_RULES = [
  // Panel admin: sin WhatsApp de cliente.
  { prefix: '/admin', whatsapp: false },
  // Ficha y landings renderizan su propia pestaña de WhatsApp.
  { prefix: '/products/', whatsapp: false },
  { prefix: '/lp/', whatsapp: false },
];

const EXACT = {
  // UI densa: nada de chrome ni flotantes.
  '/checkout': { marquee: false, navbar: false, footer: false, whatsapp: false },
  // WIP: sin header global pero todavía sin pestaña de WhatsApp propia,
  // así que conserva el botón global. Al sumarle su WhatsAppTab, quitar
  // `whatsapp: true`.
  '/lp/antimoho-pisos': { marquee: false, navbar: false, footer: false, whatsapp: true },
  '/lp/escultor-led': FULL_BLEED,
  '/lp/depiladora-ipl': FULL_BLEED,
  '/lp/parches-detox': FULL_BLEED,
  '/lp/masajeador-ems-eyes': FULL_BLEED,
  '/lp/masajeador-facial-iones-lambo': FULL_BLEED,
  // Cierran con su propio CTA/footer pero usan la cinta global.
  '/lp/mundial-revendedores': { footer: false },
  '/lp/sillon-puff-inflable': { footer: false },
  '/lp/kit-belleza-6en1': { footer: false },
};

/** React Router acepta `/checkout/`; la tabla también. */
function normalize(pathname) {
  if (!pathname) return '/';
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

/**
 * @param {string} pathname  `location.pathname`
 * @returns {{ marquee: boolean, navbar: boolean, footer: boolean, whatsapp: boolean }}
 */
export function getLayoutChrome(pathname) {
  const path = normalize(pathname);
  const result = { ...DEFAULT };
  for (const { prefix, ...flags } of PREFIX_RULES) {
    if (path.startsWith(prefix)) Object.assign(result, flags);
  }
  return Object.assign(result, EXACT[path]);
}
