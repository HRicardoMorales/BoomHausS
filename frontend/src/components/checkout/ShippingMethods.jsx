// Sección "Métodos de envío" del checkout fullpage (opciones en ./shipping.js).
import { useId } from "react";
import { money } from "./checkoutFormat";
import { SHIPPING_OPTIONS } from "./shipping";

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export function ShippingMethods({ unlocked, value, onChange }) {
  const titleId = useId();
  return (
    <div className="ckfp-section">
      <h2 className="ckfp-section-title" id={titleId}>Métodos de envío</h2>
      {!unlocked ? (
        <div className="ckfp-ship-locked">
          <LockIcon />
          Completá la dirección para ver los métodos de envío
        </div>
      ) : (
        <div className="ckfp-ship-group" role="radiogroup" aria-labelledby={titleId}>
          {SHIPPING_OPTIONS.map(opt => (
            <label key={opt.value} className={`ckfp-ship-opt${value === opt.value ? " selected" : ""}`}>
              <input
                type="radio" name="shipping" value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
              />
              <span className="ckfp-ship-info">
                <span className="ckfp-ship-title">{opt.title}</span>
                <span className="ckfp-ship-sub">{opt.sub}</span>
              </span>
              <span className="ckfp-ship-price">
                {opt.was && <span className="ckfp-ship-was"><span className="sr-only">Antes </span>{money(opt.was)}</span>}
                {opt.price === 0
                  ? <span className="ckfp-ship-free">GRATIS</span>
                  : <span className="ckfp-ship-cost">{money(opt.price)}</span>}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
