// Metadata por ruta. Las landings (/lp/*) y el detalle de producto se dejan
// sin título propio acá: usan el título por defecto o el que definan ellas.

import { DEFAULT_STORE_NAME } from "../config/brand.js";

// Los títulos usan la marca fija (no la del entorno) para no cambiar el SEO
// si alguien define VITE_STORE_NAME con otro valor en un deploy de prueba.
export const SITE_NAME = DEFAULT_STORE_NAME;

const TITLES = {
  "/": `${SITE_NAME} · Tienda oficial de belleza`,
  "/products": `Productos · ${SITE_NAME}`,
  "/cart": `Tu carrito · ${SITE_NAME}`,
  "/checkout": `Finalizar compra · ${SITE_NAME}`,
  "/login": `Ingresar · ${SITE_NAME}`,
  "/register": `Crear cuenta · ${SITE_NAME}`,
  "/forgot-password": `Recuperar contraseña · ${SITE_NAME}`,
  "/my-orders": `Mis pedidos · ${SITE_NAME}`,
  "/terms": `Términos y condiciones · ${SITE_NAME}`,
  "/privacy": `Política de privacidad · ${SITE_NAME}`,
  "/returns": `Cambios y devoluciones · ${SITE_NAME}`,
  "/success-payment": `¡Gracias por tu compra! · ${SITE_NAME}`,
};

// Rutas que no tienen que aparecer en buscadores (también en robots.txt).
const NOINDEX_PREFIXES = [
  "/admin", "/cart", "/checkout", "/my-orders", "/success-payment",
  "/login", "/register", "/forgot-password", "/reset-password",
];

// Alias de la home: comparten canonical con "/".
const ALIASES = { "/public": "/", "/tienda": "/products" };

function normalize(pathname) {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return ALIASES[clean] ?? clean;
}

// Rutas con parámetro: el título sale del prefijo.
function prefixTitle(path) {
  if (path.startsWith("/admin")) return `Admin · ${SITE_NAME}`;
  if (path.startsWith("/reset-password/")) return `Nueva contraseña · ${SITE_NAME}`;
  return null;
}

export function getRouteSeo(pathname, origin) {
  const path = normalize(pathname);
  const base = (__SITE_URL__ || origin || "").replace(/\/+$/, "");
  return {
    title: TITLES[path] ?? prefixTitle(path),
    canonical: `${base}${path}`,
    noindex: NOINDEX_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`)),
  };
}
