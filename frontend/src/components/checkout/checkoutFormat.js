// Helpers de presentación del checkout. El total real lo recalcula y valida el servidor.

export const PROVINCES = [
  "Buenos Aires","CABA","Catamarca","Chaco","Chubut","Córdoba","Corrientes",
  "Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones",
  "Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe",
  "Santiago del Estero","Tierra del Fuego","Tucumán",
];

export function money(n) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n) || 0);
}

// Misma función que usa el CartContext (antes había una copia acá).
export { calcItemTotal } from "../../utils/cartMath";

/** Total cobrado y total "de lista" de una línea (para tachar el precio anterior). */
export function lineTotals(item, calcItemTotal) {
  const total = calcItemTotal(item);
  const original = item.bundleTotal && item.compareAtPrice
    ? Number(item.compareAtPrice)
    : (Number(item.price) || 0) * (Number(item.quantity) || 0);
  return { total, original, discounted: original > total };
}

export function itemThumb(item) {
  return item.imageUrl || item.image || null;
}
