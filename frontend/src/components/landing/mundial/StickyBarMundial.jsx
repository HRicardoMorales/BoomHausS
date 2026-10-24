import { useEffect, useState } from "react";
import { moneyARSTight } from "../../../utils/pricing.js";
import "./StickyBarMundial.css";

/* =========================
   STICKY BAR + Final CTA
========================= */
export function StickyBarMundial({ kitPrice, onBuy, onWhatsapp, cartCount, cartTotal, minOrder, onAddMore }) {
  const hasCart = cartCount > 0;
  const min = Number(minOrder) || 0;
  const underMin = hasCart && min > 0 && (cartTotal || 0) < min;
  const missing = underMin ? min - (cartTotal || 0) : 0;
  const minProgress = min > 0 ? Math.min(1, (cartTotal || 0) / min) : 0;

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const h = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      setVisible(y > 260);
      setProgress(Math.max(0, Math.min(1, y / h)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  let label;
  if (underMin) {
    label = `FALTAN ${moneyARSTight(missing)}`;
  } else if (hasCart) {
    label = `TU PEDIDO · ${cartCount} ${cartCount === 1 ? "ítem" : "ítems"} · ENVÍO GRATIS ✓`;
  } else {
    label = "KIT RECOMENDADO";
  }
  const priceToShow = hasCart ? cartTotal : kitPrice;
  const btnLabel = underMin ? "AGREGAR MÁS" : hasCart ? "CHECKOUT →" : "ME LO LLEVO →";
  const btnHandler = underMin ? onAddMore : onBuy;

  return (
    <div
      className={`ml-sticky ${hasCart ? "has-cart" : ""} ${underMin ? "is-under-min" : ""} ${visible ? "is-visible" : ""}`}
      role="region"
      aria-label="Barra de compra"
    >
      <div
        className="ml-sticky-progress"
        style={{ transform: `scaleX(${underMin ? minProgress : progress})` }}
        aria-hidden="true"
      />
      <div className="ml-sticky-info">
        <div className="ml-sticky-label">
          {hasCart && <span className="ml-sticky-dot" aria-hidden="true" />}
          {label}
        </div>
        <div className="ml-sticky-price">{moneyARSTight(priceToShow)}</div>
      </div>
      <div className="ml-sticky-ctas">
        <button type="button" className="ml-sticky-wa" onClick={onWhatsapp} aria-label="WhatsApp">
          💬
        </button>
        <button type="button" className="ml-sticky-btn" onClick={btnHandler}>
          {btnLabel}
        </button>
      </div>
    </div>
  );
}
