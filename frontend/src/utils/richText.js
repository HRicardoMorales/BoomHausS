// Texto enriquecido mínimo para los configs de las landings
// ("Probala <strong>30 días</strong><br>sin riesgo") → árbol de nodos que
// `<RichText>` renderiza con elementos de React, sin `dangerouslySetInnerHTML`.
//
// Lista blanca: <strong>/<b>, <em>/<i> y <br>. Cualquier otra etiqueta se
// descarta y queda solo su texto; los atributos nunca se leen. Así un
// `<img src=x onerror=…>` que se cuele en un config no crea ningún elemento.
// Puro (sin React ni DOM) → testeable y usable en build/SSR.

/** @typedef {string | { type: "br" } | { type: "strong" | "em", children: RichNode[] }} RichNode */

const INLINE = { strong: "strong", b: "strong", em: "em", i: "em" };

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] !== "#") return ENTITIES[e.toLowerCase()] ?? m;
    const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });

// `<tag …>`, `</tag>` y `<br/>`; los comentarios y `<!doctype>` también se descartan.
const TAG_RE = /<!--[\s\S]*?-->|<\s*(\/)?\s*([a-z][a-z0-9]*)\b[^>]*>/gi;

/** Tope defensivo: un config no tiene párrafos de este tamaño. */
const MAX_CHARS = 5000;

/**
 * @param {unknown} html
 * @returns {RichNode[]}
 */
export function parseRichText(html) {
  if (typeof html !== "string" || !html) return [];
  const src = html.slice(0, MAX_CHARS);
  const root = { type: "root", children: [] };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  const pushText = (raw) => {
    const text = decode(raw);
    if (!text) return;
    const kids = top().children;
    // Texto contiguo (p. ej. alrededor de una etiqueta descartada) en un solo nodo.
    if (typeof kids[kids.length - 1] === "string") kids[kids.length - 1] += text;
    else kids.push(text);
  };

  let last = 0;
  for (let m = TAG_RE.exec(src); m; m = TAG_RE.exec(src)) {
    pushText(src.slice(last, m.index));
    last = TAG_RE.lastIndex;
    const [, closing, rawName] = m;
    if (!rawName) continue; // comentario
    const name = rawName.toLowerCase();
    if (name === "br") {
      if (!closing) top().children.push({ type: "br" });
      continue;
    }
    const type = INLINE[name];
    if (!type) continue; // fuera de la lista blanca: se pierde la etiqueta, queda el texto
    if (!closing) {
      const node = { type, children: [] };
      top().children.push(node);
      stack.push(node);
      continue;
    }
    // Cierre: solo si hay uno abierto del mismo tipo (los cierres huérfanos se ignoran
    // y los mal anidados cierran lo que quedó adentro, como hace el navegador).
    const at = stack.findLastIndex((n, i) => i > 0 && n.type === type);
    if (at > 0) stack.length = at;
  }
  TAG_RE.lastIndex = 0;
  pushText(src.slice(last));

  return prune(root.children);
}

/* Fuera los <strong></strong> vacíos que deja un config descuidado (y se
   vuelve a unir el texto que quedó a los dos lados). */
function prune(nodes) {
  const out = [];
  for (const n of nodes) {
    if (typeof n !== "string" && n.type !== "br") {
      n.children = prune(n.children);
      if (!n.children.length) continue;
    }
    if (typeof n === "string" && typeof out[out.length - 1] === "string") out[out.length - 1] += n;
    else out.push(n);
  }
  return out;
}
