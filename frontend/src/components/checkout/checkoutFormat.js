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
