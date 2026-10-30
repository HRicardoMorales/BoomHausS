import { useId, useState } from "react";
import RichText from "../ui/RichText";

/* =========================
   Mini acordeones del bloque de compra.
   Cada ítem trae `html` (texto del config de la landing con <strong>/<em>/<br>,
   ver `RichText`) o `text` (texto plano, p. ej. la descripción corta).
========================= */
export default function HeroAccordions({ items = [] }) {
  const [openIdx, setOpenIdx] = useState(null);
  const baseId = useId();
  if (!items.length) return null;
  return (
    <div className="hacc-wrap">
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        const panelId = `${baseId}-panel-${i}`;
        return (
          <div key={item.id || i} className={`hacc-item${isOpen ? " hacc-item--open" : ""}`}>
            <button
              type="button"
              className="hacc-q"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="hacc-ico" aria-hidden="true">
                {item.icon}
              </span>
              <span className="hacc-title">{item.title}</span>
              <span className="hacc-arrow" aria-hidden="true" />
            </button>
            <div className="hacc-body" id={panelId} inert={!isOpen}>
              <div className="hacc-inner">
                {typeof item.text === "string" ? (
                  <p className="hacc-content hacc-content--text">{item.text}</p>
                ) : (
                  <RichText as="div" className="hacc-content" html={item.html} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
