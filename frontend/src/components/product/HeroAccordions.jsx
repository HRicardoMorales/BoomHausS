import { useState } from "react";

/* =========================
   Mini acordeones del bloque de compra (estilo Calmora)
========================= */
export default function HeroAccordions({ items = [] }) {
  const [openIdx, setOpenIdx] = useState(null);
  if (!items.length) return null;
  return (
    <div className="hacc-wrap">
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} className={`hacc-item${isOpen ? " hacc-item--open" : ""}`}>
            <button
              type="button"
              className="hacc-q"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="hacc-ico">{item.icon}</span>
              <span className="hacc-title">{item.title}</span>
              <span className="hacc-arrow" aria-hidden="true" />
            </button>
            <div className="hacc-body">
              <div
                className="hacc-content"
                dangerouslySetInnerHTML={{ __html: item.html }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
