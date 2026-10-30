import api from "./api";

/**
 * Pedido del producto de una landing, adelantado al chunk de la ruta.
 *
 * Las landings dedicadas (Escultor LED, Depiladora, Parches, Antimoho) no
 * pintan el hero hasta tener el producto (precio y stock reales). Sin esto el
 * orden era: index.js → chunk de la landing → montaje → `GET /products/slug`
 * → render. Ahora la ruta dispara el GET al empezar a bajar el chunk (ver
 * `lazyWithProduct` en App.jsx) y la landing toma esa misma promesa al montar:
 * la API y el chunk viajan en paralelo y el LCP no paga los dos en serie.
 *
 * La promesa adelantada se usa **una sola vez**: si el usuario vuelve a la
 * landing más tarde se pide de nuevo (precio y stock frescos). Si quedó vieja
 * (`MAX_AGE_MS`) tampoco se usa.
 */
const MAX_AGE_MS = 30_000;
const prefetched = new Map(); // slug -> { promise, at }

function request(slug) {
  return api.get(`/products/slug/${slug}`);
}

/** Dispara el GET del producto sin esperar la respuesta. Idempotente. */
export function prefetchProductBySlug(slug, now = Date.now()) {
  const hit = prefetched.get(slug);
  if (hit && now - hit.at < MAX_AGE_MS) return hit.promise;
  const promise = request(slug);
  // Evita "unhandled rejection" si nadie la consume; quien la tome con
  // `fetchProductBySlug` recibe el error igual.
  promise.catch(() => {});
  prefetched.set(slug, { promise, at: now });
  return promise;
}

/**
 * Respuesta de `GET /products/slug/:slug`: la adelantada si hay una fresca
 * (y la consume), si no un pedido nuevo.
 */
export function fetchProductBySlug(slug, now = Date.now()) {
  const hit = prefetched.get(slug);
  prefetched.delete(slug);
  if (hit && now - hit.at < MAX_AGE_MS) return hit.promise;
  return request(slug);
}
