// src/pages/checkout.jsx
// Checkout fullpage — página única, sin pasos, estilo TiendaNube/Shopify
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api, { warmUpApi } from "../services/api";
import { getStoredAuth } from "../utils/auth";
import { useCart } from '../hooks/useCart';
import { trackWithCapi, getFbCookies } from "../lib/metaPixel";
import { PROVINCES, money } from "../components/checkout/checkoutFormat";
import { SummaryAccordion, SidebarSummary, CouponBox } from "../components/checkout/CheckoutSummary";
import { CheckoutStickyBar } from "../components/checkout/CheckoutStickyBar";
import { CheckoutField } from "../components/checkout/CheckoutField";
import { ShippingMethods } from "../components/checkout/ShippingMethods";
import { shippingPrice, isDeliveryUnlocked } from "../components/checkout/shipping";
import { MpRedirectOverlay } from "../components/checkout/MpRedirectOverlay";
import { PaymentMethods } from "../components/checkout/PaymentMethods";
import { BillingAddress } from "../components/checkout/BillingAddress";
import "./checkout.page.css";

// Meta cookies/eventId helpers viven en lib/metaPixel.js.

const INITIAL_FORM = {
  nombre: "", apellido: "", email: "", tel: "",
  direccion: "", extra: "",
  ciudad: "", provincia: "Buenos Aires", cp: "", dni: "",
  billingEmail: "",
};

function onlyDigits(s) { return String(s || "").replace(/[^\d]/g, ""); }
function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim()); }

