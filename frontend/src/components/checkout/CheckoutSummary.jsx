// Resúmenes del pedido del checkout fullpage (/checkout).
// Solo presentación: los montos llegan calculados desde la página y el total
// real lo recalcula y valida el servidor.
import { useId, useState } from "react";
import { imageAtWidth } from "../../utils/imageCdn";
import { itemThumb, lineTotals, money } from "./checkoutFormat";

export function BagIcon({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

export function Chevron({ className, size = 14, stroke = "currentColor", style }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" style={style} aria-hidden="true">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  );
}

function ShippingRow({ className, shippingCost }) {
  return (
    <div className={className}>
      <span>Envío</span>
      {shippingCost > 0 ? <span>{money(shippingCost)}</span> : <span className="ckfp-sa-free">GRATIS</span>}
    </div>
  );
}

/** Miniatura con badge de cantidad; `prefix` elige el set de clases (sa = acordeón, sb = sidebar). */
function LineItem({ item, calcItemTotal, prefix, size }) {
  const thumb = itemThumb(item);
  const { total, original, discounted } = lineTotals(item, calcItemTotal);
  const isSidebar = prefix === "sb";
  return (
    <div className={`ckfp-${prefix}-item`}>
      <div className={`ckfp-${prefix}-img-wrap`}>
        {thumb
          ? <img src={imageAtWidth(thumb, size * 2) || thumb} alt={item.name} className={`ckfp-${prefix}-img`} width={size} height={size} decoding="async" />
          : <span className="ckfp-sa-ph" aria-hidden="true">📦</span>}
        <span className={`ckfp-${prefix}-qty`}>{item.quantity}</span>
      </div>
      <span className={`ckfp-${prefix}-name`}>{item.name}</span>
      {isSidebar ? (
        <div className="ckfp-sb-price">
          {discounted && <span className="ckfp-sb-was">{money(original)}</span>}
          <span>{money(total)}</span>
        </div>
      ) : (
        <span className="ckfp-sa-price">
          {discounted && <span className="ckfp-sa-price-was">{money(original)}</span>}
          {money(total)}
        </span>
      )}
    </div>
  );
}

/** Acordeón del resumen (arriba del formulario en mobile). */
export function SummaryAccordion({ items, calcItemTotal, totalPrice, finalTotal, savings, couponDiscount, appliedCoupon, shippingCost = 0 }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="ckfp-sa">
      <button
        type="button"
        className="ckfp-sa-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(o => !o)}
      >
        <span className="ckfp-sa-toggle-left">
          <BagIcon style={{ color: "#111" }} />
          <span className="ckfp-sa-lbl">Resumen del pedido</span>
          <Chevron className={`ckfp-sa-chev${open ? " open" : ""}`} />
        </span>
        <span className="ckfp-sa-toggle-right">
          {savings > 0 && <span className="ckfp-sa-was">{money(totalPrice)}</span>}
          <span className="ckfp-sa-total">{money(finalTotal)}</span>
        </span>
      </button>

      {open && (
        <div className="ckfp-sa-body" id={panelId}>
          {items.map((item, i) => (
            <LineItem key={i} item={item} calcItemTotal={calcItemTotal} prefix="sa" size={48} />
          ))}
          <div className="ckfp-sa-totals">
            <ShippingRow className="ckfp-sa-row" shippingCost={shippingCost} />
            {savings > 0 && <div className="ckfp-sa-row ckfp-sa-row--accent"><span>Descuento</span><span>−{money(savings)}</span></div>}
            {couponDiscount > 0 && appliedCoupon && (
              <div className="ckfp-sa-row ckfp-sa-row--accent"><span>Cupón {appliedCoupon.code}</span><span>−{money(couponDiscount)}</span></div>
            )}
            <div className="ckfp-sa-final"><span>Total</span><span>{money(finalTotal)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Campo de cupón (toggle + input + aplicar / cupón aplicado + quitar).
 * Se usa en la sidebar (desktop) y en la sección mobile; cada uso tiene su
 * propio estado de apertura y la página le pasa el input controlado.
 */
export function CouponBox({
  appliedCoupon, couponInput, setCouponInput, onApplyCoupon, onRemoveCoupon,
  couponError, applyingCoupon, toggleLabel, appliedLabel,
}) {
  const [open, setOpen] = useState(false);
  const rowId = useId();
  const errId = useId();

  if (appliedCoupon) {
    return (
      <div className="ckfp-coupon-applied">
        <span>{appliedLabel}</span>
        <button type="button" className="ckfp-coupon-remove" onClick={onRemoveCoupon}>Quitar</button>
      </div>
    );
  }

  return (
    <>
      <button type="button" className="ckfp-coupon-toggle" aria-expanded={open} aria-controls={rowId} onClick={() => setOpen(o => !o)}>
        {toggleLabel}
      </button>
      {open && (
        <div className="ckfp-coupon-row" id={rowId}>
          <input
            type="text" placeholder="Código de descuento"
            aria-label="Código de descuento"
            aria-invalid={couponError ? true : undefined}
            aria-describedby={couponError ? errId : undefined}
            value={couponInput}
            onChange={e => setCouponInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && onApplyCoupon()}
            className="ckfp-coupon-inp"
          />
          <button type="button" className="ckfp-coupon-btn" onClick={onApplyCoupon} disabled={applyingCoupon}>
            {applyingCoupon ? "..." : "Aplicar"}
          </button>
        </div>
      )}
      {couponError && <div className="ckfp-coupon-err" id={errId} role="alert">{couponError}</div>}
    </>
  );
}

/** Columna derecha (desktop): ítems, cupón y totales. */
export function SidebarSummary({ items, calcItemTotal, totalPrice, finalTotal, savings, couponDiscount, appliedCoupon, shippingCost = 0, ...coupon }) {
  return (
    <aside className="ckfp-sidebar" aria-label="Resumen del pedido">
      <div className="ckfp-sidebar-items">
        {items.map((item, i) => (
          <LineItem key={i} item={item} calcItemTotal={calcItemTotal} prefix="sb" size={56} />
        ))}
      </div>

      <div className="ckfp-sb-divider" />

      <CouponBox
        {...coupon}
        appliedCoupon={appliedCoupon}
        toggleLabel="¿Tenés un código de descuento?"
        appliedLabel={<>🎟 {appliedCoupon?.code}</>}
      />

      <div className="ckfp-sb-divider" />

      <div className="ckfp-sb-totals">
        <div className="ckfp-sb-row"><span>Subtotal</span><span>{money(totalPrice)}</span></div>
        <ShippingRow className="ckfp-sb-row" shippingCost={shippingCost} />
        {savings > 0 && <div className="ckfp-sb-row ckfp-sb-row--accent"><span>Descuento</span><span>−{money(savings)}</span></div>}
        {couponDiscount > 0 && <div className="ckfp-sb-row ckfp-sb-row--accent"><span>Cupón {appliedCoupon?.code}</span><span>−{money(couponDiscount)}</span></div>}
        <div className="ckfp-sb-final"><span>Total</span><span>{money(finalTotal)}</span></div>
      </div>
    </aside>
  );
}
