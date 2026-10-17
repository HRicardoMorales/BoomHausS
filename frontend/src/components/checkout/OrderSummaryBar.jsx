import { useId, useState } from "react";
import { money } from "./checkoutFormat";

const STEP_LABELS = ["Tus datos", "Pago", "✓ Confirmación"];

/**
 * Resumen colapsable del pedido + indicador de progreso (pasos 1 y 2).
 * Solo presentación: recibe los montos ya calculados por el padre.
 */
export function OrderSummaryBar({
  step, items, calc, accentColor, appliedCoupon,
  totalPrice, fullPrice, savings, discountAmount, shippingCost, finalTotal,
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const showStrike = savings > 0 || discountAmount > 0;

  return (
    <div>
      <button
        type="button"
        className="cs-summary-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)", display: "flex", alignItems: "center", gap: 6 }}>
          Resumen del pedido
          <span aria-hidden="true" style={{ fontSize: 11, color: "#888", transform: open ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform .2s" }}>▼</span>
        </span>
        <span style={{ textAlign: "right" }}>
          {showStrike && <span className="cs-summary-strike">{money(discountAmount > 0 ? totalPrice : fullPrice)}</span>}
          <span className="cs-summary-total">{money(finalTotal)}</span>
        </span>
      </button>

      {open && (
        <div className="cs-summary-items" id={panelId}>
          {items.map((it, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 13, fontWeight: 700 }}>
                <span style={{ color: "var(--text)" }}>{it.name} × {it.quantity}</span>
                <span>{money(calc(it))}</span>
              </div>
              {it.gifts?.map((gift, gi) => (
                <div key={gi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0 3px 10px", fontSize: 12, fontWeight: 700 }}>
                  <span style={{ color: accentColor }}>🎁 {gift}</span>
                  <span style={{ color: accentColor, fontWeight: 900 }}>GRATIS</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: shippingCost > 0 ? "var(--text)" : accentColor, paddingTop: 6, borderTop: "1px solid var(--border)", marginTop: 6 }}>
            <span>Envío</span><span>{shippingCost > 0 ? money(shippingCost) : "GRATIS"}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: accentColor, paddingTop: 6 }}>
              <span>Cupón {appliedCoupon?.code}</span><span>-{money(discountAmount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, paddingTop: 8 }}>
            <span>Total</span><span>{money(finalTotal)}</span>
          </div>
        </div>
      )}

      <StepProgress step={step} />
    </div>
  );
}

function StepProgress({ step }) {
  return (
    <div style={{ padding: "14px 28px 0" }}>
      <div className="cs-progress" aria-hidden="true">
        <div className={`cs-step-circle ${step >= 1 && step < 2 ? "active" : step >= 2 ? "done" : ""}`}>{step >= 2 ? "✓" : "1"}</div>
        <div className={`cs-step-line ${step >= 2 ? "done" : ""}`} />
        <div className={`cs-step-circle ${step === 2 ? "active" : step > 2 ? "done" : ""}`}>{step > 2 ? "✓" : "2"}</div>
        <div className="cs-step-line" />
        <div className={`cs-step-circle ${step === 2 ? "active" : ""}`}>3</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 8px" }}>
        {STEP_LABELS.map((l, i) => {
          const done = (i === 0 && step >= 2) || (i === 1 && step >= 2);
          const active = (i === 0 && step === 1) || (i === 1 && step === 1) || (i === 2 && step === 2);
          return (
            <span key={l} className={`cs-step-label ${done ? "done" : active ? "active" : ""}`} aria-current={active ? "step" : undefined}>{l}</span>
          );
        })}
      </div>
    </div>
  );
}
