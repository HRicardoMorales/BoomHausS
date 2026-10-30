// Paso 0 del sheet de checkout: ítems, totales, cupón y urgencia.
// Solo presentación: los montos llegan calculados y el cupón se valida en el
// padre (y de nuevo en el servidor). El total real lo recalcula el backend.
import { money } from "./checkoutFormat";

const KIT_MATCH = (it) => {
  const n = (it.name || "").toLowerCase();
  return n.includes("kit") && n.includes("revendedor");
};

const qtyBadgeStyle = { position: "absolute", top: -6, right: -6, background: "var(--primary)", color: "#fff", borderRadius: 999, width: 20, height: 20, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" };

/**
 * @param {object} props
 * @param {object[]} props.items
 * @param {(item: object) => number} props.calc  total de un ítem
 * @param {{ color: string, bg: string, border: string, text: string }} props.accent
 * @param {{ shippingCost: number, savings: number, discountAmount: number, totalPrice: number, finalTotal: number }} props.totals
 * @param {object} props.coupon  estado + handlers de `CouponField`
 * @param {string} props.cartTime  "mm:ss"; "00:00" oculta la urgencia
 * @param {number} props.socialProofCount
 */
export function CartStep({ items, calc, accent, totals, coupon, cartTime, socialProofCount }) {
  const hasKit = items.some(KIT_MATCH);
  const { shippingCost, savings, discountAmount, totalPrice, finalTotal } = totals;

  return (
    <div>
      {/* Hero benefits bar — color sigue la landing via --primary */}
      <div className="cs-ship-banner">
        <span className="cs-ship-banner-text">🚚 Envío gratis a todo el país</span>
        {hasKit && <span className="cs-ship-banner-text">· 🎁 +20 unidades de regalo incluidas</span>}
      </div>

      <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#aaa", fontWeight: 700 }}>Tu carrito está vacío.</div>
        )}
        {items.map((it, idx) => (
          <CartItemRow key={idx} item={it} total={calc(it)} accent={accent} />
        ))}
      </div>

      <div style={{ padding: "0 16px 10px" }}>
        <div className="cs-totals">
          <div className="cs-total-row"><span>Envío</span><span style={{ color: shippingCost > 0 ? "var(--text)" : accent.color, fontWeight: 800 }}>{shippingCost > 0 ? money(shippingCost) : "GRATIS"}</span></div>
          {savings > 0 && <div className="cs-total-row" style={{ color: accent.color }}><span>Ahorrás</span><span>-{money(savings)}</span></div>}
          {discountAmount > 0 && (
            <div className="cs-total-row" style={{ color: accent.color }}>
              <span>Cupón <strong>{coupon.applied.code}</strong></span>
              <span>-{money(discountAmount)}</span>
            </div>
          )}
          <div className="cs-total-row final">
            <span>Total</span>
            <span>
              {discountAmount > 0 && <span style={{ fontSize: 14, fontWeight: 700, textDecoration: "line-through", color: "#aaa", marginRight: 8 }}>{money(totalPrice)}</span>}
              {money(finalTotal)}
            </span>
          </div>
        </div>

        <CouponField {...coupon} />

        {cartTime !== "00:00" && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <span className="cs-cd-pill">
              ⚡ Oferta válida por <span className="cs-cd-pill-time">&nbsp;{cartTime}</span>
            </span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12, fontWeight: 800, color: accent.text, background: accent.bg, border: `1px solid ${accent.border}`, borderRadius: 8, padding: "8px 12px", marginTop: 10 }}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>🔥</span>
          <span>{socialProofCount} personas compraron esto en las últimas 24 horas</span>
        </div>
      </div>
    </div>
  );
}

