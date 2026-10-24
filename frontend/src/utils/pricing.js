// Formato de precios y descuentos compartido (es-AR, sin decimales).
// Única fuente de verdad para mostrar plata: no crear otros `Intl.NumberFormat`
// de moneda en componentes (antes había 15 copias, varias creando el formatter
// en cada render).

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Número finito o 0: `undefined`, `null`, `NaN`, `Infinity` y basura → 0. */
const toAmount = (n) => {
  const num = typeof n === "string" && n.trim() === "" ? 0 : Number(n);
  return Number.isFinite(num) ? num : 0;
};

/** "$ 12.345" (espacio duro, como lo escribe Intl). Valores inválidos → "$ 0". */
export const moneyARS = (n) => ARS.format(toAmount(n));

/**
 * "$12.345" sin espacio: para precios grandes en tipografía display (héroe de
 * la ficha, bundles, landing mayorista), donde el espacio parte el número.
 */
export const moneyARSTight = (n) => moneyARS(n).replace(/\s/g, "");

/**
 * Porcentaje de descuento entero entre el precio actual y el de lista.
 * Devuelve 0 si no hay descuento real o si los datos son inválidos.
 */
export function discountPct(price, compareAt) {
  const p = Number(price) || 0;
  const c = Number(compareAt) || 0;
  return c > p && p > 0 ? Math.round(((c - p) / c) * 100) : 0;
}
