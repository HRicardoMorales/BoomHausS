// Minimal config para LANDING_CONFIGS / home page
// El componente completo vive en src/landings/LuxCoveLED/LuxCoveLED.jsx
// checkoutName es SOLO fallback: LuxCoveLED lee product.name de la BD
// y usa este valor si el fetch falla. Fuente de verdad = admin → producto
// escultor-led → campo Name. Cambiá alli para actualizar UI + card.
const escultorLed = {
  productSlug: 'escultor-led',
  checkoutName: 'Escultor Facial LED 7 en 1',
  bundles: [
    { qty: 1, price: 39900, compareAt: 115000, label: '1 unidad', popular: true },
  ],
  // heroImages vacio a proposito: si hay un producto activo con imagenes
  // en la BD, la card del home lo toma de ahi. Un item con src:'' aca
  // hacia que el home renderizara una card con imagen rota. Vacio = deja
  // que SafeImg muestre el fallback con el nombre.
  heroImages: [],
};


export default escultorLed;
