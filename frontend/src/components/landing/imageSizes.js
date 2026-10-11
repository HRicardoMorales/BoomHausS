// frontend/src/components/landing/imageSizes.js
//
// `sizes` y anchos de srcset compartidos por las landings. El layout es el
// mismo en todas (hero en 2 columnas desde 768 px con contenedor de 1100 px),
// así que centralizarlos evita que cada <SafeImg> invente su propio número.
// Los anchos solo se usan en hosts transformables (ver utils/imageCdn.js).

/** Imagen principal de la galería del hero: 100vw en mobile, ~48% de 1100 px en desktop. */
export const HERO_SIZES = '(min-width: 768px) min(48vw, 528px), 100vw';

/** Bloques imagen + texto (features): media columna en desktop. */
export const FEATURE_SIZES = '(min-width: 768px) min(50vw, 550px), 100vw';

/** Grillas de 2 columnas (antes/después por zona). */
export const HALF_SIZES = '(min-width: 768px) 360px, 50vw';

/** Miniaturas de 56-70 px (galería, bundles): 2x y 3x. */
export const THUMB_WIDTHS = [120, 180];

/** Íconos y avatares de ~44 px. */
export const ICON_WIDTHS = [96, 144];

/** Pasos ilustrados (~90 px). */
export const STEP_WIDTHS = [180, 270];

/** Comparativas lado a lado (máx. 170 px). */
export const COMP_WIDTHS = [240, 340, 510];

/** Media columna. */
export const HALF_WIDTHS = [240, 360, 480, 720];

/** Fotos de reseñas (tarjeta de hasta 520 px). */
export const REVIEW_WIDTHS = [360, 520, 780, 1040];
