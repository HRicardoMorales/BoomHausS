import { createElement, Fragment, useMemo } from "react";
import { parseRichText } from "../../utils/richText";

function renderNodes(nodes) {
  return nodes.map((n, i) => {
    if (typeof n === "string") return <Fragment key={i}>{n}</Fragment>;
    if (n.type === "br") return <br key={i} />;
    const Tag = n.type; // "strong" | "em": salen de la lista blanca del parser
    return <Tag key={i}>{renderNodes(n.children)}</Tag>;
  });
}

/**
 * Texto de config con negritas, itálicas y saltos de línea, renderizado como
 * elementos de React (ver `utils/richText.js`). Reemplaza a
 * `dangerouslySetInnerHTML`: lo que no está en la lista blanca sale como texto.
 *
 * @param {{ html?: string, as?: string } & Record<string, unknown>} props
 *   `as`: elemento contenedor (por defecto `<p>`); el resto de las props va a él.
 */
export default function RichText({ html, as = "p", ...rest }) {
  const nodes = useMemo(() => parseRichText(html), [html]);
  return createElement(as, rest, renderNodes(nodes));
}
