// Orden "más vendidos" para el carrusel de la home.
// El backend (GET /products/bestsellers) devuelve ids o slugs ordenados por
// unidades vendidas en pedidos pagos; acá se cruzan con el catálogo cargado.

const keysOf = (p) => [p?._id, p?.id, p?.slug].filter(Boolean).map(String);

/**
 * Productos del catálogo en el orden de `ids`. Devuelve null si hay menos de
 * `min` coincidencias (en ese caso la home vuelve a "ofertas que más rinden").
 */
export function rankBySales(products, ids, { min = 3, max = 8 } = {}) {
  if (!Array.isArray(products) || !Array.isArray(ids) || ids.length === 0) return null;
  const byKey = new Map();
  for (const p of products) for (const k of keysOf(p)) if (!byKey.has(k)) byKey.set(k, p);

  const seen = new Set();
  const ranked = [];
  for (const id of ids) {
    const p = byKey.get(String(id));
    if (p && !seen.has(p)) {
      seen.add(p);
      ranked.push(p);
      if (ranked.length === max) break;
    }
  }
  return ranked.length >= min ? ranked : null;
}
