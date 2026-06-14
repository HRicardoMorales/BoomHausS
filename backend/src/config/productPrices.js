// backend/src/config/productPrices.js
//
// FUENTE DE VERDAD DE PRECIOS — actualizar acá cuando cambien en
// las landings (frontend/src/landings/*.js o las constantes hardcodeadas
// de las landings componente: LuxCoveLED, DepiladoraIPL, ParchesDetox, etc.)
//
// Esta tabla actúa como red de seguridad: el servicio de pricing busca
// primero el producto en MongoDB (Product). Si no existe, cae a esta tabla.
// Si tampoco está acá, la orden se rechaza con 400.
//
// Estructura por slug (o por productId que la landing manda al carrito):
//   price:                precio unitario en ARS — usado cuando el cliente
//                         compra sin bundleTotal (qty * price).
//   allowedBundlePrices:  lista de precios TOTALES permitidos para un
//                         bundle. El frontend manda `bundleTotal` en cada
//                         item; el backend valida que esté en esta lista
//                         (de lo contrario rechaza la orden). Soporta el
//                         caso donde varios bundles tienen qty=1 pero
//                         precios distintos por pack.
//
//   bundles (legacy):     { [qty]: totalPrecioBundle } — compatible hacia
//                         atrás con el formato viejo. Se sigue aceptando.

module.exports = {
  // ── Escultor Facial LED 3 en 1 (LuxCoveLED) ────────────────────────
  // frontend/src/landings/LuxCoveLED/LuxCoveLED.jsx — DEFAULT_PRICE = 39900
  'escultor-led': {
    price: 39900,
    allowedBundlePrices: [39900],
  },

  // ── Depiladora IPL Profesional ─────────────────────────────────────
  // frontend/src/landings/depiladora-ipl.js + DepiladoraIPL/DepiladoraIPL.jsx
  // El componente envía PRODUCT_SLUG = 'Depiladora Permanente IPL En casa'
  // (bug pre-existente), así que registramos ambos identificadores.
  'depiladora-ipl': {
    price: 39900,
    allowedBundlePrices: [39900],
  },
  'Depiladora Permanente IPL En casa': {
    price: 39900,
    allowedBundlePrices: [39900],
  },

  // ── Parches Plantares Detox Kinoki ─────────────────────────────────
  // frontend/src/landings/parches-detox.js — bundles 3+3 / 6+6 / 10+10
  'parches-detox': {
    allowedBundlePrices: [48900, 58000, 78800],
  },

  // ── Sillón Puff Inflable Sunfield ──────────────────────────────────
  // frontend/src/landings/sillon-puff-inflable.js
  // El bundle qty=3 está soldOut con price=0; no se incluye.
  'sillon-puff-inflable': {
    allowedBundlePrices: [69800, 131800],
  },

  // ── Kit de Belleza 6 en 1 Boxili ───────────────────────────────────
  // frontend/src/landings/kit-belleza-6en1.js
  'kit-belleza-6en1': {
    allowedBundlePrices: [34900, 62000, 89900],
  },

  // ── Masajeador EMS Eyes ────────────────────────────────────────────
  // frontend/src/landings/masajeador-ems-eyes.js
  // Bundles con qty=1 fija pero precios distintos por pack.
  'masajeador-ems-eyes': {
    allowedBundlePrices: [39900, 72000, 99900],
  },

  // ── Masajeador Facial Lambo Lady ───────────────────────────────────
  // frontend/src/landings/masajeador-facial-iones-lambo.js
  'masajeador-facial-iones-lambo': {
    allowedBundlePrices: [42900, 74900],
  },
};
