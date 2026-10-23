export const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
    <rect width="100%" height="100%" fill="#1B4D7E"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial" font-size="32" font-weight="900" fill="#fff">
      MUNDIAL ARGENTINA
    </text>
  </svg>
`);

export function moneyARS(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0";
  return `$${Math.round(num).toLocaleString("es-AR")}`;
}

/* Hash determinístico pequeño — para valores "reales" pero estables */
function seedHash(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* Stock "social proof": número bajo, estable por slug.
   No inventa stock real — si la API expone stock lo usamos. */
export function getStockFor(cfg, productData) {
  const real = Number(productData?.stock);
  if (Number.isFinite(real) && real > 0 && real < 50) return real;
  // Rango 8..22 packs, estable por slug
  return 8 + (seedHash(cfg.slug || cfg.name || "x") % 15);
}

/* Día del año — seed para counters que cambian por día */
export function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/* Iniciales de un nombre → "Marcos D." → "MD" */
export function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1][0] || "")).toUpperCase();
}

/* Gradiente estable por nombre (para avatars de iniciales) */
const AVATAR_GRADIENTS = [
  ["#1B4D3E", "#059669"],
  ["#0369A1", "#0EA5E9"],
  ["#7C2D12", "#EA580C"],
  ["#4C1D95", "#8B5CF6"],
  ["#7F1D1D", "#DC2626"],
  ["#115E59", "#14B8A6"],
  ["#1E3A8A", "#3B82F6"],
  ["#831843", "#EC4899"],
];
export function getAvatarColors(name) {
  const idx = seedHash(name || "x") % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}