/** Fila de un ítem: miniatura(s), nombre/variante, badges y precio. */
function CartItemRow({ item: it, total: itemTotal, accent }) {
  const origTotal = it.bundleTotal && it.compareAtPrice
    ? Number(it.compareAtPrice)
    : (Number(it.price) || 0) * (Number(it.quantity) || 0);
  const hasDiscount = (it.bundleTotal && it.compareAtPrice && Number(it.compareAtPrice) > itemTotal)
    || (it.promo?.type === "bundle2" && it.promo?.discountPct > 0);
  const badgeStyle = { fontSize: 10.5, background: accent.bg, color: accent.text, border: `1px solid ${accent.border}`, borderRadius: 999, padding: "2px 7px", fontWeight: 800 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 12px", boxShadow: "0 2px 10px rgba(0,0,0,.05)" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <CartItemMedia item={it} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <CartItemName name={it.name} />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}>
            {hasDiscount && it.promo?.discountPct > 0 && <span style={badgeStyle}>-{it.promo.discountPct}% OFF</span>}
            {hasDiscount && it.bundleTotal && <span style={badgeStyle}>PACK AHORRO</span>}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0, paddingTop: 2 }}>
          {hasDiscount && origTotal !== itemTotal && (
            <div style={{ fontSize: 11, textDecoration: "line-through", color: "#bbb", fontWeight: 700 }}>{money(origTotal)}</div>
          )}
          <div style={{ fontWeight: 900, fontSize: 16, color: hasDiscount ? accent.color : "var(--text)" }}>{money(itemTotal)}</div>
        </div>
      </div>

      {it.gifts?.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#b45309", letterSpacing: ".04em", marginBottom: 2 }}>🎁 INCLUIDO EN TU PEDIDO</div>
          {it.gifts.map((gift, gi) => (
            <div key={gi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}>· {gift}</span>
              <span style={{ fontSize: 11.5, fontWeight: 900, color: "#d97706", background: "#fef3c7", borderRadius: 999, padding: "2px 8px" }}>GRATIS</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Pack: [producto principal] + [imágenes del bundle] sin duplicados; si no, una miniatura. */
function CartItemMedia({ item: it }) {
  const mainImg = it.imageUrl || it.image || null;

  if (it.bundleImgs?.length > 0) {
    const otherImgs = mainImg ? it.bundleImgs.filter(s => s !== mainImg) : it.bundleImgs;
    const allImgs = mainImg ? [mainImg, ...otherImgs] : it.bundleImgs;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        {allImgs.map((src, bIdx) => (
          <div key={bIdx} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {bIdx > 0 && <span style={{ fontSize: 11, fontWeight: 900, color: "var(--primary)", opacity: .55, lineHeight: 1 }}>+</span>}
            <div style={{ width: 52, height: 52, borderRadius: 9, overflow: "hidden", background: "#f5f0f3", border: "1px solid rgba(0,0,0,.07)", flexShrink: 0 }}>
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
            </div>
          </div>
        ))}
        <span style={qtyBadgeStyle}>{it.quantity}</span>
      </div>
    );
  }

  return (
    <>
      <div style={{ width: 76, height: 76, borderRadius: 10, overflow: "hidden", background: "#f0f4f8", display: "grid", placeItems: "center", border: "1px solid rgba(0,0,0,.07)" }}>
        {mainImg ? <img src={mainImg} alt={it.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22 }}>📦</span>}
      </div>
      <span style={qtyBadgeStyle}>{it.quantity}</span>
    </>
  );
}

/** "Producto — Variante" se muestra en dos líneas. */
function CartItemName({ name = "" }) {
  const nameStyle = { fontWeight: 900, fontSize: 13, lineHeight: 1.3, color: "rgba(11,18,32,.90)" };
  const parts = name.split(" — ");
  if (parts.length < 2) return <div style={nameStyle}>{name}</div>;
  return (
    <>
      <div style={nameStyle}>{parts[0]}</div>
      <div style={{ fontWeight: 700, fontSize: 11.5, color: "var(--primary)", marginTop: 2, lineHeight: 1.3 }}>{parts[1]}</div>
    </>
  );
}

/** Cupón discreto: link que despliega el campo; aplicado queda bloqueado con "Quitar". */
function CouponField({ applied, open, onToggle, input, onInputChange, applying, error, onApply, onRemove }) {
  return (
    <>
      {!applied && (
        <button className="cs-coupon-toggle" onClick={onToggle} aria-expanded={open}>
          ¿Tenés un código de descuento?
        </button>
      )}
      {(open || applied) && (
        <div className="cs-coupon-body">
          <div className="cs-coupon-row">
            <input
              type="text"
              placeholder="Código de cupón"
              aria-label="Código de cupón"
              value={input}
              onChange={e => onInputChange(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && !applied && onApply()}
              className={applied ? "cs-coupon-applied" : ""}
              disabled={!!applied}
              aria-invalid={error ? true : undefined}
            />
            {applied ? (
              <button className="cs-coupon-btn remove" onClick={onRemove}>Quitar</button>
            ) : (
              <button className="cs-coupon-btn" onClick={onApply} disabled={applying || !input.trim()}>
                {applying ? "..." : "Aplicar"}
              </button>
            )}
          </div>
          <div role="status">
            {error && <div className="cs-coupon-err">{error}</div>}
            {applied && !error && (
              <div className="cs-coupon-ok">
                ✓ Cupón aplicado — {applied.type === "percent" ? `${applied.value}% de descuento` : `${money(applied.value)} de descuento`}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
