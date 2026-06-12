// backend/src/config/productPrices.js
//
// FUENTE DE VERDAD DE PRECIOS — actualizar acá cuando cambien en
// LANDING_CONFIGS o en las constantes hardcodeadas de cada landing
// (LuxCoveLED.jsx DEFAULT_PRICE, DepiladoraIPL, ParchesDetox, etc.).
//
// Esta tabla actúa como red de seguridad: el servicio de pricing busca
// primero el producto en MongoDB (Product.bundles). Si no existe, cae a
// esta tabla. Si tampoco está acá, la orden se rechaza con 400.
//
// Estructura por slug:
//   price:   precio unitario en ARS (usado cuando no hay bundle matching)
//   bundles: { [qty: number]: totalPrecioBundle } — precio TOTAL del pack
//            de esa cantidad (no por unidad)

module.exports = {
  // LuxCoveLED — Escultor Facial LED 7 en 1
  // (frontend/src/landings/LuxCoveLED/LuxCoveLED.jsx — DEFAULT_PRICE)
  'escultor-led': {
    price: 39900,
    bundles: { 1: 39900 },
  },

  // TODO: cuando una landing no esté indexada en BD (Product), agregala acá
  // con sus bundles actuales. Ejemplo:
  // 'depiladora-ipl': { price: 35900, bundles: { 1: 35900, 2: 59900 } },
  // 'parches-detox':  { price:  9900, bundles: { 1:  9900, 2: 14900, 3: 19900 } },
};
