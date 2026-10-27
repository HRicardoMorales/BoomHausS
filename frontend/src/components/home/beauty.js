// Identidad de la home: belleza y cuidado en casa. Datos puros (sin React) para
// que la home, las secciones de prueba social y los tests compartan la misma
// lista de productos de belleza.
import { HOME_MEDIA } from "./homeMedia.js";

/* Slugs de landing de los productos de belleza, en orden de vidriera. */
export const BEAUTY_SLUGS = [
  "depiladora-ipl",
  "escultor-led",
  "masajeador-facial-iones-lambo",
  "masajeador-ems-eyes",
  "kit-belleza-6en1",
];

/*
 * "Por lo que buscás": una entrada por necesidad, no por tipo de producto.
 * `slug` es la landing a la que lleva; `media` la foto editorial (si todavía
 * no existe se usa la del producto).
 */
export const CONCERNS = [
  {
    id: "depilacion",
    title: "Depilación en casa",
    text: "Luz pulsada para piernas, axilas y bikini, a tu ritmo.",
    slug: "depiladora-ipl",
    media: HOME_MEDIA.depilacion,
  },
  {
    id: "rostro",
    title: "Rostro más firme",
    text: "Masajes con calor y microcorrientes en cinco minutos.",
    slug: "masajeador-facial-iones-lambo",
    media: HOME_MEDIA.rostro,
  },
  {
    id: "luz",
    title: "Luz LED",
    text: "Siete colores de luz para la rutina de noche.",
    slug: "escultor-led",
    media: HOME_MEDIA.led,
  },
  {
    id: "ojos",
    title: "Ojos descansados",
    text: "Calor suave y masaje para el final del día.",
    slug: "masajeador-ems-eyes",
    media: HOME_MEDIA.ojos,
  },
];

/** Landing de un producto del catálogo ("/lp/escultor-led" → "escultor-led"). */
export const landingOf = (product) => {
  const m = /^\/lp\/([^/?#]+)/.exec(product?.href || "");
  return m ? m[1] : null;
};

export const isBeauty = (product) => BEAUTY_SLUGS.includes(landingOf(product));

/**
 * Producto del catálogo para cada necesidad (para la foto de respaldo y el
 * "desde $"). Si el producto no está en el catálogo la necesidad igual se
 * muestra, sin precio.
 */
export function concernsWithProducts(products = [], concerns = CONCERNS) {
  const bySlug = new Map();
  for (const p of products) {
    const slug = landingOf(p);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, p);
  }
  return concerns.map((c) => ({ ...c, product: bySlug.get(c.slug) || null }));
}

/** Belleza primero, el resto después (orden estable). */
export function beautyFirst(products = []) {
  const rank = (p) => {
    const i = BEAUTY_SLUGS.indexOf(landingOf(p));
    return i === -1 ? BEAUTY_SLUGS.length : i;
  };
  return products
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map(({ p }) => p);
}
