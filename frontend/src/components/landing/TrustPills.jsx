import { useId, useState } from "react";
import "./TrustPills.css";

/** Políticas de la tienda (mismo texto en todas las landings que lo usan). */
const DEFAULT_TRUST_ITEMS = [
  {
    icon: "🛡️",
    title: "Probala 30 días sin riesgo",
    body: "Tenemos una política de prueba de 30 días. Si no ves ninguna diferencia en tu piel, podés devolverla y te reembolsamos el dinero entero. Sin formularios, sin preguntas — solo mandás un WhatsApp y listo.",
  },
  {
    icon: "💳",
    title: "3 cuotas sin interés",
    body: "Pagá en 3 cuotas iguales con todas las tarjetas de crédito. Sin recargo, sin costo adicional. El precio que ves es el precio final.\n\nProcesamos todos los pagos a través de MercadoPago.",
  },
  {
    icon: "🚚",
    title: "Envío gratis a todo el país",
    body: "Realizamos envíos rápidos a todo el país a través de Correo Argentino & Andreani. Todos los pedidos se despachan en menos de 24hs hábiles y se envía el código de seguimiento por WhatsApp.\n\nBuenos Aires y alrededores: 1 a 3 días hábiles.\nResto del país: 2 a 6 días hábiles.",
  },
];

/**
 * Desplegables de confianza debajo del CTA (garantía, cuotas, envío).
 * Antes eran `<div onClick>` sin teclado ni rol; ahora cada encabezado es un
 * botón con `aria-expanded`/`aria-controls` y el panel es una región
 * etiquetada. Solo uno abierto a la vez, como antes.
 */
export default function TrustPills({ items = DEFAULT_TRUST_ITEMS, tone = "wine" }) {
  const [open, setOpen] = useState(null);
  const baseId = useId();

  return (
    <div className={`lp-tp lp-tp--${tone}`}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${baseId}-btn-${i}`;
        const panelId = `${baseId}-panel-${i}`;
        return (
          <div key={item.title} className={`lp-tp__item${isOpen ? " is-open" : ""}`}>
            <h3 className="lp-tp__heading">
              <button
                type="button"
                id={btnId}
                className="lp-tp__btn"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className="lp-tp__ico" aria-hidden="true">{item.icon}</span>
                <span className="lp-tp__title">{item.title}</span>
                <span className="lp-tp__sign" aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={btnId} className="lp-tp__panel" hidden={!isOpen}>
              {item.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
