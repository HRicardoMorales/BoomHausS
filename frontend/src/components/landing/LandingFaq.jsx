import { useId, useState } from "react";
import "./LandingFaq.css";

/**
 * Acordeón de preguntas frecuentes de las landings.
 *
 * - Botones reales con `aria-expanded`/`aria-controls` (antes: <div onClick>,
 *   inaccesible por teclado).
 * - Alto animado con `grid-template-rows: 0fr → 1fr`: sin `max-height` fijo,
 *   que en Sillón/Kit cortaba respuestas de más de 300 px.
 * - El panel cerrado es `inert`: no se lee ni se enfoca.
 *
 * `items`: [{ q, a }] donde `a` es string o array de párrafos.
 * `tone`: "green" | "wine". `icon`: "chevron" | "plus".
 */
export default function LandingFaq({ title, subtitle, items = [], tone = "green", icon = "chevron" }) {
  const [open, setOpen] = useState(null);
  const baseId = useId();
  if (!items.length) return null;

  const titleId = `${baseId}-title`;

  return (
    <section className={`lfaq lfaq--${tone} lfaq--${icon}`} aria-labelledby={title ? titleId : undefined}>
      {title && <h2 id={titleId} className="lfaq-title">{title}</h2>}
      {subtitle && <p className="lfaq-subtitle">{subtitle}</p>}

      <ul className="lfaq-list">
        {items.map((item, i) => {
          const isOpen = open === i;
          const btnId = `${baseId}-q${i}`;
          const panelId = `${baseId}-a${i}`;
          const paragraphs = Array.isArray(item.a) ? item.a : [item.a];
          return (
            <li key={i} className={`lfaq-item${isOpen ? " is-open" : ""}`}>
              <h3 className="lfaq-q">
                <button
                  type="button"
                  id={btnId}
                  className="lfaq-btn"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className="lfaq-icon" aria-hidden="true" />
                </button>
              </h3>
              <div id={panelId} role="region" aria-labelledby={btnId} className="lfaq-panel" inert={!isOpen}>
                <div className="lfaq-panel-inner">
                  {paragraphs.map((p, pi) => <p key={pi}>{p}</p>)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
