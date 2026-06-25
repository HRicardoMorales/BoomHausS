// src/pages/checkout.jsx
// Checkout fullpage — página única, sin pasos, estilo TiendaNube/Shopify
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api, { warmUpApi } from "../services/api";
import { getStoredAuth } from "../utils/auth";
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";

const PROVINCES = [
  "Buenos Aires","CABA","Catamarca","Chaco","Chubut","Córdoba","Corrientes",
  "Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones",
  "Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe",
  "Santiago del Estero","Tierra del Fuego","Tucumán",
];

const INITIAL_FORM = {
  nombre: "", apellido: "", email: "", tel: "",
  direccion: "", extra: "",
  ciudad: "", provincia: "Buenos Aires", cp: "", dni: "",
  billingEmail: "",
};

function money(n) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n) || 0);
}
function onlyDigits(s) { return String(s || "").replace(/[^\d]/g, ""); }
function sanitizePhone(p) { return String(p || "").replace(/[^\d+]/g, ""); }
function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim()); }

function getOrCreateClientOrderId() {
  const KEY = "clientOrderId";
  const ex = localStorage.getItem(KEY);
  if (ex) return ex;
  let id = "";
  try { if (crypto?.randomUUID) id = crypto.randomUUID(); } catch (_) {}
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
  try { sessionStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
}

// ── Acordeón del resumen (mobile top / desktop sidebar) ─────────────────────
function SummaryAccordion({ items, calcItemTotal, totalPrice, finalTotal, savings, couponDiscount, appliedCoupon, shippingCost = 0 }) {
  const [open, setOpen] = useState(false);
  const totalItems = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

  return (
    <div className="ckfp-sa">
      <button type="button" className="ckfp-sa-toggle" onClick={() => setOpen(o => !o)}>
        <div className="ckfp-sa-toggle-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#111" }}>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span className="ckfp-sa-lbl">Resumen del pedido</span>
          <svg className={`ckfp-sa-chev${open ? " open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div className="ckfp-sa-toggle-right">
          {savings > 0 && <span className="ckfp-sa-was">{money(totalPrice)}</span>}
          <span className="ckfp-sa-total">{money(finalTotal)}</span>
        </div>
      </button>

      {open && (
        <div className="ckfp-sa-body">
          {items.map((item, i) => {
            const thumb = item.imageUrl || item.image || null;
            const itemTotal = calcItemTotal(item);
            const origTotal = item.bundleTotal && item.compareAtPrice
              ? Number(item.compareAtPrice)
              : (Number(item.price) || 0) * (Number(item.quantity) || 0);
            const hasDisc = origTotal > itemTotal;
            return (
              <div key={i} className="ckfp-sa-item">
                <div className="ckfp-sa-img-wrap">
                  {thumb ? <img src={thumb} alt={item.name} className="ckfp-sa-img" /> : <span className="ckfp-sa-ph">📦</span>}
                  <span className="ckfp-sa-qty">{item.quantity}</span>
                </div>
                <span className="ckfp-sa-name">{item.name}</span>
                <span className="ckfp-sa-price">
                  {hasDisc && <span className="ckfp-sa-price-was">{money(origTotal)}</span>}
                  {money(itemTotal)}
                </span>
              </div>
            );
          })}
          <div className="ckfp-sa-totals">
            <div className="ckfp-sa-row">
              <span>Envío</span>
              {shippingCost > 0 ? <span>{money(shippingCost)}</span> : <span className="ckfp-sa-free">GRATIS</span>}
            </div>
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

// ── Sidebar summary (desktop) ────────────────────────────────────────────────
function SidebarSummary({ items, calcItemTotal, totalPrice, finalTotal, savings, couponDiscount, appliedCoupon, shippingCost = 0, couponInput, setCouponInput, onApplyCoupon, onRemoveCoupon, couponError, applyingCoupon }) {
  const [couponOpen, setCouponOpen] = useState(false);
  return (
    <aside className="ckfp-sidebar">
      <div className="ckfp-sidebar-items">
        {items.map((item, i) => {
          const thumb = item.imageUrl || item.image || null;
          const itemTotal = calcItemTotal(item);
          const origTotal = item.bundleTotal && item.compareAtPrice
            ? Number(item.compareAtPrice)
            : (Number(item.price) || 0) * (Number(item.quantity) || 0);
          const hasDisc = origTotal > itemTotal;
          return (
            <div key={i} className="ckfp-sb-item">
              <div className="ckfp-sb-img-wrap">
                {thumb ? <img src={thumb} alt={item.name} className="ckfp-sb-img" /> : <span className="ckfp-sa-ph">📦</span>}
                <span className="ckfp-sb-qty">{item.quantity}</span>
              </div>
              <span className="ckfp-sb-name">{item.name}</span>
              <div className="ckfp-sb-price">
                {hasDisc && <span className="ckfp-sb-was">{money(origTotal)}</span>}
                <span>{money(itemTotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ckfp-sb-divider" />

      {/* Cupón */}
      {!appliedCoupon ? (
        <>
          <button type="button" className="ckfp-coupon-toggle" onClick={() => setCouponOpen(o => !o)}>
            ¿Tenés un código de descuento?
          </button>
          {couponOpen && (
            <div className="ckfp-coupon-row">
              <input
                type="text" placeholder="Código de descuento"
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
          {couponError && <div className="ckfp-coupon-err">{couponError}</div>}
        </>
      ) : (
        <div className="ckfp-coupon-applied">
          <span>🎟 {appliedCoupon.code}</span>
          <button type="button" className="ckfp-coupon-remove" onClick={onRemoveCoupon}>Quitar</button>
        </div>
      )}

      <div className="ckfp-sb-divider" />

      <div className="ckfp-sb-totals">
        <div className="ckfp-sb-row"><span>Subtotal</span><span>{money(totalPrice)}</span></div>
        <div className="ckfp-sb-row">
          <span>Envío</span>
          {shippingCost > 0 ? <span>{money(shippingCost)}</span> : <span className="ckfp-sa-free">GRATIS</span>}
        </div>
        {savings > 0 && <div className="ckfp-sb-row ckfp-sb-row--accent"><span>Descuento</span><span>−{money(savings)}</span></div>}
        {couponDiscount > 0 && <div className="ckfp-sb-row ckfp-sb-row--accent"><span>Cupón {appliedCoupon?.code}</span><span>−{money(couponDiscount)}</span></div>}
        <div className="ckfp-sb-final"><span>Total</span><span>{money(finalTotal)}</span></div>
      </div>
    </aside>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Checkout() {
  const { user } = getStoredAuth();
  const isLogged = Boolean(user?.email);
  const { items, totalPrice, clearCart, calcItemTotal } = useCart();
  const isCartEmpty = !Array.isArray(items) || items.length === 0;

  const storeName = import.meta.env.VITE_STORE_NAME || "Amelor";
  const whatsapp  = import.meta.env.VITE_WHATSAPP_NUMBER || "";

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
  const [payExpanded, setPayExpanded] = useState(true); // MP abierto por defecto
  const [onlinePayMethod, setOnlinePayMethod] = useState("mercadopago");
  const [cardPaymentDone, setCardPaymentDone] = useState(false);
  const [sameAddr, setSameAddr] = useState(true); // dirección de facturación

  // ── Cupón ─────────────────────────────────────────────────────────────────
  const [couponOpen,     setCouponOpen]     = useState(false);
  const [couponInput,    setCouponInput]    = useState("");
  const [appliedCoupon,  setAppliedCoupon]  = useState(() => {
    try {
      const stored = sessionStorage.getItem("pendingCoupon");
      if (stored) { sessionStorage.removeItem("pendingCoupon"); return JSON.parse(stored); }
    } catch (_) {}
    return null;
  });
  const [couponError,    setCouponError]    = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // ── Estados pedido ─────────────────────────────────────────────────────────
  const [loading,       setLoading]       = useState(false);
  const [redirecting,   setRedirecting]   = useState(false);
  const [error,         setError]         = useState("");
  const [subscribeEmail, setSubscribeEmail] = useState(false);
  const [stickyOpen,    setStickyOpen]    = useState(false);
  const [orderData,   setOrderData]   = useState(null);
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
  const shippingCost = useMemo(() => {
    const opt = [
      { value: "sucursal",    price: 0    },
      { value: "domicilio",   price: 2980 },
      { value: "prioritario", price: 4890 },
    ].find(o => o.value === shippingMethod);
    return opt ? opt.price : 0;
  }, [shippingMethod]);
  const finalTotal = Math.max(0, totalPrice - couponDiscount + shippingCost);

  const shippingAddress = useMemo(() => [
    form.direccion, form.extra,
    `${form.ciudad}${form.cp ? ` (${form.cp})` : ""}`.trim(),
    form.provincia,
  ].filter(Boolean).join(", "), [form]);

  // ── Warmup + pixel ────────────────────────────────────────────────────────
  const firedRef = useRef(false);
  useEffect(() => { warmUpApi(); }, []);
  useEffect(() => {
    if (isCartEmpty || firedRef.current) return;
    firedRef.current = true;
    track("InitiateCheckout", { value: Number(totalPrice) || 0, currency: "ARS", num_items: totalItems, content_ids: contentIds, content_type: "product" });
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
    track("AddPaymentInfo", { value: Number(finalTotal) || 0, currency: "ARS", content_ids: contentIds, content_type: "product", payment_type: onlinePayMethod });
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
        setTimeout(() => { window.location.href = url; }, 1200);
        return;
      }
      showError("Hubo un error generando el link de pago. Intentá de nuevo.");
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data?.error || "Error al procesar el pedido.");
    } finally { setLoading(false); }
  }

  // ── WA url ────────────────────────────────────────────────────────────────
  const waUrl = useMemo(() => {
    if (!whatsapp) return null;
    const orderId = orderData?._id || orderData?.orderId || "";
    const msg = orderId
      ? `Hola! 👋 Confirmo la entrega del pedido #${orderId}.`
      : `Hola! 👋 Confirmo mi entrega con ${storeName}.`;
    return `https://wa.me/${sanitizePhone(whatsapp)}?text=${encodeURIComponent(msg)}`;
  }, [whatsapp, orderData, storeName]);

  // ── Primer item thumbnail ─────────────────────────────────────────────────
  const firstThumb = items[0]?.imageUrl || items[0]?.image || null;

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (cardPaymentDone || orderData) {
    return (
      <div className="ckfp-shell">
        <header className="ckfp-header">
          <Link to="/" className="ckfp-logo">{storeName}</Link>
        </header>
        <main className="ckfp-success">
          <div className="ckfp-success-card">
            <div className="ckfp-success-icon">🎉</div>
            <h1 className="ckfp-success-title">{cardPaymentDone ? "¡Pago aprobado!" : "¡Gracias por tu pedido!"}</h1>
            <div className="ckfp-success-body">
              <p>Tu pedido está confirmado y en preparación.</p>
              <div className="ckfp-success-box">
                ✅ Recibirás el seguimiento por <strong>WhatsApp</strong> o email.<br />
                🚚 Tu pedido llega en <strong>1 a 3 días hábiles</strong>.
              </div>
            </div>
            <div className="ckfp-success-actions">
              {waUrl && <a className="ckfp-btn-pay" href={waUrl} target="_blank" rel="noreferrer">Contactar por WhatsApp →</a>}
              <Link to="/my-orders" className="ckfp-link">Ver mis pedidos</Link>
              <Link to="/" className="ckfp-link muted">Seguir comprando</Link>
            </div>
          </div>
        </main>
        <Styles />
      </div>
    );
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
        <Styles />
      </div>
    );
  }

  // ── Overlay MP ────────────────────────────────────────────────────────────
  const mpOverlay = redirecting && (
    <div className="ckfp-mp-overlay">
      <div className="ckfp-mp-card">
        <div className="ckfp-mp-logo-wrap">
          <svg viewBox="0 0 40 40" width="52" height="52" fill="none">
            <rect width="40" height="40" rx="12" fill="#009ee3"/>
            <path d="M10.5 20.8c0-3.4 2.2-6.2 5.2-6.2 1.6 0 2.7.7 3.3 1.5.6-.8 1.7-1.5 3.3-1.5 3 0 5.2 2.8 5.2 6.2 0 4.8-5 9.2-8.5 11.2-3.5-2-8.5-6.4-8.5-11.2z" fill="#fff"/>
          </svg>
        </div>
        <h2 className="ckfp-mp-title">Conectando con Mercado Pago</h2>
        <p className="ckfp-mp-sub">Estamos generando tu link de pago seguro</p>
        <div className="ckfp-mp-bar-track"><div className="ckfp-mp-bar" /></div>
        <p className="ckfp-mp-note">No cerrés esta pantalla — serás redirigido en segundos</p>
      </div>
    </div>
  );

  // ── Shipping options ──────────────────────────────────────────────────────
  const SHIP_OPTS = [
    { value: "sucursal",        title: "Envío a sucursal",                           sub: "2 a 4 días hábiles",  price: 0,    was: null   },
    { value: "domicilio",       title: "Envío a domicilio + código de seguimiento",  sub: "1 a 3 días hábiles",  price: 2980, was: 9814   },
    { value: "prioritario",     title: "Envío a domicilio prioritario + código de seguimiento",  sub: "1 a 2 días hábiles",  price: 4890, was: 12326  },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="ckfp-shell">
      {mpOverlay}

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
            <div className="ckfp-field">
              <input
                type="email" autoComplete="email" placeholder="Correo electrónico"
                value={form.email}
                onChange={e => setF("email", e.target.value)}
                onBlur={() => { touch("email"); captureAbandoned(); }}
                className={`ckfp-input${fieldError("email") ? " err" : ""}${fieldOk("email") ? " ok" : ""}`}
                disabled={isLogged}
              />
              {fieldError("email") && <span className="ckfp-field-err">{fieldError("email")}</span>}
            </div>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>

            {/* Nombre + Apellidos */}
            <div className="ckfp-row2">
              <div className="ckfp-field">
                <input
                  type="text" autoComplete="given-name" placeholder="Nombre"
                  value={form.nombre}
                  onChange={e => setF("nombre", e.target.value)}
                  onBlur={() => touch("nombre")}
                  className={`ckfp-input${fieldError("nombre") ? " err" : ""}${fieldOk("nombre") ? " ok" : ""}`}
                  disabled={isLogged}
                />
                {fieldError("nombre") && <span className="ckfp-field-err">{fieldError("nombre")}</span>}
              </div>
              <div className="ckfp-field">
                <input
                  type="text" autoComplete="family-name" placeholder="Apellidos"
                  value={form.apellido}
                  onChange={e => setF("apellido", e.target.value)}
                  className="ckfp-input"
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="ckfp-field">
              <input
                type="text" autoComplete="address-line1" placeholder="Dirección"
                value={form.direccion}
                onChange={e => setF("direccion", e.target.value)}
                onBlur={() => touch("direccion")}
                className={`ckfp-input${fieldError("direccion") ? " err" : ""}${fieldOk("direccion") ? " ok" : ""}`}
              />
              {fieldError("direccion") && <span className="ckfp-field-err">{fieldError("direccion")}</span>}
            </div>

            {/* Casa/apto */}
            <div className="ckfp-field">
              <input
                type="text" autoComplete="address-line2" placeholder="Casa, apartamento, etc. (opcional)"
                value={form.extra}
                onChange={e => setF("extra", e.target.value)}
                className="ckfp-input"
              />
            </div>

            {/* CP + Ciudad */}
            <div className="ckfp-row2">
              <div className="ckfp-field">
                <input
                  type="text" autoComplete="postal-code" placeholder="Código postal" inputMode="numeric"
                  value={form.cp}
                  onChange={e => setF("cp", e.target.value)}
                  onBlur={() => touch("cp")}
                  className={`ckfp-input${fieldError("cp") ? " err" : ""}${fieldOk("cp") ? " ok" : ""}`}
                />
                {fieldError("cp") && <span className="ckfp-field-err">{fieldError("cp")}</span>}
              </div>
              <div className="ckfp-field">
                <input
                  type="text" autoComplete="address-level2" placeholder="Ciudad"
                  value={form.ciudad}
                  onChange={e => setF("ciudad", e.target.value)}
                  onBlur={() => touch("ciudad")}
                  className={`ckfp-input${fieldError("ciudad") ? " err" : ""}${fieldOk("ciudad") ? " ok" : ""}`}
                />
                {fieldError("ciudad") && <span className="ckfp-field-err">{fieldError("ciudad")}</span>}
              </div>
            </div>

            {/* Provincia */}
            <div className="ckfp-field">
              <div className="ckfp-select-wrap">
                <select
                  autoComplete="address-level1" value={form.provincia}
                  onChange={e => setF("provincia", e.target.value)}
                  className="ckfp-input ckfp-select"
                >
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <span className="ckfp-select-label">Provincia / Estado</span>
              </div>
            </div>

            {/* Teléfono */}
            <div className="ckfp-field">
              <div className="ckfp-input-icon-wrap">
                <input
                  type="tel" autoComplete="tel" placeholder="Teléfono" inputMode="tel"
                  value={form.tel}
                  onChange={e => setF("tel", e.target.value)}
                  onBlur={() => { touch("tel"); captureAbandoned(); }}
                  className={`ckfp-input ckfp-input--icon${fieldError("tel") ? " err" : ""}`}
                />
                <svg className="ckfp-input-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>
                </svg>
              </div>
              {fieldError("tel") && <span className="ckfp-field-err">{fieldError("tel")}</span>}
            </div>

            {/* DNI — opcional */}
            <div className="ckfp-field">
              <input
                type="text" autoComplete="off" placeholder="DNI (opcional)" inputMode="numeric"
                value={form.dni}
                onChange={e => setF("dni", onlyDigits(e.target.value))}
                className="ckfp-input"
                maxLength={8}
              />
            </div>
          </div>

          {/* ── SECCIÓN: Métodos de envío ── */}
          {(() => {
            const deliveryUnlocked = form.direccion.trim().length >= 4 || form.ciudad.trim().length >= 2 || form.cp.trim().length >= 4;
            return (
              <div className="ckfp-section">
                <h2 className="ckfp-section-title">Métodos de envío</h2>
                {!deliveryUnlocked ? (
                  <div className="ckfp-ship-locked">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Completá la dirección para ver los métodos de envío
                  </div>
                ) : (
                  <div className="ckfp-ship-group">
                    {SHIP_OPTS.map(opt => (
                      <label
                        key={opt.value}
                        className={`ckfp-ship-opt${shippingMethod === opt.value ? " selected" : ""}`}
                      >
                        <input
                          type="radio" name="shipping" value={opt.value}
                          checked={shippingMethod === opt.value}
                          onChange={() => setShippingMethod(opt.value)}
                        />
                        <div className="ckfp-ship-info">
                          <span className="ckfp-ship-title">{opt.title}</span>
                          <span className="ckfp-ship-sub">{opt.sub}</span>
                        </div>
                        <div className="ckfp-ship-price">
                          {opt.was && <span className="ckfp-ship-was">{money(opt.was)}</span>}
                          {opt.price === 0
                            ? <span className="ckfp-ship-free">GRATIS</span>
                            : <span className="ckfp-ship-cost">{money(opt.price)}</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Cupón (mobile only — desktop lo tiene en sidebar) ── */}
          <div className="ckfp-section ckfp-coupon-mobile">
            {!appliedCoupon ? (
              <>
                <button type="button" className="ckfp-coupon-toggle" onClick={() => setCouponOpen(o => !o)}>
                  🎟 ¿Tenés un código de descuento?
                </button>
                {couponOpen && (
                  <div className="ckfp-coupon-row">
                    <input
                      type="text" placeholder="Código de descuento"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                      className="ckfp-coupon-inp"
                    />
                    <button type="button" className="ckfp-coupon-btn" onClick={handleApplyCoupon} disabled={applyingCoupon}>
                      {applyingCoupon ? "..." : "Aplicar"}
                    </button>
                  </div>
                )}
                {couponError && <div className="ckfp-coupon-err">{couponError}</div>}
              </>
            ) : (
              <div className="ckfp-coupon-applied">
                <span>🎟 {appliedCoupon.code} — <strong style={{ color: "#15803d" }}>−{money(couponDiscount)}</strong></span>
                <button type="button" className="ckfp-coupon-remove" onClick={handleRemoveCoupon}>Quitar</button>
              </div>
            )}
          </div>

          {/* ── SECCIÓN: Pago ── */}
          <div className="ckfp-section">
            <h2 className="ckfp-section-title">Pago</h2>
            <p className="ckfp-pay-safe">Todas las transacciones son seguras y están encriptadas.</p>

            {/* Mercado Pago accordion */}
            <div className={`ckfp-pay-card${onlinePayMethod === "mercadopago" ? " selected" : ""}`}>
              <div
                className="ckfp-pay-card-hdr"
                onClick={() => { setOnlinePayMethod("mercadopago"); setPayExpanded(o => onlinePayMethod !== "mercadopago" ? true : !o); }}
              >
                <input type="radio" name="payment" checked={onlinePayMethod === "mercadopago"} onChange={() => { setOnlinePayMethod("mercadopago"); setPayExpanded(true); }} />
                <div className="ckfp-pay-card-logos">
                  <img src="https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1/assets/mercadopago.BK20nVmQ.svg" alt="Mercado Pago" width="38" height="24" className="ckfp-logo-img" />
                  <img src="https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1/assets/visa.sxIq5Dot.svg" alt="Visa" width="38" height="24" className="ckfp-logo-img" />
                  <img src="https://cdn.shopify.com/shopifycloud/checkout-web/assets/c1/assets/master.CzeoQWmc.svg" alt="Mastercard" width="38" height="24" className="ckfp-logo-img" />
                  <span className="ckfp-pay-more">+3</span>
                </div>
                <svg className={`ckfp-pay-chev${payExpanded && onlinePayMethod === "mercadopago" ? " open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              {payExpanded && onlinePayMethod === "mercadopago" && (
                <div className="ckfp-pay-card-body">
                  <div className="ckfp-mp-trust">
                    <div className="ckfp-mp-trust-cuotas">
                      Pagá en <strong>3 cuotas sin interés</strong> con tu tarjeta en Mercado Pago
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── SECCIÓN: Dirección de facturación ── */}
          <div className="ckfp-section" style={{ marginTop: 48 }}>
            <h2 className="ckfp-section-title">Dirección de facturación</h2>
            <div className="ckfp-ship-group">
              <label className={`ckfp-ship-opt${sameAddr ? " selected" : ""}`}>
                <input type="radio" name="billing" checked={sameAddr} onChange={() => setSameAddr(true)} />
                <span className="ckfp-ship-title">La misma dirección de envío</span>
              </label>
              <label className={`ckfp-ship-opt${!sameAddr ? " selected" : ""}`}>
                <input type="radio" name="billing" checked={!sameAddr} onChange={() => setSameAddr(false)} />
                <span className="ckfp-ship-title">Usar una dirección de facturación distinta</span>
              </label>
            </div>
            {!sameAddr && (
              <div className="ckfp-field" style={{ marginTop: 12 }}>
                <input
                  type="email"
                  className="ckfp-input"
                  placeholder="Email de facturación"
                  value={form.billingEmail}
                  onChange={e => setF("billingEmail", e.target.value)}
                  autoComplete="email"
                />
              </div>
            )}
          </div>

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
      <div className="ckfp-sticky">
        <div className="ckfp-sticky-inner">

          {/* Resumen desplegable */}
          {stickyOpen && (
            <div className="ckfp-sticky-summary">
              {items.map((it, i) => {
                const itemTotal = calcItemTotal(it);
                const thumb = it.imageUrl || it.image || null;
                return (
                  <div key={i} className="ckfp-sticky-sum-item">
                    <div className="ckfp-sticky-sum-img-wrap">
                      {thumb
                        ? <img src={thumb} alt={it.name} className="ckfp-sticky-sum-img" />
                        : <span style={{ fontSize: 18 }}>📦</span>}
                      <span className="ckfp-sticky-sum-qty">{it.quantity}</span>
                    </div>
                    <span className="ckfp-sticky-sum-name">{it.name}</span>
                    <span className="ckfp-sticky-sum-price">{money(itemTotal)}</span>
                  </div>
                );
              })}
              <div className="ckfp-sticky-sum-rows">
                <div className="ckfp-sticky-sum-row"><span>Subtotal</span><span>{money(totalPrice)}</span></div>
                <div className="ckfp-sticky-sum-row">
                  <span>Envío</span>
                  {shippingCost > 0 ? <span>{money(shippingCost)}</span> : <span style={{ color: "#16a34a", fontWeight: 600 }}>GRATIS</span>}
                </div>
                {savings > 0 && <div className="ckfp-sticky-sum-row" style={{ color: "#16a34a" }}><span>Descuento</span><span>−{money(savings)}</span></div>}
                {couponDiscount > 0 && <div className="ckfp-sticky-sum-row" style={{ color: "#16a34a" }}><span>Cupón</span><span>−{money(couponDiscount)}</span></div>}
              </div>
            </div>
          )}

          {/* Fila clickeable: thumbnail + Total + precio */}
          <div className="ckfp-sticky-row1 ckfp-sticky-row1--btn" onClick={() => setStickyOpen(o => !o)}>
            {firstThumb && (
              <div className="ckfp-sticky-thumb-wrap">
                <img src={firstThumb} alt="" className="ckfp-sticky-thumb" />
              </div>
            )}
            <div className="ckfp-sticky-mid">
              <span className="ckfp-sticky-label">Total</span>
              <span className="ckfp-sticky-count">{totalItems} {totalItems === 1 ? "artículo" : "artículos"}</span>
            </div>
            <div className="ckfp-sticky-right">
              <span className="ckfp-sticky-currency">ARS</span>
              <span className="ckfp-sticky-amount">{money(finalTotal)}</span>
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"
                style={{ transition: "transform .2s", transform: stickyOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
              ><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>

          {/* Botón Pagar */}
          <button
            type="button"
            className={`ckfp-btn-pay${loading || redirecting ? " loading" : ""}`}
            onClick={handleSubmit}
            disabled={loading || redirecting}
          >
            {redirecting ? "Conectando..." : loading ? "Procesando..." : "Pagar ahora"}
          </button>

          <a href="/politica-de-privacidad" className="ckfp-privacy-link">Política de privacidad</a>
        </div>
      </div>

      <Styles />
    </div>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
function Styles() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <style>{`
      @keyframes ckfpIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      @keyframes ckfpMpBar { from { width:0; } to { width:100%; } }
      @keyframes ckShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }

      *, *::before, *::after { box-sizing: border-box; }

      .ckfp-shell {
        min-height: 100vh; background: #f5f5f5;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #111827;
        animation: ckfpIn .35s cubic-bezier(.22,1,.36,1) both;
      }
      .ckfp-shell input, .ckfp-shell select, .ckfp-shell textarea, .ckfp-shell button { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

      /* ── Header ── */
      .ckfp-header {
        background: #fff; border-bottom: 1px solid #e5e7eb;
        height: 60px; display: flex; align-items: center; justify-content: space-between;
        padding: 0 24px; position: sticky; top: 0; z-index: 200;
      }
      .ckfp-logo { font-size: 17px; font-weight: 700; color: #111827; text-decoration: none; letter-spacing: -.02em; font-family: 'Inter', sans-serif; }
      .ckfp-header-bag { position: relative; color: #374151; }
      .ckfp-bag-count {
        position: absolute; top: -7px; right: -8px;
        background: #111827; color: #fff; border-radius: 999px;
        width: 17px; height: 17px; font-size: 10px; font-weight: 900;
        display: flex; align-items: center; justify-content: center;
      }

      /* ── Main grid ── */
      .ckfp-main {
        max-width: 1060px; margin: 0 auto;
        display: grid; grid-template-columns: 1fr;
        gap: 0; padding: 0 0 120px;
        align-items: flex-start;
      }
      @media (min-width: 900px) {
        .ckfp-main { grid-template-columns: 1.1fr 0.9fr; gap: 0; padding-bottom: 60px; }
      }

      /* ── Form column ── */
      .ckfp-form-col {
        background: #fff; min-height: calc(100vh - 60px);
        padding: 0 24px 32px;
      }
      @media (min-width: 900px) {
        .ckfp-form-col { padding: 28px 40px 48px; border-right: 1px solid #e5e7eb; }
      }

      /* ── Sidebar column ── */
      .ckfp-sidebar-col { display: none; }
      @media (min-width: 900px) {
        .ckfp-sidebar-col { display: block; background: #f9fafb; padding: 28px 32px; border-left: 1px solid #e5e7eb; min-height: calc(100vh - 60px); }
      }

      /* ── Sidebar ── */
      .ckfp-sidebar { position: sticky; top: 80px; }
      .ckfp-sidebar-items { display: flex; flex-direction: column; gap: 16px; margin-bottom: 18px; }
      .ckfp-sb-item { display: flex; align-items: center; gap: 12px; }
      .ckfp-sb-img-wrap { position: relative; flex-shrink: 0; }
      .ckfp-sb-img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; border: 1px solid rgba(0,0,0,.08); display: block; }
      .ckfp-sb-qty {
        position: absolute; top: -7px; right: -7px;
        background: #6b7280; color: #fff; border-radius: 999px;
        width: 18px; height: 18px; font-size: 10px; font-weight: 900;
        display: flex; align-items: center; justify-content: center;
      }
      .ckfp-sb-name { flex: 1; font-size: 13px; font-weight: 600; color: #374151; line-height: 1.4; }
      .ckfp-sb-price { text-align: right; font-size: 13px; font-weight: 700; color: #111827; white-space: nowrap; }
      .ckfp-sb-was { display: block; font-size: 11px; text-decoration: line-through; color: #9ca3af; }
      .ckfp-sb-divider { height: 1px; background: #e5e7eb; margin: 14px 0; }
      .ckfp-sb-totals { display: flex; flex-direction: column; gap: 8px; }
      .ckfp-sb-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #374151; }
      .ckfp-sb-row--accent { color: #16a34a; font-weight: 700; }
      .ckfp-sb-final { display: flex; justify-content: space-between; font-size: 17px; font-weight: 900; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 4px; }

      /* ── Summary accordion (mobile top) ── */
      .ckfp-sa-mobile { background: #f9fafb; border-bottom: 1px solid #e5e7eb; margin: 0 -24px 20px; }
      @media (min-width: 900px) { .ckfp-sa-mobile { display: none; } }
      .ckfp-sa { width: 100%; }
      .ckfp-sa-toggle {
        width: 100%; display: flex; align-items: center; justify-content: space-between;
        padding: 14px 24px; background: none; border: none; cursor: pointer;
        font-size: 13px; color: #111827;
      }
      .ckfp-sa-toggle-left { display: flex; align-items: center; gap: 8px; }
      .ckfp-sa-lbl { font-size: 13px; font-weight: 700; color: #111827; }
      .ckfp-sa-chev { transition: transform .2s; color: #9ca3af; }
      .ckfp-sa-chev.open { transform: rotate(180deg); }
      .ckfp-sa-toggle-right { display: flex; align-items: center; gap: 8px; }
      .ckfp-sa-was { font-size: 12px; text-decoration: line-through; color: #9ca3af; }
      .ckfp-sa-total { font-size: 15px; font-weight: 900; color: #111827; }
      .ckfp-sa-body { padding: 12px 24px 16px; border-top: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 12px; }
      .ckfp-sa-item { display: flex; align-items: center; gap: 12px; }
      .ckfp-sa-img-wrap { position: relative; flex-shrink: 0; }
      .ckfp-sa-img { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(0,0,0,.08); display: block; }
      .ckfp-sa-ph { font-size: 22px; }
      .ckfp-sa-qty {
        position: absolute; top: -6px; right: -6px;
        background: #6b7280; color: #fff; border-radius: 999px;
        width: 17px; height: 17px; font-size: 10px; font-weight: 900;
        display: flex; align-items: center; justify-content: center;
      }
      .ckfp-sa-name { flex: 1; font-size: 12.5px; font-weight: 600; color: #374151; }
      .ckfp-sa-price { font-size: 13px; font-weight: 700; color: #111827; white-space: nowrap; }
      .ckfp-sa-price-was { display: block; font-size: 11px; text-decoration: line-through; color: #9ca3af; }
      .ckfp-sa-totals { border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; flex-direction: column; gap: 6px; }
      .ckfp-sa-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #374151; }
      .ckfp-sa-row--accent { color: #16a34a; }
      .ckfp-sa-free { color: #16a34a; font-weight: 700; }
      .ckfp-sa-final { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 2px; }

      /* ── Coupon mobile section (oculto en desktop porque está en el sidebar) ── */
      .ckfp-coupon-mobile { margin-top: 0; padding-top: 0; }
      @media (min-width: 900px) { .ckfp-coupon-mobile { display: none; } }

      /* ── Coupon ── */
      .ckfp-coupon-toggle { background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 600; color: #6b7280; padding: 0; text-decoration: underline; margin-bottom: 8px; display: block; }
      .ckfp-coupon-toggle:hover { color: #374151; }
      .ckfp-coupon-row { display: flex; gap: 8px; margin-top: 4px; }
      .ckfp-coupon-inp { flex: 1; height: 38px; border: 1.5px solid #d1d5db; border-radius: 8px; padding: 0 10px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; outline: none; background: #fff; }
      .ckfp-coupon-inp:focus { border-color: #111827; }
      .ckfp-coupon-btn { height: 38px; padding: 0 14px; border: 1.5px solid #d1d5db; border-radius: 8px; background: #f3f4f6; font-size: 12px; font-weight: 800; color: #374151; cursor: pointer; white-space: nowrap; }
      .ckfp-coupon-btn:hover:not(:disabled) { background: #e5e7eb; }
      .ckfp-coupon-btn:disabled { opacity: .5; cursor: not-allowed; }
      .ckfp-coupon-err { font-size: 12px; color: #dc2626; font-weight: 700; margin-top: 4px; }
      .ckfp-coupon-applied { display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; font-weight: 700; color: #15803d; padding: 6px 0; }
      .ckfp-coupon-remove { background: none; border: none; cursor: pointer; font-size: 11.5px; font-weight: 700; color: #9ca3af; text-decoration: underline; padding: 0; }
      .ckfp-coupon-remove:hover { color: #374151; }

      /* ── Section ── */
      .ckfp-section { margin-top: 28px; }
      .ckfp-section-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
      .ckfp-section-hdr .ckfp-section-title { margin-bottom: 0; }
      .ckfp-section-title { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 14px; font-family: 'Inter', sans-serif; letter-spacing: -.01em; }
      .ckfp-login-link { font-size: 13px; font-weight: 500; color: #6b7280; text-decoration: none; }
      .ckfp-login-link:hover { color: #111827; text-decoration: underline; }
      .ckfp-subscribe-label { display: flex; align-items: center; gap: 9px; margin-top: 10px; font-size: 13px; font-weight: 400; color: #374151; cursor: pointer; user-select: none; }
      .ckfp-subscribe-check { width: 15px; height: 15px; flex-shrink: 0; accent-color: #111827; cursor: pointer; margin: 0; }
      .ckfp-ship-locked { display: flex; align-items: center; gap: 10px; border: 1.5px dashed #d1d5db; border-radius: 10px; padding: 14px 16px; font-size: 13px; font-weight: 500; color: #9ca3af; }

      /* ── Error ── */
      .ckfp-error-box { background: #fef2f2; color: #dc2626; border: 1.5px solid #fca5a5; border-radius: 10px; padding: 12px 14px; font-size: 13px; font-weight: 800; margin: 20px 0 0; animation: ckShake .4s ease; }

      /* ── Inputs ── */
      .ckfp-field { margin-bottom: 10px; }
      .ckfp-input {
        width: 100%; padding: 11px 14px; font-size: 14px; font-weight: 500;
        border: 1.5px solid #d1d5db; border-radius: 8px;
        background: #fff; color: #111827; outline: none;
        transition: border-color .15s, box-shadow .15s;
        -webkit-appearance: none; appearance: none; font-family: inherit;
      }
      .ckfp-input::placeholder { color: #9ca3af; font-weight: 400; }
      .ckfp-input:focus { border-color: #111827; box-shadow: 0 0 0 3px rgba(0,0,0,.07); }
      .ckfp-input.err   { border-color: #dc2626; }
      .ckfp-input.ok    { border-color: #9ca3af; }
      .ckfp-field-err  { font-size: 12px; font-weight: 700; color: #dc2626; margin-top: 3px; display: block; }
      .ckfp-field-hint { font-size: 11.5px; font-weight: 600; color: #9ca3af; margin-top: 3px; display: block; }
      .ckfp-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      @media (max-width: 420px) { .ckfp-row2 { grid-template-columns: 1fr; } }

      /* País fijo */
      .ckfp-fake-select {
        display: flex; align-items: center; gap: 10px;
        border: 1.5px solid #d1d5db; border-radius: 8px; padding: 11px 14px;
        font-size: 14px; background: #f9fafb; color: #9ca3af;
      }
      .ckfp-fake-select-val { flex: 1; color: #111827; font-weight: 500; }

      /* Select */
      .ckfp-select-wrap { position: relative; }
      .ckfp-select { padding-top: 20px; cursor: pointer; }
      .ckfp-select-label {
        position: absolute; left: 14px; top: 6px; font-size: 10.5px;
        font-weight: 700; color: #9ca3af; pointer-events: none;
      }
      select.ckfp-input { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }

      /* Input con icono */
      .ckfp-input-icon-wrap { position: relative; }
      .ckfp-input--icon { padding-right: 40px; }
      .ckfp-input-ico { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }

      /* ── Shipping options ── */
      .ckfp-ship-group { border: 1.5px solid #d1d5db; border-radius: 10px; overflow: hidden; }
      .ckfp-ship-opt {
        display: flex; align-items: center; gap: 12px;
        padding: 14px 16px; cursor: pointer; background: #fff;
        border-bottom: 1px solid #e5e7eb; transition: background .12s;
      }
      .ckfp-ship-opt:last-child { border-bottom: none; }
      .ckfp-ship-opt input[type="radio"] { width: 17px; height: 17px; accent-color: #111827; flex-shrink: 0; cursor: pointer; margin: 0; }
      .ckfp-ship-opt.selected { background: #f9fafb; border-left: 3px solid #111827; padding-left: 13px; }
      .ckfp-ship-info { flex: 1; min-width: 0; }
      .ckfp-ship-title { display: block; font-size: 13.5px; font-weight: 600; color: #111827; line-height: 1.4; }
      .ckfp-ship-sub   { display: block; font-size: 12px; color: #6b7280; font-weight: 500; margin-top: 2px; }
      .ckfp-ship-price { text-align: right; flex-shrink: 0; }
      .ckfp-ship-was   { display: block; font-size: 11px; text-decoration: line-through; color: #9ca3af; }
      .ckfp-ship-free  { display: block; font-size: 13px; font-weight: 700; color: #16a34a; }
      .ckfp-ship-cost  { display: block; font-size: 13px; font-weight: 700; color: #111827; }

      /* ── Payment section ── */
      .ckfp-pay-safe { font-size: 12.5px; color: #6b7280; font-weight: 500; margin: 0 0 12px; }
      .ckfp-pay-card { border: 1.5px solid #d1d5db; border-radius: 10px; overflow: hidden; margin-bottom: 8px; background: #fff; transition: border-color .15s; }
      .ckfp-pay-card.selected { border-color: #111827; }
      .ckfp-pay-card-hdr { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; }
      .ckfp-pay-card-hdr input[type="radio"] { width: 17px; height: 17px; accent-color: #111827; flex-shrink: 0; cursor: pointer; margin: 0; }
      .ckfp-pay-card-logos { display: flex; align-items: center; gap: 6px; flex: 1; flex-wrap: wrap; }
      .ckfp-logo-img { display: block; border-radius: 4px; object-fit: contain; }
      .ckfp-pay-card-lbl { font-size: 13.5px; font-weight: 600; color: #111827; margin-right: 4px; }
      .ckfp-pay-more { font-size: 11px; font-weight: 800; color: #6b7280; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 1px 5px; }
      .ckfp-pay-chev { flex-shrink: 0; transition: transform .2s; }
      .ckfp-pay-chev.open { transform: rotate(180deg); }
      .ckfp-pay-card-body { padding: 12px 16px 14px; border-top: 1px solid #e5e7eb; font-size: 13px; font-weight: 500; color: #6b7280; line-height: 1.6; }

      /* ── Sticky footer ── */
      .ckfp-sticky {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;
        background: #fff; border-top: 1px solid #e5e7eb;
        box-shadow: 0 -4px 24px rgba(0,0,0,.10);
        padding: 12px 20px env(safe-area-inset-bottom, 16px);
      }
      @media (min-width: 900px) { .ckfp-sticky { max-width: 880px; left: 50%; transform: translateX(-50%); border-radius: 16px 16px 0 0; } }
      .ckfp-sticky-inner { display: flex; flex-direction: column; gap: 8px; max-width: 500px; margin: 0 auto; }

      /* Resumen desplegable sticky */
      .ckfp-sticky-summary {
        border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 10px;
        display: flex; flex-direction: column; gap: 8px;
        animation: ckfpIn .18s ease both;
      }
      .ckfp-sticky-sum-item { display: flex; align-items: center; gap: 10px; }
      .ckfp-sticky-sum-img-wrap { position: relative; flex-shrink: 0; }
      .ckfp-sticky-sum-img { width: 38px; height: 38px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(0,0,0,.08); display: block; }
      .ckfp-sticky-sum-qty {
        position: absolute; top: -5px; right: -5px;
        background: #6b7280; color: #fff; border-radius: 999px;
        width: 16px; height: 16px; font-size: 9px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
      }
      .ckfp-sticky-sum-name { flex: 1; font-size: 12px; font-weight: 500; color: #374151; line-height: 1.3; }
      .ckfp-sticky-sum-price { font-size: 12px; font-weight: 600; color: #111827; white-space: nowrap; }
      .ckfp-sticky-sum-rows { display: flex; flex-direction: column; gap: 4px; padding-top: 6px; border-top: 1px solid #f3f4f6; }
      .ckfp-sticky-sum-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 500; color: #6b7280; }

      /* Fila 1: thumb + Total + precio */
      .ckfp-sticky-row1 { display: flex; align-items: center; gap: 12px; }
      .ckfp-sticky-row1--btn { cursor: pointer; }
      .ckfp-sticky-thumb-wrap { flex-shrink: 0; }
      .ckfp-sticky-thumb { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; border: 1px solid rgba(0,0,0,.08); display: block; }
      .ckfp-sticky-mid { display: flex; flex-direction: column; flex: 1; min-width: 0; }
      .ckfp-sticky-label { font-size: 14px; font-weight: 700; color: #111827; line-height: 1.2; }
      .ckfp-sticky-count { font-size: 11.5px; color: #9ca3af; font-weight: 500; margin-top: 2px; }
      .ckfp-sticky-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
      .ckfp-sticky-currency { font-size: 11px; font-weight: 700; color: #9ca3af; align-self: flex-start; margin-top: 3px; }
      .ckfp-sticky-amount { font-size: 18px; font-weight: 800; color: #111827; letter-spacing: -.02em; }

      /* Fila 2: ahorro */
      .ckfp-sticky-savings-row {
        display: flex; align-items: center; gap: 6px;
        font-size: 12px; font-weight: 600; color: #64748b;
        padding: 4px 0 2px;
      }
      .ckfp-sticky-savings-row strong { font-weight: 800; color: #111827; }

      /* ── Pay button ── */
      .ckfp-btn-pay {
        display: block; width: 100%; padding: 15px 20px;
        border: none; border-radius: 10px; cursor: pointer; text-align: center; text-decoration: none;
        background: #111827; color: #fff; font-size: 15px; font-weight: 800; font-family: inherit;
        transition: background .15s, transform .1s, box-shadow .1s;
        box-shadow: 0 6px 20px rgba(0,0,0,.22);
      }
      .ckfp-btn-pay:hover:not(:disabled):not(.loading) { background: #1f2937; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,.28); }
      .ckfp-btn-pay:active:not(:disabled) { transform: scale(.98); }
      .ckfp-btn-pay:disabled, .ckfp-btn-pay.loading { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }

      /* ── Privacy link ── */
      .ckfp-privacy-link { font-size: 11.5px; color: #9ca3af; text-align: center; text-decoration: underline; display: block; font-weight: 600; }
      .ckfp-privacy-link:hover { color: #374151; }

      /* ── Free shipping banner ── */
      .ckfp-free-shipping-banner {
        display: flex; align-items: center; gap: 10px;
        background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;
        padding: 12px 16px; margin-bottom: 24px;
        font-size: 14px; font-weight: 500; color: #166534;
      }
      .ckfp-fsb-icon { font-size: 20px; line-height: 1; }
      .ckfp-fsb-text { color: #166534; }
      .ckfp-fsb-text strong { font-weight: 700; }

      /* ── MP trust block ── */
      .ckfp-mp-trust { padding: 4px 0 2px; }
      .ckfp-mp-trust-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
      .ckfp-mp-trust-logo { height: 24px; width: auto; }
      .ckfp-mp-trust-tagline { font-size: 12.5px; color: #4b5563; font-weight: 500; }
      .ckfp-mp-trust-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
      .ckfp-mp-trust-badge { font-size: 12px; font-weight: 600; color: #374151; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 10px; }
      .ckfp-mp-trust-cuotas { font-size: 13px; color: #374151; }
      .ckfp-mp-trust-cuotas strong { color: #009ee3; }

      /* ── Success ── */
      .ckfp-success { display: flex; justify-content: center; padding: 40px 20px; }
      .ckfp-success-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px 24px; max-width: 460px; width: 100%; text-align: center; }
      .ckfp-success-icon { font-size: 52px; margin-bottom: 12px; }
      .ckfp-success-title { font-size: 24px; font-weight: 900; color: #111827; margin: 0 0 14px; }
      .ckfp-success-body { font-size: 14px; color: #374151; line-height: 1.7; margin-bottom: 20px; }
      .ckfp-success-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 16px; margin-top: 12px; text-align: left; font-weight: 600; }
      .ckfp-success-actions { display: flex; flex-direction: column; gap: 12px; align-items: center; }
      .ckfp-link { font-size: 13px; font-weight: 700; color: #111827; text-decoration: underline; }
      .ckfp-link.muted { color: #9ca3af; }

      /* ── Empty ── */
      .ckfp-empty { text-align: center; padding: 60px 20px; }
      .ckfp-empty h2 { font-size: 20px; font-weight: 800; color: #374151; margin: 0 0 16px; }

      /* ── MP Overlay ── */
      .ckfp-mp-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.65); display: flex; align-items: center; justify-content: center; padding: 20px; }
      .ckfp-mp-card { background: #fff; border-radius: 20px; padding: 36px 28px 32px; max-width: 360px; width: 100%; text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,.25); }
      .ckfp-mp-logo-wrap { margin: 0 auto 16px; display: inline-flex; }
      .ckfp-mp-title { font-size: 20px; font-weight: 900; color: #0b1220; margin: 0 0 8px; }
      .ckfp-mp-sub { font-size: 13.5px; font-weight: 600; color: #64748b; margin: 0 0 20px; line-height: 1.5; }
      .ckfp-mp-bar-track { width: 100%; height: 4px; background: #e5e7eb; border-radius: 99px; overflow: hidden; margin-bottom: 16px; }
      .ckfp-mp-bar { height: 100%; background: #009ee3; border-radius: 99px; animation: ckfpMpBar 2.5s ease forwards; }
      .ckfp-mp-note { font-size: 12px; font-weight: 600; color: #94a3b8; margin: 0; }
    `}</style>
    </>
  );
}
