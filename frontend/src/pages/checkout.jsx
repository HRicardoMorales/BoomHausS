// src/pages/checkout.jsx
// Checkout fullpage — 3 pasos, mobile-first, estilo TiendaNube
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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

// ─── Accordion resumen (pasos 1 y 2) ────────────────────────────────────────
function SummaryAccordion({ items, calcItemTotal, totalPrice, finalTotal, couponDiscount, appliedCoupon }) {
  const [open, setOpen] = useState(false);
  const totalItems = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const fullTotal = items.reduce((a, it) => {
    if (it.bundleTotal && it.compareAtPrice) return a + Number(it.compareAtPrice);
    return a + (Number(it.price) || 0) * (Number(it.quantity) || 0);
  }, 0);
  const savings = Math.max(0, fullTotal - totalPrice);

  return (
    <div className="ckfp-sa">
      <button type="button" className="ckfp-sa-header" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <div className="ckfp-sa-header-left">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1B4D3E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span className="ckfp-sa-title">{open ? "Ocultar" : "Ver"} pedido</span>
          <span className="ckfp-sa-badge">{totalItems}</span>
          <svg className={`ckfp-sa-chevron${open ? " open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div className="ckfp-sa-header-right">
          {savings > 0 && <span className="ckfp-sa-savings">−{money(savings)}</span>}
          <span className="ckfp-sa-amount">{money(finalTotal)}</span>
        </div>
      </button>
      <div className={`ckfp-sa-body${open ? " open" : ""}`}>
        <div className="ckfp-sa-items">
          {items.map((item, i) => {
            const thumb = item.imageUrl || item.image || null;
            const itemTotal = calcItemTotal(item);
            const origTotal = item.bundleTotal && item.compareAtPrice
              ? Number(item.compareAtPrice)
              : (Number(item.price) || 0) * (Number(item.quantity) || 0);
            const hasDisc = origTotal > itemTotal;
            return (
              <div key={i} className="ckfp-sa-item">
                <div className="ckfp-sa-item-img-wrap">
                  {thumb ? <img src={thumb} alt={item.name} className="ckfp-sa-item-img" /> : <span className="ckfp-sa-item-ph">📦</span>}
                  <span className="ckfp-sa-item-qty">{item.quantity}</span>
                </div>
                <div className="ckfp-sa-item-name">{item.name}</div>
                <div className="ckfp-sa-item-price">
                  {hasDisc && <span className="ckfp-sa-item-was">{money(origTotal)}</span>}
                  <span className={hasDisc ? "ckfp-sa-item-sale" : ""}>{money(itemTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="ckfp-sa-totals">
          <div className="ckfp-sa-row"><span>Subtotal</span><span>{money(totalPrice)}</span></div>
          {savings > 0 && <div className="ckfp-sa-row ckfp-sa-row--green"><span>Descuento promo</span><span>−{money(savings)}</span></div>}
          {couponDiscount > 0 && appliedCoupon && (
            <div className="ckfp-sa-row ckfp-sa-row--green"><span>Cupón {appliedCoupon.code}</span><span>−{money(couponDiscount)}</span></div>
          )}
          <div className="ckfp-sa-row ckfp-sa-row--green"><span>Envío</span><span>GRATIS</span></div>
          <div className="ckfp-sa-final"><span>Total</span><span>{money(finalTotal)}</span></div>
        </div>
      </div>
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
  const location = useLocation();

  const storeName = import.meta.env.VITE_STORE_NAME || "Amelor";
  const whatsapp  = import.meta.env.VITE_WHATSAPP_NUMBER || "";

  // Si viene desde la sheet del carrito (skipCart:true), arrancar en paso 1
  const skipCart = location.state?.skipCart === true;

  // ── Paso ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(() => skipCart ? 1 : rSession("ck_step", 0));
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
  const [shippingMethod, setShippingMethod] = useState("andreani");
  const isCod = false;

  // ── Pago ──────────────────────────────────────────────────────────────────
  const [onlinePayMethod, setOnlinePayMethod] = useState(null);
  const [cardMounted, setCardMounted] = useState(false);
  const [selectedCuotas, setSelectedCuotas] = useState(3);
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
    setStep(2);
  }

  function handleStep2Next() {
    setStep(3);
  }

  function goBack() {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
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
        <div className="ckfp-header-right">
          <div className="ckfp-secure-badge">
            <svg className="ckfp-lock-icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Pago 100% seguro</span>
          </div>
          <div className="ckfp-header-divider" />
          <div className="ckfp-payment-logos">
            <img src="/icons/mercadopago.svg" alt="MercadoPago" className="ckfp-pay-logo" />
            <img src="/icons/visa.svg" alt="Visa" className="ckfp-pay-logo" />
            <img src="/icons/mastercard.svg" alt="Mastercard" className="ckfp-pay-logo" />
            <img src="/icons/amex.svg" alt="Amex" className="ckfp-pay-logo" />
          </div>
        </div>
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

          </div>
        )}

        {/* ══ PASO 1 — INFORMACIÓN ══════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <SummaryAccordion
              items={items}
              calcItemTotal={calcItemTotal}
              totalPrice={totalPrice}
              finalTotal={finalTotal}
              couponDiscount={couponDiscount}
              appliedCoupon={appliedCoupon}
            />
            <div className="ckfp-step-wrap">
            <button type="button" className="ckfp-back" onClick={goBack}>← Volver al carrito</button>
            <h2 className="ckfp-step-heading">Información de contacto y envío</h2>

            {error && (
              <div ref={errorRef} className="ckfp-error-box">⚠️ {error}</div>
            )}

            <form onSubmit={e => { e.preventDefault(); handleStep1Next(); }} noValidate>
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

              <button type="submit" className="ckfp-btn-primary ckfp-cta ckfp-form-cta" disabled={loading}>
                Continuar →
              </button>
            </form>
          </div>
          </>
        )}

        {/* ══ PASO 2 — MÉTODO DE ENVÍO ══════════════════════════════════════ */}
        {step === 2 && (
          <>
            <SummaryAccordion
              items={items}
              calcItemTotal={calcItemTotal}
              totalPrice={totalPrice}
              finalTotal={finalTotal}
              couponDiscount={couponDiscount}
              appliedCoupon={appliedCoupon}
            />
            <div className="ckfp-step-wrap">
              <button type="button" className="ckfp-back" onClick={goBack}>← Volver</button>
              <h2 className="ckfp-step-heading">Método de envío</h2>

              <div className="ckfp-addr-preview" style={{ marginBottom: 20 }}>
                <span className="ckfp-addr-preview-label">Entregar en</span>
                <span className="ckfp-addr-preview-val">{shippingAddress}</span>
                <button type="button" className="ckfp-addr-change" onClick={goBack}>Cambiar</button>
              </div>

              {/* Envío a domicilio */}
              <p className="ckfp-section-title" style={{ marginBottom: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign:"middle", marginRight:5 }}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                Envío a domicilio
              </p>
              <div className="ckfp-ship-options">
                {[
                  { value:"andreani",       title:'Andreani Estándar "Envío a domicilio"', eta:"Llega en 2 a 3 días hábiles",  was:"$13.041,00" },
                  { value:"correo_clasico",  title:"Correo Argentino Clásico - Envío a domicilio", eta:"Llega en 3 a 5 días hábiles", was:"$15.591,55" },
                  { value:"correo_expreso",  title:"Correo Argentino Expreso - Envío a domicilio", eta:"Llega en 1 a 2 días hábiles",  was:"$17.151,81" },
                ].map(opt => (
                  <label key={opt.value} className={`ckfp-ship-opt ${shippingMethod === opt.value ? "selected" : ""}`}>
                    <input type="radio" name="shipping" value={opt.value} checked={shippingMethod === opt.value} onChange={e => setShippingMethod(e.target.value)} />
                    <div className="ckfp-ship-info">
                      <div className="ckfp-ship-title">{opt.title}</div>
                      <div className="ckfp-ship-sub">{opt.eta}</div>
                    </div>
                    <div className="ckfp-ship-price-col">
                      <span className="ckfp-ship-price-free">Gratis</span>
                      <span className="ckfp-ship-price-was">{opt.was}</span>
                    </div>
                  </label>
                ))}
              </div>

              <button type="button" className="ckfp-btn-primary ckfp-cta ckfp-form-cta" onClick={handleStep2Next}>
                Continuar al pago →
              </button>
            </div>
          </>
        )}

        {/* ══ PASO 3 — PAGO ════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="ckfp-pay-layout">
            {/* Columna izquierda: pago */}
            <div className="ckfp-pay-col">
              <button type="button" className="ckfp-back" onClick={goBack}>← Volver</button>

              {/* Resumen de datos confirmados */}
              <div className="ckfp-confirm-summary">
                {/* Fila: Contacto */}
                <div className="ckfp-confirm-row">
                  <div className="ckfp-confirm-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div className="ckfp-confirm-info">
                    <span className="ckfp-confirm-main">{form.nombre}</span>
                    <span className="ckfp-confirm-sub">{form.email}</span>
                  </div>
                  <button type="button" className="ckfp-confirm-change" onClick={() => setStep(1)}>Cambiar</button>
                </div>
                <div className="ckfp-confirm-divider" />
                {/* Fila: Dirección */}
                <div className="ckfp-confirm-row">
                  <div className="ckfp-confirm-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div className="ckfp-confirm-info">
                    <span className="ckfp-confirm-main">{shippingAddress}</span>
                    {form.dni && <span className="ckfp-confirm-sub">DNI {form.dni}{form.tel ? ` · ${form.tel}` : ""}</span>}
                  </div>
                  <button type="button" className="ckfp-confirm-change" onClick={() => setStep(1)}>Cambiar</button>
                </div>
                <div className="ckfp-confirm-divider" />
                {/* Fila: Método de envío */}
                <div className="ckfp-confirm-row">
                  <div className="ckfp-confirm-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  </div>
                  <div className="ckfp-confirm-info">
                    <span className="ckfp-confirm-main">
                      {shippingMethod === "andreani"        && 'Andreani Estándar "Envío a domicilio"'}
                      {shippingMethod === "correo_clasico"  && "Correo Argentino Clásico · Envío a domicilio"}
                      {shippingMethod === "correo_expreso"  && "Correo Argentino Expreso · Envío a domicilio"}
                      <span style={{ color: "#16a34a", fontWeight: 800 }}> · Gratis</span>
                    </span>
                    <span className="ckfp-confirm-sub">
                      {shippingMethod === "andreani"        && "Llega en 2 a 3 días hábiles"}
                      {shippingMethod === "correo_clasico"  && "Llega en 3 a 5 días hábiles"}
                      {shippingMethod === "correo_expreso"  && "Llega en 1 a 2 días hábiles"}
                    </span>
                  </div>
                  <button type="button" className="ckfp-confirm-change" onClick={() => setStep(2)}>Cambiar</button>
                </div>
              </div>

              {error && <div ref={errorRef} className="ckfp-error-box">⚠️ {error}</div>}

              {/* COD confirmation */}
              {isCod ? (
                <>
                  <div className="ckfp-cod-box">
                    ✅ Abonás en efectivo o transferencia cuando te llegue el pedido.<br />
                    Solo disponible en CABA. Confirmamos la entrega por WhatsApp.
                  </div>
                  <button
                    type="button"
                    className={`ckfp-btn-dark ckfp-cta ckfp-form-cta ckfp-pay-btn ${loading ? "loading" : ""}`}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Procesando..." : `Confirmar pedido · ${money(finalTotal)}`}
                  </button>
                </>
              ) : (
                <>
                  {/* MEDIO DE PAGO — header con líneas */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: ".12em", whiteSpace: "nowrap" }}>Medio de pago</span>
                    <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                  </div>

                  {onlinePayMethod === null && (
                    /* Lista de métodos */
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#f5f5f5", margin: "0 0 20px", padding: "12px" }}>
                      {/* Mercado Pago — primero */}
                      <div className="ckfp-pcard" onClick={() => setOnlinePayMethod("mercadopago")}>
                        <div className="ckfp-pcard-row">
                          <img src="https://http2.mlstatic.com/storage/cpp/static-files/863dde6d-4e18-43f8-bcde-7905aa7a962e.svg" alt="Mercado Pago" height="28" style={{ display: "block", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1a1a1a" }}>Mercado Pago</div>
                            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginTop: 2 }}>Tarjetas, efectivo, cuotas sin tarjeta</div>
                          </div>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#c0c0c0", flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      </div>
                      {/* Tarjeta — segundo */}
                      <div className="ckfp-pcard" onClick={() => { setCardMounted(true); setOnlinePayMethod("card"); }}>
                        <div className="ckfp-pcard-row">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "#64748b" }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1a1a1a" }}>Tarjeta de crédito o débito</div>
                            <div style={{ display: "flex", gap: 4, marginTop: 5, alignItems: "center" }}>
                              <svg viewBox="0 0 60 22" width="36" height="13" aria-label="Visa" style={{ display:"block" }}><rect width="60" height="22" rx="3" fill="#1A1F71"/><text x="30" y="16" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900" fontStyle="italic" fontFamily="Arial,sans-serif">VISA</text></svg>
                              <svg viewBox="0 0 44 28" width="28" height="18" aria-label="Mastercard" style={{ display:"block" }}><rect width="44" height="28" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/><circle cx="16" cy="14" r="9" fill="#EB001B"/><circle cx="28" cy="14" r="9" fill="#F79E1B"/><path d="M22 7.2a9 9 0 0 1 0 13.6 9 9 0 0 1 0-13.6z" fill="#FF5F00"/></svg>
                              <svg viewBox="0 0 60 22" width="36" height="13" aria-label="American Express" style={{ display:"block" }}><rect width="60" height="22" rx="3" fill="#2E77BC"/><text x="30" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="0.5">AMEX</text></svg>
                              <span style={{ background: "#f4f6f8", border: "1px solid #e0e0e0", borderRadius: 3, padding: "1px 4px", fontSize: 9, fontWeight: 900, color: "#555" }}>NX</span>
                            </div>
                          </div>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#c0c0c0", flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {onlinePayMethod === "mercadopago" && (
                    /* Vista expandida — Mercado Pago */
                    <div className="ckfp-pay-detail" style={{ marginBottom: 20 }}>
                      <div className="ckfp-pay-view-hdr">
                        <button type="button" className="ckfp-pay-view-back" onClick={() => setOnlinePayMethod(null)} aria-label="Volver a métodos de pago">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <img src="https://http2.mlstatic.com/storage/cpp/static-files/863dde6d-4e18-43f8-bcde-7905aa7a962e.svg" alt="Mercado Pago" height="24" style={{ display: "block" }} />
                      </div>
                      <div style={{ padding: "14px 16px 4px" }}>
                        <div style={{ fontSize: 15.5, fontWeight: 800, color: "#1a1a1a", marginBottom: 14, lineHeight: 1.3 }}>Pagá con tu cuenta de Mercado Pago</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, fontWeight: 600, color: "#374151", lineHeight: 1.5 }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><rect width="24" height="24" rx="6" fill="#e0f2fe"/><path d="M5 12h14M5 8h8" stroke="#009ee3" strokeWidth="2" strokeLinecap="round"/></svg>
                            <div><strong style={{ fontWeight: 800, color: "#1e293b" }}>Usá tus tarjetas guardadas,</strong> dinero disponible y mucho más.</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, fontWeight: 600, color: "#374151", lineHeight: 1.5 }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><rect width="24" height="24" rx="6" fill="#e0f2fe"/><circle cx="12" cy="12" r="5" stroke="#009ee3" strokeWidth="2"/><path d="M12 9v3l1.5 1.5" stroke="#009ee3" strokeWidth="2" strokeLinecap="round"/></svg>
                            <div><strong style={{ fontWeight: 800, color: "#1e293b" }}>Accedé a Cuotas sin Tarjeta</strong> para comprar ahora y pagar después.</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                          <svg viewBox="0 0 60 22" width="42" height="16" aria-label="Visa" style={{ display:"block" }}><rect width="60" height="22" rx="3" fill="#1A1F71"/><text x="30" y="16" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900" fontStyle="italic" fontFamily="Arial,sans-serif">VISA</text></svg>
                          <svg viewBox="0 0 44 28" width="36" height="24" aria-label="Mastercard" style={{ display:"block" }}><rect width="44" height="28" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/><circle cx="16" cy="14" r="9" fill="#EB001B"/><circle cx="28" cy="14" r="9" fill="#F79E1B"/><path d="M22 7.2a9 9 0 0 1 0 13.6 9 9 0 0 1 0-13.6z" fill="#FF5F00"/></svg>
                          <svg viewBox="0 0 60 22" width="42" height="16" aria-label="American Express" style={{ display:"block" }}><rect width="60" height="22" rx="3" fill="#2E77BC"/><text x="30" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="0.5">AMEX</text></svg>
                          <span style={{ background: "#f4f6f8", border: "1px solid #e0e0e0", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 900, color: "#555", display:"inline-flex", alignItems:"center" }}>NX</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 11, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "11px 13px" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#009ee3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", lineHeight: 1.3 }}>Te llevaremos a Mercado Pago</div>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#94a3b8", marginTop: 2 }}>Si no tenés una cuenta, podés usar tu e-mail.</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "center", padding: "10px 0 14px" }}>
                        <button type="button" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#94a3b8", textDecoration: "underline", textUnderlineOffset: 2, padding: "4px 6px" }} onClick={() => setOnlinePayMethod(null)}>
                          ← Cambiar opción de pago
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Vista expandida — Tarjeta — montada desde el primer click, retenida para aperturas instantáneas */}
                  {cardMounted && <div className="ckfp-pay-detail" style={{ display: onlinePayMethod === "card" ? "block" : "none", marginBottom: 20 }}>
                    <div className="ckfp-pay-view-hdr">
                      <button type="button" className="ckfp-pay-view-back" onClick={() => setOnlinePayMethod(null)} aria-label="Volver a métodos de pago">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#64748b", flexShrink: 0 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: "#1a1a1a", flex: 1 }}>Tarjeta de crédito o débito</span>
                    </div>
                    <div style={{ padding: "0 16px" }}>
                      <CardPaymentBrick
                        amount={finalTotal}
                        onBeforeSubmit={handleCardBeforeSubmit}
                        onSuccess={handleCardSuccess}
                        onError={() => {}}
                        onSetError={msg => showError(msg)}
                      />
                      {finalTotal > 0 && (
                        <div className="ckfp-cuotas-field">
                          <label className="ckfp-cuotas-label" htmlFor="ckfp-cuotas-select">
                            Cuotas
                            <span className="ckfp-cuotas-label-badge">3 sin interés disponibles</span>
                          </label>
                          <div className="ckfp-cuotas-select-wrap">
                            <select
                              id="ckfp-cuotas-select"
                              className="ckfp-cuotas-select"
                              value={selectedCuotas}
                              onChange={e => setSelectedCuotas(Number(e.target.value))}
                            >
                              <option value={1}>1 pago de {money(finalTotal)}</option>
                              <option value={3}>3 cuotas sin interés de {money(Math.round(finalTotal / 3))}/mes</option>
                            </select>
                            <svg className="ckfp-cuotas-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                          {selectedCuotas === 3 && (
                            <p className="ckfp-cuotas-hint">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Sin recargo — pagás 3 x {money(Math.round(finalTotal / 3))}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "center", padding: "10px 0 14px" }}>
                      <button type="button" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#94a3b8", textDecoration: "underline", textUnderlineOffset: 2, padding: "4px 6px" }} onClick={() => setOnlinePayMethod(null)}>
                        ← Cambiar opción de pago
                      </button>
                    </div>
                  </div>}

                  {/* Botón MP inline */}
                  {onlinePayMethod === "mercadopago" && (
                    <button
                      type="button"
                      className={`ckfp-btn-dark ckfp-cta ckfp-form-cta ckfp-pay-btn ${loading || redirecting ? "loading" : ""}`}
                      onClick={handleSubmit}
                      disabled={loading || redirecting}
                    >
                      {redirecting ? "Conectando con Mercado Pago..." : loading ? "Procesando..." : "Pagar a través de Mercado Pago"}
                    </button>
                  )}
                </>
              )}
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
          <div className="ckfp-sticky-trust-row">
            <span>🔒 SSL Seguro</span>
            <span>💳 3 cuotas sin interés</span>
            <span>🚚 Envío gratis</span>
            <span>🛡️ Garantía 30 días</span>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="ckfp-sticky-footer">
          <button type="button" className="ckfp-btn-primary ckfp-cta" onClick={handleStep1Next}>
            Continuar con el envío →
          </button>
          <div className="ckfp-sticky-trust-row">
            <span>🔒 SSL Seguro</span>
            <span>💳 3 cuotas sin interés</span>
            <span>🚚 Envío gratis</span>
            <span>🛡️ Garantía 30 días</span>
          </div>
        </div>
      )}
      {step === 2 && !isCartEmpty && (
        <div className="ckfp-sticky-footer">
          <button type="button" className="ckfp-btn-primary ckfp-cta" style={{ marginTop: 0 }} onClick={handleStep2Next}>
            Continuar al pago →
          </button>
          <div className="ckfp-sticky-trust-row">
            <span>🔒 Pago seguro</span>
            <span>🛡️ Garantía 30 días</span>
            <span>🚚 Envío gratis</span>
          </div>
        </div>
      )}
      {step === 3 && onlinePayMethod === null && !isCod && !isCartEmpty && (
        <div className="ckfp-sticky-footer">
          <button type="button" className="ckfp-btn-primary ckfp-cta" style={{ marginTop: 0 }}>
            Elegí tu método de pago
          </button>
          <div className="ckfp-sticky-trust-row">
            <span>🔒 Pago seguro</span>
            <span>🛡️ Garantía 30 días</span>
            <span>🚚 Envío gratis</span>
          </div>
        </div>
      )}
      {step === 3 && onlinePayMethod === "mercadopago" && !isCartEmpty && (
        <div className="ckfp-sticky-footer">
          <button
            type="button"
            className={`ckfp-btn-dark ckfp-cta ${loading || redirecting ? "loading" : ""}`}
            onClick={handleSubmit}
            disabled={loading || redirecting}
          >
            {redirecting ? "Conectando..." : loading ? "Procesando..." : "Pagar a través de Mercado Pago"}
          </button>
          <div className="ckfp-sticky-trust-row">
            <span>🔒 SSL Seguro</span>
            <span>💳 3 cuotas sin interés</span>
            <span>🚚 Envío gratis</span>
            <span>🛡️ Garantía 30 días</span>
          </div>
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
      @keyframes ckfpPageIn {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      /* ── Shell ── */
      .ckfp-shell {
        min-height: 100vh;
        background: #f9fafb;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: #111827;
        animation: ckfpPageIn .38s cubic-bezier(.22,1,.36,1) both;
      }

      /* ── Header ── */
      .ckfp-header {
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 2px 10px rgba(0,0,0,.07);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        height: 62px;
        position: sticky;
        top: 0;
        z-index: 100;
        flex-shrink: 0;
      }
      .ckfp-logo {
        font-size: 18px;
        font-weight: 900;
        letter-spacing: -0.04em;
        color: #111827;
        text-decoration: none;
        line-height: 1;
      }
      .ckfp-header-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      /* Badge SSL — pill verde */
      .ckfp-secure-badge {
        display: flex;
        align-items: center;
        gap: 5px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 999px;
        padding: 5px 11px 5px 8px;
        font-size: 11.5px;
        font-weight: 700;
        color: #166534;
        white-space: nowrap;
      }
      .ckfp-lock-icon { flex-shrink: 0; }
      /* Divisor vertical */
      .ckfp-header-divider { width: 1px; height: 22px; background: #e5e7eb; flex-shrink: 0; }
      /* Logos de métodos de pago */
      .ckfp-payment-logos {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .ckfp-pay-logo {
        height: 20px;
        width: auto;
        border-radius: 4px;
        opacity: .88;
        transition: opacity .15s;
      }
      .ckfp-pay-logo:hover { opacity: 1; }
      @media (max-width: 560px) {
        .ckfp-payment-logos { display: none; }
        .ckfp-header-divider { display: none; }
      }
      @media (max-width: 360px) {
        .ckfp-secure-badge span { display: none; }
        .ckfp-secure-badge { padding: 6px; border-radius: 50%; }
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
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 800;
        background: #fff;
        border: 2px solid #d1d5db;
        color: #6b7280;
        transition: background .3s, color .3s, border-color .3s;
      }
      .ckfp-step-circle.active { background: #1B4D3E; border-color: #1B4D3E; color: #fff; }
      .ckfp-step-circle.done   { background: #16a34a; border-color: #16a34a; color: #fff; }
      .ckfp-step-label {
        font-size: 10px;
        font-weight: 600;
        color: #9ca3af;
        white-space: nowrap;
        transition: color .2s;
      }
      .ckfp-step-label.active { color: #1B4D3E; font-weight: 700; }
      .ckfp-step-label.done   { color: #16a34a; }
      .ckfp-step-label.skip   { opacity: .5; }
      .ckfp-connector {
        flex: 1;
        height: 2px;
        background: #e5e7eb;
        margin: 0 4px;
        margin-bottom: 18px;
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
        justify-content: center;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid #f3f4f6;
      }
      .ckfp-trust-item {
        font-size: 11.5px;
        font-weight: 600;
        color: #6b7280;
        display: flex;
        align-items: center;
        gap: 3px;
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
      .ckfp-ship-options { display: flex; flex-direction: column; border: 1.5px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 20px; background: #fff; }
      .ckfp-ship-opt {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 15px 16px;
        cursor: pointer;
        transition: background .12s;
        background: #fff;
        border-bottom: 1px solid #f0f0f0;
      }
      .ckfp-ship-opt:last-child { border-bottom: none; }
      .ckfp-ship-opt:hover { background: #f8fafc; }
      .ckfp-ship-opt.selected { background: #f8fafc; }
      .ckfp-ship-opt input[type="radio"] { width: 18px; height: 18px; accent-color: #111827; flex-shrink: 0; cursor: pointer; }
      .ckfp-ship-info  { flex: 1; min-width: 0; }
      .ckfp-ship-title { font-weight: 700; font-size: .88rem; color: #111827; line-height: 1.4; }
      .ckfp-ship-sub   { font-size: .78rem; font-weight: 600; color: #009ee3; margin-top: 3px; }
      .ckfp-ship-price-col { text-align: right; flex-shrink: 0; }
      .ckfp-ship-price-free { display: block; font-size: .9rem; font-weight: 900; color: #111827; }
      .ckfp-ship-price-was  { display: block; font-size: .72rem; font-weight: 600; color: #9ca3af; text-decoration: line-through; margin-top: 1px; }

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
        transition: border-color .15s, background .15s, box-shadow .15s;
        background: #fff;
      }
      .ckfp-pay-opt:hover { border-color: #009ee3; }
      .ckfp-pay-opt.selected { border-color: #009ee3; background: #f0f9ff; border-width: 2px; }
      .ckfp-pay-opt--mp.selected { box-shadow: 0 0 0 3px rgba(0,158,227,.1); }
      .ckfp-pay-opt input[type="radio"] { width: 18px; height: 18px; accent-color: #009ee3; flex-shrink: 0; margin-top: 3px; }
      .ckfp-pay-info { flex: 1; min-width: 0; }
      .ckfp-pay-title { font-weight: 900; font-size: .9rem; color: #111827; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .ckfp-mp-brand { display: flex; align-items: center; gap: 8px; }
      .ckfp-mp-wordmark { font-size: 1rem; font-weight: 900; color: #009ee3; letter-spacing: -.01em; }
      .ckfp-pay-rec-badge { font-size: .68rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: rgba(0,158,227,.12); color: #006fa6; border: 1px solid rgba(0,158,227,.3); }
      .ckfp-pay-secure-badge { font-size: .68rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: rgba(22,163,74,.10); color: #15803d; border: 1px solid rgba(22,163,74,.25); }
      .ckfp-pay-sub { font-size: .8rem; font-weight: 600; color: #6b7280; margin-top: 3px; }

      /* ── Cuotas select field ── */
      .ckfp-cuotas-field {
        padding: 12px 16px 12px;
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        margin-top: -4px;
      }
      .ckfp-cuotas-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: .78rem;
        font-weight: 800;
        color: #374151;
        margin-bottom: 7px;
        text-transform: uppercase;
        letter-spacing: .04em;
      }
      .ckfp-cuotas-label-badge {
        font-size: .65rem;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 999px;
        background: #dcfce7;
        color: #15803d;
        border: 1px solid #bbf7d0;
        text-transform: none;
        letter-spacing: 0;
      }
      .ckfp-cuotas-select-wrap {
        position: relative;
      }
      .ckfp-cuotas-select {
        width: 100%;
        appearance: none;
        -webkit-appearance: none;
        background: #fff;
        border: 1.5px solid #d1d5db;
        border-radius: 9px;
        padding: 10px 38px 10px 13px;
        font-size: .88rem;
        font-weight: 700;
        color: #111827;
        cursor: pointer;
        outline: none;
        transition: border-color .15s;
        font-family: inherit;
      }
      .ckfp-cuotas-select:focus { border-color: #009ee3; box-shadow: 0 0 0 3px rgba(0,158,227,.1); }
      .ckfp-cuotas-chevron {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: #6b7280;
      }
      .ckfp-cuotas-hint {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: .75rem;
        font-weight: 700;
        color: #15803d;
        margin: 6px 0 0;
      }

      /* ── Card brands ── */
      .ckfp-card-brands { display: flex; align-items: center; gap: 8px; margin-top: 9px; }
      .ckfp-brand-amex { font-size: .62rem; font-weight: 900; padding: 3px 7px; border-radius: 4px; background: #2E77BC; color: #fff; letter-spacing: .04em; }

      /* ── Pay button inner ── */
      .ckfp-pay-btn-inner { display: flex; align-items: center; gap: 8px; justify-content: center; }

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
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid #f3f4f6;
      }
      .ckfp-pay-trust-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: .72rem;
        font-weight: 700;
        color: #6b7280;
      }
      .ckfp-pay-trust-item svg { color: #9ca3af; flex-shrink: 0; }

      /* ── Pay logos ── */
      .ckfp-pay-logos {
        display: flex;
        gap: 10px;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 12px;
      }
      .ckfp-logo-amex { font-size: .62rem; font-weight: 900; padding: 4px 8px; border-radius: 4px; background: #2E77BC; color: #fff; letter-spacing: .04em; }

      /* ── Summary Accordion (pasos 1 y 2) ── */
      .ckfp-sa {
        max-width: 520px;
        margin: 0 auto 14px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        overflow: hidden;
      }
      .ckfp-sa-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 13px 16px;
        background: none;
        border: none;
        cursor: pointer;
        gap: 8px;
        font-family: inherit;
        transition: background .15s;
      }
      .ckfp-sa-header:hover { background: #f9fafb; }
      .ckfp-sa-header-left {
        display: flex;
        align-items: center;
        gap: 7px;
        flex: 1;
        min-width: 0;
      }
      .ckfp-sa-title {
        font-size: 13.5px;
        font-weight: 800;
        color: #1B4D3E;
      }
      .ckfp-sa-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 5px;
        background: #1B4D3E;
        color: #fff;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 900;
      }
      .ckfp-sa-chevron { transition: transform .22s; flex-shrink: 0; }
      .ckfp-sa-chevron.open { transform: rotate(180deg); }
      .ckfp-sa-header-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .ckfp-sa-savings {
        font-size: 11px;
        font-weight: 700;
        color: #16a34a;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 999px;
        padding: 2px 8px;
        white-space: nowrap;
      }
      .ckfp-sa-amount {
        font-size: 15px;
        font-weight: 900;
        color: #111827;
      }
      .ckfp-sa-body {
        max-height: 0;
        overflow: hidden;
        transition: max-height .35s cubic-bezier(.22,1,.36,1);
      }
      .ckfp-sa-body.open { max-height: 800px; }
      .ckfp-sa-items {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 14px 16px;
        border-top: 1px solid #f3f4f6;
      }
      .ckfp-sa-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .ckfp-sa-item-img-wrap {
        position: relative;
        flex-shrink: 0;
        width: 52px; height: 52px;
        border-radius: 10px;
        overflow: hidden;
        background: #f1f5f9;
        border: 1px solid #e5e7eb;
        display: grid;
        place-items: center;
      }
      .ckfp-sa-item-img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .ckfp-sa-item-ph { font-size: 1.3rem; }
      .ckfp-sa-item-qty {
        position: absolute;
        top: -5px; right: -5px;
        background: #1B4D3E; color: #fff;
        border-radius: 999px;
        width: 18px; height: 18px;
        font-size: 10px; font-weight: 900;
        display: flex; align-items: center; justify-content: center;
      }
      .ckfp-sa-item-name {
        flex: 1; min-width: 0;
        font-size: .82rem; font-weight: 700; color: #111827; line-height: 1.3;
      }
      .ckfp-sa-item-price {
        flex-shrink: 0;
        text-align: right;
        font-size: .88rem; font-weight: 900; color: #111827;
        display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
      }
      .ckfp-sa-item-was { font-size: .7rem; color: #9ca3af; text-decoration: line-through; font-weight: 600; }
      .ckfp-sa-item-sale { color: #16a34a; }
      .ckfp-sa-totals {
        border-top: 1px solid #f3f4f6;
        padding: 12px 16px 14px;
        display: flex; flex-direction: column; gap: 6px;
      }
      .ckfp-sa-row {
        display: flex; justify-content: space-between;
        font-size: .82rem; font-weight: 700; color: #6b7280;
      }
      .ckfp-sa-row--green { color: #16a34a; font-weight: 800; }
      .ckfp-sa-final {
        display: flex; justify-content: space-between;
        font-size: .98rem; font-weight: 900; color: #111827;
        border-top: 1.5px solid #e5e7eb;
        padding-top: 10px; margin-top: 4px;
      }

      /* ── Aside / Summary ── */
      .ckfp-aside {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
      }
      @media (max-width: 767px) {
        .ckfp-aside { order: -1; }
      }
      @media (min-width: 768px) {
        .ckfp-aside { position: sticky; top: 80px; }
        .ckfp-summary-toggle { display: none; }
        .ckfp-aside-inner { max-height: none !important; overflow: visible !important; }
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
      .ckfp-aside-inner {
        max-height: 0;
        overflow: hidden;
        transition: max-height .35s cubic-bezier(.22,1,.36,1);
      }
      .ckfp-aside-inner.open { max-height: 1200px; }

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

      /* ── Confirm summary (paso 3) ── */
      .ckfp-confirm-summary { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
      .ckfp-confirm-row { display: flex; align-items: flex-start; gap: 10px; padding: 11px 14px; }
      .ckfp-confirm-divider { height: 1px; background: #f3f4f6; }
      .ckfp-confirm-icon { width: 28px; height: 28px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #64748b; margin-top: 1px; }
      .ckfp-confirm-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .ckfp-confirm-main { font-size: 12.5px; font-weight: 700; color: #111827; line-height: 1.4; }
      .ckfp-confirm-sub { font-size: 11px; font-weight: 500; color: #6b7280; line-height: 1.4; }
      .ckfp-confirm-change { background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 800; color: #1B4D3E; text-decoration: underline; text-underline-offset: 2px; white-space: nowrap; flex-shrink: 0; padding: 0; font-family: inherit; margin-top: 2px; }
      .ckfp-confirm-change:hover { color: #153D31; }

      /* ── Payment cards & detail views ── */
      .ckfp-pcard { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; cursor: pointer; transition: border-color .15s; }
      .ckfp-pcard:hover { border-color: #d1d5db; }
      .ckfp-pcard-row { display: flex; align-items: center; gap: 11px; padding: 16px; min-height: 58px; }
      .ckfp-pay-detail { border: 1.5px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #fff; }
      .ckfp-pay-view-hdr { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-bottom: 1.5px solid #f1f5f9; background: #fafbfc; }
      .ckfp-pay-view-back { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: none; background: none; cursor: pointer; color: #64748b; border-radius: 7px; flex-shrink: 0; transition: background .12s, color .12s; }
      .ckfp-pay-view-back:hover { background: #e2e8f0; color: #1e293b; }
      .ckfp-btn-dark { display: block; width: 100%; padding: 14px 20px; border: none; border-radius: 12px; background: #1e293b; color: #fff; font-size: 1rem; font-weight: 900; cursor: pointer; text-align: center; text-decoration: none; font-family: inherit; box-sizing: border-box; transition: transform .12s, box-shadow .12s, opacity .15s; box-shadow: 0 8px 24px rgba(0,0,0,.22); }
      .ckfp-btn-dark:hover:not(:disabled) { background: #0f172a; transform: translateY(-1px); box-shadow: 0 12px 30px rgba(0,0,0,.32); }
      .ckfp-btn-dark:active:not(:disabled) { transform: scale(.98); }
      .ckfp-btn-dark:disabled, .ckfp-btn-dark.loading { opacity: .6; cursor: not-allowed; transform: none; }

      /* ── Sticky footer ── */
      .ckfp-sticky-footer {
        display: none;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        background: #fff;
        border-top: 1px solid #e5e7eb;
        box-shadow: 0 -4px 16px rgba(0,0,0,.06);
        padding: 12px 16px 16px;
        z-index: 200;
      }
      .ckfp-sticky-footer .ckfp-cta { margin-top: 0; }
      .ckfp-btn-primary.ckfp-cta { border-radius: 14px; font-size: 16px; font-weight: 800; padding: 15px; letter-spacing: .3px; }
      .ckfp-sticky-trust-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 8px;
      }
      .ckfp-sticky-trust-row span {
        font-size: 10.5px;
        color: #6b7280;
        font-weight: 600;
        white-space: nowrap;
      }
      .ckfp-sticky-trust-row span:not(:last-child)::after {
        content: "·";
        margin-left: 10px;
        color: #d1d5db;
      }
      @media (max-width: 767px) {
        .ckfp-sticky-footer { display: block; }
        .ckfp-form-cta { display: none !important; }
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
        align-items: flex-start;
        gap: 14px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 14px;
      }
      .ckfp-cart0-img-wrap {
        position: relative;
        flex-shrink: 0;
      }
      .ckfp-cart0-img {
        width: 72px;
        height: 72px;
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
        background: #1b4d3e;
        color: #fff;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 11px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #fff;
      }
      .ckfp-cart0-info {
        flex: 1;
        min-width: 0;
      }
      .ckfp-cart0-name {
        font-size: 14px;
        font-weight: 700;
        color: #111827;
        line-height: 1.3;
        margin-bottom: 6px;
      }
      .ckfp-cart0-gift {
        font-size: 11.5px;
        color: #374151;
        font-weight: 600;
        margin-top: 2px;
        display: flex;
        align-items: center;
        gap: 3px;
        line-height: 1.6;
      }
      .ckfp-cart0-gift strong { color: #1b6d4f; font-weight: 700; font-size: 11px; }
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
        font-size: 17px;
        font-weight: 800;
        color: #111827;
      }
      .ckfp-cart0-ship-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        font-weight: 700;
        color: #374151;
        padding: 10px 0;
        border-top: 1px solid #f3f4f6;
        border-bottom: 1px solid #f3f4f6;
        margin: 8px 0;
      }
      .ckfp-cart0-ship-free {
        color: #1b6d4f;
        font-weight: 700;
      }
      .ckfp-cart0-savings {
        background: #fff9e6;
        border: 1px solid #fde68a;
        border-radius: 24px;
        padding: 7px 14px;
        font-size: 13px;
        font-weight: 700;
        color: #92600a;
        text-align: center;
        margin: 10px 0;
      }
      .ckfp-cart0-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0 4px;
        border-top: 1px solid #f3f4f6;
        margin-top: 8px;
      }
      .ckfp-cart0-total-row > span:first-child {
        font-size: 16px;
        font-weight: 700;
        color: #111827;
      }
      .ckfp-cart0-total-was {
        font-size: 11px;
        color: #9ca3af;
        text-decoration: line-through;
        font-weight: 400;
        display: block;
        text-align: right;
      }
      .ckfp-cart0-total-final {
        font-size: 22px;
        font-weight: 900;
        color: #111827;
        display: block;
      }
    `}</style>
  );
}

// Compatibilidad legacy (CheckoutContent usado en contextos embebidos)
export function CheckoutContent() {
  return <Checkout />;
}
