// Cálculo de totales del carrito (presentación). Función pura y única fuente:
// la usan el CartContext y el checkout. El servidor recalcula y valida el total
// real del pedido; esto es lo que ve el cliente antes de pagar.

/** Descuento por defecto de la promo "Lleva 2" (por pares). */
export const BUNDLE2_DISCOUNT_PCT = 18;

/**
 * Total de una línea del carrito, redondeado a pesos enteros.
 * - `bundleTotal`: pack de precio cerrado (gana sobre todo lo demás).
 * - `promo.type === "bundle2"`: -X% solo sobre los pares; la unidad impar va a precio lleno.
 * - Cantidades o precios inválidos/negativos → 0.
 */
export function calcItemTotal(it) {
  if (it?.bundleTotal) return Math.round(Number(it.bundleTotal));

  const qty = Math.max(0, Number(it?.quantity) || 0);
  const base = Math.max(0, Number(it?.price) || 0);
  if (!qty || !base) return 0;

  if (it?.promo?.type === "bundle2") {
    const pct = Math.max(0, Number(it?.promo?.discountPct) || 0);
    const pairs = Math.floor(qty / 2) * 2;
    return Math.round(pairs * base * (1 - pct / 100) + (qty - pairs) * base);
  }

  return Math.round(qty * base);
}

/** Suma de las líneas. */
export const cartTotal = (items = []) => items.reduce((acc, it) => acc + calcItemTotal(it), 0);
