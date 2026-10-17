// Barra fija inferior del checkout fullpage: resumen desplegable + total + "Pagar ahora".
// Solo presentación: el submit (`onPay`) y los montos vienen de la página.
import { useId, useState } from "react";
import { imageAtWidth } from "../../utils/imageCdn";
import { itemThumb, money } from "./checkoutFormat";
import { Chevron } from "./CheckoutSummary";

const GREEN = "#16a34a";

export function CheckoutStickyBar({
  items, calcItemTotal, totalItems, totalPrice, finalTotal, savings, couponDiscount, shippingCost,
  busy, redirecting, loading, onPay,
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const firstThumb = items.length ? itemThumb(items[0]) : null;

  return (
    <div className="ckfp-sticky">
      <div className="ckfp-sticky-inner">
        {open && (
          <div className="ckfp-sticky-summary" id={panelId}>
            {items.map((it, i) => {
              const thumb = itemThumb(it);
              return (
                <div key={i} className="ckfp-sticky-sum-item">
                  <div className="ckfp-sticky-sum-img-wrap">
                    {thumb
                      ? <img src={imageAtWidth(thumb, 76) || thumb} alt={it.name} className="ckfp-sticky-sum-img" width={38} height={38} loading="lazy" decoding="async" />
                      : <span style={{ fontSize: 18 }} aria-hidden="true">📦</span>}
                    <span className="ckfp-sticky-sum-qty">{it.quantity}</span>
                  </div>
                  <span className="ckfp-sticky-sum-name">{it.name}</span>
                  <span className="ckfp-sticky-sum-price">{money(calcItemTotal(it))}</span>
                </div>
              );
            })}
            <div className="ckfp-sticky-sum-rows">
              <div className="ckfp-sticky-sum-row"><span>Subtotal</span><span>{money(totalPrice)}</span></div>
              <div className="ckfp-sticky-sum-row">
                <span>Envío</span>
                {shippingCost > 0 ? <span>{money(shippingCost)}</span> : <span style={{ color: GREEN, fontWeight: 600 }}>GRATIS</span>}
              </div>
              {savings > 0 && <div className="ckfp-sticky-sum-row" style={{ color: GREEN }}><span>Descuento</span><span>−{money(savings)}</span></div>}
              {couponDiscount > 0 && <div className="ckfp-sticky-sum-row" style={{ color: GREEN }}><span>Cupón</span><span>−{money(couponDiscount)}</span></div>}
            </div>
          </div>
        )}

        {/* Antes era un <div onClick>: ahora botón real (teclado + lector de pantalla). */}
        <button
          type="button"
          className="ckfp-sticky-row1 ckfp-sticky-row1--btn"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${open ? "Ocultar" : "Ver"} resumen del pedido: total ${money(finalTotal)}`}
          onClick={() => setOpen(o => !o)}
        >
          {firstThumb && (
            <span className="ckfp-sticky-thumb-wrap">
              <img src={imageAtWidth(firstThumb, 96) || firstThumb} alt="" className="ckfp-sticky-thumb" width={48} height={48} decoding="async" />
            </span>
          )}
          <span className="ckfp-sticky-mid">
            <span className="ckfp-sticky-label">Total</span>
            <span className="ckfp-sticky-count">{totalItems} {totalItems === 1 ? "artículo" : "artículos"}</span>
          </span>
          <span className="ckfp-sticky-right">
            <span className="ckfp-sticky-currency">ARS</span>
            <span className="ckfp-sticky-amount">{money(finalTotal)}</span>
            <Chevron
              size={13}
              stroke="#9ca3af"
              style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
            />
          </span>
        </button>

        <button
          type="button"
          className={`ckfp-btn-pay${busy ? " loading" : ""}`}
          onClick={onPay}
          disabled={busy}
        >
          {redirecting ? "Conectando..." : loading ? "Procesando..." : "Pagar ahora"}
        </button>

        <a href="/politica-de-privacidad" className="ckfp-privacy-link">Política de privacidad</a>
      </div>
    </div>
  );
}
