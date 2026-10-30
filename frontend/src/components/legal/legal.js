// Utilidades puras de las páginas legales (Términos, Privacidad, Devoluciones).

/** Link de WhatsApp con mensaje prellenado. `null` si no hay un número usable. */
export function whatsappLink(phone, message = "") {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

const DATE_FMT = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * "2026-10-22" → { iso: "2026-10-22", label: "22 de octubre de 2026" }.
 * Fecha inválida → null (la página no muestra la línea antes que mostrar "Invalid Date").
 */
export function formatUpdated(isoDate) {
  if (typeof isoDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== isoDate) return null;
  return { iso: isoDate, label: DATE_FMT.format(d) };
}

/** Número de sección con dos dígitos: 1 → "01". */
export const sectionNumber = (index) => String(index + 1).padStart(2, "0");

/** Las otras dos políticas, para el pie de cada página. */
const LEGAL_PAGES = [
  { to: "/terms", label: "Términos y condiciones" },
  { to: "/privacy", label: "Política de privacidad" },
  { to: "/returns", label: "Cambios y devoluciones" },
];

export const otherLegalPages = (current) => LEGAL_PAGES.filter((p) => p.to !== current);
