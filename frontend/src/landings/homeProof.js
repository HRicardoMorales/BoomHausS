// Prueba social para la home, armada con lo que ya publican las landings
// (`reviews` / `reviewsCarousel` y `proofVideos` de cada config). No se
// inventa contenido: cada opinión y cada video linkea al producto del que sale.
// Funciones puras (sin React ni red) → testeables.
import { LANDING_CONFIGS, LANDING_META } from "./index.js";
import { isCloudinaryVideo } from "../utils/videoCdn.js";

const NAME_BY_SLUG = Object.fromEntries(LANDING_META.map((m) => [m.slug, m.name]));

/* Una entrada por config: 'nebulizador' y 'nebulizador-mesh' son el mismo objeto. */
function uniqueLandings(configs) {
  const seen = new Set();
  const out = [];
  for (const [slug, cfg] of Object.entries(configs)) {
    if (!cfg || seen.has(cfg)) continue;
    seen.add(cfg);
    out.push({ slug, cfg, name: NAME_BY_SLUG[slug] || slug });
  }
  return out;
}

/* Los títulos de las landings vienen en MAYÚSCULAS de anuncio. */
function sentenceCase(text = "") {
  const t = String(text).trim();
  if (!t || t !== t.toUpperCase()) return t;
  const lower = t.toLocaleLowerCase("es-AR");
  return lower.charAt(0).toLocaleUpperCase("es-AR") + lower.slice(1);
}

/**
 * Opiniones intercaladas por producto (round-robin) para que la sección no
 * sea "8 opiniones de la lámpara". Solo las que tienen texto y nombre.
 */
export function collectReviews(configs = LANDING_CONFIGS, { max = 9, minRating = 4 } = {}) {
  const queues = uniqueLandings(configs)
    .map(({ slug, cfg, name }) =>
      [...(cfg.reviews || []), ...(cfg.reviewsCarousel || [])]
        .filter((r) => r?.text && r?.name && (r.rating ?? 5) >= minRating)
        .map((r, i) => ({
          id: `${slug}-${i}`,
          name: r.name,
          rating: Math.min(5, Math.max(1, Math.round(r.rating ?? 5))),
          title: sentenceCase(r.title),
          text: r.text,
          product: name,
          href: `/lp/${slug}`,
        }))
    )
    .filter((q) => q.length);

  const out = [];
  for (let round = 0; out.length < max && queues.some((q) => q[round]); round++) {
    for (const q of queues) {
      if (q[round] && out.length < max) out.push(q[round]);
    }
  }
  return out;
}

/* Etiquetas de relleno de algunas landings ("SATISFECHA"): no aportan. */
const GENERIC_LABEL = /^\s*(satisfech[oa]s?)?\s*$/i;

/**
 * Videos de uso. Solo Cloudinary: se pueden transcodificar a un tamaño de
 * tile y sacar poster; los hotlinks de terceros quedan fuera (ver NIGHTLY.md).
 * Un video por producto primero, después el resto.
 */
export function collectProofVideos(configs = LANDING_CONFIGS, { max = 6 } = {}) {
  const queues = uniqueLandings(configs)
    .map(({ slug, cfg, name }) =>
      (cfg.proofVideos || [])
        .filter((v) => isCloudinaryVideo(v?.videoUrl))
        .map((v, i) => ({
          id: `${slug}-v${i}`,
          src: v.videoUrl,
          label: GENERIC_LABEL.test(v.label || "") ? "" : sentenceCase(v.label),
          product: name,
          href: `/lp/${slug}`,
        }))
    )
    .filter((q) => q.length);

  const out = [];
  for (let round = 0; out.length < max && queues.some((q) => q[round]); round++) {
    for (const q of queues) {
      if (q[round] && out.length < max) out.push(q[round]);
    }
  }
  return out;
}

/**
 * "<strong>x</strong>" de los textos de stats → segmentos `{ text, strong }`
 * para renderizar sin `dangerouslySetInnerHTML`. Cualquier otra etiqueta se
 * descarta (queda solo su texto).
 */
function parseStrong(html = "") {
  const out = [];
  const re = /<strong>([\s\S]*?)<\/strong>/gi;
  const clean = (s) => s.replace(/<[^>]*>/g, "");
  let last = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    if (m.index > last) out.push({ text: clean(html.slice(last, m.index)), strong: false });
    out.push({ text: clean(m[1]), strong: true });
    last = m.index + m[0].length;
  }
  if (last < html.length) out.push({ text: clean(html.slice(last)), strong: false });
  return out.filter((s) => s.text);
}

/**
 * Antes/después con estadísticas: solo las landings que publican **las dos**
 * fotos y al menos 2 stats (el kit tiene `beforeImg: ""` → afuera). Se toman
 * las 3 stats más altas y la nota al pie tal cual la publica la landing.
 */
export function collectTransformations(configs = LANDING_CONFIGS, { max = 4 } = {}) {
  return uniqueLandings(configs)
    .filter(({ cfg }) => cfg.beforeAfter?.beforeImg && cfg.beforeAfter?.afterImg)
    .map(({ slug, cfg, name }) => ({
      id: slug,
      product: name,
      href: `/lp/${slug}`,
      before: cfg.beforeAfter.beforeImg,
      after: cfg.beforeAfter.afterImg,
      beforeLabel: cfg.beforeAfter.beforeLabel || "Antes",
      afterLabel: cfg.beforeAfter.afterLabel || "Después",
      stats: (cfg.statsCircles || [])
        .filter((s) => Number.isFinite(s?.target) && s.target > 0 && s.target <= 100 && s.text)
        .sort((a, b) => b.target - a.target)
        .slice(0, 3)
        .map((s) => ({ value: s.target, parts: parseStrong(s.text) })),
      note: cfg.statsFooterNote || "",
    }))
    .filter((t) => t.stats.length >= 2)
    .slice(0, max);
}
