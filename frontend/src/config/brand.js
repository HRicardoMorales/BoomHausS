// Única fuente del nombre de la tienda.
//
// Antes cada componente leía `VITE_STORE_NAME` con su propio default
// ("Amelor" en unos, "Encontratodo" en otros): sin la variable definida, la
// home, auth y las páginas legales mostraban otra marca que el logo y el SEO.

/** Marca por defecto: la del logo y los títulos de cada ruta. */
export const DEFAULT_STORE_NAME = "Amelor";

/**
 * Resuelve el nombre visible a partir del valor de entorno.
 * Vacío, solo espacios o no-string → marca por defecto.
 * @param {unknown} raw
 * @returns {string}
 */
export function resolveStoreName(raw) {
  const name = typeof raw === "string" ? raw.trim() : "";
  return name || DEFAULT_STORE_NAME;
}

export const STORE_NAME = resolveStoreName(import.meta.env.VITE_STORE_NAME);

/** Inicial para el monograma de imágenes sin foto. */
export const BRAND_MONOGRAM = STORE_NAME.charAt(0).toUpperCase();
