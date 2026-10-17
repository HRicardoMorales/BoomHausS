// Sección "Dirección de facturación" del checkout fullpage.
// Solo presentación: `sameAddr` y el email de facturación siguen en la página
// (se usan al armar el pedido). Radios en un `radiogroup` nombrado por el título y
// el email con `CheckoutField` (label real; antes solo tenía placeholder).
import { useId } from "react";
import { CheckoutField } from "./CheckoutField";

const OPTIONS = [
  { same: true,  title: "La misma dirección de envío" },
  { same: false, title: "Usar una dirección de facturación distinta" },
];

export function BillingAddress({ sameAddr, onSameAddrChange, billingEmail, onBillingEmailChange }) {
  const titleId = useId();
  return (
    <div className="ckfp-section ckfp-billing">
      <h2 className="ckfp-section-title" id={titleId}>Dirección de facturación</h2>
      <div className="ckfp-ship-group" role="radiogroup" aria-labelledby={titleId}>
        {OPTIONS.map(opt => (
          <label key={String(opt.same)} className={`ckfp-ship-opt${sameAddr === opt.same ? " selected" : ""}`}>
            <input
              type="radio" name="billing" value={opt.same ? "same" : "other"}
              checked={sameAddr === opt.same}
              onChange={() => onSameAddrChange(opt.same)}
            />
            <span className="ckfp-ship-title">{opt.title}</span>
          </label>
        ))}
      </div>
      {!sameAddr && (
        <div className="ckfp-billing-email">
          <CheckoutField
            label="Email de facturación"
            type="email" autoComplete="email"
            value={billingEmail}
            onChange={e => onBillingEmailChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
