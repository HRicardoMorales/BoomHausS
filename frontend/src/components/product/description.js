// Descripción larga del producto (campo `description`, texto plano del admin)
// → bloques para renderizar sin `dangerouslySetInnerHTML`.
//
// Reglas, pensadas para lo que se escribe en un <textarea>:
//   - una línea en blanco separa párrafos;
//   - líneas que empiezan con "-", "*", "•" o "✓" forman una lista;
//   - los saltos simples dentro de un párrafo se respetan (se unen con "\n").

const BULLET_RE = /^\s*(?:[-*•✓✔]|\d+[.)])\s+/;

/** Tope defensivo: la ficha no es lugar para un ensayo. */
export const MAX_DESCRIPTION_CHARS = 4000;

/**
 * @param {unknown} text
 * @returns {Array<{ type: "p", text: string } | { type: "ul", items: string[] }>}
 */
export function parseDescription(text) {
  if (typeof text !== "string") return [];
  const clean = text.replace(/\r\n?/g, "\n").slice(0, MAX_DESCRIPTION_CHARS).trim();
  if (!clean) return [];

  const blocks = [];
  for (const chunk of clean.split(/\n\s*\n/)) {
    let para = [];
    let list = null;
    const flushPara = () => {
      if (para.length) blocks.push({ type: "p", text: para.join("\n") });
      para = [];
    };
    const flushList = () => {
      if (list?.length) blocks.push({ type: "ul", items: list });
      list = null;
    };

    for (const raw of chunk.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (BULLET_RE.test(line)) {
        flushPara();
        const item = line.replace(BULLET_RE, "").trim();
        if (item) (list ||= []).push(item);
      } else {
        flushList();
        para.push(line);
      }
    }
    flushPara();
    flushList();
  }
  return blocks;
}
