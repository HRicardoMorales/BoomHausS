// Lógica pura de la ficha de producto / landing (sin React → testeable).
//
// La ficha combina tres fuentes:
//   1. el config estático de la landing (`src/landings/*.js`),
//   2. la variante elegida (puede traer sus propios packs, bullets e imágenes),
//   3. el producto de la base (precios de packs editados desde el admin).

/**
 * Pack seleccionado por defecto: el del config si lo fija, si no el marcado
 * `popular`, y si no hay ninguno el segundo (índice histórico de la tienda).
 */
export function defaultBundleIdx(config, bundles) {
  if (config?.defaultBundleIdx !== undefined) return config.defaultBundleIdx;
  if (!bundles) return 1;
  const popular = bundles.findIndex((b) => b.popular);
  return popular >= 0 ? popular : 1;
}

/**
 * Config efectivo: la variante activa pisa packs, bullets y descripción corta;
 * el subtítulo y los bullets del producto (admin) pisan a ambos; si el
 * producto de la base tiene packs guardados, sus precios pisan los del config
 * (se cruzan por cantidad).
 */
export function resolveLandingConfig(config, activeVariant, product) {
  let base = config;
  if (activeVariant) {
    const bullets = [...(activeVariant.kitBullets || []), ...(config.sharedBenefits || [])];
    base = {
      ...config,
      bundles: activeVariant.bundles || config.bundles,
      trustBullets: bullets.length ? bullets : config.trustBullets,
      miniDescription: activeVariant.miniDescription || config.miniDescription,
    };
  }

  base = applyProductCopy(base, product);

  if (!product?.bundles?.length || !base.bundles?.length) return base;

  const bundles = base.bundles.map((cb) => {
    const db = product.bundles.find((b) => b.qty === cb.qty);
    return db ? { ...cb, price: db.price, compareAt: db.compareAt ?? cb.compareAt } : cb;
  });
  return { ...base, bundles };
}

/** Máximo de bullets que muestra el hero (y que acepta el backend). */
export const MAX_HIGHLIGHTS = 6;

/**
 * Textos del producto cargados desde el admin: `subtitle` pisa el subtítulo
 * del hero y `highlights` los bullets. Sin datos en el producto queda el
 * config (o los bullets neutros de la ficha genérica).
 */
export function applyProductCopy(config, product) {
  const subtitle = typeof product?.subtitle === "string" ? product.subtitle.trim() : "";
  const highlights = Array.isArray(product?.highlights)
    ? product.highlights
        .filter((h) => typeof h === "string")
        .map((h) => h.trim())
        .filter(Boolean)
        .slice(0, MAX_HIGHLIGHTS)
    : [];
  if (!subtitle && !highlights.length) return config;
  return {
    ...config,
    ...(subtitle && { heroSubtitle: subtitle }),
    ...(highlights.length && { trustBullets: highlights }),
  };
}

/**
 * Galería: imágenes del color elegido → del producto (portada primero, sin
 * duplicados) → las del config de la variante (producto no cargado en admin).
 */
export function resolveGalleryImages(product, activeVariant, activeColorVariant) {
  if (activeColorVariant?.images?.length) return activeColorVariant.images.filter(Boolean);

  const images = [];
  if (product?.imageUrl) images.push(product.imageUrl);
  if (Array.isArray(product?.images)) {
    for (const x of product.images) {
      if (x && typeof x === "string" && !images.includes(x)) images.push(x);
    }
  }
  if (images.length) return images;

  return activeVariant?.images?.length ? activeVariant.images.filter(Boolean) : images;
}

/**
 * Producto sintético para cuando la variante tiene imágenes en el config pero
 * el producto no existe en la base: así el carrito funciona igual.
 */
export function variantFallbackProduct({ config, activeVariant, bundleIdx, slug }) {
  if (!activeVariant?.images?.length) return null;
  return {
    _id: activeVariant.productSlug || slug || "variant-fallback",
    name: config.checkoutName || activeVariant.name || "Producto",
    price: activeVariant.bundles?.[bundleIdx]?.price || 0,
    images: activeVariant.images,
    imageUrl: activeVariant.images[0] || "",
  };
}

/** Nombre del ítem en el carrito, con variante, color y cantidad si aplica. */
export function cartItemName({ baseName, activeVariant, activeColorVariant, qty }) {
  if (!baseName || !activeVariant) return baseName;
  const color = activeColorVariant?.name || "";
  const qtyStr = qty > 1 ? ` x${qty} unidades` : " x1";
  const label = activeVariant.cartLabel;
  if (label) return `${baseName} ${label}${color ? ` — ${color}` : ""}${qtyStr}`;
  return `${baseName}${color ? ` ${color}` : ""}${qtyStr}`;
}

/**
 * Opciones del ítem principal para `addItem`: un pack tiene total fijo; sin
 * packs se informa el precio de lista para mostrar el ahorro. Devuelve
 * `undefined` si no hay nada que informar (mismo contrato que antes).
 * El total real lo vuelve a calcular y validar el servidor.
 */
export function mainItemOptions(bundle, { price, compareAt }) {
  if (bundle) {
    const opts = { bundleTotal: bundle.price };
    if (bundle.compareAt) opts.compareAtPrice = bundle.compareAt;
    return opts;
  }
  return compareAt > price ? { compareAtPrice: compareAt } : undefined;
}

/**
 * Reseñas cortas para el carrusel bajo el hero: `miniReviews` (o el carrusel
 * general) con el texto corto (`short`) si existe. Máximo 6.
 */
export function pickMiniReviews(mc) {
  const source = mc?.miniReviews?.length ? mc.miniReviews : mc?.reviewsCarousel || [];
  return source.slice(0, 6).map((r) => ({ ...r, text: r.short || r.text }));
}
