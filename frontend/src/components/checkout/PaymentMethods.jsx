// Sección "Pago" del checkout fullpage.
//
// Solo presentación: el medio elegido (`value`, que viaja como `payment_type` en el
// pedido) y su setter siguen en la página; acá vive únicamente si el detalle está
// desplegado.
//
// Antes la cabecera era un `div onClick` con un radio adentro (sin teclado ni
// `aria-expanded`) y los logos se pedían a cdn.shopify.com (se veían rotos si ese
// CDN fallaba o lo bloqueaba un adblock). Ahora:
// - la elección es un `<label>` + radio nativo dentro de un `radiogroup` nombrado
//   por el título, con un nombre accesible en texto (los logos son decorativos);
// - desplegar/plegar es un `<button>` aparte con `aria-expanded`/`aria-controls`
//   (un control dentro de otro sería HTML inválido);
// - los logos son SVG inline (`PaymentLogos`), sin requests.
import { useId, useState } from "react";
import { BadgeMP, BadgeVisa, BadgeMC } from "./PaymentLogos";

const METHODS = [
  {
    value: "mercadopago",
    name: "Mercado Pago: tarjetas de crédito, débito y más",
    logos: [BadgeMP, BadgeVisa, BadgeMC],
    more: 3,
    detail: <>Pagá en <strong>3 cuotas sin interés</strong> con tu tarjeta en Mercado Pago</>,
  },
];

const Chevron = ({ open }) => (
  <svg className={`ckfp-pay-chev${open ? " open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export function PaymentMethods({ value, onChange }) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const [expanded, setExpanded] = useState(true); // abierto por defecto, como antes

  return (
    <div className="ckfp-section">
      <h2 className="ckfp-section-title" id={titleId}>Pago</h2>
      <p className="ckfp-pay-safe">Todas las transacciones son seguras y están encriptadas.</p>

      <div role="radiogroup" aria-labelledby={titleId}>
        {METHODS.map(m => {
          const selected = value === m.value;
          const open = selected && expanded;
          const bodyId = `${baseId}-${m.value}`;
          return (
            <div key={m.value} className={`ckfp-pay-card${selected ? " selected" : ""}`}>
              <div className="ckfp-pay-card-hdr">
                <label className="ckfp-pay-pick">
                  <input
                    type="radio" name="payment" value={m.value}
                    checked={selected}
                    onChange={() => { onChange(m.value); setExpanded(true); }}
                  />
                  <span className="sr-only">{m.name}</span>
                  <span className="ckfp-pay-card-logos" aria-hidden="true">
                    {m.logos.map((Logo, i) => <Logo key={i} />)}
                    {m.more > 0 && <span className="ckfp-pay-more">+{m.more}</span>}
                  </span>
                </label>
                <button
                  type="button"
                  className="ckfp-pay-toggle"
                  aria-expanded={open}
                  aria-controls={bodyId}
                  aria-label={open ? "Ocultar detalle del pago" : "Ver detalle del pago"}
                  onClick={() => {
                    if (!selected) { onChange(m.value); setExpanded(true); }
                    else setExpanded(o => !o);
                  }}
                >
                  <Chevron open={open} />
                </button>
              </div>
              <div id={bodyId} className="ckfp-pay-card-body" hidden={!open}>
                <div className="ckfp-mp-trust">
                  <div className="ckfp-mp-trust-cuotas">{m.detail}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
