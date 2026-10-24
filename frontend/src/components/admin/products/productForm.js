// frontend/src/components/admin/products/productForm.js
// Lógica pura del editor de productos del admin: formato, ida y vuelta entre
// el producto de la API y el formulario, payload validado, "sin guardar" y
// sincronización con los configs de las landings. Sin React ni red: se testea sola.
import { moneyARS as money } from '../../../utils/pricing.js';

/** Packs editables: lo que se compara para saber si hay cambios sin guardar. */
const BUNDLE_TEXT_FIELDS = ['label', 'badge', 'benefit'];

export const CATEGORIES = [
  { v: 'general', l: 'General' },
  { v: 'hogar', l: 'Hogar' },
  { v: 'mascotas', l: 'Mascotas' },
  { v: 'salud', l: 'Salud' },
  { v: 'accesorios', l: 'Accesorios' },
  { v: 'kits', l: 'Kits' },
  { v: 'inflables', l: 'Inflables' },
  { v: 'gorros', l: 'Gorros' },
  { v: 'ruido', l: 'Ruido' },
  { v: 'mundial', l: 'Mundial' },
  { v: 'otro', l: 'Otro' },
];

export const EMPTY_FORM = Object.freeze({
  _id: '', slug: '', name: '', description: '',
  price: '', compareAtPrice: '', imagesText: '',
  category: 'general', isActive: true, bundles: [],
  subtitle: '', highlightsText: '',
});

export { money };

