// Slug de producto de cada landing dedicada (las que tienen su propio
// componente en vez de pasar por ProductDetail). Fuente única: el `data.js`
// de cada landing lo re-exporta como PRODUCT_SLUG y App.jsx lo usa para
// adelantar el GET del producto mientras baja el chunk (ver
// services/productBySlug.js). Módulo sin dependencias: entra en el chunk
// inicial sin arrastrar los datos de las landings.
export const LANDING_PRODUCT_SLUGS = Object.freeze({
  luxCoveLED: 'escultor-led',
  // Slug histórico del admin, con espacios: no "arreglarlo" sin migrar la BD.
  depiladoraIPL: 'Depiladora Permanente IPL En casa',
  parchesDetox: 'parches-detox',
  antimohoPisos: 'antimoho-pisos',
});
