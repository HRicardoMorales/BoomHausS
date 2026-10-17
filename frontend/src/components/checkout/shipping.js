// Opciones de envío del checkout fullpage.
// Antes se recreaban en cada render de la página y sus precios estaban duplicados
// en el cálculo del costo: `shippingPrice` es ahora la única fuente para el total
// que ve el cliente (el servidor recalcula el suyo; esto es solo presentación).

export const SHIPPING_OPTIONS = [
  { value: "sucursal",    title: "Envío a sucursal",                                      sub: "2 a 4 días hábiles", price: 0,    was: null },
  { value: "domicilio",   title: "Envío a domicilio + código de seguimiento",             sub: "1 a 3 días hábiles", price: 2980, was: 9814 },
  { value: "prioritario", title: "Envío a domicilio prioritario + código de seguimiento", sub: "1 a 2 días hábiles", price: 4890, was: 12326 },
];

export function shippingPrice(method) {
  return SHIPPING_OPTIONS.find(o => o.value === method)?.price ?? 0;
}

/** Se muestran las opciones recién cuando hay algo de dirección cargado. */
export function isDeliveryUnlocked(form) {
  return form.direccion.trim().length >= 4 || form.ciudad.trim().length >= 2 || form.cp.trim().length >= 4;
}
