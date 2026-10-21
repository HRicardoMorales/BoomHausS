import { useId, useState } from "react";

/* =========================
   Mini acordeones del bloque de compra.
   Cada ítem trae `html` (texto fijo escrito en el config de la landing) o
   `text` (texto plano, p. ej. la descripción corta: se renderiza como texto,
   nunca como HTML).
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
                  <div className="hacc-content" dangerouslySetInnerHTML={{ __html: item.html }} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
