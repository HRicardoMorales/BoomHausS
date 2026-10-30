// Presentación de una línea del carrito. Pura: no cambia cómo se calcula el
// total (eso vive en `utils/cartMath`, y el servidor lo recalcula al pagar),
// solo decide qué se muestra y qué controles tiene sentido ofrecer.
import { calcItemTotal } from "../../utils/cartMath.js";

/** Tope del stepper: evita que un toque sostenido deje 300 unidades. */
export const MAX_QTY = 99;

/**
 * - `isPack`: la línea tiene `bundleTotal` (pack de precio cerrado elegido en
 *   una landing). Su total no depende de la cantidad, así que el stepper no
 *   se ofrece: antes "+" sumaba unidades sin cambiar el precio. Esto valía
 *   solo para la lámpara (detectada por slug); ahora vale para todo pack.
 * - `saving`: lo que ahorra el pack contra su precio de lista (`compareAtPrice`
 *   es el precio de lista del pack completo, igual que en el checkout).
 * - `promoPct`: la promo "Lleva 2" se muestra solo cuando aplica (≥ 2 u.).
 */
export function describeLine(it) {
  const qty = Math.max(1, Math.trunc(Number(it?.quantity)) || 1);
  const unitPrice = Math.max(0, Number(it?.price) || 0);
  const total = calcItemTotal(it);
  const isPack = Boolean(it?.bundleTotal);
  const compareAt = Math.max(0, Number(it?.compareAtPrice) || 0);
  const saving = isPack && compareAt > total ? compareAt - total : 0;
  const promoPct =
    !isPack && qty >= 2 && it?.promo?.type === "bundle2"
      ? Math.max(0, Number(it.promo.discountPct) || 0)
      : 0;

  return {
    qty,
    unitPrice,
    total,
    isPack,
    saving,
    promoPct,
    canDecrease: !isPack && qty > 1,
    canIncrease: !isPack && qty < MAX_QTY,
  };
}

/** Unidades totales (los packs cuentan sus unidades). */
export function cartCount(items = []) {
  return items.reduce((acc, it) => acc + Math.max(0, Number(it?.quantity) || 0), 0);
}

/** Ahorro total de los packs del carrito. */
export function cartSavings(items = []) {
  return items.reduce((acc, it) => acc + describeLine(it).saving, 0);
}

/** "1 producto" / "3 productos". */
export const unitsLabel = (n) => `${n} ${n === 1 ? "producto" : "productos"}`;
