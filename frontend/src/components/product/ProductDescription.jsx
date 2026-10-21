import { useMemo } from "react";
import Reveal from "../motion/Reveal";
import SectionHeader from "./SectionHeader";
import { parseDescription } from "./description";
import "./ProductDescription.css";

/*
 * Descripción larga del producto en la ficha genérica. Texto plano del admin
 * convertido a párrafos y listas (ver `parseDescription`): nada de HTML
 * inyectado, así un texto cargado desde el panel no puede romper la página.
 */
export default function ProductDescription({ text, title = "Sobre el producto" }) {
  const blocks = useMemo(() => parseDescription(text), [text]);
  if (!blocks.length) return null;

  return (
    <section className="pdesc" aria-labelledby="pdesc-title">
      <SectionHeader title={<span id="pdesc-title">{title}</span>} />
      <Reveal className="pdesc-body">
        {blocks.map((b, i) =>
          b.type === "ul" ? (
            <ul key={i} className="pdesc-list">
              {b.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          ) : (
            <p key={i} className="pdesc-p">
              {b.text}
            </p>
          )
        )}
      </Reveal>
    </section>
  );
}
