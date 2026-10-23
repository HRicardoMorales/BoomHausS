// frontend/src/utils/imageCdn.js
//
// URLs responsivas para los CDNs de imágenes que usa el sitio. Cada provider
// sabe reescribir una URL a un ancho dado; el resto de URLs se devuelven tal
// cual (sin srcset), así que es seguro llamarlo con cualquier src.
//
//   Cloudinary  .../image/upload/<transform>/v123/foo.jpg → f_auto,q_auto,c_limit,w_N
//               (respeta transformaciones previas: agrega la nuestra encadenada)
//   Pexels      ?auto=compress&cs=tinysrgb&w=N (si había `h`, se escala proporcional)
//   Shopify     cdn.shopify.com/s/files/... y <tienda>/cdn/shop/... → ?width=N
//               (GIF y SVG quedan afuera: el resize de Shopify congela el GIF)
//   X/Twitter   pbs.twimg.com/media/... → name=small|medium|large (680/1200/2048,
//               variantes fijas: el srcset usa el ancho nominal de cada una)
//
// Las URLs protocol-relative (`//host/...`) se normalizan a https.
//
// Uso:
//   responsiveImage(src, { widths: [320, 640, 960] })
//   → { src, srcSet } (srcSet undefined si el host no es transformable)

export const DEFAULT_WIDTHS = [320, 480, 640, 960, 1280];

const CLOUDINARY_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/i;
const PEXELS_RE = /^https?:\/\/images\.pexels\.com\//i;
const SHOPIFY_RE = /^https?:\/\/(?:cdn\.shopify\.com\/s\/files\/|[^/]+\/cdn\/shop\/)[^?#]+\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i;
const TWIMG_RE = /^https?:\/\/pbs\.twimg\.com\/media\//i;

// Variantes con nombre de pbs.twimg.com (encajan la imagen en un cuadrado de N px).
// `thumb` (150) no se usa porque recorta al cuadrado.
const TWIMG_VARIANTS = [
  { name: 'small', width: 680 },
  { name: 'medium', width: 1200 },
  { name: 'large', width: 2048 },
];

function normalize(src) {
  return src.startsWith('//') ? `https:${src}` : src;
}

function cloudinaryAt(match, width) {
  const [, base, rest] = match;
  return `${base}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}

function pexelsAt(src, width) {
  try {
    const url = new URL(src);
    const prevW = Number(url.searchParams.get('w'));
    const prevH = Number(url.searchParams.get('h'));
    url.searchParams.set('auto', 'compress');
    url.searchParams.set('cs', 'tinysrgb');
    url.searchParams.set('w', String(width));
    // Si había alto (ej. fit=crop), se escala proporcional para no cambiar el recorte.
    if (prevW > 0 && prevH > 0) url.searchParams.set('h', String(Math.round((prevH * width) / prevW)));
    else url.searchParams.delete('h');
    url.searchParams.delete('dpr');
    return url.toString();
  } catch {
    return null;
  }
}

function withParams(src, params) {
  try {
    const url = new URL(src);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    return url.toString();
  } catch {
    return null;
  }
}

function twimgVariant(width) {
  return TWIMG_VARIANTS.find((v) => v.width >= width) || TWIMG_VARIANTS[TWIMG_VARIANTS.length - 1];
}

/**
 * { url, width } de `src` a (al menos) `width` px, o null si el host no lo soporta.
 * `width` es el ancho real de la variante (puede ser mayor al pedido en hosts
 * con tamaños fijos, como Twitter).
 */
function resolveAt(src, width) {
  if (!src || typeof src !== 'string' || !(width > 0)) return null;
  const w = Math.round(width);
  const abs = normalize(src.trim());
  const cl = abs.match(CLOUDINARY_RE);
  if (cl) return { url: cloudinaryAt(cl, w), width: w };
  if (PEXELS_RE.test(abs)) {
    const url = pexelsAt(abs, w);
    return url ? { url, width: w } : null;
  }
  if (SHOPIFY_RE.test(abs)) {
    const url = withParams(abs, { width: w });
    return url ? { url, width: w } : null;
  }
  if (TWIMG_RE.test(abs)) {
    const variant = twimgVariant(w);
    const url = withParams(abs, { name: variant.name });
    return url ? { url, width: variant.width } : null;
  }
  return null;
}

/** Devuelve la URL de `src` redimensionada a `width` px, o null si el host no lo soporta. */
export function imageAtWidth(src, width) {
  return resolveAt(src, width)?.url ?? null;
}

/** true si `src` está en un CDN que acepta redimensionado por URL. */
function isTransformable(src) {
  return imageAtWidth(src, 1) !== null;
}

/**
 * { src, srcSet } para un <img>. `src` queda en el ancho más grande de la
 * lista (fallback para navegadores sin srcset), salvo que el host no sea
 * transformable: ahí se devuelve el original y srcSet undefined.
 */
export function responsiveImage(src, { widths = DEFAULT_WIDTHS } = {}) {
  if (!isTransformable(src)) return { src, srcSet: undefined };
  const sorted = [...new Set(widths)].filter((w) => w > 0).sort((a, b) => a - b);
  if (!sorted.length) return { src, srcSet: undefined };
  // Dedupe por URL: en hosts con variantes fijas varios anchos caen en la misma.
  const seen = new Map();
  for (const w of sorted) {
    const r = resolveAt(src, w);
    if (r && !seen.has(r.url)) seen.set(r.url, r.width);
  }
  const entries = [...seen.entries()];
  const srcSet = entries.map(([url, w]) => `${url} ${w}w`).join(', ');
  return { src: entries[entries.length - 1][0], srcSet };
}
