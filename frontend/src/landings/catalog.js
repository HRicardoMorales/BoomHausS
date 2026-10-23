// Puente entre los productos de la base y las landings configuradas en
// `src/landings/*`. Funciones puras: sin React ni red, fáciles de testear.
import { LANDING_CONFIGS } from "./index.js";

/* Slugs canónicos de las landings, para deduplicar por prefijo. */
const LANDING_PRODUCT_SLUGS = new Set(
  Object.values(LANDING_CONFIGS).map((cfg) => cfg.productSlug).filter(Boolean)
);

/**
 * Landing canónica para un slug de producto de la base (misma lógica que
 * `findLandingForSlug` del admin):
 * 1. clave directa del config ("parches-detox")
 * 2. `config.productSlug` ("lampara-magnetica-negro-kit" → "lampara-magnetica")
 * 3. `variant.productSlug` (variantes de una misma landing)
 * 4. prefijo: "sillon-puff-inflable-sunfield" extiende un productSlug conocido
 *    con palabras agregadas en el admin (p. ej. la marca).
 */
export function findLandingSlug(productSlug) {
  if (!productSlug) return null;
  for (const [landingSlug, config] of Object.entries(LANDING_CONFIGS)) {
    if (landingSlug === productSlug) return landingSlug;
    if (config.productSlug === productSlug) return landingSlug;
    if (Array.isArray(config.variants)) {
      for (const v of config.variants) {
        if (v.productSlug === productSlug) return landingSlug;
      }
    }
  }
  for (const [landingSlug, config] of Object.entries(LANDING_CONFIGS)) {
    const base = config.productSlug || landingSlug;
    if (productSlug.startsWith(base + "-")) return landingSlug;
  }
  return null;
}

/** URL de la ficha: la landing si existe, si no el detalle genérico. */
export function productHref(product) {
  const landingSlug = findLandingSlug(product.slug);
  return landingSlug ? `/lp/${landingSlug}` : `/products/${product._id}`;
}

/* Productos "virtuales" a partir de los configs de landing, para que una
   landing aparezca en el catálogo aunque su producto no esté en la base.
   Se deduplican por referencia de config ('nebulizador' y 'nebulizador-mesh'
   apuntan al mismo objeto). Los configs son estáticos → se calculan una vez. */
function buildLandingVirtualProducts() {
  const seenCfgs = new Set();
  const out = [];
  for (const [key, cfg] of Object.entries(LANDING_CONFIGS)) {
    if (seenCfgs.has(cfg)) continue;
    seenCfgs.add(cfg);
    const slug = cfg.productSlug || key;
    const v0 = cfg.variants?.[0];
    // Configs sin variants (sillón puff, parches detox): imagen del primer
    // heroImage o storyBlock, precio del primer bundle.
    const hero = cfg.heroImages?.[0];
    const img = v0?.thumbImg || v0?.images?.[0]
      || (typeof hero === "string" ? hero : hero?.src)
      || cfg.storyBlocks?.[0]?.img
      || "";
    out.push({
      _id: `lp-${slug}`,
      name: cfg.checkoutName || slug,
      slug,
      images: img ? [img] : [],
      price: v0?.bundles?.[0]?.price || cfg.bundles?.[0]?.price || 0,
      compareAtPrice: v0?.bundles?.[0]?.compareAt || cfg.bundles?.[0]?.compareAt || 0,
      isActive: true,
    });
  }
  return out;
}

export const LANDING_VIRTUAL_PRODUCTS = buildLandingVirtualProducts();

/**
 * Catálogo visible a partir de la respuesta de la API.
 * - `apiProducts`: productos de `/products` (se descartan los inactivos).
 * - `dbSlugs`: todos los slugs de la base, activos e inactivos: un virtual
 *   cuyo producto se desactivó no debe reaparecer.
 * Regla dura: precio > 0 obligatorio, nunca una card "$ 0" con botón de compra.
 * Los virtuales solo se suman acá, con la API respondiendo OK: nunca como
 * fallback de un error de red.
 */
export function buildCatalog(apiProducts, dbSlugs = [], virtuals = LANDING_VIRTUAL_PRODUCTS) {
  const active = (Array.isArray(apiProducts) ? apiProducts : []).filter((p) => p.isActive !== false);

  const allDbSlugs = new Set(Array.isArray(dbSlugs) ? dbSlugs : []);
  active.forEach((p) => p.slug && allDbSlugs.add(p.slug)); // por si /slugs falló

  const extras = virtuals.filter((p) => !allDbSlugs.has(p.slug));

  // Productos de la base cuyo slug extiende el de una landing: ya los
  // representa la landing (o su virtual).
  const fromDb = active.filter((p) => {
    if (!p.slug || LANDING_PRODUCT_SLUGS.has(p.slug)) return true;
    for (const base of LANDING_PRODUCT_SLUGS) {
      if (p.slug.startsWith(base + "-")) return false;
    }
    return true;
  });

  // `href` precalculado: así la card no necesita los configs de landing y
  // este módulo puede vivir fuera del chunk inicial (ver `useCatalog`).
  return [...extras, ...fromDb]
    .filter((p) => Number(p.price) > 0)
    .map((p) => ({ ...p, href: productHref(p) }));
}