export function sanitizeSlug(s) {
  return String(s ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // "lámpara" → "lampara", no "l-mpara"
    .replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/** % de descuento entero; 0 si no hay tachado mayor al precio. */
export function pct(price, compareAt) {
  const p = Number(price) || 0;
  const c = Number(compareAt) || 0;
  return c > p && p > 0 ? Math.round(((c - p) / c) * 100) : 0;
}

/** Líneas no vacías de un textarea ("uno por línea"). */
export function lines(text) {
  return String(text ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
}

/** Precio que se muestra en la lista: el pack más barato o el precio base. */
export function listPrice(product) {
  const prices = (Array.isArray(product?.bundles) ? product.bundles : [])
    .map((b) => Number(b?.price)).filter((n) => Number.isFinite(n) && n > 0);
  return prices.length
    ? { fromBundles: true, price: Math.min(...prices) }
    : { fromBundles: false, price: Number(product?.price) || 0 };
}

export function filterProducts(products, search) {
  const q = String(search ?? '').trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) =>
    String(p?.name ?? '').toLowerCase().includes(q) || String(p?.slug ?? '').toLowerCase().includes(q));
}

/* ─── Landings ─── */

/** Qué landing (y variante) usa este slug de producto. */
export function findLandingForSlug(slug, configs) {
  if (!slug) return null;
  for (const [landingSlug, config] of Object.entries(configs)) {
    if (config.productSlug === slug) {
      return { landingSlug, config, variant: null, rootBundles: config.bundles || null };
    }
    for (const variant of Array.isArray(config.variants) ? config.variants : []) {
      if (variant.productSlug === slug) {
        return { landingSlug, config, variant, rootBundles: variant.bundles || null };
      }
    }
  }
  return null;
}

/** Imágenes del config: `images` o, si no hay, las de los bloques de historia. */
function extractImages(config) {
  if (Array.isArray(config.images) && config.images.length) return config.images;
  if (Array.isArray(config.storyBlocks)) return config.storyBlocks.map((b) => b.img).filter(Boolean).slice(0, 4);
  return [];
}

function guessCategory(landingSlug) {
  if (landingSlug.includes('mochila')) return 'mascotas';
  if (/lampara|nebuliz|porta/.test(landingSlug)) return 'hogar';
  if (/soporte|nasal/.test(landingSlug)) return 'salud';
  if (landingSlug.includes('consola')) return 'otro';
  return 'general';
}

/** Todos los productos que declaran las landings (una entrada por variante). */
export function landingProducts(configs, meta = []) {
  const out = [];
  for (const [landingSlug, config] of Object.entries(configs)) {
    const name = meta.find((m) => m.slug === landingSlug)?.name;
    const category = guessCategory(landingSlug);
    if (Array.isArray(config.variants)) {
      for (const v of config.variants) {
        if (!v.productSlug) continue;
        out.push({
          productSlug: v.productSlug,
          name: `${name || landingSlug} — ${v.name}`,
          landingSlug,
          price: v.bundles?.[0]?.price || 0,
          category,
          images: v.images?.length ? v.images : extractImages(config),
          bundles: v.bundles || [],
        });
      }
    } else {
      out.push({
        productSlug: config.productSlug || landingSlug,
        name: name || config.checkoutName || landingSlug,
        landingSlug,
        price: config.bundles?.[0]?.price || 0,
        category,
        images: extractImages(config),
        bundles: config.bundles || [],
      });
    }
  }
  return out;
}

/** Productos de las landings que todavía no existen en la base. */
export function missingLandingProducts(products, configs, meta) {
  const dbSlugs = new Set(products.map((p) => p.slug));
  return landingProducts(configs, meta).filter((lp) => !dbSlugs.has(lp.productSlug));
}

function normalizeBundle(b, idx = 0) {
  return {
    qty: Number(b?.qty ?? idx + 1) || 0,
    price: Number(b?.price) || 0,
    compareAt: Number(b?.compareAt) || 0,
    label: String(b?.label ?? ''),
    badge: String(b?.badge ?? ''),
    benefit: String(b?.benefit ?? ''),
    popular: Boolean(b?.popular),
  };
}

/** Payload de alta para un producto que solo existe en un config de landing. */
export function seedPayload(lp) {
  const first = lp.bundles?.[0];
  return {
    name: lp.name,
    slug: lp.productSlug,
    price: Number(lp.price) || Number(first?.price) || 1, // el modelo exige precio: $1 de placeholder
    compareAtPrice: Number(first?.compareAt) || 0,
    category: lp.category || 'general',
    images: lp.images || [],
    isActive: true,
    bundles: (lp.bundles || []).map(normalizeBundle),
  };
}

/* ─── Formulario ─── */

/**
 * Producto de la API → estado del formulario. Si la base no tiene packs pero la
 * landing sí, se precargan los del config (al guardar quedan en la base).
 */
export function formFromProduct(p, configs = {}) {
  if (!p) return { ...EMPTY_FORM };
  const dbBundles = Array.isArray(p.bundles) ? p.bundles : [];
  const landing = findLandingForSlug(p.slug, configs);
  const configBundles = Array.isArray(landing?.rootBundles) ? landing.rootBundles.map(normalizeBundle) : [];
  return {
    _id: p._id || '',
    slug: p.slug || '',
    name: p.name || '',
    description: p.description || '',
    price: p.price ?? '',
    compareAtPrice: p.compareAtPrice ?? '',
    imagesText: (Array.isArray(p.images) ? p.images : []).join('\n'),
    category: p.category || 'general',
    isActive: p.isActive ?? true,
    bundles: dbBundles.length ? dbBundles : configBundles,
    subtitle: p.subtitle || '',
    highlightsText: (Array.isArray(p.highlights) ? p.highlights : []).join('\n'),
  };
}

/** Cambio de un campo de un pack: los numéricos se guardan como número. */
export function updateBundle(bundles, idx, field, value) {
  return bundles.map((b, i) => {
    if (i !== idx) return b;
    const next = field === 'popular' || BUNDLE_TEXT_FIELDS.includes(field) ? value : Number(value) || 0;
    return { ...b, [field]: next };
  });
}

/**
 * Formulario → payload para POST/PATCH /products.
 * @returns {{ payload: object, error: string }} error vacío si se puede guardar.
 */
export function payloadFromForm(form) {
  const payload = {
    slug: sanitizeSlug(form.slug),
    name: String(form.name ?? '').trim(),
    description: String(form.description ?? '').trim(),
    price: Number(form.price) || 0,
    compareAtPrice: Number(form.compareAtPrice) || 0,
    images: lines(form.imagesText),
    category: String(form.category || 'general').trim(),
    isActive: Boolean(form.isActive),
    subtitle: String(form.subtitle ?? '').trim(),
    highlights: lines(form.highlightsText),
    bundles: (form.bundles || []).map(normalizeBundle),
  };
  let error = '';
  if (!payload.slug) error = 'Falta el slug';
  else if (!payload.name) error = 'Falta el nombre';
  else if (!payload.price && !payload.bundles.length) error = 'Falta el precio';
  else if (payload.bundles.some((b) => b.price <= 0)) error = 'Hay paquetes sin precio';
  return { payload, error };
}

/**
 * ¿El formulario difiere de lo guardado? Compara los payloads normalizados, así
 * "59900" vs 59900 o un espacio al final no cuentan como cambio y cualquier
 * campo de un pack (también badge/beneficio/popular) sí.
 */
export function isDirty(form, saved, configs = {}) {
  if (!saved) return true;
  const a = payloadFromForm(form).payload;
  const b = payloadFromForm(formFromProduct(saved, configs)).payload;
  // Packs precargados del config que todavía no están en la base: hay que guardar.
  if (!(saved.bundles?.length) && a.bundles.length) return true;
  return JSON.stringify(a) !== JSON.stringify(b);
}
