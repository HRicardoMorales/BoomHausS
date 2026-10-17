// frontend/src/utils/preloadImage.js
//
// Precarga una imagen con el MISMO candidato que va a elegir <SafeImg>.
//
// Un `new Image()` con solo `src` baja el original: si después el <img> real
// usa srcset (Cloudinary/Shopify/Twitter, ver imageCdn.js), el navegador pide
// otra URL y la precarga se tira. Seteando `sizes` y `srcset` antes de `src`
// en la imagen suelta, el navegador hace la misma selección por viewport/DPR
// y la respuesta queda en caché para el <img> visible.

import { responsiveImage, DEFAULT_WIDTHS } from './imageCdn.js';

const requested = new Set();

/**
 * @param {string} src  URL original (acepta `//host`).
 * @param {{ sizes?: string, widths?: number[] | false }} [opts]
 *        Deben coincidir con los props del <SafeImg> que la va a mostrar.
 */
export function preloadImage(src, { sizes = '100vw', widths = DEFAULT_WIDTHS } = {}) {
  if (typeof window === 'undefined' || !src) return;
  const { src: url, srcSet } = widths ? responsiveImage(src, { widths }) : { src };
  const key = `${url}|${srcSet ?? ''}|${sizes}`;
  if (requested.has(key)) return;
  requested.add(key);

  const img = new window.Image();
  img.decoding = 'async';
  if (srcSet) {
    img.sizes = sizes;
    img.srcset = srcSet;
  }
  img.src = url.startsWith('//') ? `https:${url}` : url;
}