function getOrCreateClientOrderId() {
  const KEY = "clientOrderId";
  const ex = localStorage.getItem(KEY);
  if (ex) return ex;
  let id = "";
  try { if (crypto?.randomUUID) id = crypto.randomUUID(); } catch { /* best-effort: se ignora */ }
  if (!id) id = `co_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(KEY, id);
  return id;
}
function clearClientOrderId() { localStorage.removeItem("clientOrderId"); }

function rSession(key, fallback) {
  try { const v = sessionStorage.getItem(key); return v != null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function wSession(key, val) {
  try { sessionStorage.setItem(key, JSON.stringify(val)); } catch { /* best-effort: se ignora */ }
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Checkout() {
  const { user } = getStoredAuth();
  const isLogged = Boolean(user?.email);
  const { items, totalPrice, calcItemTotal } = useCart();
  const isCartEmpty = !Array.isArray(items) || items.length === 0;

  const storeName = import.meta.env.VITE_STORE_NAME || "Amelor";

  // ── Formulario ────────────────────────────────────────────────────────────
  const [form, setForm] = useState(() => {
    const saved = rSession("ck_form", {});
    return {
      ...INITIAL_FORM, ...saved,
      nombre:   isLogged && user?.name  ? user.name  : (saved.nombre  || ""),
      apellido: saved.apellido || "",
      email:    isLogged && user?.email ? user.email : (saved.email   || ""),
    };
  });
  useEffect(() => { wSession("ck_form", form); }, [form]);

  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});

  function setF(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: "" }));
  }
  function touch(key) { setTouched(t => ({ ...t, [key]: true })); }

  function fieldError(key) {
    if (!touched[key]) return "";
    const val = String(form[key] || "").trim();
    if (key === "nombre")    return val.length < 2 ? "Requerido." : "";
    if (key === "email")     return !validateEmail(val) ? "Email inválido." : "";
    if (key === "tel")       return onlyDigits(val).length < 8 ? "Teléfono inválido." : "";
    if (key === "direccion") return val.length < 4 ? "Requerida." : "";
    if (key === "ciudad")    return val.length < 2 ? "Requerida." : "";
    if (key === "cp")        return onlyDigits(val).length < 4 ? "CP inválido." : "";
    return "";
  }
  function fieldOk(key) { return touched[key] && fieldError(key) === "" && String(form[key] || "").trim().length > 0; }

  // ── Envío ─────────────────────────────────────────────────────────────────
  const [shippingMethod, setShippingMethod] = useState("sucursal");

  // ── Pago ──────────────────────────────────────────────────────────────────
  const [onlinePayMethod, setOnlinePayMethod] = useState("mercadopago");
  const [sameAddr, setSameAddr] = useState(true); // dirección de facturación

  // ── Cupón ─────────────────────────────────────────────────────────────────
  const [couponInput,    setCouponInput]    = useState("");
  const [appliedCoupon,  setAppliedCoupon]  = useState(() => {
    try {
      const stored = sessionStorage.getItem("pendingCoupon");
      if (stored) { sessionStorage.removeItem("pendingCoupon"); return JSON.parse(stored); }
    } catch { /* best-effort: se ignora */ }
    return null;
  });
  const [couponError,    setCouponError]    = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // ── Estados pedido ─────────────────────────────────────────────────────────
  const [loading,       setLoading]       = useState(false);
  const [redirecting,   setRedirecting]   = useState(false);
  const [error,         setError]         = useState("");
  const [subscribeEmail, setSubscribeEmail] = useState(false);
  const errorRef = useRef(null);

  function showError(msg) {
    setError(msg);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }

  // ── Totales ───────────────────────────────────────────────────────────────
  const totalItems  = useMemo(() => items.reduce((a, it) => a + (Number(it.quantity) || 0), 0), [items]);
  const contentIds  = useMemo(() => items.map(it => it?.productId).filter(Boolean).map(String), [items]);
  const fullPrice   = useMemo(() => items.reduce((s, it) => {
    if (it.bundleTotal && it.compareAtPrice) return s + Number(it.compareAtPrice);
    return s + (Number(it.price) || 0) * (Number(it.quantity) || 0);
  }, 0), [items]);
  const savings = Math.max(0, fullPrice - totalPrice);
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const pct = Number(appliedCoupon.pct ?? appliedCoupon.value ?? 0);
    return Math.round(totalPrice * pct / 100);
  }, [appliedCoupon, totalPrice]);
  const shippingCost = shippingPrice(shippingMethod);
  const finalTotal = Math.max(0, totalPrice - couponDiscount + shippingCost);

  const shippingAddress = useMemo(() => [
    form.direccion, form.extra,
    `${form.ciudad}${form.cp ? ` (${form.cp})` : ""}`.trim(),
    form.provincia,
  ].filter(Boolean).join(", "), [form]);

  // ── Warmup + pixel ────────────────────────────────────────────────────────
  // Guard de único InitiateCheckout por render de esta página. Si el user
  // vuelve a /checkout desde otra ruta se dispara de nuevo (nueva sesión de
  // intento) — el ref se resetea con el unmount.
  const icFiredRef = useRef(false);
  useEffect(() => { warmUpApi(); }, []);
  useEffect(() => {
    if (isCartEmpty || icFiredRef.current) return;
    icFiredRef.current = true;
    // trackWithCapi hace Pixel + POST /api/track con eventID compartido.
    // Meta deduplica la pareja server↔browser.
    trackWithCapi("InitiateCheckout", {
      value:        Number(totalPrice) || 0,
      currency:     "ARS",
      num_items:    totalItems,
      content_ids:  contentIds,
      content_type: "product",
    });
  }, [isCartEmpty]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Captura abandonada ────────────────────────────────────────────────────
  function captureAbandoned() {
    const phone = form.tel.trim();
    const email = form.email.trim();
    if (!phone && !email) return;
    if (!items.length) return;
    api.post("/abandoned-cart", {
      phone, email,
      name: `${form.nombre} ${form.apellido}`.trim(),
      address: shippingAddress,
      city: form.ciudad, province: form.provincia, postalCode: form.cp,
      items: items.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, imageUrl: i.imageUrl || null })),
      total: finalTotal, totalItems,
      step: "checkout_single",
      landingSource: window.location.pathname,
    }).catch(() => {});
  }

  // ── Validación completa ───────────────────────────────────────────────────
  function validateAll() {
    const required = ["nombre", "email", "tel", "direccion", "ciudad", "cp"];
    const errs = {};
    required.forEach(k => {
      const e = fieldError(k) || (String(form[k] || "").trim() === "" ? "Requerido." : "");
      if (e) errs[k] = e;
    });
    const allTouched = {};
    required.forEach(k => { allTouched[k] = true; });
    setTouched(t => ({ ...t, ...allTouched }));
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Cupón ─────────────────────────────────────────────────────────────────
  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError("Ingresá un cupón."); return; }
    setApplyingCoupon(true); setCouponError("");
    try {
      const res = await api.post("/coupons/validate", { code, cartTotal: totalPrice });
      if (res.data?.ok) { setAppliedCoupon({ ...res.data.data, code }); setCouponError(""); }
      else { setCouponError(res.data?.message || "Cupón inválido."); setAppliedCoupon(null); }
    } catch (err) {
      const LOCAL = { "DESCUENTO10": 10, "PROMO15": 15, "WELCOME20": 20, "VIP25": 25 };
      const pct = LOCAL[code];
      if (pct) { setAppliedCoupon({ code, pct }); setCouponError(""); }
      else setCouponError(err?.response?.data?.message || "Cupón inválido.");
    } finally { setApplyingCoupon(false); }
  }
  function handleRemoveCoupon() { setAppliedCoupon(null); setCouponInput(""); setCouponError(""); }

  // ── Construir body de orden ───────────────────────────────────────────────
  function buildOrderBody(overrides = {}) {
    const { fbp, fbc } = getFbCookies();
    return {
      clientOrderId:   getOrCreateClientOrderId(),
      customerName:    `${form.nombre} ${form.apellido}`.trim(),
      customerEmail:   form.email.trim(),
      customerDni:     onlyDigits(form.dni),
      customerPhone:   form.tel.trim(),
      shippingAddress,
      shippingMethod,
      paymentMethod:   "mercadopago",
      notes:           [
        appliedCoupon ? `Cupón: ${appliedCoupon.code}` : "",
        !sameAddr && form.billingEmail ? `Facturación: ${form.billingEmail.trim()}` : "",
      ].filter(Boolean).join(" | "),
      coupon:          appliedCoupon?.code || null,
      couponDiscount,
      total: finalTotal,
      items: items.map(it => ({
        productId:      it.productId,
        name:           it.name,
        price:          it.price,
        quantity:       it.quantity,
        imageUrl:       it.imageUrl       || undefined,
        bundleTotal:    it.bundleTotal    || undefined,
        compareAtPrice: it.compareAtPrice || undefined,
      })),
      // Meta CAPI — fbp/fbc para el Purchase server-side desde el webhook MP.
      // purchaseEventId lo setea el server (determinístico "purchase_<orderId>").
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
      ...overrides,
    };
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault();
    if (isCartEmpty) { showError("Tu carrito está vacío."); return; }
    if (!validateAll()) {
      showError("Completá los campos requeridos antes de continuar.");
      return;
    }
    captureAbandoned();
    // AddPaymentInfo: el user confirmó datos y va a MP. trackWithCapi hace
    // Pixel + POST /api/track con eventID compartido.
    trackWithCapi("AddPaymentInfo", {
      value:        Number(finalTotal) || 0,
      currency:     "ARS",
      content_ids:  contentIds,
      content_type: "product",
      payment_type: onlinePayMethod,
    });
    setLoading(true); setError("");
    try {
      const res = await api.post("/orders", buildOrderBody());
      if (!res?.data) { showError("No se pudo procesar el pedido."); return; }
      const isProd = import.meta.env.MODE === "production";
      const url = isProd ? res.data.init_point : (res.data.sandbox_init_point || res.data.init_point);
      if (url) {
        clearClientOrderId();
        // NO disparar Purchase aquí — el usuario todavía no pagó.
        // Purchase se dispara en SuccessPayment cuando MP confirma el pago aprobado.
        setRedirecting(true);
        // rAF ensures the overlay paints at least one frame before navigating
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => { window.location.href = url; }, 1100);
          });
        });
        return;
      }
      showError("Hubo un error generando el link de pago. Intentá de nuevo.");
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data?.error || "Error al procesar el pedido.");
    } finally { setLoading(false); }
  }

  // ── Carrito vacío ─────────────────────────────────────────────────────────
  if (isCartEmpty) {
    return (
      <div className="ckfp-shell">
        <header className="ckfp-header"><Link to="/" className="ckfp-logo">{storeName}</Link></header>
        <main className="ckfp-empty">
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🛒</div>
          <h2>Tu carrito está vacío</h2>
          <Link to="/products" className="ckfp-btn-pay" style={{ display: "inline-block", marginTop: 16 }}>Ver productos →</Link>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="ckfp-shell">
      <MpRedirectOverlay open={redirecting} />

      {/* ── HEADER ── */}
      <header className="ckfp-header">
        <Link to="/" className="ckfp-logo">{storeName}</Link>
        <div className="ckfp-header-bag">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {totalItems > 0 && <span className="ckfp-bag-count">{totalItems}</span>}
        </div>
      </header>

      {/* ── MAIN GRID ── */}
      <main className="ckfp-main">

        {/* ── Columna izquierda: form ── */}
        <div className="ckfp-form-col">

          {/* Summary accordion (mobile) */}
          <div className="ckfp-sa-mobile">
            <SummaryAccordion
              items={items} calcItemTotal={calcItemTotal}
              totalPrice={totalPrice} finalTotal={finalTotal}
              savings={savings} couponDiscount={couponDiscount} appliedCoupon={appliedCoupon}
              shippingCost={shippingCost}
            />
          </div>

          {/* Error box */}
          {error && <div ref={errorRef} className="ckfp-error-box">⚠️ {error}</div>}


          {/* ── SECCIÓN: Contacto ── */}
          <div className="ckfp-section">
            <div className="ckfp-section-hdr">
              <h2 className="ckfp-section-title">Contacto</h2>
              {!isLogged && <a href="/login" className="ckfp-login-link">Iniciar sesión</a>}
            </div>
            <CheckoutField
              label="Correo electrónico" type="email" autoComplete="email"
              value={form.email}
              onChange={e => setF("email", e.target.value)}
              onBlur={() => { touch("email"); captureAbandoned(); }}
              error={fieldError("email")} ok={fieldOk("email")}
              disabled={isLogged}
            />
            <label className="ckfp-subscribe-label">
              <input
                type="checkbox"
                checked={subscribeEmail}
                onChange={e => setSubscribeEmail(e.target.checked)}
                className="ckfp-subscribe-check"
              />
              Enviarme novedades y ofertas por correo electrónico
            </label>
          </div>

          {/* ── SECCIÓN: Entrega ── */}
          <div className="ckfp-section">
            <h2 className="ckfp-section-title">Entrega</h2>

            {/* País — fijo */}
            <div className="ckfp-field">
              <div className="ckfp-fake-select">
                <span>País / Región</span>
                <span className="ckfp-fake-select-val">Argentina</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>

            <div className="ckfp-row2">
              <CheckoutField
                label="Nombre" type="text" autoComplete="given-name"
                value={form.nombre}
                onChange={e => setF("nombre", e.target.value)}
                onBlur={() => touch("nombre")}
                error={fieldError("nombre")} ok={fieldOk("nombre")}
                disabled={isLogged}
              />
              <CheckoutField
                label="Apellidos" type="text" autoComplete="family-name"
                value={form.apellido}
                onChange={e => setF("apellido", e.target.value)}
              />
            </div>

            <CheckoutField
              label="Dirección" type="text" autoComplete="address-line1"
              value={form.direccion}
              onChange={e => setF("direccion", e.target.value)}
              onBlur={() => touch("direccion")}
              error={fieldError("direccion")} ok={fieldOk("direccion")}
            />
            <CheckoutField
              label="Casa, apartamento, etc. (opcional)" type="text" autoComplete="address-line2"
              value={form.extra}
              onChange={e => setF("extra", e.target.value)}
            />

            <div className="ckfp-row2">
              <CheckoutField
                label="Código postal" type="text" autoComplete="postal-code" inputMode="numeric"
                value={form.cp}
                onChange={e => setF("cp", e.target.value)}
                onBlur={() => touch("cp")}
                error={fieldError("cp")} ok={fieldOk("cp")}
              />
              <CheckoutField
                label="Ciudad" type="text" autoComplete="address-level2"
                value={form.ciudad}
                onChange={e => setF("ciudad", e.target.value)}
                onBlur={() => touch("ciudad")}
                error={fieldError("ciudad")} ok={fieldOk("ciudad")}
              />
            </div>

            {/* Provincia */}
            <div className="ckfp-field">
              <div className="ckfp-select-wrap">
                <select
                  id="ckfp-provincia"
                  autoComplete="address-level1" value={form.provincia}
                  onChange={e => setF("provincia", e.target.value)}
                  className="ckfp-input ckfp-select"
                >
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <label htmlFor="ckfp-provincia" className="ckfp-select-label">Provincia / Estado</label>
              </div>
            </div>

            <CheckoutField
              label="Teléfono" type="tel" autoComplete="tel" inputMode="tel"
              value={form.tel}
              onChange={e => setF("tel", e.target.value)}
              onBlur={() => { touch("tel"); captureAbandoned(); }}
              error={fieldError("tel")}
              icon={
                <svg className="ckfp-input-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>
                </svg>
              }
            />
            <CheckoutField
              label="DNI (opcional)" type="text" autoComplete="off" inputMode="numeric"
              value={form.dni}
              onChange={e => setF("dni", onlyDigits(e.target.value))}
              maxLength={8}
            />
          </div>

          <ShippingMethods unlocked={isDeliveryUnlocked(form)} value={shippingMethod} onChange={setShippingMethod} />

          {/* ── Cupón (mobile only — desktop lo tiene en sidebar) ── */}
          <div className="ckfp-section ckfp-coupon-mobile">
            <CouponBox
              appliedCoupon={appliedCoupon}
              couponInput={couponInput} setCouponInput={setCouponInput}
              onApplyCoupon={handleApplyCoupon} onRemoveCoupon={handleRemoveCoupon}
              couponError={couponError} applyingCoupon={applyingCoupon}
              toggleLabel="🎟 ¿Tenés un código de descuento?"
              appliedLabel={<>🎟 {appliedCoupon?.code} — <strong style={{ color: "#15803d" }}>−{money(couponDiscount)}</strong></>}
            />
          </div>

          <PaymentMethods value={onlinePayMethod} onChange={setOnlinePayMethod} />

          <BillingAddress
            sameAddr={sameAddr} onSameAddrChange={setSameAddr}
            billingEmail={form.billingEmail} onBillingEmailChange={v => setF("billingEmail", v)}
          />

          {/* Spacer para sticky footer */}
          <div style={{ height: 48 }} />
        </div>

        {/* ── Columna derecha: sidebar (desktop) ── */}
        <div className="ckfp-sidebar-col">
          <SidebarSummary
            items={items} calcItemTotal={calcItemTotal}
            totalPrice={totalPrice} finalTotal={finalTotal}
            savings={savings} couponDiscount={couponDiscount} appliedCoupon={appliedCoupon}
            shippingCost={shippingCost}
            couponInput={couponInput} setCouponInput={setCouponInput}
            onApplyCoupon={handleApplyCoupon} onRemoveCoupon={handleRemoveCoupon}
            couponError={couponError} applyingCoupon={applyingCoupon}
          />
        </div>
      </main>

      {/* ── STICKY FOOTER ── */}
      <CheckoutStickyBar
        items={items} calcItemTotal={calcItemTotal} totalItems={totalItems}
        totalPrice={totalPrice} finalTotal={finalTotal}
        savings={savings} couponDiscount={couponDiscount} shippingCost={shippingCost}
        busy={loading || redirecting} loading={loading} redirecting={redirecting}
        onPay={handleSubmit}
      />
    </div>
  );
}
