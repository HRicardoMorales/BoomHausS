/**
 * Plugin de Vite para SEO en build time.
 *
 * Las previews de Vercel cambian de URL en cada deploy, así que la URL pública
 * no puede quedar hardcodeada en index.html. Se resuelve al compilar:
 *
 *   1. SITE_URL (opcional, si se define a mano)
 *   2. VERCEL_PROJECT_PRODUCTION_URL (variable de sistema que Vercel inyecta)
 *   3. vacío → las imágenes quedan relativas y la canonical usa el origin actual
 *
 * Además genera robots.txt y sitemap.xml con la misma base, para que nunca
 * vuelvan a apuntar a un deploy viejo.
 */

const PUBLIC_ROUTES = ["/", "/products", "/terms", "/privacy", "/returns"];
const PRIVATE_PREFIXES = ["/admin", "/checkout", "/cart", "/my-orders", "/success-payment", "/reset-password"];

export function resolveSiteUrl(env = process.env) {
  const raw = env.SITE_URL || env.VERCEL_PROJECT_PRODUCTION_URL || "";
  if (!raw) return "";
  const withProtocol = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

export function buildRobots(siteUrl) {
  const lines = ["User-agent: *", "Allow: /", ...PRIVATE_PREFIXES.map((p) => `Disallow: ${p}`)];
  if (siteUrl) lines.push("", `Sitemap: ${siteUrl}/sitemap.xml`);
  return lines.join("\n") + "\n";
}

export function buildSitemap(siteUrl) {
  const urls = PUBLIC_ROUTES.map((path) => `  <url><loc>${siteUrl}${path === "/" ? "/" : path}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export default function seoPlugin() {
  const siteUrl = resolveSiteUrl();

  return {
    name: "amelor-seo",

    // Expone la URL al código de la app (canonical por ruta en components/Seo.jsx).
    config() {
      return { define: { __SITE_URL__: JSON.stringify(siteUrl) } };
    },

    transformIndexHtml(html) {
      return html.replaceAll("%SITE_URL%", siteUrl);
    },

    generateBundle() {
      this.emitFile({ type: "asset", fileName: "robots.txt", source: buildRobots(siteUrl) });
      // Un sitemap con URLs relativas es inválido: solo se emite con dominio.
      if (siteUrl) this.emitFile({ type: "asset", fileName: "sitemap.xml", source: buildSitemap(siteUrl) });
    },
  };
}
