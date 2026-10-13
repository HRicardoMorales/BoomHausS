// Formato de precios y descuentos compartido (es-AR, sin decimales).

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** "$ 12.345" — valores no numéricos se muestran como $ 0. */
export const moneyARS = (n) => ARS.format(Number(n) || 0);

/**
 * Porcentaje de descuento entero entre el precio actual y el de lista.
 * Devuelve 0 si no hay descuento real o si los datos son inválidos.
 */
export function discountPct(price, compareAt) {
  const p = Number(price) || 0;
  const c = Number(compareAt) || 0;
  return c > p && p > 0 ? Math.round(((c - p) / c) * 100) : 0;
}
