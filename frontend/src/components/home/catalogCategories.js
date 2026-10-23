const CATEGORY_LABELS = {
  general: "General",
  gorros: "Gorros",
  accesorios: "Accesorios",
  inflables: "Inflables",
  ruido: "Ruido",
  hogar: "Hogar",
  kits: "Kits",
  mundial: "Mundial",
  otro: "Otro",
};

export const ALL_CATEGORIES = "todos";

export const categoryLabel = (k) =>
  CATEGORY_LABELS[k] || (k ? k.charAt(0).toUpperCase() + k.slice(1) : "General");

export const productCategory = (p) => (p.category || "general").trim();

/** Categorías conocidas presentes en el catálogo ("general" no tiene pestaña). */
export function categoriesOf(products) {
  const seen = new Set();
  for (const p of products) {
    const c = productCategory(p);
    if (Object.hasOwn(CATEGORY_LABELS, c) && c !== "general") seen.add(c);
  }
  return Array.from(seen).sort();
}
