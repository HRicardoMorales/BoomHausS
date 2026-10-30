import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { moneyARS } from "../../utils/pricing.js";
import { unitsLabel } from "./cartLine.js";

const MOBILE = "(max-width: 899.98px)";

/**
 * Resumen del pedido. En desktop es una columna sticky; en mobile, además,
 * aparece una barra fija abajo con el total y el CTA mientras el resumen no
 * está en pantalla (IntersectionObserver), con `safe-area` para el home
 * indicator. La barra suma `pdx-sticky-active` al body, la misma señal que
 * usan las landings, así el botón de WhatsApp se corre y no la tapa.
 */
export default function CartSummary({ count, total, savings }) {
  const ctaRef = useRef(null);
  const [barVisible, setBarVisible] = useState(false);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia(MOBILE);
    let inView = true;
    const sync = () => setBarVisible(mq.matches && !inView);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    mq.addEventListener?.("change", sync);
    return () => {
      io.disconnect();
      mq.removeEventListener?.("change", sync);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("pdx-sticky-active", barVisible);
    return () => document.body.classList.remove("pdx-sticky-active");
  }, [barVisible]);

  return (
    <>
      <aside className="cart-summary" aria-labelledby="cart-summary-title">
        <h2 id="cart-summary-title" className="cart-summary__title">Resumen</h2>

        <dl className="cart-summary__rows">
          <div>
            <dt>Subtotal · {unitsLabel(count)}</dt>
            <dd>{moneyARS(total)}</dd>
          </div>
          <div>
            <dt>Envío</dt>
            <dd>A coordinar</dd>
          </div>
        </dl>

        <div className="cart-summary__total">
          <span>Total</span>
          <strong>{moneyARS(total)}</strong>
        </div>
        {savings > 0 && (
          <p className="cart-summary__saving">Incluye {moneyARS(savings)} de ahorro en packs</p>
        )}

        <Link ref={ctaRef} className="btn btn-primary cart-summary__cta" to="/checkout">
          Ir a pagar
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>

        <ul className="cart-summary__trust">
          <li>Pagás con Mercado Pago: débito, crédito o dinero en cuenta</li>
          <li>El total final se confirma antes de pagar</li>
        </ul>
      </aside>

      <div className={`cart-bar${barVisible ? " is-visible" : ""}`} aria-hidden={!barVisible} inert={!barVisible}>
        <div className="cart-bar__total">
          <span>Total · {unitsLabel(count)}</span>
          <strong>{moneyARS(total)}</strong>
        </div>
        <Link className="btn btn-primary cart-bar__cta" to="/checkout" tabIndex={barVisible ? undefined : -1}>
          Ir a pagar
        </Link>
      </div>
    </>
  );
}
