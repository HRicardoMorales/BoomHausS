// frontend/src/utils/imageCdn.js
//
// URLs responsivas para los CDNs de imágenes que usa el sitio. Cada provider
// sabe reescribir una URL a un ancho dado; el resto de URLs se devuelven tal
// cual (sin srcset), así que es seguro llamarlo con cualquier src.
//
//   Cloudinary  .../image/upload/<transform>/v123/foo.jpg → f_auto,q_auto,c_limit,w_N
//               (respeta transformaciones previas: agrega la nuestra encadenada)
//   Pexels      ?auto=compress&cs=tinysrgb&w=N (si había `h`, se escala proporcional)
//
// Uso:
//   responsiveImage(src, { widths: [320, 640, 960] })
//   → { src, srcSet } (srcSet undefined si el host no es transformable)

export const DEFAULT_WIDTHS = [320, 480, 640, 960, 1280];

const CLOUDINARY_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/i;
const PEXELS_RE = /^https?:\/\/images\.pexels\.com\//i;

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

/** Devuelve la URL de `src` redimensionada a `width` px, o null si el host no lo soporta. */
export function imageAtWidth(src, width) {
  if (!src || typeof src !== 'string' || !(width > 0)) return null;
  const w = Math.round(width);
  const cl = src.match(CLOUDINARY_RE);
  if (cl) return cloudinaryAt(cl, w);
  if (PEXELS_RE.test(src)) return pexelsAt(src, w);
  return null;
}

/** true si `src` está en un CDN que acepta redimensionado por URL. */
export function isTransformable(src) {
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
  const srcSet = sorted.map((w) => `${imageAtWidth(src, w)} ${w}w`).join(', ');
  return { src: imageAtWidth(src, sorted[sorted.length - 1]), srcSet };
}
