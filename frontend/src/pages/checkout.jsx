// src/pages/checkout.jsx
// Checkout fullpage — 3 pasos, mobile-first, estilo TiendaNube
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api, { warmUpApi } from "../services/api";
import CardPaymentBrick from "../components/CardPaymentBrick.jsx";
import { getStoredAuth } from "../utils/auth";
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";

// ─── Constantes ────────────────────────────────────────────────────────────
const PROVINCES = [
  "Buenos Aires","CABA","Catamarca","Chaco","Chubut","Córdoba","Corrientes",
  "Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones",
  "Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe",
  "Santiago del Estero","Tierra del Fuego","Tucumán",
];

const INITIAL_FORM = {
  nombre: "", email: "", tel: "",
  direccion: "", extra: "",
  ciudad: "", provincia: "Buenos Aires", cp: "",
  dni: "",
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function money(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}
function onlyDigits(s) { return String(s || "").replace(/[^\d]/g, ""); }
function sanitizePhone(p) { return String(p || "").replace(/[^\d+]/g, ""); }

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

function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim()); }

// ─── Progress bar ───────────────────────────────────────────────────────────
function ProgressBar({ step, isCaba }) {
  const labels = ["Información", "Envío", "Pago"];
  return (
    <div className="ckfp-progress" role="list" aria-label="Pasos del checkout">
      {labels.map((label, i) => {
        const n = i + 1;
        const isDone = step > n || (!isCaba && n === 2 && step === 3);
        const isActive = step === n && !(step === 3 && !isCaba && n === 2);
        const isSkip = !isCaba && n === 2;
        return (
          <Fragment key={n}>
            <div className="ckfp-step" role="listitem" aria-current={isActive ? "step" : undefined}>
              <div className={`ckfp-step-circle ${isDone ? "done" : isActive ? "active" : ""}`}>
                {isDone ? "✓" : n}
              </div>
              <span className={`ckfp-step-label ${isDone ? "done" : isActive ? "active" : ""} ${isSkip ? "skip" : ""}`}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div className={`ckfp-connector ${isDone ? "done" : ""}`} aria-hidden="true" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ─── Resumen del pedido ─────────────────────────────────────────────────────
function OrderSummary({ items, calcItemTotal, updateQty, removeItem, totalPrice, couponDiscount, appliedCoupon, finalTotal, onApplyCoupon, onRemoveCoupon, couponInput, setCouponInput, couponError, applyingCoupon, clearCart, showEdit = true }) {
  const [couponOpen, setCouponOpen] = useState(false);
  const fullTotal = items.reduce((a, it) => a + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0);
  const promoSavings = Math.max(0, fullTotal - totalPrice);
  const promoPct = fullTotal > 0 ? Math.round((promoSavings / fullTotal) * 100) : 0;

  return (
    <div className="ckfp-summary">
      <div className="ckfp-summary-head">
        <h3 className="ckfp-summary-title">Resumen del pedido</h3>
        {showEdit && (
          <button type="button" className="ckfp-summary-clear"
            onClick={() => { if (window.confirm("¿Seguro que querés eliminar tu pedido? Esta acción no se puede deshacer.")) clearCart(); }}>
            Vaciar
          </button>
        )}
      </div>

      {promoSavings > 0 && (
        <div className="ckfp-promo-badge">🔥 {promoPct}% OFF aplicado</div>
      )}

      <div className="ckfp-items">
        {items.map((item, i) => {
          const thumb = item.imageUrl || item.image || null;
          const itemTotal = calcItemTotal(item);
          const isFixed = Boolean(item.bundleTotal);
          return (
            <div key={i} className="ckfp-item">
              <div className="ckfp-item-img">
                {thumb
                  ? <img src={thumb} alt={item.name} />
                  : <span className="ckfp-item-ph">📦</span>}
                <span className="ckfp-item-qty-badge">{item.quantity}</span>
              </div>
              <div className="ckfp-item-info">
                <div className="ckfp-item-name">{item.name}</div>
                {isFixed ? (
                  <div className="ckfp-item-fixed-qty">Cant: {item.quantity}</div>
                ) : (
                  <div className="ckfp-qty-row">
                    <button type="button" className="ckfp-qty-btn"
                      onClick={() => item.quantity <= 1 ? removeItem(item.productId) : updateQty(item.productId, item.quantity - 1)}>
                      {item.quantity <= 1 ? "×" : "−"}
                    </button>
                    <span className="ckfp-qty-num">{item.quantity}</span>
                    <button type="button" className="ckfp-qty-btn"
                      onClick={() => updateQty(item.productId, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                )}
              </div>
              <div className="ckfp-item-price">
                {item.compareAtPrice && item.compareAtPrice > itemTotal && (
                  <div className="ckfp-item-was">{money(item.compareAtPrice)}</div>
                )}
                <div className={`ckfp-item-total ${item.compareAtPrice && item.compareAtPrice > itemTotal ? "sale" : ""}`}>
                  {money(itemTotal)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ckfp-totals">
        <div className="ckfp-total-row">
          <span>Subtotal</span>
          <span>{money(totalPrice)}</span>
        </div>
        <div className="ckfp-total-row green">
          <span>Envío</span>
          <span>GRATIS</span>
        </div>
        {promoSavings > 0 && (
          <div className="ckfp-total-row green">
            <span>Descuento promo</span>
            <span>−{money(promoSavings)}</span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="ckfp-total-row green">
            <span>Cupón {appliedCoupon?.code}</span>
            <span>−{money(couponDiscount)}</span>
          </div>
        )}

        <div className="ckfp-coupon-area">
          {!appliedCoupon ? (
            <>
              <button type="button" className="ckfp-coupon-toggle" onClick={() => setCouponOpen(o => !o)}>
                {couponOpen ? "▲ Ocultar código" : "¿Tenés un código de descuento?"}
              </button>
              <div className={`ckfp-coupon-body${couponOpen ? " open" : ""}`}>
                <div className="ckfp-coupon-row">
                  <input
                    type="text"
                    className="ckfp-coupon-inp"
                    placeholder="Cupón de descuento"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onApplyCoupon(); } }}
                    autoComplete="off"
                    style={{ minWidth: 0, flex: 1 }}
                  />
                  <button type="button" className="ckfp-coupon-btn" onClick={onApplyCoupon} disabled={applyingCoupon}>
                    {applyingCoupon ? "..." : "Aplicar"}
                  </button>
                </div>
                {couponError && <div className="ckfp-coupon-err">{couponError}</div>}
              </div>
            </>
          ) : (
            <div className="ckfp-coupon-applied">
              <span>🎟️ {appliedCoupon.code} (−{appliedCoupon.pct || appliedCoupon.value}%)</span>
              <button type="button" className="ckfp-coupon-remove" onClick={onRemoveCoupon}>Quitar</button>
            </div>
          )}
        </div>

        <div className="ckfp-total-final">
          <span>Total</span>
          <span>{money(finalTotal)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────
export default function Checkout() {
  const { user } = getStoredAuth();
  const isLogged = Boolean(user?.email);
  const { items, totalPrice, clearCart, calcItemTotal, updateQty, removeItem } = useCart();
  const isCartEmpty = !Array.isArray(items) || items.length === 0;

  const storeName = import.meta.env.VITE_STORE_NAME || "BoomHausS";
  const whatsapp  = import.meta.env.VITE_WHATSAPP_NUMBER || "";

  // ── Paso ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(() => rSession("ck_step", 0));
  useEffect(() => { wSession("ck_step", step); }, [step]);

  // ── Formulario ────────────────────────────────────────────────────────────
  const [form, setForm] = useState(() => {
    const saved = rSession("ck_form", {});
    return {
      ...INITIAL_FORM, ...saved,
      nombre: isLogged && user?.name  ? user.name  : (saved.nombre || ""),
      email:  isLogged && user?.email ? user.email : (saved.email  || ""),
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

  // validación de campo individual para mostrar error en tiempo real
  function fieldError(key) {
    if (!touched[key]) return "";
    const val = String(form[key] || "").trim();
    switch (key) {
      case "nombre": return val.length < 2 ? "Nombre requerido." : "";
      case "email": return !validateEmail(val) ? "Email inválido." : "";
      case "tel": return onlyDigits(val).length < 8 ? "Ingresá un teléfono válido." : "";
      case "direccion": return val.length < 4 ? "Dirección requerida." : "";
      case "ciudad": return val.length < 2 ? "Ciudad requerida." : "";
      case "cp": return onlyDigits(val).length < 4 ? "Código postal inválido." : "";
      case "dni": {
        const d = onlyDigits(val);
        return d.length < 7 || d.length > 8 ? "DNI inválido (7 u 8 dígitos)." : "";
      }
      default: return "";
    }
  }
  function fieldOk(key) { return touched[key] && fieldError(key) === "" && String(form[key] || "").trim().length > 0; }

  // ── Envío ─────────────────────────────────────────────────────────────────
  const isCaba = form.provincia === "CABA";
  const [shippingMethod, setShippingMethod] = useState("correo_argentino");
  const isCod = shippingMethod === "caba_cod";

  // ── Pago ──────────────────────────────────────────────────────────────────
  const [onlinePayMethod, setOnlinePayMethod] = useState("mercadopago");
  const [cardPaymentDone, setCardPaymentDone] = useState(false);

  // ── Cupón ─────────────────────────────────────────────────────────────────
  const [couponInput,    setCouponInput]    = useState("");
  const [appliedCoupon,  setAppliedCoupon]  = useState(null);
  const [couponError,    setCouponError]    = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // ── Estados de pedido ─────────────────────────────────────────────────────
  const [loading,     setLoading]     = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error,       setError]       = useState("");
  const [orderData,   setOrderData]   = useState(null);

  // summary mobile
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [showShipToast, setShowShipToast] = useState(false);

  const errorRef = useRef(null);
  function showError(msg) {
    setError(msg);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }

  // ── Totales ───────────────────────────────────────────────────────────────
  const totalItems = useMemo(() => items.reduce((a, it) => a + (Number(it.quantity) || 0), 0), [items]);
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
  const finalTotal = Math.max(0, totalPrice - couponDiscount);

  const shippingAddress = useMemo(() => [
    form.direccion,
    form.extra,
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

  // scroll top al cambiar de paso
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  // ── Captura abandonada ────────────────────────────────────────────────────
  function captureAbandoned() {
    const phone = form.tel.trim();
    const email = form.email.trim();
    if (!phone && !email) return;
    if (!items.length) return;
    api.post("/abandoned-cart", {
      phone, email, name: form.nombre,
      address: shippingAddress,
      city: form.ciudad, province: form.provincia, postalCode: form.cp,
      items: items.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, imageUrl: i.imageUrl || null })),
      total: finalTotal, totalItems,
      step: `checkout_step${step}`,
      landingSource: window.location.pathname,
    }).catch(() => {});
  }

  // ── Validación paso 1 ─────────────────────────────────────────────────────
  function validateStep1() {
    const required = ["nombre", "email", "tel", "direccion", "ciudad", "cp", "dni"];
    const errs = {};
    required.forEach(k => {
      const e = fieldError(k) || (String(form[k] || "").trim() === "" ? "Campo requerido." : "");
      if (e) errs[k] = e;
    });
    const touched2 = {};
    required.forEach(k => { touched2[k] = true; });
    setTouched(t => ({ ...t, ...touched2 }));
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Navegación entre pasos ────────────────────────────────────────────────
  function handleStep1Next() {
    if (!validateStep1()) return;
    captureAbandoned();
    if (isCaba) {
      setStep(2);
    } else {
      setShippingMethod("correo_argentino");
      setShowShipToast(true);
      setTimeout(() => setShowShipToast(false), 3200);
      setStep(3);
    }
  }

  function handleStep2Next() {
    setStep(3);
  }

  function goBack() {
    if (step === 3 && isCaba) setStep(2);
    else if (step === 3 || step === 2) setStep(1);
    else if (step === 1) setStep(0);
  }

  // ── Cupón ─────────────────────────────────────────────────────────────────
  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError("Ingresá un cupón."); return; }
    setApplyingCoupon(true); setCouponError("");
    try {
      const res = await api.post("/coupons/validate", { code, cartTotal: totalPrice });
      if (res.data?.ok) {
        setAppliedCoupon({ ...res.data.data, code });
        setCouponError("");
      } else {
        setCouponError(res.data?.message || "Cupón inválido.");
        setAppliedCoupon(null);
      }
    } catch (err) {
      // Fallback local si el backend no tiene el endpoint
      const LOCAL = { "DESCUENTO10": 10, "PROMO15": 15, "WELCOME20": 20, "VIP25": 25 };
      const pct = LOCAL[code];
      if (pct) { setAppliedCoupon({ code, pct }); setCouponError(""); }
      else setCouponError(err?.response?.data?.message || "Cupón inválido o expirado.");
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() { setAppliedCoupon(null); setCouponInput(""); setCouponError(""); }

  // ── Construir body de orden ───────────────────────────────────────────────
  function buildOrderBody(overrides = {}) {
    return {
      clientOrderId:   getOrCreateClientOrderId(),
      customerName:    form.nombre.trim(),
      customerEmail:   form.email.trim(),
      customerDni:     onlyDigits(form.dni),
      customerPhone:   form.tel.trim(),
      shippingAddress,
      shippingMethod:  isCod ? "caba_cod" : shippingMethod,
      paymentMethod:   isCod ? "cod" : (onlinePayMethod === "card" ? "card" : "mercadopago"),
      notes:           appliedCoupon ? `Cupón: ${appliedCoupon.code}` : "",
      coupon:          appliedCoupon?.code || null,
      couponDiscount,
      total:           finalTotal,
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

  // ── Submit principal (MP o COD) ───────────────────────────────────────────
  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault();
    if (isCartEmpty) { showError("Tu carrito está vacío."); return; }

    track("AddPaymentInfo", { value: Number(finalTotal) || 0, currency: "ARS", content_ids: contentIds, content_type: "product", payment_type: isCod ? "cod" : onlinePayMethod });
    setLoading(true); setError("");

    try {
      const res = await api.post("/orders", buildOrderBody());
      if (!res?.data) { showError("No se pudo procesar el pedido."); return; }

      if (isCod) {
        clearClientOrderId();
        const data = res.data.data || res.data;
        setOrderData(data);
        track("Purchase", { value: Number(finalTotal), currency: "ARS", num_items: totalItems, content_ids: contentIds, content_type: "product" });
        clearCart();
        wSession("ck_step", 1); wSession("ck_form", null);
        return;
      }

      const isProd = import.meta.env.MODE === "production";
      const url = isProd ? res.data.init_point : (res.data.sandbox_init_point || res.data.init_point);
      if (url) {
        clearClientOrderId();
        track("Purchase", { value: Number(finalTotal), currency: "ARS", num_items: totalItems, content_ids: contentIds, content_type: "product" });
        setRedirecting(true);
        setTimeout(() => { window.location.href = url; }, 1200);
        return;
      }

      showError("Hubo un error generando el link de Mercado Pago. Intentá de nuevo.");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Error al procesar el pedido.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Tarjeta ───────────────────────────────────────────────────────────────
  function handleCardBeforeSubmit() {
    if (isCartEmpty) { showError("Tu carrito está vacío."); return false; }
    if (!form.nombre.trim() || !shippingAddress.trim()) { showError("Completá tus datos de contacto y dirección antes de pagar."); return false; }
    return true;
  }

  async function handleCardSuccess(paymentData) {
    setLoading(true);
    try {
      await api.post("/orders", buildOrderBody({ paymentMethod: "card", paymentId: paymentData.id }));
      clearClientOrderId();
      track("Purchase", { value: Number(finalTotal), currency: "ARS", num_items: totalItems, content_ids: contentIds, content_type: "product" });
      clearCart();
      wSession("ck_step", 1); wSession("ck_form", null);
      setCardPaymentDone(true);
    } catch (err) {
      showError("Pago aprobado, pero hubo un error al registrar el pedido. Contactate por WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  // ── URLs de WA ────────────────────────────────────────────────────────────
  const waUrl = useMemo(() => {
    if (!whatsapp) return null;
    const orderId = orderData?._id || orderData?.orderId || "";
    const msg = orderId
      ? `Hola! 👋 Confirmo la entrega del pedido #${orderId}. Pago en efectivo o transferencia al recibir.`
      : `Hola! 👋 Confirmo la entrega con ${storeName}.`;
    return `https://wa.me/${sanitizePhone(whatsapp)}?text=${encodeURIComponent(msg)}`;
  }, [whatsapp, orderData, storeName]);

  // ══════════════════════════════════════════════════════════════════════════
  // PANTALLAS DE ÉXITO
  // ══════════════════════════════════════════════════════════════════════════
  if (cardPaymentDone || (orderData && isCod)) {
    return (
      <div className="ckfp-shell">
        <header className="ckfp-header">
          <Link to="/" className="ckfp-logo">{storeName}</Link>
        </header>
        <main className="ckfp-success">
          <div className="ckfp-success-card">
            <div className="ckfp-success-icon">🎉</div>
            <h1 className="ckfp-success-title">
              {cardPaymentDone ? "¡Pago aprobado!" : "¡Gracias por tu pedido!"}
            </h1>
            <div className="ckfp-success-body">
              {isCod ? (
                <>
                  <p>Tu pedido llega en <strong>24 a 48 hs hábiles</strong> (solo CABA). Abonás en la puerta.</p>
                  <div className="ckfp-success-box">
                    ✅ Te confirmamos la entrega por <strong>WhatsApp</strong> o teléfono.<br />
                    💵 Podés pagar en <strong>efectivo</strong> o <strong>transferencia</strong> en el lugar.
                  </div>
                </>
              ) : (
                <>
                  <p>Tu pedido está confirmado y en preparación.</p>
                  <div className="ckfp-success-box">
                    ✅ Recibirás el seguimiento por <strong>WhatsApp</strong> o email.<br />
                    🚚 Tu pedido llega en <strong>1 a 3 días hábiles</strong>.
                  </div>
                </>
              )}
            </div>
            <div className="ckfp-success-actions">
              {waUrl && (
                <a className="ckfp-btn-primary" href={waUrl} target="_blank" rel="noreferrer">
                  {isCod ? "Confirmar por WhatsApp →" : "Contactar por WhatsApp →"}
                </a>
              )}
              <Link to="/my-orders" className="ckfp-link">Ver mis pedidos</Link>
              <Link to="/" className="ckfp-link muted">Seguir comprando</Link>
            </div>
          </div>
        </main>
        <Styles />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CARRITO VACÍO
  // ══════════════════════════════════════════════════════════════════════════
  if (isCartEmpty) {
    return (
      <div className="ckfp-shell">
        <header className="ckfp-header">
          <Link to="/" className="ckfp-logo">{storeName}</Link>
        </header>
        <main className="ckfp-empty">
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🛒</div>
          <h2>Tu carrito está vacío</h2>
          <Link to="/products" className="ckfp-btn-primary" style={{ display: "inline-block", marginTop: 16 }}>
            Ver productos →
          </Link>
        </main>
        <Styles />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // OVERLAY MERCADO PAGO
  // ══════════════════════════════════════════════════════════════════════════
  const mpOverlay = redirecting && (
    <div className="ckfp-mp-overlay">
      <div className="ckfp-mp-card">
        <div className="ckfp-mp-logo">
          <svg viewBox="0 0 40 40" width="52" height="52" fill="none">
            <rect width="40" height="40" rx="12" fill="#009ee3"/>
            <path d="M10.5 20.8c0-3.4 2.2-6.2 5.2-6.2 1.6 0 2.7.7 3.3 1.5.6-.8 1.7-1.5 3.3-1.5 3 0 5.2 2.8 5.2 6.2 0 4.8-5 9.2-8.5 11.2-3.5-2-8.5-6.4-8.5-11.2z" fill="#fff"/>
          </svg>
        </div>
        <h2 className="ckfp-mp-title">Conectando con Mercado Pago</h2>
        <p className="ckfp-mp-sub">Estamos generando tu link de pago seguro</p>
        <div className="ckfp-mp-bar-track"><div className="ckfp-mp-bar" /></div>
        <div className="ckfp-mp-trust">
          {["🔒 Pago seguro", "🛡️ Datos encriptados", "✅ Compra protegida"].map(t => (
            <span key={t} className="ckfp-mp-trust-item">{t}</span>
          ))}
        </div>
        <p className="ckfp-mp-note">No cerrés esta pantalla — serás redirigido en segundos</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="ckfp-shell">
      {mpOverlay}
      {showShipToast && (
        <div className="ckfp-ship-toast">
          ✅ Envío gratis calculado — llega en 2 a 5 días hábiles
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="ckfp-header">
        <Link to="/" className="ckfp-logo">{storeName}</Link>
        <div className="ckfp-secure-badge">🔒 Compra segura</div>
      </header>

      {/* ── PROGRESS BAR (oculto en step 0) ── */}
      {step > 0 && (
        <div className="ckfp-progress-wrap">
          <ProgressBar step={step} isCaba={isCaba} />
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="ckfp-main">

        {/* ══ PASO 0 — CARRITO / RESUMEN ═══════════════════════════════════ */}
        {step === 0 && (
          <div className="ckfp-step-wrap">
            <h2 className="ckfp-step-heading">Tu pedido</h2>

            {/* Items */}
            <div className="ckfp-cart0-items">
              {items.map((item, idx) => {
                const thumb = item.imageUrl || item.image || null;
                const itemTotal = calcItemTotal(item);
                const origTotal = item.bundleTotal && item.compareAtPrice
                  ? Number(item.compareAtPrice)
                  : (Number(item.price) || 0) * (Number(item.quantity) || 0);
                const hasDisc = origTotal > itemTotal;
                return (
                  <div key={idx} className="ckfp-cart0-item">
                    <div className="ckfp-cart0-img-wrap">
                      {thumb
                        ? <img src={thumb} alt={item.name} className="ckfp-cart0-img" />
                        : <span className="ckfp-cart0-ph">📦</span>}
                      <span className="ckfp-cart0-qty-badge">{item.quantity}</span>
                    </div>
                    <div className="ckfp-cart0-info">
                      <div className="ckfp-cart0-name">{item.name}</div>
                      {item.gifts?.map((g, gi) => (
                        <div key={gi} className="ckfp-cart0-gift">🎁 {g} · <strong>GRATIS</strong></div>
                      ))}
                    </div>
                    <div className="ckfp-cart0-price">
                      {hasDisc && <div className="ckfp-cart0-was">{money(origTotal)}</div>}
                      <div className={`ckfp-cart0-total${hasDisc ? " sale" : ""}`}>{money(itemTotal)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Envío gratis */}
            <div className="ckfp-cart0-ship-row">
              <span>🚚 Envío</span>
              <span className="ckfp-cart0-ship-free">GRATIS</span>
            </div>

            {/* Ahorro badge */}
            {savings > 0 && (
              <div className="ckfp-cart0-savings">
                🎉 ¡Ahorrás {money(savings)} en este pedido!
              </div>
            )}

            {/* Total */}
            <div className="ckfp-cart0-total-row">
              <span>Total</span>
              <div>
                {savings > 0 && <span className="ckfp-cart0-total-was">{money(fullPrice)}</span>}
                <span className="ckfp-cart0-total-final">{money(finalTotal)}</span>
              </div>
            </div>

            {/* Trust */}
            <div className="ckfp-trust-row" style={{ marginTop: 16, marginBottom: 0 }}>
              {["🔒 Compra segura", "🛡️ Garantía 30 días", "✅ +500 clientes"].map(t => (
                <span key={t} className="ckfp-trust-item">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* ══ PASO 1 — INFORMACIÓN ══════════════════════════════════════════ */}
        {step === 1 && (
          <div className="ckfp-step-wrap">
            <button type="button" className="ckfp-back" onClick={goBack}>← Volver al carrito</button>
            <h2 className="ckfp-step-heading">Información de contacto y envío</h2>

            {items.length > 0 && (
              <div className="ckfp-product-preview">
                {(items[0].imageUrl || items[0].image) && (
                  <img src={items[0].imageUrl || items[0].image} alt={items[0].name} className="ckfp-product-preview-img" />
                )}
                <div className="ckfp-product-preview-info">
                  <div className="ckfp-product-preview-name">{items[0].name}</div>
                  <div className="ckfp-product-preview-prices">
                    <span className="ckfp-product-preview-final">{money(calcItemTotal(items[0]))}</span>
                    {items[0].compareAtPrice && Number(items[0].compareAtPrice) > calcItemTotal(items[0]) && (
                      <span className="ckfp-product-preview-was">{money(items[0].compareAtPrice)}</span>
                    )}
                  </div>
                  <span className="ckfp-product-preview-ship">🚚 Envío gratis a todo el país</span>
                </div>
              </div>
            )}

            {error && (
              <div ref={errorRef} className="ckfp-error-box">⚠️ {error}</div>
            )}

            <form onSubmit={e => { e.preventDefault(); handleStep1Next(); }} noValidate>
              <div className="ckfp-trust-row ckfp-trust-top">
                {["🔒 Compra segura", "🚚 Envío gratis", "🛡️ Garantía 30 días"].map(t => (
                  <span key={t} className="ckfp-trust-item">{t}</span>
                ))}
              </div>
              <div className="ckfp-section-title">Datos de contacto</div>

              {/* Nombre */}
              <div className="ckfp-field">
                <label className="ckfp-label" htmlFor="ck-nombre">
                  Nombre y apellido *
                </label>
                <input
                  id="ck-nombre"
                  className={`ckfp-input ${fieldError("nombre") ? "err" : ""} ${fieldOk("nombre") ? "ok" : ""}`}
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre completo"
                  value={form.nombre}
                  onChange={e => setF("nombre", e.target.value)}
                  onBlur={() => touch("nombre")}
                  disabled={isLogged}
                  required
                />
                {fieldError("nombre") && <span className="ckfp-field-err">{fieldError("nombre")}</span>}
                {fieldOk("nombre") && <span className="ckfp-field-ok">✓</span>}
              </div>

              {/* Email + Tel */}
              <div className="ckfp-row-2">
                <div className="ckfp-field">
                  <label className="ckfp-label" htmlFor="ck-email">Email *</label>
                  <input
                    id="ck-email"
                    className={`ckfp-input ${fieldError("email") ? "err" : ""} ${fieldOk("email") ? "ok" : ""}`}
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    value={form.email}
                    onChange={e => setF("email", e.target.value)}
                    onBlur={() => {
                      touch("email");
                      captureAbandoned();
                      const val = form.email.trim();
                      if (validateEmail(val)) {
                        try {
                          localStorage.setItem("checkout_partial_email", JSON.stringify({ email: val, timestamp: Date.now(), items }));
                          localStorage.setItem("checkout_started_at", String(Date.now()));
                        } catch (_) {}
                        console.log("[Recovery] Email captured:", val);
                      }
                    }}
                    disabled={isLogged}
                    required
                  />
                  <span className="ckfp-field-hint">📦 Seguimiento de tu pedido</span>
                  {fieldError("email") && <span className="ckfp-field-err">{fieldError("email")}</span>}
                </div>
                <div className="ckfp-field">
                  <label className="ckfp-label" htmlFor="ck-tel">Teléfono / WhatsApp *</label>
                  <input
                    id="ck-tel"
                    className={`ckfp-input ${fieldError("tel") ? "err" : ""} ${fieldOk("tel") ? "ok" : ""}`}
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="11 1234-5678"
                    value={form.tel}
                    onChange={e => setF("tel", e.target.value)}
                    onBlur={() => { touch("tel"); captureAbandoned(); }}
                    required
                  />
                  {fieldError("tel") && <span className="ckfp-field-err">{fieldError("tel")}</span>}
                </div>
              </div>

              {/* DNI */}
              <div className="ckfp-field">
                <label className="ckfp-label" htmlFor="ck-dni">DNI *</label>
                <input
                  id="ck-dni"
                  className={`ckfp-input ${fieldError("dni") ? "err" : ""} ${fieldOk("dni") ? "ok" : ""}`}
                  type="text"
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="Ej: 40123456"
                  value={form.dni}
                  onChange={e => setF("dni", onlyDigits(e.target.value))}
                  onBlur={() => touch("dni")}
                  maxLength={8}
                  required
                />
                <span className="ckfp-field-hint">🔒 Solo para emitir tu factura electrónica</span>
                {fieldError("dni") && <span className="ckfp-field-err">{fieldError("dni")}</span>}
              </div>

              <div className="ckfp-section-title" style={{ marginTop: 24 }}>Dirección de envío</div>

              {/* Dirección + Extra */}
              <div className="ckfp-field">
                <label className="ckfp-label" htmlFor="ck-dir">Calle y número *</label>
                <input
                  id="ck-dir"
                  className={`ckfp-input ${fieldError("direccion") ? "err" : ""} ${fieldOk("direccion") ? "ok" : ""}`}
                  type="text"
                  autoComplete="address-line1"
                  placeholder="Av. Corrientes 1234"
                  value={form.direccion}
                  onChange={e => setF("direccion", e.target.value)}
                  onBlur={() => touch("direccion")}
                  required
                />
                {fieldError("direccion") && <span className="ckfp-field-err">{fieldError("direccion")}</span>}
              </div>

              <div className="ckfp-field">
                <label className="ckfp-label" htmlFor="ck-extra">Piso / Depto (opcional)</label>
                <input
                  id="ck-extra"
                  className="ckfp-input"
                  type="text"
                  autoComplete="address-line2"
                  placeholder="Piso 3, Depto B"
                  value={form.extra}
                  onChange={e => setF("extra", e.target.value)}
                />
              </div>

              {/* Ciudad + CP */}
              <div className="ckfp-row-2">
                <div className="ckfp-field">
                  <label className="ckfp-label" htmlFor="ck-ciudad">Ciudad *</label>
                  <input
                    id="ck-ciudad"
                    className={`ckfp-input ${fieldError("ciudad") ? "err" : ""} ${fieldOk("ciudad") ? "ok" : ""}`}
                    type="text"
                    autoComplete="address-level2"
                    placeholder="Buenos Aires"
                    value={form.ciudad}
                    onChange={e => setF("ciudad", e.target.value)}
                    onBlur={() => touch("ciudad")}
                    required
                  />
                  {fieldError("ciudad") && <span className="ckfp-field-err">{fieldError("ciudad")}</span>}
                </div>
                <div className="ckfp-field">
                  <label className="ckfp-label" htmlFor="ck-cp">Código postal *</label>
                  <input
                    id="ck-cp"
                    className={`ckfp-input ${fieldError("cp") ? "err" : ""} ${fieldOk("cp") ? "ok" : ""}`}
                    type="text"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    placeholder="1414"
                    value={form.cp}
                    onChange={e => setF("cp", e.target.value)}
                    onBlur={() => touch("cp")}
                    required
                  />
                  {fieldError("cp") && <span className="ckfp-field-err">{fieldError("cp")}</span>}
                </div>
              </div>

              {/* Provincia */}
              <div className="ckfp-field">
                <label className="ckfp-label" htmlFor="ck-prov">Provincia *</label>
                <select
                  id="ck-prov"
                  className="ckfp-input ckfp-select"
                  autoComplete="address-level1"
                  value={form.provincia}
                  onChange={e => setF("provincia", e.target.value)}
                  required
                >
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <button type="submit" className="ckfp-btn-primary ckfp-cta" disabled={loading}>
                Continuar →
              </button>
            </form>

            {/* Trust */}
            <div className="ckfp-trust-row">
              {["🔒 Compra segura", "🚚 Envío gratis", "🛡️ Garantía 30 días"].map(t => (
                <span key={t} className="ckfp-trust-item">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* ══ PASO 2 — MÉTODO DE ENVÍO (solo CABA) ══════════════════════════ */}
        {step === 2 && (
          <div className="ckfp-step-wrap">
            <button type="button" className="ckfp-back" onClick={goBack}>← Volver</button>
            <h2 className="ckfp-step-heading">Método de envío</h2>

            <div className="ckfp-addr-preview">
              <span className="ckfp-addr-preview-label">Entregar en</span>
              <span className="ckfp-addr-preview-val">
                {form.direccion}{form.extra ? `, ${form.extra}` : ""} — {form.ciudad}, CABA {form.cp}
              </span>
              <button type="button" className="ckfp-addr-change" onClick={goBack}>Cambiar</button>
            </div>

            <div className="ckfp-ship-options">
              {[
                {
                  value: "correo_argentino",
                  icon: "🚚",
                  title: "Envío a domicilio",
                  sub: "Correo Argentino + Andreani · 2 a 4 días hábiles",
                  price: "GRATIS",
                },
                {
                  value: "caba_cod",
                  icon: "💵",
                  title: "Pagás al recibir",
                  sub: "Solo CABA · 24 a 48 hs hábiles · Efectivo o transferencia",
                  badge: "+ Confianza",
                  price: "GRATIS",
                },
                {
                  value: "retiro_oficina",
                  icon: "🏢",
                  title: "Retiro por oficina",
                  sub: "Crisólogo Larralde 2471, Saavedra, CABA",
                  price: "GRATIS",
                },
              ].map(opt => (
                <label key={opt.value} className={`ckfp-ship-opt ${shippingMethod === opt.value ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="shipping"
                    value={opt.value}
                    checked={shippingMethod === opt.value}
                    onChange={e => setShippingMethod(e.target.value)}
                  />
                  <span className="ckfp-ship-ico">{opt.icon}</span>
                  <div className="ckfp-ship-info">
                    <div className="ckfp-ship-title">
                      {opt.title}
                      {opt.badge && <span className="ckfp-ship-badge">{opt.badge}</span>}
                    </div>
                    <div className="ckfp-ship-sub">{opt.sub}</div>
                  </div>
                  <span className="ckfp-ship-price">{opt.price}</span>
                </label>
              ))}
            </div>

            <button type="button" className="ckfp-btn-primary ckfp-cta" onClick={handleStep2Next}>
              Continuar al pago →
            </button>
          </div>
        )}

        {/* ══ PASO 3 — PAGO ════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="ckfp-pay-layout">
            {/* Columna izquierda: pago */}
            <div className="ckfp-pay-col">
              <button type="button" className="ckfp-back" onClick={goBack}>← Volver</button>
              <h2 className="ckfp-step-heading">
                {isCod ? "Confirmar pedido" : "Método de pago"}
              </h2>

              {/* Banner no-CABA */}
              {!isCaba && (
                <div className="ckfp-free-ship-banner">
                  🚚 <strong>¡Envío gratis a todo el país!</strong><br />
                  <span>Tu pedido llega en 2 a 5 días hábiles via Andreani o Correo Argentino.</span>
                </div>
              )}

              {/* Dirección confirmada */}
              <div className="ckfp-addr-preview" style={{ marginBottom: 20 }}>
                <span className="ckfp-addr-preview-label">Enviar a</span>
                <span className="ckfp-addr-preview-val">{shippingAddress}</span>
                <button type="button" className="ckfp-addr-change" onClick={() => setStep(1)}>Cambiar</button>
              </div>

              {error && <div ref={errorRef} className="ckfp-error-box">⚠️ {error}</div>}

              {/* COD confirmation */}
              {isCod ? (
                <div className="ckfp-cod-box">
                  ✅ Abonás en efectivo o transferencia cuando te llegue el pedido.<br />
                  Solo disponible en CABA. Confirmamos la entrega por WhatsApp.
                </div>
              ) : (
                <div className="ckfp-pay-methods">
                  {/* MercadoPago */}
                  <label className={`ckfp-pay-opt ${onlinePayMethod === "mercadopago" ? "selected" : ""}`} onClick={() => setOnlinePayMethod("mercadopago")}>
                    <input type="radio" name="pay" value="mercadopago" checked={onlinePayMethod === "mercadopago"} onChange={() => setOnlinePayMethod("mercadopago")} />
                    <div className="ckfp-pay-info">
                      <div className="ckfp-pay-title" style={{ color: "#009ee3" }}>
                        Mercado Pago
                        <span className="ckfp-pay-rec-badge">Recomendado</span>
                      </div>
                      <div className="ckfp-pay-sub">Débito, crédito, dinero en cuenta y más. Hasta 12 cuotas.</div>
                    </div>
                    <svg viewBox="0 0 56 22" width="56" height="22" className="ckfp-mp-logo-inline">
                      <rect width="56" height="22" rx="4" fill="#009ee3"/>
                      <text x="50%" y="15" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="sans-serif">MercadoPago</text>
                    </svg>
                  </label>

                  {/* Tarjeta */}
                  <label className={`ckfp-pay-opt ${onlinePayMethod === "card" ? "selected" : ""}`} onClick={() => setOnlinePayMethod("card")}>
                    <input type="radio" name="pay" value="card" checked={onlinePayMethod === "card"} onChange={() => setOnlinePayMethod("card")} />
                    <div className="ckfp-pay-info">
                      <div className="ckfp-pay-title">
                        Tarjeta de crédito / débito
                        <span className="ckfp-pay-secure-badge">🔒 Seguro</span>
                      </div>
                      <div className="ckfp-pay-sub">Ingresá los datos de tu tarjeta directamente aquí.</div>
                      <div className="ckfp-card-brands">
                        {["VISA", "MC", "AMEX"].map(b => <span key={b} className="ckfp-card-brand">{b}</span>)}
                      </div>
                    </div>
                  </label>

                  {/* Brick de tarjeta */}
                  {onlinePayMethod === "card" && (
                    <div className="ckfp-card-brick-wrap">
                      <div className="ckfp-ssl-notice">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Tus datos están <strong>100% encriptados</strong> con SSL. Nunca guardamos los datos de tu tarjeta.
                      </div>
                      <CardPaymentBrick
                        amount={finalTotal}
                        onBeforeSubmit={handleCardBeforeSubmit}
                        onSuccess={handleCardSuccess}
                        onError={() => {}}
                        onSetError={msg => showError(msg)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Botón principal (MP o COD) */}
              {(isCod || onlinePayMethod === "mercadopago") && (
                <button
                  type="button"
                  className={`ckfp-btn-primary ckfp-cta ckfp-pay-btn ${loading || redirecting ? "loading" : ""}`}
                  onClick={handleSubmit}
                  disabled={loading || redirecting}
                >
                  {redirecting
                    ? "🔄 Conectando con Mercado Pago..."
                    : loading
                    ? "⏳ Procesando..."
                    : isCod
                    ? `Confirmar pedido · ${money(finalTotal)}`
                    : `Pagar ${money(finalTotal)} en Mercado Pago →`}
                </button>
              )}
              {!isCod && onlinePayMethod === "mercadopago" && finalTotal > 0 && (
                <p className="ckfp-installments-hint">
                  o 3 cuotas de {money(Math.round(finalTotal / 3))} sin interés
                </p>
              )}

              {/* Trust badges */}
              <div className="ckfp-pay-trust">
                {[
                  { ico: "🔒", l: "SSL seguro" },
                  { ico: "🚚", l: "Envío gratis" },
                  { ico: "⭐", l: "+500 clientes" },
                  { ico: "🛡️", l: "Garantía 30 días" },
                ].map(({ ico, l }) => (
                  <div key={l} className="ckfp-trust-badge">
                    <span>{ico}</span>
                    <span>{l}</span>
                  </div>
                ))}
              </div>

              {/* Logos de medios de pago */}
              <div className="ckfp-pay-logos">
                <span className="ckfp-pay-logo mp">MercadoPago</span>
                <span className="ckfp-pay-logo visa">VISA</span>
                <span className="ckfp-pay-logo mc">MC</span>
                <span className="ckfp-pay-logo amex">AMEX</span>
              </div>
            </div>

            {/* Columna derecha: resumen (desktop) / collapsible (mobile) */}
            <aside className="ckfp-aside">
              {/* Mobile: toggle */}
              <button type="button" className="ckfp-summary-toggle" onClick={() => setSummaryOpen(o => !o)}>
                <span>Resumen del pedido</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong>{money(finalTotal)}</strong>
                  <span className="ckfp-chevron" style={{ transform: summaryOpen ? "rotate(180deg)" : "none" }}>▼</span>
                </span>
              </button>
              <div className={`ckfp-aside-inner ${summaryOpen ? "open" : ""}`}>
                <OrderSummary
                  items={items}
                  calcItemTotal={calcItemTotal}
                  updateQty={updateQty}
                  removeItem={removeItem}
                  totalPrice={totalPrice}
                  couponDiscount={couponDiscount}
                  appliedCoupon={appliedCoupon}
                  finalTotal={finalTotal}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={handleRemoveCoupon}
                  couponInput={couponInput}
                  setCouponInput={setCouponInput}
                  couponError={couponError}
                  applyingCoupon={applyingCoupon}
                  clearCart={clearCart}
                  showEdit={true}
                />
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* ── STICKY MOBILE CTA (pasos 0, 1 y 3) ── */}
      {step === 0 && (
        <div className="ckfp-sticky-footer">
          <button type="button" className="ckfp-btn-primary ckfp-cta" onClick={() => setStep(1)}>
            Continuar con mis datos →
          </button>
          <div className="ckfp-sticky-sub">🔒 Pago seguro · Sin necesidad de cuenta</div>
        </div>
      )}
      {step === 1 && (
        <div className="ckfp-sticky-footer">
          <button type="button" className="ckfp-btn-primary ckfp-cta" onClick={handleStep1Next}>
            Continuar con el envío →
          </button>
        </div>
      )}
      {step === 3 && (isCod || onlinePayMethod === "mercadopago") && !isCartEmpty && (
        <div className="ckfp-sticky-footer">
          <button
            type="button"
            className={`ckfp-btn-primary ckfp-cta ${loading || redirecting ? "loading" : ""}`}
            onClick={handleSubmit}
            disabled={loading || redirecting}
          >
            {redirecting ? "🔄 Conectando..." : loading ? "⏳ Procesando..." : isCod ? `Confirmar · ${money(finalTotal)}` : `Pagar ${money(finalTotal)} →`}
          </button>
        </div>
      )}

      <Styles />
    </div>
  );
}

// ─── Estilos (scoped) ────────────────────────────────────────────────────────
function Styles() {
  return (
    <style>{`
      /* ── Shell ── */
      .ckfp-shell {
        min-height: 100vh;
        background: #f9fafb;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: #111827;
      }

      /* ── Header ── */
      .ckfp-header {
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .ckfp-logo {
        font-size: 1.4rem;
        font-weight: 900;
        letter-spacing: -0.04em;
        color: #111827;
        text-decoration: none;
        flex: 1;
        text-align: center;
      }
      .ckfp-secure-badge {
        font-size: .75rem;
        font-weight: 700;
        color: #6b7280;
        position: absolute;
        right: 20px;
      }

      /* ── Progress ── */
      .ckfp-progress-wrap {
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
        padding: 14px 20px;
      }
      .ckfp-progress {
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 360px;
        margin: 0 auto;
        gap: 0;
      }
      .ckfp-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }
      .ckfp-step-circle {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 900;
        background: #e5e7eb;
        color: #9ca3af;
        transition: background .2s, color .2s;
      }
      .ckfp-step-circle.active { background: #1B4D3E; color: #fff; }
      .ckfp-step-circle.done   { background: #16a34a; color: #fff; }
      .ckfp-step-label {
        font-size: 10px;
        font-weight: 700;
        color: #9ca3af;
        white-space: nowrap;
        transition: color .2s;
      }
      .ckfp-step-label.active { color: #1B4D3E; }
      .ckfp-step-label.done   { color: #16a34a; }
      .ckfp-step-label.skip   { opacity: .5; }
      .ckfp-connector {
        flex: 1;
        height: 2px;
        background: #e5e7eb;
        margin: 0 6px;
        margin-bottom: 14px;
        min-width: 24px;
        transition: background .3s;
      }
      .ckfp-connector.done { background: #16a34a; }

      /* ── Main ── */
      .ckfp-main {
        max-width: 1080px;
        margin: 0 auto;
        padding: 24px 16px 100px;
      }

      /* ── Step wrap (pasos 1 y 2) ── */
      .ckfp-step-wrap {
        max-width: 520px;
        margin: 0 auto;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 24px 20px;
      }
      .ckfp-step-heading {
        font-size: 1.15rem;
        font-weight: 900;
        color: #111827;
        margin: 0 0 20px;
        letter-spacing: -0.02em;
      }
      .ckfp-section-title {
        font-size: .78rem;
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: #6b7280;
        margin-bottom: 14px;
      }
      .ckfp-back {
        background: none;
        border: none;
        cursor: pointer;
        font-size: .85rem;
        font-weight: 700;
        color: #6b7280;
        padding: 0;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .ckfp-back:hover { color: #111827; }

      /* ── Campos ── */
      .ckfp-field {
        position: relative;
        margin-bottom: 14px;
      }
      .ckfp-label {
        display: block;
        font-size: .82rem;
        font-weight: 800;
        color: #374151;
        margin-bottom: 5px;
      }
      .ckfp-input {
        width: 100%;
        box-sizing: border-box;
        padding: 11px 14px;
        font-size: 15px;
        font-weight: 500;
        border: 1.5px solid #d1d5db;
        border-radius: 10px;
        background: #fff;
        color: #111827;
        outline: none;
        transition: border-color .16s, box-shadow .16s;
        -webkit-appearance: none;
        appearance: none;
      }
      .ckfp-input:focus {
        border-color: #1B4D3E;
        box-shadow: 0 0 0 3px rgba(27,77,62,.12);
      }
      .ckfp-input.err   { border-color: #dc2626 !important; }
      .ckfp-input.ok    { border-color: #16a34a; }
      .ckfp-select { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }
      .ckfp-field-err  { display: block; font-size: .78rem; font-weight: 700; color: #dc2626; margin-top: 4px; }
      .ckfp-field-hint { display: block; font-size: .75rem; font-weight: 600; color: #6b7280; margin-top: 4px; }
      .ckfp-field-ok   { position: absolute; right: 12px; top: 38px; color: #16a34a; font-size: 15px; pointer-events: none; }
      .ckfp-row-2      { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      @media (max-width: 420px) { .ckfp-row-2 { grid-template-columns: 1fr; } }

      /* ── Error box ── */
      .ckfp-error-box {
        background: #fef2f2;
        color: #dc2626;
        border: 1.5px solid #fca5a5;
        border-radius: 10px;
        padding: 12px 14px;
        font-size: .88rem;
        font-weight: 800;
        margin-bottom: 16px;
        animation: ckShake .4s ease;
      }
      @keyframes ckShake {
        0%,100% { transform: translateX(0); }
        20% { transform: translateX(-5px); }
        40% { transform: translateX(5px); }
        60% { transform: translateX(-3px); }
        80% { transform: translateX(3px); }
      }

      /* ── CTA button ── */
      .ckfp-btn-primary {
        display: block;
        width: 100%;
        padding: 14px 20px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #1B6D4F 0%, #1B4D3E 100%);
        color: #fff;
        font-size: 1rem;
        font-weight: 900;
        cursor: pointer;
        text-align: center;
        text-decoration: none;
        transition: transform .12s, box-shadow .12s, opacity .15s;
        box-shadow: 0 8px 24px rgba(27,77,62,.28);
      }
      .ckfp-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 30px rgba(27,77,62,.36); }
      .ckfp-btn-primary:active:not(:disabled) { transform: scale(.98); }
      .ckfp-btn-primary:disabled,
      .ckfp-btn-primary.loading { opacity: .6; cursor: not-allowed; transform: none; }
      .ckfp-cta { margin-top: 20px; }
      .ckfp-pay-btn { font-size: 1.05rem; padding: 16px 20px; }

      /* ── Trust row ── */
      .ckfp-trust-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        margin-top: 18px;
      }
      .ckfp-trust-item {
        font-size: .78rem;
        font-weight: 700;
        color: #6b7280;
      }

      /* ── Address preview ── */
      .ckfp-addr-preview {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 10px 14px;
        margin-bottom: 20px;
        font-size: .85rem;
        flex-wrap: wrap;
      }
      .ckfp-addr-preview-label { font-weight: 800; color: #374151; white-space: nowrap; }
      .ckfp-addr-preview-val   { flex: 1; font-weight: 600; color: #6b7280; min-width: 0; }
      .ckfp-addr-change {
        background: none; border: none; cursor: pointer;
        font-size: .78rem; font-weight: 800; color: #1B4D3E;
        text-decoration: underline; padding: 0; white-space: nowrap;
      }

      /* ── Shipping options ── */
      .ckfp-ship-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
      .ckfp-ship-opt {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border: 1.5px solid #d1d5db;
        border-radius: 12px;
        cursor: pointer;
        transition: border-color .15s, background .15s;
        background: #fff;
      }
      .ckfp-ship-opt:hover { border-color: #1B4D3E; background: #f0fdf4; }
      .ckfp-ship-opt.selected { border-color: #1B4D3E; background: rgba(27,77,62,.04); border-width: 2px; }
      .ckfp-ship-opt input[type="radio"] { width: 18px; height: 18px; accent-color: #1B4D3E; flex-shrink: 0; }
      .ckfp-ship-ico   { font-size: 1.3rem; flex-shrink: 0; }
      .ckfp-ship-info  { flex: 1; min-width: 0; }
      .ckfp-ship-title { font-weight: 900; font-size: .9rem; color: #111827; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .ckfp-ship-badge { font-size: .7rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: rgba(16,185,129,.10); color: #065f46; border: 1px solid rgba(16,185,129,.25); }
      .ckfp-ship-sub   { font-size: .8rem; font-weight: 600; color: #6b7280; margin-top: 2px; }
      .ckfp-ship-price { font-size: .88rem; font-weight: 900; color: #16a34a; flex-shrink: 0; }

      /* ── Paso 3: layout ── */
      .ckfp-pay-layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 24px;
        max-width: 1040px;
        margin: 0 auto;
        align-items: flex-start;
      }
      @media (min-width: 768px) {
        .ckfp-pay-layout { grid-template-columns: 1.1fr 0.9fr; }
      }
      .ckfp-pay-col {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 24px 20px;
      }

      /* ── Free ship banner ── */
      .ckfp-free-ship-banner {
        background: #ecfdf5;
        border: 1px solid #bbf7d0;
        color: #14532d;
        border-radius: 12px;
        padding: 14px 16px;
        font-size: .88rem;
        font-weight: 700;
        margin-bottom: 18px;
        line-height: 1.55;
      }
      .ckfp-free-ship-banner strong { font-weight: 900; }
      .ckfp-free-ship-banner span { font-weight: 600; color: #166534; }

      /* ── COD box ── */
      .ckfp-cod-box {
        background: #ecfdf5;
        border: 1.5px solid #86efac;
        border-radius: 12px;
        padding: 14px 16px;
        font-size: .88rem;
        font-weight: 700;
        color: #14532d;
        margin-bottom: 18px;
        line-height: 1.55;
      }

      /* ── Payment methods ── */
      .ckfp-pay-methods { display: flex; flex-direction: column; gap: 10px; }
      .ckfp-pay-opt {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        border: 1.5px solid #d1d5db;
        border-radius: 12px;
        cursor: pointer;
        transition: border-color .15s, background .15s;
        background: #fff;
      }
      .ckfp-pay-opt:hover { border-color: #1B4D3E; }
      .ckfp-pay-opt.selected { border-color: #009ee3; background: #f0f9ff; border-width: 2px; }
      .ckfp-pay-opt input[type="radio"] { width: 18px; height: 18px; accent-color: #1B4D3E; flex-shrink: 0; margin-top: 2px; }
      .ckfp-pay-info   { flex: 1; min-width: 0; }
      .ckfp-pay-title  { font-weight: 900; font-size: .9rem; color: #111827; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .ckfp-pay-rec-badge    { font-size: .7rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: rgba(0,158,227,.10); color: #006fa6; border: 1px solid rgba(0,158,227,.25); }
      .ckfp-pay-secure-badge { font-size: .7rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: rgba(22,163,74,.10); color: #15803d; border: 1px solid rgba(22,163,74,.25); }
      .ckfp-pay-sub    { font-size: .8rem; font-weight: 600; color: #6b7280; margin-top: 2px; }
      .ckfp-card-brands { display: flex; gap: 6px; margin-top: 8px; }
      .ckfp-card-brand { font-size: .68rem; font-weight: 900; padding: 3px 7px; border-radius: 4px; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; }
      .ckfp-mp-logo-inline { flex-shrink: 0; border-radius: 4px; }

      /* ── SSL notice ── */
      .ckfp-ssl-notice {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: .82rem;
        font-weight: 700;
        color: #15803d;
        margin-bottom: 12px;
        line-height: 1.4;
      }
      .ckfp-ssl-notice strong { font-weight: 900; }
      .ckfp-card-brick-wrap { margin-top: 4px; }

      /* ── Pay trust ── */
      .ckfp-pay-trust {
        display: flex;
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
        margin-top: 16px;
        padding-top: 14px;
        border-top: 1px solid #f3f4f6;
      }
      .ckfp-trust-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        font-size: .7rem;
        font-weight: 700;
        color: #6b7280;
      }
      .ckfp-trust-badge span:first-child { font-size: 1.1rem; }

      /* ── Pay logos ── */
      .ckfp-pay-logos {
        display: flex;
        gap: 6px;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 12px;
      }
      .ckfp-pay-logo {
        font-size: .68rem;
        font-weight: 900;
        padding: 4px 10px;
        border-radius: 5px;
        letter-spacing: .03em;
      }
      .ckfp-pay-logo.mp   { background: #009ee3; color: #fff; }
      .ckfp-pay-logo.visa { background: #1A1F71; color: #fff; }
      .ckfp-pay-logo.mc   { background: #EB001B; color: #fff; }
      .ckfp-pay-logo.amex { background: #2E77BC; color: #fff; }

      /* ── Aside / Summary ── */
      .ckfp-aside {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
      }
      @media (min-width: 768px) {
        .ckfp-aside { position: sticky; top: 80px; }
        .ckfp-summary-toggle { display: none; }
        .ckfp-aside-inner { display: block !important; }
      }
      .ckfp-summary-toggle {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        background: none;
        border: none;
        border-bottom: 1px solid #e5e7eb;
        font-size: .9rem;
        font-weight: 800;
        color: #111827;
        cursor: pointer;
      }
      .ckfp-chevron { font-size: .75rem; transition: transform .2s; display: inline-block; }
      .ckfp-aside-inner { display: none; }
      .ckfp-aside-inner.open { display: block; }

      /* ── Order summary ── */
      .ckfp-summary { padding: 16px; }
      .ckfp-summary-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      .ckfp-summary-title { font-size: .95rem; font-weight: 900; margin: 0; color: #111827; }
      .ckfp-summary-clear { background: none; border: none; cursor: pointer; font-size: .75rem; font-weight: 700; color: #9ca3af; text-decoration: underline; padding: 0; }
      .ckfp-promo-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(22,163,74,.08); border: 1px solid rgba(22,163,74,.18); color: #15803d; border-radius: 999px; padding: 4px 10px; font-size: .78rem; font-weight: 800; margin-bottom: 10px; }

      /* Items */
      .ckfp-items { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
      .ckfp-item { display: flex; gap: 10px; align-items: center; }
      .ckfp-item-img {
        position: relative; flex-shrink: 0;
        width: 56px; height: 56px;
        border-radius: 10px; overflow: hidden;
        background: #f1f5f9; border: 1px solid #e5e7eb;
        display: grid; place-items: center;
      }
      .ckfp-item-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .ckfp-item-ph { font-size: 1.4rem; }
      .ckfp-item-qty-badge {
        position: absolute; top: -6px; right: -6px;
        background: #1B4D3E; color: #fff;
        border-radius: 999px; width: 20px; height: 20px;
        font-size: 11px; font-weight: 900;
        display: flex; align-items: center; justify-content: center;
      }
      .ckfp-item-info { flex: 1; min-width: 0; }
      .ckfp-item-name { font-size: .82rem; font-weight: 800; color: #111827; line-height: 1.3; }
      .ckfp-item-fixed-qty { font-size: .75rem; font-weight: 600; color: #6b7280; margin-top: 4px; }
      .ckfp-qty-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
      .ckfp-qty-btn {
        width: 24px; height: 24px; border-radius: 6px;
        border: 1px solid #e5e7eb; background: #f9fafb;
        cursor: pointer; display: grid; place-items: center;
        font-size: .82rem; font-weight: 900; color: #6b7280;
      }
      .ckfp-qty-num { font-size: .82rem; font-weight: 800; min-width: 16px; text-align: center; }
      .ckfp-item-price { flex-shrink: 0; text-align: right; }
      .ckfp-item-was { font-size: .72rem; color: #9ca3af; text-decoration: line-through; font-weight: 600; }
      .ckfp-item-total { font-size: .9rem; font-weight: 900; }
      .ckfp-item-total.sale { color: #16a34a; }

      /* Totals */
      .ckfp-totals { border-top: 1px solid #f3f4f6; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
      .ckfp-total-row { display: flex; justify-content: space-between; font-size: .85rem; font-weight: 700; color: #6b7280; }
      .ckfp-total-row.green { color: #16a34a; font-weight: 800; }
      .ckfp-total-final { display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 900; color: #111827; border-top: 1.5px solid #e5e7eb; padding-top: 10px; margin-top: 4px; }

      /* Coupon */
      .ckfp-coupon-area { margin-top: 4px; }
      .ckfp-coupon-row  { display: flex; gap: 7px; }
      .ckfp-coupon-inp {
        flex: 1; height: 36px;
        border: 1px solid #d1d5db; border-radius: 8px;
        padding: 0 10px; font-size: .82rem; font-weight: 700;
        background: #fafafa; color: #111827;
        outline: none; text-transform: uppercase; letter-spacing: .03em;
        transition: border-color .15s;
      }
      .ckfp-coupon-inp:focus { border-color: #1B4D3E; }
      .ckfp-coupon-btn {
        height: 36px; padding: 0 12px;
        border: 1px solid #d1d5db; border-radius: 8px;
        background: #f4f4f4; color: #555;
        font-size: .78rem; font-weight: 800;
        cursor: pointer; white-space: nowrap;
        transition: background .15s;
      }
      .ckfp-coupon-btn:hover:not(:disabled) { background: #e8e8e8; }
      .ckfp-coupon-btn:disabled { opacity: .45; cursor: not-allowed; }
      .ckfp-coupon-err  { font-size: .75rem; font-weight: 700; color: #dc2626; margin-top: 4px; }
      .ckfp-coupon-applied { display: flex; align-items: center; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 10px; font-size: .82rem; font-weight: 800; color: #15803d; }
      .ckfp-coupon-remove { background: none; border: none; cursor: pointer; font-size: .75rem; font-weight: 800; color: #9ca3af; text-decoration: underline; padding: 0; }

      /* ── Success ── */
      .ckfp-success, .ckfp-empty {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 40px 20px; text-align: center;
      }
      .ckfp-success-card {
        background: #fff; border: 1px solid #e5e7eb; border-radius: 20px;
        padding: 32px 24px; max-width: 460px; width: 100%;
      }
      .ckfp-success-icon { font-size: 3.5rem; margin-bottom: 10px; }
      .ckfp-success-title { font-size: 1.5rem; font-weight: 900; color: #111827; margin: 0 0 12px; letter-spacing: -0.03em; }
      .ckfp-success-body { font-size: .9rem; font-weight: 600; color: #6b7280; line-height: 1.6; margin-bottom: 20px; }
      .ckfp-success-box { background: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 14px; font-size: .85rem; font-weight: 800; color: #14532d; text-align: left; margin-top: 12px; line-height: 1.6; }
      .ckfp-success-actions { display: flex; flex-direction: column; gap: 10px; }
      .ckfp-link { font-size: .88rem; font-weight: 800; color: #1B4D3E; text-decoration: underline; }
      .ckfp-link.muted { color: #9ca3af; }

      /* ── Sticky footer ── */
      .ckfp-sticky-footer {
        display: none;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        background: #fff;
        border-top: 1.5px solid #e5e7eb;
        padding: 10px 16px 14px;
        z-index: 200;
      }
      .ckfp-sticky-footer .ckfp-cta { margin-top: 0; }
      @media (max-width: 767px) {
        .ckfp-sticky-footer { display: block; }
      }

      /* ── MP overlay ── */
      .ckfp-mp-overlay {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,.5);
        backdrop-filter: blur(8px);
        padding: 20px;
        animation: ckFadeIn .3s ease;
      }
      .ckfp-mp-card {
        background: #fff; border-radius: 20px;
        padding: 36px 28px; max-width: 360px; width: 100%;
        text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,.18);
        animation: ckSlideUp .32s ease;
      }
      .ckfp-mp-logo   { margin-bottom: 18px; }
      .ckfp-mp-title  { font-size: 1.2rem; font-weight: 900; color: #111827; margin: 0 0 6px; }
      .ckfp-mp-sub    { font-size: .85rem; color: #6b7280; font-weight: 600; margin: 0 0 20px; }
      .ckfp-mp-bar-track { width: 100%; height: 4px; border-radius: 4px; background: rgba(0,158,227,.12); overflow: hidden; margin-bottom: 20px; }
      .ckfp-mp-bar    { width: 30%; height: 100%; border-radius: 4px; background: linear-gradient(90deg, #009ee3, #00c3ff); animation: ckMpBar 1.8s ease-in-out infinite; }
      .ckfp-mp-trust  { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 16px; }
      .ckfp-mp-trust-item { font-size: .72rem; font-weight: 700; color: #6b7280; }
      .ckfp-mp-note   { font-size: .72rem; color: #9ca3af; font-weight: 600; margin: 0; }

      @keyframes ckFadeIn   { from { opacity: 0; } to { opacity: 1; } }
      @keyframes ckSlideUp  { from { opacity: 0; transform: translateY(18px) scale(.97); } to { opacity: 1; transform: none; } }
      @keyframes ckMpBar    { 0% { transform: translateX(-100%); } 50% { transform: translateX(250%); } 100% { transform: translateX(-100%); } }

      /* ── Cambio 1: Mini-resumen producto paso 1 ── */
      .ckfp-product-preview {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 16px;
      }
      .ckfp-product-preview-img {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        object-fit: cover;
        flex-shrink: 0;
      }
      .ckfp-product-preview-info {
        flex: 1;
        min-width: 0;
      }
      .ckfp-product-preview-name {
        font-size: 13px;
        font-weight: 700;
        color: #111827;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 3px;
      }
      .ckfp-product-preview-prices {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 3px;
      }
      .ckfp-product-preview-final {
        font-size: 14px;
        font-weight: 900;
        color: #16a34a;
      }
      .ckfp-product-preview-was {
        font-size: 12px;
        font-weight: 600;
        color: #9ca3af;
        text-decoration: line-through;
      }
      .ckfp-product-preview-ship {
        font-size: 11px;
        font-weight: 700;
        color: #2563eb;
      }

      /* ── Cambio 2: Trust top ── */
      .ckfp-trust-top {
        margin-bottom: 14px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f3f4f6;
      }

      /* ── Cambio 3: Cupón colapsable ── */
      .ckfp-coupon-toggle {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 13px;
        color: #6b7280;
        text-decoration: underline;
        padding: 4px 0;
        display: block;
        text-align: left;
        font-family: inherit;
        transition: color .15s;
      }
      .ckfp-coupon-toggle:hover { color: #374151; }
      .ckfp-coupon-body {
        max-height: 0;
        overflow: hidden;
        transition: max-height .25s ease;
      }
      .ckfp-coupon-body.open {
        max-height: 120px;
      }
      .ckfp-coupon-inp {
        min-width: 0;
        flex: 1;
      }

      /* ── Cambio 5: Cuotas hint ── */
      .ckfp-installments-hint {
        font-size: 12px;
        color: #6b7280;
        text-align: center;
        margin-top: 6px;
        margin-bottom: 0;
      }

      /* ── Cambio 7: Toast envío ── */
      @keyframes ckfpToastIn {
        from { opacity: 0; transform: translateY(-12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes ckfpToastOut {
        from { opacity: 1; }
        to   { opacity: 0; }
      }
      .ckfp-ship-toast {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        background: #e8f5e9;
        color: #1b5e20;
        font-size: 13px;
        font-weight: 700;
        padding: 10px 20px;
        border-radius: 999px;
        box-shadow: 0 4px 16px rgba(0,0,0,.12);
        white-space: nowrap;
        animation: ckfpToastIn .3s ease forwards;
        pointer-events: none;
      }

      /* ── Paso 0: carrito / resumen ── */
      .ckfp-cart0-items {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 12px;
      }
      .ckfp-cart0-item {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px;
      }
      .ckfp-cart0-img-wrap {
        position: relative;
        flex-shrink: 0;
      }
      .ckfp-cart0-img {
        width: 64px;
        height: 64px;
        border-radius: 10px;
        object-fit: cover;
        display: block;
      }
      .ckfp-cart0-ph {
        width: 64px;
        height: 64px;
        border-radius: 10px;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
      }
      .ckfp-cart0-qty-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        background: #111827;
        color: #fff;
        border-radius: 999px;
        width: 20px;
        height: 20px;
        font-size: 11px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ckfp-cart0-info {
        flex: 1;
        min-width: 0;
      }
      .ckfp-cart0-name {
        font-size: 13px;
        font-weight: 700;
        color: #111827;
        line-height: 1.35;
        margin-bottom: 4px;
      }
      .ckfp-cart0-gift {
        font-size: 11px;
        color: #16a34a;
        font-weight: 600;
        margin-top: 2px;
      }
      .ckfp-cart0-price {
        text-align: right;
        flex-shrink: 0;
      }
      .ckfp-cart0-was {
        font-size: 12px;
        color: #9ca3af;
        text-decoration: line-through;
        font-weight: 600;
      }
      .ckfp-cart0-total {
        font-size: 15px;
        font-weight: 900;
        color: #111827;
      }
      .ckfp-cart0-total.sale {
        color: #16a34a;
      }
      .ckfp-cart0-ship-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        font-weight: 700;
        color: #374151;
        padding: 10px 0;
        border-top: 1px solid #f3f4f6;
      }
      .ckfp-cart0-ship-free {
        color: #16a34a;
        font-weight: 900;
      }
      .ckfp-cart0-savings {
        background: #fef9c3;
        border: 1px solid #fde047;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 800;
        color: #713f12;
        text-align: center;
        margin: 8px 0;
      }
      .ckfp-cart0-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0 4px;
        border-top: 1.5px solid #e5e7eb;
        margin-top: 4px;
        font-size: 17px;
        font-weight: 900;
        color: #111827;
      }
      .ckfp-cart0-total-was {
        font-size: 13px;
        color: #9ca3af;
        text-decoration: line-through;
        font-weight: 600;
        margin-right: 8px;
      }
      .ckfp-cart0-total-final {
        font-size: 20px;
        font-weight: 900;
        color: #111827;
      }
      .ckfp-sticky-sub {
        text-align: center;
        font-size: 11px;
        color: #9ca3af;
        font-weight: 600;
        margin-top: 6px;
      }
    `}</style>
  );
}

// Compatibilidad legacy (CheckoutContent usado en contextos embebidos)
export function CheckoutContent() {
  return <Checkout />;
}
