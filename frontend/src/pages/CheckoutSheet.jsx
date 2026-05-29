// src/pages/CheckoutSheet.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function useCountdown(storageKey = "pd_countdown", minutes = 18) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const saved = Number(sessionStorage.getItem(storageKey));
    const target = saved && saved > Date.now() ? saved : Date.now() + minutes * 60 * 1000;
    sessionStorage.setItem(storageKey, String(target));
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [storageKey, minutes]);
  const totalSec = Math.floor(left / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";
import api from "../services/api";

const PROVINCES = [
  "Buenos Aires","CABA","Catamarca","Chaco","Chubut","Córdoba","Corrientes",
  "Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones",
  "Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe",
  "Santiago del Estero","Tierra del Fuego","Tucumán",
];

function money(n) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n) || 0);
}

function calcItemTotal(it) {
  if (it?.bundleTotal) return Math.round(Number(it.bundleTotal));
  const qty = Math.max(0, Number(it?.quantity) || 0);
  const base = Math.max(0, Number(it?.price) || 0);
  if (!qty || !base) return 0;
  if (it?.promo?.type === "bundle2") {
    const pct = Math.max(0, Number(it?.promo?.discountPct) || 0);
    const pairs = Math.floor(qty / 2) * 2;
    return Math.round(pairs * base * (1 - pct / 100) + (qty - pairs) * base);
  }
  return Math.round(qty * base);
}

/* ─── Card brand SVG logos ─── */
const LogoVisa = () => (
  <svg viewBox="0 0 60 22" width="42" height="16" aria-label="Visa" style={{ display:"block" }}>
    <rect width="60" height="22" rx="3" fill="#1A1F71"/>
    <text x="30" y="16" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900" fontStyle="italic" fontFamily="Arial,sans-serif">VISA</text>
  </svg>
);
const LogoMC = () => (
  <svg viewBox="0 0 44 28" width="36" height="24" aria-label="Mastercard" style={{ display:"block" }}>
    <rect width="44" height="28" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
    <circle cx="16" cy="14" r="9" fill="#EB001B"/>
    <circle cx="28" cy="14" r="9" fill="#F79E1B"/>
    <path d="M22 7.2a9 9 0 0 1 0 13.6 9 9 0 0 1 0-13.6z" fill="#FF5F00"/>
  </svg>
);
const LogoAmex = () => (
  <svg viewBox="0 0 60 22" width="42" height="16" aria-label="American Express" style={{ display:"block" }}>
    <rect width="60" height="22" rx="3" fill="#2E77BC"/>
    <text x="30" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="0.5">AMEX</text>
  </svg>
);
const LogoDiners = () => (
  <svg viewBox="0 0 44 28" width="36" height="24" aria-label="Diners Club" style={{ display:"block" }}>
    <rect width="44" height="28" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
    <circle cx="17" cy="14" r="8.5" fill="none" stroke="#004A97" strokeWidth="2.5"/>
    <circle cx="27" cy="14" r="8.5" fill="none" stroke="#004A97" strokeWidth="2.5"/>
  </svg>
);
const LogoMP = () => (
  <svg viewBox="0 0 44 28" width="36" height="24" aria-label="Mercado Pago" style={{ display:"block" }}>
    <rect width="44" height="28" rx="4" fill="#009ee3"/>
    <text x="22" y="18" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900" fontFamily="Arial,sans-serif">MP</text>
  </svg>
);

const INITIAL_FORM = {
  nombre: "", dni: "", tel: "", email: "",
  apellido: "", direccion: "", extra: "",
  cp: "", ciudad: "", provincia: "Buenos Aires", notes: "",
};

export function CheckoutSheet({ onClose, allowCod = true, primaryColor = "#1b4d3e", primaryHover = "#153d31" }) {
  const navigate = useNavigate();
  const { items, totalPrice, updateQty, removeItem, clearCart, calcItemTotal: ctxCalc } = useCart();
  const calc = ctxCalc || calcItemTotal;

  const [step, setStep] = useState(0);
  const [delivery, setDelivery] = useState("correo");
  const [payment, setPayment] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const cartTime = useCountdown("pd_countdown", 18);
  const socialProofCount = useMemo(() => 18 + Math.floor(Math.random() * 12), []);
  const [sameAddr, setSameAddr] = useState(true);
  const [payOpen, setPayOpen] = useState(null); // null | 'card' | 'mp'
  const [submitting, setSubmitting] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [confirmedItems, setConfirmedItems] = useState([]);
  const [showCabaConfirm, setShowCabaConfirm] = useState(false);
  const [confirmedPaymentMethod, setConfirmedPaymentMethod] = useState(null); // 'cod' | 'mp' | 'card'
  const [stepTransition, setStepTransition] = useState("idle"); // "idle" | "exiting" | "entering"

  // ── Cupón de descuento ──
  const [couponOpen, setCouponOpen]       = useState(false);
  const [couponInput, setCouponInput]     = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError]     = useState("");
  // appliedCoupon: null | { code, type, value }
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // MP states
  const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY || null;
  const [mpLoaded, setMpLoaded] = useState(false);
  const [cardFormInstance, setCardFormInstance] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState(null);
  // MP redirect interstitial (step 3) — evita la redirección abrupta que causa abandono
  const [mpRedirectUrl, setMpRedirectUrl] = useState(null);
  const [mpCountdown, setMpCountdown] = useState(4);
  const cardFormRef = useRef(null);
  const processCardPaymentRef = useRef(null);

  const sheetRef = useRef(null);
  const totalItems = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

  // Full price (without promos) for savings calc
  // For bundle items use compareAtPrice when available (the "tachado" price)
  const fullPrice = items.reduce((s, i) => {
    if (i.bundleTotal && i.compareAtPrice) return s + Number(i.compareAtPrice);
    return s + (Number(i.price) || 0) * (Number(i.quantity) || 0);
  }, 0);
  const savings = Math.max(0, fullPrice - totalPrice);

  // Descuento del cupón — siempre en sincronía con totalPrice actual
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") return Math.round(totalPrice * appliedCoupon.value / 100);
    return Math.min(appliedCoupon.value, totalPrice);
  }, [appliedCoupon, totalPrice]);

  const finalTotal = Math.max(0, totalPrice - discountAmount);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => sheetRef.current?.classList.add("cs-sheet--open"));
  }, []);

  function setF(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: "" }));
  }

  function touchF(key) {
    setTouched(t => ({ ...t, [key]: true }));
  }

  function fieldOk(key) {
    if (!touched[key]) return false;
    if (errors[key]) return false;
    const val = form[key]?.trim() || "";
    if (key === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    return val.length > 0;
  }

  function handleClose() {
    if (step === 0 || step >= 3) { onClose(); return; }
    setShowExitIntent(true);
  }

  function goToStep(n) {
    setStepTransition("exiting");
    setTimeout(() => {
      setStep(n);
      setStepTransition("entering");
      setTimeout(() => setStepTransition("idle"), 300);
    }, 180);
  }

  // ── Captura silenciosa de carrito abandonado ──
  // Se dispara on blur cuando el cliente deja algún dato de contacto.
  // El backend hace upsert por teléfono o email, así que se puede llamar varias veces.
  function captureAbandoned(extra = {}) {
    const phone = (extra.phone ?? form.tel ?? "").trim();
    const email = (extra.email ?? form.email ?? "").trim();
    if (!phone && !email) return;
    if (!items || items.length === 0) return;

    const stepName =
      step === 0 ? "cart" :
      step === 1 ? "info" :
      step === 2 ? "payment" : "unknown";

    const payload = {
      phone,
      email,
      name: `${form.nombre || ""} ${form.apellido || ""}`.trim(),
      address: form.direccion || "",
      city: form.ciudad || "",
      province: form.provincia || "",
      postalCode: form.cp || "",
      items: items.map(i => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        imageUrl: i.imageUrl || i.image || null,
      })),
      total: totalPrice,
      totalItems,
      step: stepName,
      landingSource: typeof window !== "undefined" ? window.location.pathname : "",
      paymentMethod: payment === "mp" ? "mercadopago" : payment === "card" ? "card" : null,
      ...extra,
    };

    // Silencioso: nunca bloquea al usuario
    api.post("/abandoned-cart", payload).catch(() => {});
  }

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponApplying(true);
    setCouponError("");
    try {
      const res = await api.post("/coupons/validate", { code, cartTotal: totalPrice });
      if (res.data?.ok) {
        setAppliedCoupon(res.data.data);
        setCouponError("");
      } else {
        setCouponError(res.data?.message || "Código inválido.");
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(err?.response?.data?.message || "Código inválido o expirado.");
      setAppliedCoupon(null);
    } finally {
      setCouponApplying(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  }

  function validateStep1() {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!form.dni.trim()) e.dni = "El DNI es obligatorio.";
    if (!form.tel.trim()) e.tel = "El celular es obligatorio.";
    if (!form.email.trim()) e.email = "El email es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Email inválido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Crear el pedido en el backend y devolver el orderId ──
  async function createOrderInDB() {
    const cartItems = items.map(i => ({
      productId:      i.productId,
      name:           i.name,
      price:          i.price,
      quantity:       i.quantity,
      imageUrl:       i.imageUrl       || undefined,
      bundleTotal:    i.bundleTotal    || undefined,
      compareAtPrice: i.compareAtPrice || undefined,
    }));
    const res = await api.post("/orders", {
      customerName:    `${form.nombre} ${form.apellido}`.trim(),
      customerEmail:   form.email.trim(),
      customerDni:     form.dni.trim(),
      customerPhone:   form.tel,
      shippingAddress: [form.direccion, form.extra, form.ciudad, form.cp, form.provincia].filter(Boolean).join(", ") || form.provincia || "Sin especificar",
      shippingMethod:  delivery === "caba" ? "caba_cod" : "correo_argentino",
      paymentMethod:   payment === "mp" ? "mercadopago" : "card",
      notes:           [form.notes, appliedCoupon ? `Cupón: ${appliedCoupon.code}` : ""].filter(Boolean).join(" | ") || "",
      total:           finalTotal,
      items:           cartItems,
    });
    const data = res.data?.data || res.data;
    return data?._id || data?.orderId || null;
  }

  // ── Flujo MP: crear orden y redirigir a la app de Mercado Pago ──
  async function handleSubmit() {
    setSubmitting(true);
    try {
      const cartItems = items.map(i => ({
        productId:      i.productId,
        name:           i.name,
        price:          i.price,
        quantity:       i.quantity,
        imageUrl:       i.imageUrl       || undefined,
        bundleTotal:    i.bundleTotal    || undefined,
        compareAtPrice: i.compareAtPrice || undefined,
      }));
      const res = await api.post("/orders", {
        customerName:    `${form.nombre} ${form.apellido}`.trim(),
        customerEmail:   form.email.trim(),
        customerDni:     form.dni.trim(),
        customerPhone:   form.tel,
        shippingAddress: [form.direccion, form.extra, form.ciudad, form.cp, form.provincia].filter(Boolean).join(", ") || form.provincia || "Sin especificar",
        shippingMethod:  delivery === "caba" ? "caba_cod" : "correo_argentino",
        paymentMethod:   "mercadopago",
        notes:           [form.notes, appliedCoupon ? `Cupón: ${appliedCoupon.code}` : ""].filter(Boolean).join(" | ") || "",
        total:           finalTotal,
        items:           cartItems,
      });

      const isProd = import.meta.env.MODE === "production";
      const url = isProd
        ? res.data.init_point
        : res.data.sandbox_init_point || res.data.init_point;

      if (url) {
        // Purchase se dispara ANTES de la redirección porque una vez que el cliente
        // sale del sitio hacia MP ya no se puede trackear el evento.
        track("Purchase", {
          currency: "ARS",
          value: finalTotal,
          content_ids: items.map(i => i.productId),
          content_type: "product",
          num_items: totalItems,
        });
        setMpRedirectUrl(url);
        setMpCountdown(4);
        goToStep(3);
        setSubmitting(false);
        return;
      }

      // Fallback si no hay URL
      setErrors({ submit: "No se pudo conectar con Mercado Pago. Intentá de nuevo." });
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      setErrors({ submit: "Error al procesar el pedido. Intentá de nuevo." });
      setSubmitting(false);
    }
  }

  // ── Flujo COD (pagar al recibir — solo CABA) ──
  async function handleCodSubmit() {
    setSubmitting(true);
    try {
      const cartItems = items.map(i => ({
        productId:      i.productId,
        name:           i.name,
        price:          i.price,
        quantity:       i.quantity,
        imageUrl:       i.imageUrl       || undefined,
        bundleTotal:    i.bundleTotal    || undefined,
        compareAtPrice: i.compareAtPrice || undefined,
      }));
      await api.post("/orders", {
        customerName:    `${form.nombre} ${form.apellido}`.trim(),
        customerEmail:   form.email.trim(),
        customerDni:     form.dni.trim(),
        customerPhone:   form.tel,
        shippingAddress: [form.direccion, form.extra, form.ciudad, form.cp, form.provincia].filter(Boolean).join(", ") || form.provincia || "Sin especificar",
        shippingMethod:  "caba_cod",
        paymentMethod:   "cod",
        notes:           ["Pago al recibir", form.notes, appliedCoupon ? `Cupón: ${appliedCoupon.code}` : ""].filter(Boolean).join(". "),
        total:           finalTotal,
        items:           cartItems,
      });
      track("Purchase", { currency: "ARS", value: finalTotal, content_ids: items.map(i => i.productId), num_items: totalItems });
      setConfirmedTotal(finalTotal);
      setConfirmedItems([...items]);
      setConfirmedPaymentMethod("cod");
      clearCart();
      setShowCabaConfirm(false);
      goToStep(4);
    } catch (err) {
      console.error(err);
      setErrors({ submit: "Error al registrar el pedido. Intentá de nuevo." });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Countdown del interstitial MP: auto-redirige cuando llega a 0 ──
  useEffect(() => {
    if (step !== 3 || !mpRedirectUrl) return;
    if (mpCountdown <= 0) {
      window.location.href = mpRedirectUrl;
      return;
    }
    const t = setTimeout(() => setMpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, mpRedirectUrl, mpCountdown]);

  // ── Flujo tarjeta: se llama desde el callback onSubmit del CardForm ──
  async function processCardPayment({ token, paymentMethodId, issuerId, installments, amount, email, identificationType, identificationNumber }) {
    setProcessingPayment(true);
    try {
      // 1. Crear el pedido en DB primero
      let orderId = savedOrderId;
      if (!orderId) {
        orderId = await createOrderInDB();
        setSavedOrderId(orderId);
      }

      // 2. Procesar pago con tarjeta
      const res = await api.post("/orders/card-payment", {
        token, paymentMethodId, issuerId, installments, amount,
        email: email || "comprador@boomhauss.com",
        identificationType, identificationNumber,
        customerName: `${form.nombre} ${form.apellido}`.trim(),
        orderId,
      });

      const { status, statusDetail } = res.data;

      if (status === "approved") {
        track("Purchase", { currency: "ARS", value: Number(amount), content_ids: items.map(i => i.productId), num_items: totalItems });
        setConfirmedTotal(Number(amount));
        setConfirmedItems([...items]);
        setConfirmedPaymentMethod("card");
        clearCart();
        goToStep(4);
      } else if (status === "in_process") {
        setErrors({ submit: "Tu pago está siendo procesado. Te notificaremos cuando se confirme." });
      } else {
        setErrors({ submit: `Pago rechazado: ${statusDetail || status}. Probá con otra tarjeta.` });
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrors({ submit: err.response?.data?.message || "Error al procesar el pago. Intentá de nuevo." });
    } finally {
      setProcessingPayment(false);
    }
  }

  // ── Mantener ref de processCardPayment siempre actualizada (evita stale closure) ──
  processCardPaymentRef.current = processCardPayment;

  // ── Cargar script SDK de MP ──
  useEffect(() => {
    if (!window.MercadoPago) {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => setMpLoaded(true);
      document.head.appendChild(script);
    } else {
      setMpLoaded(true);
    }
    return () => {
      if (cardFormRef.current) {
        try { cardFormRef.current.unmount(); } catch {}
      }
    };
  }, []);

  // ── Montar cardForm (iframe: false) cuando elige "card" ──
  useEffect(() => {
    if (payment !== "card" || !mpLoaded || !mpPublicKey) return;

    const timer = setTimeout(() => {
      // Si los elementos no existen aun en el DOM, salir
      if (!document.getElementById("cs-card-form")) return;
      try {
        const mp = new window.MercadoPago(mpPublicKey, { locale: "es-AR" });
        const cf = mp.cardForm({
          amount: String(totalPrice),
          iframe: false,
          form: {
            id: "cs-card-form",
            cardNumber:           { id: "cs-inp-cardNumber",   placeholder: "Numero de tarjeta" },
            expirationDate:       { id: "cs-inp-expiration",   placeholder: "MM/AA" },
            securityCode:         { id: "cs-inp-cvv",          placeholder: "CVV" },
            cardholderName:       { id: "cs-inp-name",         placeholder: "Titular de la tarjeta" },
            issuer:               { id: "cs-inp-issuer" },
            installments:         { id: "cs-inp-installments" },
            identificationType:   { id: "cs-inp-docType" },
            identificationNumber: { id: "cs-inp-docNumber",   placeholder: "Numero de documento" },
            cardholderEmail:      { id: "cs-inp-email" },
          },
          callbacks: {
            onFormMounted: err => {
              if (err) console.warn("MP cardForm mount error:", err);
            },
            onSubmit: async event => {
              event.preventDefault();
              const data = cf.getCardFormData();
              await processCardPaymentRef.current({
                token:                data.token,
                paymentMethodId:      data.paymentMethodId,
                issuerId:             data.issuerId,
                installments:         data.installments,
                amount:               data.amount,
                email:                data.cardholderEmail,
                identificationType:   data.identificationType,
                identificationNumber: data.identificationNumber,
              });
            },
            onError: errs => console.warn("MP cardForm errors:", errs),
          },
        });
        cardFormRef.current = cf;
        setCardFormInstance(cf);
      } catch (e) {
        console.error("Error montando MP CardForm:", e);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (cardFormRef.current) {
        try { cardFormRef.current.unmount(); } catch {}
        cardFormRef.current = null;
        setCardFormInstance(null);
      }
    };
  }, [payment, mpLoaded, mpPublicKey]);

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) handleClose();
  }

  function togglePayOption(opt) {
    if (payOpen === opt) { setPayOpen(null); setPayment(null); }
    else { setPayOpen(opt); setPayment(opt); }
  }

  const firstImg = items[0]?.imageUrl || items[0]?.image || null;

  return (
    <>
      <style>{`
        @keyframes csSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes csSlideDown {
          from { max-height: 0; opacity: 0; }
          to   { max-height: 800px; opacity: 1; }
        }
        @keyframes csPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(29,158,117,.5); }
          50%      { box-shadow: 0 0 0 6px rgba(29,158,117,0); }
        }
        .cs-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          display: flex; align-items: flex-end; justify-content: center;
        }
        @media (min-width: 768px) {
          .cs-overlay { align-items: center; }
          .cs-sheet { max-width: 480px !important; border-radius: 16px !important; max-height: 92vh !important; }
        }
        .cs-sheet {
          background: #fff; width: 100%; border-radius: 20px 20px 0 0;
          max-height: 92vh; display: flex; flex-direction: column;
          transform: translateY(100%); opacity: 0;
          transition: transform .38s cubic-bezier(.22,1,.36,1), opacity .28s ease;
          overflow: hidden;
        }
        .cs-sheet--open { transform: translateY(0) !important; opacity: 1 !important; }
        /* ── Navbar unificado ── */
        .cs-nav {
          display: flex; align-items: center; height: 56px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0; background: #fff; padding: 0 4px;
        }
        .cs-nav-side {
          display: flex; align-items: center; min-width: 88px;
        }
        .cs-nav-side--right { justify-content: flex-end; gap: 2px; }
        .cs-nav-center {
          flex: 1; text-align: center;
          font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -.01em;
        }
        .cs-nav-btn {
          display: flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; background: none; border: none;
          cursor: pointer; border-radius: 10px; color: #444;
          transition: background .12s; flex-shrink: 0;
        }
        .cs-nav-btn:hover { background: #f5f5f7; }
        .cs-nav-back {
          display: flex; align-items: center; gap: 4px;
          background: none; border: none; cursor: pointer;
          border-radius: 10px; color: #444; padding: 8px 10px 8px 6px;
          font-size: 13px; font-weight: 700; transition: background .12s;
          white-space: nowrap;
        }
        .cs-nav-back:hover { background: #f5f5f7; }
        .cs-nav-secure {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 800; color: #1D9E75;
          background: #f0fdf4; border: 1px solid #d1fae5;
          border-radius: 999px; padding: 4px 10px; white-space: nowrap;
          margin-right: 2px;
        }

        .cs-body { overflow-y: auto; flex: 1; padding: 0 0 24px; }
        .cs-body::-webkit-scrollbar { width: 4px; }
        .cs-body::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
        @keyframes csStepIn  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes csStepOut { from { opacity:1; transform:translateY(0); }   to { opacity:0; transform:translateY(-10px); } }
        .cs-body--entering { animation: csStepIn  .30s cubic-bezier(.22,1,.36,1) both; }
        .cs-body--exiting  { animation: csStepOut .18s cubic-bezier(.55,0,.1,1) both; pointer-events:none; overflow:hidden; }

        /* Floating label */
        .cs-field { position: relative; }
        .cs-field input, .cs-field select, .cs-field textarea {
          width: 100%; box-sizing: border-box;
          padding: 22px 14px 8px; font-size: 15px; font-weight: 600;
          border: 1.5px solid #e0e0e0; border-radius: 10px;
          background: #fff; color: var(--text);
          outline: none; transition: border-color .18s, box-shadow .18s;
          -webkit-appearance: none; appearance: none;
        }
        .cs-field input:focus, .cs-field select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(27,77,62,.08);
        }
        .cs-field input.cs-err, .cs-field select.cs-err { border-color: #c0392b !important; }
        .cs-field label {
          position: absolute; left: 14px; right: 14px; top: 50%; transform: translateY(-50%);
          font-size: 14px; font-weight: 600; color: #888;
          transition: all .16s ease; pointer-events: none;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cs-field input:focus ~ label,
        .cs-field input.hv ~ label,
        .cs-field select ~ label,
        .cs-field textarea:focus ~ label,
        .cs-field textarea.hv ~ label {
          top: 10px; transform: none; font-size: 11px; color: #999; font-weight: 700;
        }
        .cs-field textarea { padding-top: 26px; padding-bottom: 10px; }
        .cs-field textarea ~ label { top: 18px; transform: none; }
        .cs-field-err { font-size: 12px; color: #c0392b; font-weight: 700; margin-top: 4px; }
        .cs-field select ~ label { top: 10px; transform: none; font-size: 11px; color: #999; font-weight: 700; }

        /* (legacy removed) */

        /* Radio shipping/pay cards */
        .cs-opt {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 16px; border: 1.5px solid #d0d0d0; border-radius: 10px;
          cursor: pointer; transition: border-color .15s, background .15s;
        }
        .cs-opt.cs-opt--active { border-color: var(--primary); background: rgba(27,77,62,.04); }
        .cs-opt input[type=radio] { width: 18px; height: 18px; accent-color: var(--primary); flex-shrink: 0; margin-top: 2px; }

        /* ── Payment step 2 redesign ── */
        .cs-ship-summary {
          display: flex; align-items: center; justify-content: space-between;
          background: #f8fafc; border: 1.5px solid #e2e8f0;
          border-radius: 10px; padding: 11px 14px; margin-bottom: 20px;
        }
        .cs-pay-section-hdr { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .cs-pay-section-line { flex: 1; height: 1px; background: #e5e7eb; }
        .cs-pay-section-ttl { font-size: 13px; font-weight: 900; color: #1a1a1a; text-transform: uppercase; letter-spacing: .12em; white-space: nowrap; }
        .cs-pay-ssl-row { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: #9ca3af; margin-bottom: 14px; }
        .cs-pcard { border: 1.5px solid #e2e8f0; border-radius: 10px; background: #fff; overflow: hidden; transition: border-color .15s, box-shadow .15s; }
        .cs-pcard--open { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(27,77,62,.07); }
        .cs-pcard-row {
          display: flex; align-items: center; gap: 11px;
          padding: 15px 16px; cursor: pointer; min-height: 58px;
        }
        .cs-pcard-row:hover { background: #fafafa; }
        .cs-pcard-row input[type=radio] { width: 18px; height: 18px; accent-color: var(--primary); flex-shrink: 0; }
        .cs-pcard-lbl { flex: 1; font-size: 14.5px; font-weight: 700; color: #1a1a1a; }
        .cs-pcard-logos { display: flex; align-items: center; gap: 4px; }
        .cs-pcard-chev { color: #c0c0c0; flex-shrink: 0; transition: transform .2s; }
        .cs-pcard-chev--open { transform: rotate(180deg); }
        .cs-pcard-body { padding: 0 16px 16px; border-top: 1.5px solid #f3f4f6; }
        /* MP panel */
        .cs-mp2 { padding-top: 16px; }
        .cs-mp2-title { font-size: 15.5px; font-weight: 800; color: #1a1a1a; text-align: center; margin-bottom: 14px; line-height: 1.3; }
        .cs-mp2-bullets { display: flex; flex-direction: column; gap: 11px; margin-bottom: 16px; }
        .cs-mp2-bullet { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; font-weight: 600; color: #374151; line-height: 1.5; }
        .cs-mp2-bullet strong { font-weight: 800; color: #1e293b; }
        .cs-mp2-logos { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .cs-mp2-footer { display: flex; align-items: center; gap: 11px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 11px 13px; }
        .cs-mp2-footer-main { font-size: 13px; font-weight: 800; color: #1e293b; line-height: 1.3; }
        .cs-mp2-footer-sub { font-size: 11.5px; font-weight: 600; color: #94a3b8; margin-top: 2px; }
        .cs-card-brands-row { display: flex; align-items: center; gap: 7px; margin-top: 14px; padding-top: 12px; border-top: 1.5px solid #f3f4f6; }
        .cs-card-brands-lbl { font-size: 11px; font-weight: 700; color: #9ca3af; margin-right: 2px; white-space: nowrap; }

        /* Progress bar */
        .cs-progress { display: flex; align-items: center; gap: 0; padding: 16px 24px 0; }
        .cs-step-circle {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 900; border: 2px solid #d0d0d0;
          background: #fff; color: #aaa; transition: all .2s;
        }
        .cs-step-circle.active { background: var(--primary); border-color: var(--primary); color: #fff; }
        .cs-step-circle.done { background: #1D9E75; border-color: #1D9E75; color: #fff; }
        .cs-step-line { flex: 1; height: 2px; background: #e0e0e0; }
        .cs-step-line.done { background: #1D9E75; }
        .cs-step-label { font-size: 11px; font-weight: 700; color: #aaa; margin-top: 4px; text-align: center; }
        .cs-step-label.active { color: var(--primary); }
        .cs-step-label.done { color: #1D9E75; }

        /* Summary collapsible */
        .cs-summary-toggle {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px; cursor: pointer; border-bottom: 1px solid var(--border);
          background: var(--bg);
        }
        .cs-summary-items { background: #fff; border-bottom: 1px solid var(--border); padding: 12px 20px; }

        /* Pay panel */
        .cs-pay-panel { overflow: hidden; animation: csSlideDown .22s ease forwards; }

        /* Benefit bar (legacy) */
        .cs-benefits { background: #f0fdf8; border-bottom: 1px solid #b7f0dc; padding: 12px 20px; display: flex; align-items: center; justify-content: space-evenly; gap: 4px; }
        .cs-benefits-item { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 11px; font-weight: 800; color: #0a5c3a; }
        .cs-benefits-line { width: 28px; height: 2px; background: #34d399; border-radius: 2px; }

        /* ✨ Hero benefits — envío gratis protagonista + regalos si aplica */
        .cs-hero-benefits {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px 16px 12px;
          background: linear-gradient(180deg, #ecfdf5 0%, #f0fdf8 100%);
          border-bottom: 1px solid #b7f0dc;
        }
        .cs-hero-free,
        .cs-hero-gifts {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 12px;
          background: #fff;
          border: 1.5px solid #34d399;
          box-shadow: 0 4px 12px rgba(15,157,110,.08);
        }
        .cs-hero-gifts {
          border-color: #f59e0b;
          background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%);
          box-shadow: 0 4px 14px rgba(245,158,11,.15);
          animation: csGiftPulse 2.4s ease-in-out infinite;
        }
        @keyframes csGiftPulse {
          0%,100% { box-shadow: 0 4px 14px rgba(245,158,11,.15); }
          50%     { box-shadow: 0 6px 22px rgba(245,158,11,.28); }
        }
        .cs-hero-free-ico,
        .cs-hero-gifts-ico {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          font-size: 20px;
          background: #d1fae5;
        }
        .cs-hero-gifts-ico { background: #fde68a; }
        .cs-hero-free-txt,
        .cs-hero-gifts-txt { flex: 1; min-width: 0; }
        .cs-hero-free-title {
          font-size: 14px;
          font-weight: 1000;
          color: #065f46;
          letter-spacing: .02em;
          line-height: 1.15;
        }
        .cs-hero-free-sub {
          font-size: 11.5px;
          font-weight: 700;
          color: #047857;
          margin-top: 2px;
        }
        .cs-hero-gifts-title {
          font-size: 14px;
          font-weight: 1000;
          color: #92400e;
          letter-spacing: .02em;
          line-height: 1.15;
        }
        .cs-hero-gifts-sub {
          font-size: 11.5px;
          font-weight: 700;
          color: #b45309;
          margin-top: 2px;
        }

        /* Payment logos */
        .cs-pay-logos { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .cs-logo-badge { background: #f4f6f8; border: 1px solid #e0e0e0; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 900; color: #555; letter-spacing: .03em; display:inline-flex; align-items:center; }
        .cs-logo-rapi { background: #e21e2e; color: #fff; }
        .cs-logo-pf   { background: #f4a900; color: #fff; }

        /* Totals */
        .cs-totals { display: flex; flex-direction: column; gap: 8px; }
        .cs-total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: rgba(11,18,32,.65); }
        .cs-total-row.final { font-size: 18px; font-weight: 900; color: var(--text); border-top: 1.5px solid var(--border); padding-top: 10px; margin-top: 4px; }

        /* Coupon field — discreto */
        .cs-coupon-toggle {
          display: inline-block; margin-top: 12px;
          font-size: 12px; font-weight: 600; color: #aaa;
          cursor: pointer; background: none; border: none; padding: 0;
          text-decoration: none; letter-spacing: .01em;
          transition: color .15s;
        }
        .cs-coupon-toggle:hover { color: #888; }
        @keyframes csCouponIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cs-coupon-body { animation: csCouponIn .18s ease forwards; margin-top: 8px; }
        .cs-coupon-row { display: flex; gap: 7px; }
        .cs-coupon-row input {
          flex: 1; height: 38px; border: 1px solid #ddd; border-radius: 7px;
          padding: 0 10px; font-size: 13px; font-weight: 700; background: #fafafa;
          color: var(--text); outline: none; text-transform: uppercase; letter-spacing: .5px;
          transition: border-color .15s;
        }
        .cs-coupon-row input:focus { border-color: #aaa; background: #fff; }
        .cs-coupon-row input.cs-coupon-applied { border-color: #1D9E75; background: #f0fdf4; color: #1D9E75; }
        .cs-coupon-row input:disabled { opacity: .8; cursor: default; }
        .cs-coupon-btn {
          height: 38px; padding: 0 13px; border: 1px solid #ccc; border-radius: 7px;
          background: #f4f4f4; color: #555; font-size: 12px; font-weight: 800;
          cursor: pointer; white-space: nowrap; transition: background .15s, border-color .15s;
          flex-shrink: 0;
        }
        .cs-coupon-btn:hover:not(:disabled) { background: #e8e8e8; border-color: #bbb; }
        .cs-coupon-btn:disabled { opacity: .45; cursor: not-allowed; }
        .cs-coupon-btn.remove { background: #f4f4f4; color: #888; border-color: #ddd; }
        .cs-coupon-btn.remove:hover { background: #eee; }
        .cs-coupon-err { font-size: 11.5px; font-weight: 700; color: #c0392b; margin-top: 5px; }
        .cs-coupon-ok  { font-size: 11.5px; font-weight: 700; color: #1D9E75; margin-top: 5px; }

        /* CTA button */
        .cs-cta {
          width: 100%; padding: 15px; border: none; border-radius: 10px;
          font-size: 16px; font-weight: 900; cursor: pointer;
          background: var(--primary); color: #fff;
          transition: background .15s, transform .1s;
        }
        .cs-cta:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }
        .cs-cta:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* Confirm success (legacy) */
        .cs-confirm { text-align: center; padding: 40px 24px; }
        .cs-confirm-icon { font-size: 56px; margin-bottom: 12px; }

        /* ── Step 4 confirmation redesign ── */
        @keyframes csCheckCircleIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes csCheckDraw {
          from { stroke-dashoffset: 30; }
          to   { stroke-dashoffset: 0; }
        }
        .cs-confirm4 {
          text-align: center; padding: 40px 24px 32px;
          animation: csFadeUp .4s cubic-bezier(.22,1,.36,1) both;
        }
        .cs-confirm4-circle {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--primary);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 12px 32px rgba(0,0,0,.18);
          animation: csCheckCircleIn .5s cubic-bezier(.22,1,.36,1) both;
        }
        .cs-confirm4-check {
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
          animation: csCheckDraw .45s cubic-bezier(.22,1,.36,1) .35s both;
        }
        .cs-confirm4-title {
          font-size: 24px; font-weight: 900; color: var(--text);
          margin: 0 0 8px; line-height: 1.2;
        }
        .cs-confirm4-sub {
          font-size: 14px; font-weight: 600; color: #64748b;
          margin: 0 auto 24px; line-height: 1.6; max-width: 300px;
        }
        .cs-confirm4-details {
          background: #f8faff; border: 1.5px solid var(--border);
          border-radius: 14px; padding: 4px 16px; text-align: left; margin-bottom: 20px;
        }
        .cs-confirm4-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0; font-size: 13px; font-weight: 700;
          border-bottom: 1px solid var(--border);
        }
        .cs-confirm4-row:last-child { border-bottom: none; }
        .cs-confirm4-label { color: #888; }
        .cs-confirm4-val { color: var(--text); font-weight: 900; }
        .cs-confirm4-val--green { color: #1D9E75; font-weight: 900; }
        .cs-confirm4-val--total { font-size: 17px; color: var(--primary); }
        .cs-confirm4-wa {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 14px 0; border-radius: 12px;
          background: #25d366; color: #fff; font-weight: 900; font-size: 15px;
          text-decoration: none; margin-bottom: 10px;
          box-shadow: 0 8px 20px rgba(37,211,102,.25);
          transition: filter .15s;
        }
        .cs-confirm4-wa:hover { filter: brightness(1.07); }
        .cs-confirm4-close {
          width: 100%; padding: 12px 0; border-radius: 12px;
          border: 1.5px solid var(--border2); background: transparent;
          color: var(--text); font-weight: 800; font-size: 14px; cursor: pointer;
          transition: background .12s;
        }
        .cs-confirm4-close:hover { background: #f5f7fa; }

        /* Divider */
        .cs-divider { height: 8px; background: #f5f7fa; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin: 20px 0; }

        /* Back link */
        .cs-back { background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 700; color: var(--text); text-decoration: underline; padding: 0; }

        /* Sticky CTA footer — always visible at bottom of modal */
        .cs-footer {
          flex-shrink: 0;
          padding: 12px 20px 16px;
          border-top: 1.5px solid var(--border);
          background: #fff;
        }

        /* Total box step 2 */
        .cs-total-box { display: flex; align-items: center; gap: 14px; background: #f8faff; border: 1.5px solid var(--border); border-radius: 10px; padding: 14px 16px; }

        /* Policies */
        .cs-policies { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; font-size: 11px; }
        .cs-policies a { color: #999; text-decoration: underline; font-weight: 600; }

        /* ✓ Field valid indicator */
        .cs-field-ok { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #1D9E75; font-size: 16px; font-weight: 900; pointer-events: none; }

        /* Countdown pill in cart */
        .cs-cd-pill { display: inline-flex; align-items: center; gap: 6px; background: #0b172a; color: #fff; border-radius: 999px; padding: 5px 14px; font-size: 12px; font-weight: 900; letter-spacing: .03em; }
        .cs-cd-pill-time { font-variant-numeric: tabular-nums; color: #f59e0b; }

        /* Trust row (step 1 bottom) */
        .cs-trust-row { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; padding: 10px 0 4px; }
        .cs-trust-item { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; color: #64748b; }

        /* Exit intent overlay */
        .cs-exit-overlay { position: fixed; inset: 0; z-index: 10999; background: rgba(0,0,0,.65); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .cs-exit-card { background: #fff; border-radius: 16px; padding: 28px 24px; max-width: 340px; width: 100%; text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,.25); }
        .cs-exit-emoji { font-size: 44px; margin-bottom: 10px; }
        .cs-exit-title { font-size: 20px; font-weight: 900; color: #0b1220; margin: 0 0 8px; line-height: 1.2; }
        .cs-exit-sub { font-size: 13px; font-weight: 600; color: #64748b; margin: 0 0 20px; line-height: 1.5; }
        .cs-exit-stay { width: 100%; padding: 13px; border: none; border-radius: 10px; font-size: 15px; font-weight: 900; cursor: pointer; background: var(--primary); color: #fff; margin-bottom: 10px; }
        .cs-exit-leave { width: 100%; padding: 10px; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; background: none; color: #aaa; }
        .cs-exit-leave:hover { color: #666; }

        /* ── Card form (inputs manuales, cada campo es una card) ── */
        .cs-card-form {
          display: flex; flex-direction: column; gap: 8px;
          margin-top: 14px; margin-bottom: 14px;
        }
        .cs-card-field {
          position: relative;
          border: 1.5px solid #e0e0e0; border-radius: 10px;
          background: #fff; min-height: 56px;
          display: flex; flex-direction: column; justify-content: center;
          padding: 0 44px 0 14px;
          transition: border-color .15s, box-shadow .15s; cursor: text;
        }
        .cs-card-field:focus-within { border-color: #555; box-shadow: 0 0 0 3px rgba(0,0,0,.05); }
        .cs-card-field--err { border-color: #c0392b !important; }

        /* Label flotante */
        .cs-card-lbl {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          font-size: 15px; color: #999; pointer-events: none;
          transition: top .15s, font-size .15s, color .15s, transform .15s;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: calc(100% - 50px); line-height: 1;
        }
        .cs-card-field--hv .cs-card-lbl,
        .cs-card-field:focus-within .cs-card-lbl {
          top: 11px; transform: none; font-size: 11px; color: #888;
        }

        /* Input */
        .cs-card-inp {
          border: none; outline: none; background: transparent;
          font-size: 15px; font-weight: 600; color: #1a1a1a;
          width: 100%; padding: 20px 0 6px; line-height: 1.2;
          -webkit-appearance: none; appearance: none;
          font-family: inherit; box-sizing: border-box;
        }
        .cs-card-field:not(.cs-card-field--hv):not(:focus-within) .cs-card-inp {
          padding: 0;
        }

        /* Iconos derecha */
        .cs-card-ico {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          color: #bbb; pointer-events: none;
        }
        .cs-card-ico--lock { font-size: 16px; }
        .cs-card-ico--cvv {
          width: 20px; height: 20px;
          border: 1.5px solid #ccc; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #888;
        }

        /* Botón limpiar nombre */
        .cs-card-clear {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: transparent; border: none; color: #aaa;
          font-size: 16px; cursor: pointer; line-height: 1; padding: 4px;
        }
        .cs-card-clear:hover { color: #555; }

        /* Error inline */
        .cs-card-err {
          font-size: 11px; color: #c0392b; font-weight: 700;
          margin-top: 2px; padding-bottom: 6px;
        }

        /* Auto-float: MP manages placeholder, so field always looks "filled" once mounted */
        .cs-card-field--auto .cs-card-inp::placeholder { color: #999; font-weight: 400; }
        .cs-card-field--auto .cs-card-inp:not(:placeholder-shown) ~ .cs-card-lbl,
        .cs-card-field--auto .cs-card-inp:focus ~ .cs-card-lbl {
          top: 11px; transform: none; font-size: 11px; color: #888;
        }

        /* Fila de dos campos */
        .cs-card-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        /* Select (Documento) */
        .cs-card-field--sel { padding-right: 32px; }
        .cs-card-sel { appearance: none; -webkit-appearance: none; cursor: pointer; }
        .cs-card-arrow {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          font-size: 13px; color: #aaa; pointer-events: none;
        }

        .mp-loading { text-align: center; padding: 24px; color: #aaa; font-size: 13px; font-weight: 600; }
        .mp-not-ready { background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 12px 14px; font-size: 13px; font-weight: 700; color: #7c5a00; }

        /* ══════ Mercado Pago panel (step 2) ══════ */
        .cs-mp-panel {
          margin-top: 10px;
          background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
          border: 1.5px solid #009ee3;
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 6px 20px rgba(0,158,227,.10);
        }
        .cs-mp-panel-head {
          display: flex; align-items: center; gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #dbeafe;
        }
        .cs-mp-logo-wrap { flex-shrink: 0; }
        .cs-mp-head-txt { flex: 1; min-width: 0; }
        .cs-mp-head-title {
          font-size: 14px; font-weight: 900; color: #0b1220;
          line-height: 1.2;
        }
        .cs-mp-head-sub {
          font-size: 11.5px; font-weight: 700; color: #475569;
          margin-top: 3px; line-height: 1.3;
        }
        .cs-mp-benefits {
          list-style: none;
          margin: 12px 0 10px;
          padding: 0;
          display: flex; flex-direction: column; gap: 8px;
        }
        .cs-mp-benefits li {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 12.5px; font-weight: 700; color: #1e293b;
          line-height: 1.4;
        }
        .cs-mp-check {
          flex-shrink: 0;
          width: 18px; height: 18px;
          display: inline-flex; align-items: center; justify-content: center;
          background: #009ee3; color: #fff;
          border-radius: 50%;
          font-size: 11px; font-weight: 900;
          margin-top: 1px;
        }
        .cs-mp-trust {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; flex-wrap: wrap;
          padding: 8px 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-top: 2px;
        }
        .cs-mp-trust-item {
          font-size: 10.5px; font-weight: 900;
          color: #0f766e; letter-spacing: .02em;
        }
        .cs-mp-trust-dot { color: #cbd5e1; font-weight: 900; }

        /* Banner envío gratis — hereda color de la landing */
        .cs-ship-banner {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 16px;
          background: transparent;
          border-bottom: 1px solid rgba(0,0,0,.07);
          flex-wrap: wrap;
        }
        .cs-ship-banner-text {
          font-size: 12px; font-weight: 800;
          color: var(--primary);
        }

        /* ══════ Interstitial MP (step 3) ══════ */
        @keyframes csSpin { to { transform: rotate(360deg); } }
        @keyframes csPulseRing {
          0% { box-shadow: 0 0 0 0 rgba(0,158,227,.5); }
          70% { box-shadow: 0 0 0 18px rgba(0,158,227,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,158,227,0); }
        }
        @keyframes csFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cs-mp-inter {
          padding: 28px 22px 24px;
          text-align: center;
          animation: csFadeUp .35s ease forwards;
        }
        .cs-mp-inter-logo {
          display: inline-flex;
          align-items: center; justify-content: center;
          width: 72px; height: 72px;
          background: #009ee3;
          border-radius: 50%;
          margin: 0 auto 14px;
          animation: csPulseRing 2s ease-out infinite;
        }
        .cs-mp-inter-check {
          display: inline-flex;
          align-items: center; justify-content: center;
          width: 54px; height: 54px;
          border-radius: 50%;
          background: #10b981; color: #fff;
          font-size: 28px; font-weight: 900;
          margin: 0 auto 12px;
          box-shadow: 0 10px 24px rgba(16,185,129,.35);
        }
        .cs-mp-inter-title {
          font-size: 20px; font-weight: 900;
          color: #0b1220;
          margin: 0 0 6px;
          line-height: 1.2;
        }
        .cs-mp-inter-sub {
          font-size: 13.5px; font-weight: 600;
          color: #64748b;
          margin: 0 0 20px;
          line-height: 1.5;
          max-width: 360px;
          margin-left: auto; margin-right: auto;
        }
        .cs-mp-inter-card {
          background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
          border: 1.5px solid #009ee3;
          border-radius: 14px;
          padding: 16px;
          margin: 0 auto 18px;
          max-width: 380px;
          box-shadow: 0 10px 28px rgba(0,158,227,.12);
        }
        .cs-mp-inter-brand {
          display: flex; align-items: center; justify-content: center;
          gap: 8px;
          padding-bottom: 12px; margin-bottom: 12px;
          border-bottom: 1px dashed #bae6fd;
        }
        .cs-mp-inter-brand-txt {
          font-size: 11px; font-weight: 800;
          color: #0369a1;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .cs-mp-inter-total-lbl {
          font-size: 11px; font-weight: 800;
          color: #64748b;
          letter-spacing: .06em;
          text-transform: uppercase;
        }
        .cs-mp-inter-total {
          font-size: 30px; font-weight: 1000;
          color: #0b1220;
          letter-spacing: -.02em;
          margin-top: 2px;
          line-height: 1;
        }
        .cs-mp-inter-name {
          font-size: 12.5px; font-weight: 700;
          color: #475569;
          margin-top: 8px;
        }
        .cs-mp-inter-spinner {
          width: 22px; height: 22px;
          border: 2.5px solid #e0f2fe;
          border-top-color: #009ee3;
          border-radius: 50%;
          animation: csSpin .9s linear infinite;
          display: inline-block;
          vertical-align: middle;
        }
        .cs-mp-inter-count {
          display: flex; align-items: center; justify-content: center;
          gap: 10px;
          font-size: 13px; font-weight: 800;
          color: #0369a1;
          margin-bottom: 16px;
        }
        .cs-mp-inter-cta {
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          padding: 15px 18px;
          border: none;
          border-radius: 12px;
          background: #009ee3;
          color: #fff;
          font-size: 15.5px; font-weight: 900;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          gap: 8px;
          box-shadow: 0 10px 24px rgba(0,158,227,.30);
          transition: transform .12s, box-shadow .18s;
        }
        .cs-mp-inter-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(0,158,227,.38);
        }
        .cs-mp-inter-trust {
          display: flex; align-items: center; justify-content: center;
          gap: 14px; flex-wrap: wrap;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #e2e8f0;
        }
        .cs-mp-inter-trust-item {
          display: flex; align-items: center; gap: 4px;
          font-size: 10.5px; font-weight: 800;
          color: #475569;
          letter-spacing: .02em;
        }
        .cs-mp-inter-back {
          background: none; border: none; cursor: pointer;
          font-size: 12.5px; font-weight: 700;
          color: #94a3b8;
          text-decoration: underline;
          margin-top: 14px;
          padding: 6px;
        }

        /* ── Payment detail view (replace accordion with nav pattern) ── */
        .cs-pay-detail {
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
        }
        .cs-pay-view-hdr {
          display: flex; align-items: center; gap: 10px;
          padding: 13px 16px;
          border-bottom: 1.5px solid #f1f5f9;
          background: #fafbfc;
        }
        .cs-pay-view-back {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px;
          border: none; background: none; cursor: pointer;
          color: #64748b; border-radius: 7px; flex-shrink: 0;
          transition: background .12s, color .12s;
        }
        .cs-pay-view-back:hover { background: #e2e8f0; color: #1e293b; }
        .cs-pay-view-hdr-ttl {
          font-size: 13.5px; font-weight: 800; color: #1a1a1a; flex: 1;
        }
        .cs-pay-change {
          background: none; border: none; cursor: pointer;
          font-size: 12px; font-weight: 700; color: #94a3b8;
          text-decoration: underline; text-underline-offset: 2px;
          padding: 4px 6px; transition: color .15s;
        }
        .cs-pay-change:hover { color: #475569; }

        /* Dark CTA for payment step */
        .cs-cta--dark { background: #1e293b !important; }
        .cs-cta--dark:hover:not(:disabled) { background: #0f172a !important; transform: translateY(-1px); }
      `}</style>

      {/* ══════ CABA CONFIRM MODAL ══════ */}
      {showCabaConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, maxWidth: 400, width: "100%", padding: "32px 28px 28px", boxShadow: "0 24px 60px rgba(0,0,0,.25)", textAlign: "center" }}>
            {/* Icon */}
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32, boxShadow: "0 8px 20px rgba(52,211,153,.20)" }}>
              🛵
            </div>
            <h3 style={{ fontWeight: 900, fontSize: 20, color: "#0b1220", margin: "0 0 8px", lineHeight: 1.2 }}>
              Entrega en CABA
            </h3>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>
              Esta modalidad de <strong>pago al recibir</strong> está disponible <strong>únicamente para Ciudad Autónoma de Buenos Aires (CABA)</strong>.<br />
              Confirmá que tu dirección está en CABA para continuar.
            </p>

            {/* Address preview */}
            {(form.direccion || form.ciudad) && (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", marginBottom: 20, textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Tu dirección</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                  {[form.direccion, form.extra, form.ciudad, form.cp].filter(Boolean).join(", ")}
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <button
              disabled={submitting}
              onClick={handleCodSubmit}
              style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#1b4d3e,#2d7a5e)", color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", marginBottom: 10, boxShadow: "0 8px 20px rgba(27,77,62,.25)", transition: "transform .12s, box-shadow .18s" }}
            >
              {submitting ? "Confirmando pedido..." : "Sí, estoy en CABA — Confirmar pedido"}
            </button>
            <button
              onClick={() => setShowCabaConfirm(false)}
              style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "transparent", color: "#64748b", fontWeight: 800, fontSize: 14, cursor: "pointer" }}
            >
              Volver y cambiar método de entrega
            </button>

            {errors.submit && (
              <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: "#c0392b" }}>{errors.submit}</div>
            )}
          </div>
        </div>
      )}

      <div className="cs-overlay" onClick={handleOverlayClick} style={{ '--primary': primaryColor, '--primary-hover': primaryHover }}>
        <div className="cs-sheet" ref={sheetRef}>

          {/* ─── NAVBAR ─── */}
          <div className="cs-nav">
            <div className="cs-nav-side cs-nav-side--left">
              {step <= 2 && (
                step === 0 ? (
                  <button className="cs-nav-back" onClick={onClose} aria-label="Volver a la tienda">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                    Volver
                  </button>
                ) : (
                  <button className="cs-nav-btn" onClick={() => goToStep(step - 1)} aria-label="Volver al paso anterior">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  </button>
                )
              )}
            </div>

            <div className="cs-nav-center">
              {import.meta.env.VITE_STORE_NAME || "BoomHausS"}
            </div>

            <div className="cs-nav-side cs-nav-side--right">
              {step <= 2 && (
                <>
                  {(step === 1 || step === 2) && (
                    <span className="cs-nav-secure">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Seguro
                    </span>
                  )}
                  <button className="cs-nav-btn" onClick={handleClose} aria-label="Cerrar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Collapsible summary + progress (steps 1 & 2) */}
          {(step === 1 || step === 2) && (
            <div>
              <div className="cs-summary-toggle" onClick={() => setSummaryOpen(o => !o)}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  Resumen del pedido
                  <span style={{ fontSize: 11, color: "#888", transform: summaryOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform .2s" }}>▼</span>
                </span>
                <div style={{ textAlign: "right" }}>
                  {(savings > 0 || discountAmount > 0) && <div style={{ fontSize: 11, color: "#888", textDecoration: "line-through" }}>{money(discountAmount > 0 ? totalPrice : fullPrice)}</div>}
                  <div style={{ fontWeight: 900, fontSize: 15, color: "var(--text)" }}>{money(finalTotal)}</div>
                </div>
              </div>

              {summaryOpen && (
                <div className="cs-summary-items">
                  {items.map((it, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 13, fontWeight: 700 }}>
                        <span style={{ color: "var(--text)" }}>{it.name} × {it.quantity}</span>
                        <span>{money(calc(it))}</span>
                      </div>
                      {it.gifts?.map((gift, gi) => (
                        <div key={gi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0 3px 10px", fontSize: 12, fontWeight: 700 }}>
                          <span style={{ color: "#1D9E75" }}>🎁 {gift}</span>
                          <span style={{ color: "#1D9E75", fontWeight: 900 }}>GRATIS</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#1D9E75", paddingTop: 6, borderTop: "1px solid var(--border)", marginTop: 6 }}>
                    <span>Envío</span><span>GRATIS</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#1D9E75", paddingTop: 6 }}>
                      <span>Cupón {appliedCoupon?.code}</span><span>-{money(discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, paddingTop: 8 }}>
                    <span>Total</span><span>{money(finalTotal)}</span>
                  </div>
                </div>
              )}

              <div style={{ padding: "14px 28px 0" }}>
                <div className="cs-progress">
                  <div className={`cs-step-circle ${step >= 1 && step < 2 ? "active" : step >= 2 ? "done" : ""}`}>{step >= 2 ? "✓" : "1"}</div>
                  <div className={`cs-step-line ${step >= 2 ? "done" : ""}`} />
                  <div className={`cs-step-circle ${step === 2 ? "active" : step > 2 ? "done" : ""}`}>{step > 2 ? "✓" : "2"}</div>
                  <div className="cs-step-line" />
                  <div className={`cs-step-circle ${step === 2 ? "active" : ""}`}>3</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 8px" }}>
                  {["Tus datos", "Pago", "✓ Confirmación"].map((l, i) => {
                    const done = (i === 0 && step >= 2) || (i === 1 && step >= 2);
                    const active = (i === 0 && step === 1) || (i === 1 && step === 1) || (i === 2 && step === 2);
                    return <span key={l} className={`cs-step-label ${done ? "done" : active ? "active" : ""}`}>{l}</span>;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── BODY ─── */}
          <div className={`cs-body${stepTransition === "exiting" ? " cs-body--exiting" : stepTransition === "entering" ? " cs-body--entering" : ""}`}>

            {/* ══════ STEP 0 — CART ══════ */}
            {step === 0 && (() => {
              // ✅ Detecta si el carrito tiene el Kit Completo del mundial
              const hasKit = items.some((it) => {
                const n = (it.name || "").toLowerCase();
                return n.includes("kit") && n.includes("revendedor");
              });
              return (
              <div>
                {/* Hero benefits bar — color sigue la landing via --primary */}
                <div className="cs-ship-banner">
                  <span className="cs-ship-banner-text">🚚 Envío gratis a todo el país</span>
                  {hasKit && <span className="cs-ship-banner-text">· 🎁 +20 unidades de regalo incluidas</span>}
                </div>

                {/* Cart items */}
                <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#aaa", fontWeight: 700 }}>Tu carrito está vacío.</div>
                  )}
                  {items.map((it, idx) => {
                    const itemTotal = calc(it);
                    const origTotal = it.bundleTotal && it.compareAtPrice
                      ? Number(it.compareAtPrice)
                      : (Number(it.price) || 0) * (Number(it.quantity) || 0);
                    const hasDiscount = (it.bundleTotal && it.compareAtPrice && Number(it.compareAtPrice) > itemTotal)
                      || (it.promo?.type === "bundle2" && it.promo?.discountPct > 0);
                    const thumb = it.imageUrl || it.image || null;
                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 12px" }}>

                        {/* Imágenes: bundle (múltiples) o producto único */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          {it.bundleImgs?.length > 0 ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              {it.bundleImgs.map((src, bIdx) => (
                                <div key={bIdx} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  {bIdx > 0 && <span style={{ fontSize: 11, fontWeight: 900, color: "var(--primary)", opacity: .55, lineHeight: 1 }}>+</span>}
                                  <div style={{ width: 52, height: 52, borderRadius: 9, overflow: "hidden", background: "#f5f0f3", border: "1px solid rgba(0,0,0,.07)", flexShrink: 0 }}>
                                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                                  </div>
                                </div>
                              ))}
                              <span style={{ position: "absolute", top: -6, right: -6, background: "var(--primary)", color: "#fff", borderRadius: 999, width: 20, height: 20, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{it.quantity}</span>
                            </div>
                          ) : (
                            <>
                              <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", background: "#f0f4f8", display: "grid", placeItems: "center", border: "1px solid rgba(0,0,0,.07)" }}>
                                {thumb ? <img src={thumb} alt={it.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22 }}>📦</span>}
                              </div>
                              <span style={{ position: "absolute", top: -6, right: -6, background: "var(--primary)", color: "#fff", borderRadius: 999, width: 20, height: 20, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{it.quantity}</span>
                            </>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {(() => {
                            const parts = it.name.split(' — ');
                            return parts.length > 1 ? (
                              <>
                                <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.3, color: "rgba(11,18,32,.90)" }}>{parts[0]}</div>
                                <div style={{ fontWeight: 700, fontSize: 11.5, color: "var(--primary)", marginTop: 2, lineHeight: 1.3 }}>{parts[1]}</div>
                              </>
                            ) : (
                              <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.3, color: "rgba(11,18,32,.90)" }}>{it.name}</div>
                            );
                          })()}
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}>
                            {hasDiscount && it.promo?.discountPct > 0 && (
                              <span style={{ fontSize: 10.5, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 999, padding: "2px 7px", fontWeight: 800 }}>
                                -{it.promo.discountPct}% OFF
                              </span>
                            )}
                            {hasDiscount && it.bundleTotal && (
                              <span style={{ fontSize: 10.5, background: "#dcfce7", color: "#166534", border: "1px solid #86efac", borderRadius: 999, padding: "2px 7px", fontWeight: 800 }}>
                                PACK AHORRO
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 5 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(11,18,32,.38)" }}>
                              Cant: {it.quantity}
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <div style={{ textAlign: "right", flexShrink: 0, paddingTop: 2 }}>
                          {hasDiscount && origTotal !== itemTotal && (
                            <div style={{ fontSize: 11, textDecoration: "line-through", color: "#bbb", fontWeight: 700 }}>{money(origTotal)}</div>
                          )}
                          <div style={{ fontWeight: 900, fontSize: 16, color: hasDiscount ? "#1D9E75" : "var(--text)" }}>{money(itemTotal)}</div>
                        </div>
                      </div>
                      {it.gifts?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {it.gifts.map((gift, gi) => (
                            <div key={gi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "5px 10px" }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: "#166534" }}>🎁 {gift}</span>
                              <span style={{ fontSize: 12, fontWeight: 900, color: "#16a34a" }}>GRATIS</span>
                            </div>
                          ))}
                        </div>
                      )}
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div style={{ padding: "0 16px 10px" }}>
                  <div className="cs-totals">
                    <div className="cs-total-row"><span>Envío</span><span style={{ color: "#1D9E75" }}>GRATIS</span></div>
                    {savings > 0 && <div className="cs-total-row" style={{ color: "#1D9E75" }}><span>Ahorrás</span><span>-{money(savings)}</span></div>}
                    {discountAmount > 0 && (
                      <div className="cs-total-row" style={{ color: "#1D9E75" }}>
                        <span>Cupón <strong>{appliedCoupon.code}</strong></span>
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

                  {/* Coupon — discreto */}
                  {!appliedCoupon && (
                    <button
                      className="cs-coupon-toggle"
                      onClick={() => setCouponOpen(o => !o)}
                    >
                      ¿Tenés un código de descuento?
                    </button>
                  )}
                  {(couponOpen || appliedCoupon) && (
                    <div className="cs-coupon-body">
                      <div className="cs-coupon-row">
                        <input
                          type="text"
                          placeholder="Código de cupón"
                          value={couponInput}
                          onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                          onKeyDown={e => e.key === "Enter" && !appliedCoupon && applyCoupon()}
                          className={appliedCoupon ? "cs-coupon-applied" : ""}
                          disabled={!!appliedCoupon}
                        />
                        {appliedCoupon ? (
                          <button className="cs-coupon-btn remove" onClick={removeCoupon}>Quitar</button>
                        ) : (
                          <button className="cs-coupon-btn" onClick={applyCoupon} disabled={couponApplying || !couponInput.trim()}>
                            {couponApplying ? "..." : "Aplicar"}
                          </button>
                        )}
                      </div>
                      {couponError && <div className="cs-coupon-err">{couponError}</div>}
                      {appliedCoupon && !couponError && (
                        <div className="cs-coupon-ok">
                          ✓ Cupón aplicado — {appliedCoupon.type === "percent" ? `${appliedCoupon.value}% de descuento` : `${money(appliedCoupon.value)} de descuento`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Countdown urgency */}
                  {cartTime !== "00:00" && (
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <span className="cs-cd-pill">
                        ⚡ Oferta válida por <span className="cs-cd-pill-time">&nbsp;{cartTime}</span>
                      </span>
                    </div>
                  )}

                  {/* Social proof */}
                  <div style={{ textAlign: "center", fontSize: 12, fontWeight: 800, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 10px", marginTop: 10 }}>
                    🔥 {socialProofCount} personas compraron esto en las últimas 24 horas
                  </div>

                </div>
              </div>
              );
            })()}

            {/* ══════ STEP 1 — INFO + ENTREGA ══════ */}
            {step === 1 && (
              <div style={{ padding: "20px 20px 0" }}>

                {/* Contacto */}
                <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 14, color: "var(--text)" }}>Contacto</div>

                {/* Nombre + Apellido — dos columnas */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div className="cs-field">
                    <input
                      id="cs-nombre" name="given-name" type="text"
                      value={form.nombre}
                      onChange={e => setF("nombre", e.target.value)}
                      onBlur={() => touchF("nombre")}
                      className={`${form.nombre ? "hv" : ""} ${errors.nombre ? "cs-err" : ""}`}
                      autoComplete="given-name"
                    />
                    <label htmlFor="cs-nombre">Nombre *</label>
                    {fieldOk("nombre") && <span className="cs-field-ok">✓</span>}
                  </div>
                  <div className="cs-field">
                    <input
                      id="cs-apellido" name="family-name" type="text"
                      value={form.apellido}
                      onChange={e => setF("apellido", e.target.value)}
                      onBlur={() => touchF("apellido")}
                      className={`${form.apellido ? "hv" : ""}`}
                      autoComplete="family-name"
                    />
                    <label htmlFor="cs-apellido">Apellido</label>
                    {fieldOk("apellido") && <span className="cs-field-ok">✓</span>}
                  </div>
                </div>
                {errors.nombre && <div className="cs-field-err" style={{ marginBottom: 8 }}>{errors.nombre}</div>}

                {/* DNI */}
                <div className="cs-field" style={{ marginBottom: 4 }}>
                  <input
                    id="cs-dni" name="dni" type="text"
                    value={form.dni}
                    onChange={e => setF("dni", e.target.value)}
                    onBlur={() => touchF("dni")}
                    className={`${form.dni ? "hv" : ""} ${errors.dni ? "cs-err" : ""}`}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                  <label htmlFor="cs-dni">DNI *</label>
                  {fieldOk("dni") && <span className="cs-field-ok">✓</span>}
                </div>
                <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, marginBottom: 12 }}>
                  Lo usamos únicamente para emitir tu factura electrónica 🔒
                </div>
                {errors.dni && <div className="cs-field-err" style={{ marginBottom: 8 }}>{errors.dni}</div>}

                {/* Celular */}
                <div className="cs-field" style={{ marginBottom: 12 }}>
                  <input
                    id="cs-tel" name="tel" type="tel"
                    value={form.tel}
                    onChange={e => setF("tel", e.target.value)}
                    onBlur={e => { touchF("tel"); captureAbandoned({ phone: e.target.value }); }}
                    className={`${form.tel ? "hv" : ""} ${errors.tel ? "cs-err" : ""}`}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  <label htmlFor="cs-tel">Número de celular *</label>
                  {fieldOk("tel") && <span className="cs-field-ok">✓</span>}
                </div>
                {errors.tel && <div className="cs-field-err" style={{ marginBottom: 8 }}>{errors.tel}</div>}

                {/* Email */}
                <div className="cs-field" style={{ marginBottom: 4 }}>
                  <input
                    id="cs-email" name="email" type="email"
                    value={form.email}
                    onChange={e => setF("email", e.target.value)}
                    onBlur={e => { touchF("email"); captureAbandoned({ email: e.target.value }); }}
                    className={`${form.email ? "hv" : ""} ${errors.email ? "cs-err" : ""}`}
                    inputMode="email"
                    autoComplete="email"
                  />
                  <label htmlFor="cs-email">Email *</label>
                  {fieldOk("email") && <span className="cs-field-ok">✓</span>}
                </div>
                {errors.email && <div className="cs-field-err" style={{ marginBottom: 8 }}>{errors.email}</div>}

                <div className="cs-divider" />

                {/* Entrega */}
                <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 14, color: "var(--text)" }}>Entrega</div>

                {/* Provincia */}
                <div className="cs-field" style={{ marginBottom: 12 }}>
                  <select
                    id="cs-provincia" name="address-level1"
                    value={form.provincia} onChange={e => setF("provincia", e.target.value)}
                    autoComplete="address-level1"
                  >
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <label htmlFor="cs-provincia">Provincia / Estado</label>
                </div>

                {/* Dirección */}
                <div className="cs-field" style={{ marginBottom: 12 }}>
                  <input
                    id="cs-direccion" name="address-line1" type="text"
                    value={form.direccion}
                    onChange={e => setF("direccion", e.target.value)}
                    onBlur={() => { touchF("direccion"); captureAbandoned(); }}
                    className={form.direccion ? "hv" : ""}
                    autoComplete="street-address"
                  />
                  <label htmlFor="cs-direccion">Dirección (opcional)</label>
                </div>

                <div className="cs-field" style={{ marginBottom: 12 }}>
                  <input
                    id="cs-extra" name="address-line2" type="text"
                    value={form.extra} onChange={e => setF("extra", e.target.value)}
                    className={form.extra ? "hv" : ""}
                    autoComplete="address-line2"
                  />
                  <label htmlFor="cs-extra">Piso / Dpto / Referencias (opcional)</label>
                </div>

                {/* CP + Ciudad */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  <div className="cs-field">
                    <input
                      id="cs-cp" name="postal-code" type="text"
                      value={form.cp} onChange={e => setF("cp", e.target.value)}
                      className={form.cp ? "hv" : ""} inputMode="numeric"
                      autoComplete="postal-code"
                    />
                    <label htmlFor="cs-cp">Código postal</label>
                  </div>
                  <div className="cs-field">
                    <input
                      id="cs-ciudad" name="address-level2" type="text"
                      value={form.ciudad} onChange={e => setF("ciudad", e.target.value)}
                      className={form.ciudad ? "hv" : ""}
                      autoComplete="address-level2"
                    />
                    <label htmlFor="cs-ciudad">Ciudad</label>
                  </div>
                </div>

                {/* Shipping methods — solo se muestra si hay más de una opción (CABA) */}
                {allowCod && (
                  <>
                    <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 10, color: "var(--text)" }}>Método de envío</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                      {[
                        { val: "correo", title: "Envío a Domicilio (Correo Arg)", sub: "Llega a todo el país · Seguimiento incluido" },
                        { val: "caba", title: "Pagás al recibir", badge: "Solo CABA", sub: "Entrega coordinada · Pagás cuando te llega" },
                      ].map(opt => (
                        <div key={opt.val} className={`cs-opt ${delivery === opt.val ? "cs-opt--active" : ""}`} onClick={() => setDelivery(opt.val)}>
                          <input type="radio" name="delivery" checked={delivery === opt.val} onChange={() => setDelivery(opt.val)} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                              {opt.title}
                              {opt.badge && <span style={{ fontSize: 11, background: "rgba(27,77,62,.10)", border: "1px solid rgba(27,77,62,.20)", color: "var(--primary)", borderRadius: 999, padding: "2px 7px", fontWeight: 800 }}>{opt.badge}</span>}
                            </div>
                            <div style={{ fontSize: 13, color: "#888", fontWeight: 600, marginTop: 2 }}>{opt.sub}</div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "#1D9E75", flexShrink: 0 }}>GRATIS</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Notas adicionales */}
                <div className="cs-field" style={{ marginBottom: 20 }}>
                  <textarea
                    value={form.notes}
                    onChange={e => setF("notes", e.target.value)}
                    className={form.notes ? "hv" : ""}
                    rows={3}
                    style={{ resize: "none" }}
                  />
                  <label>Notas adicionales para el pedido (opcional)</label>
                </div>

                <div style={{ textAlign: "center", marginTop: 16, marginBottom: 8 }}>
                  <button className="cs-back" onClick={() => goToStep(0)}>← Volver al carrito</button>
                </div>
              </div>
            )}

            {/* ══════ STEP 2 — PAGO ══════ */}
            {step === 2 && (
              <div style={{ padding: "20px 20px 0" }}>

                {/* Shipping summary */}
                <div className="cs-ship-summary">
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>Envío</div>
                    <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{delivery === "caba" ? "Pagás al recibir (CABA)" : "Envío a domicilio — Correo Argentino"}</div>
                  </div>
                  <div style={{ fontWeight: 900, color: "#1D9E75", fontSize: 14 }}>GRATIS</div>
                </div>

                {/* Section header */}
                <div className="cs-pay-section-hdr">
                  <div className="cs-pay-section-line" />
                  <span className="cs-pay-section-ttl">Medio de pago</span>
                  <div className="cs-pay-section-line" />
                </div>

                {/* ── Selección de método o vista de detalle ── */}
                {payOpen === null ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#f5f5f5", margin: "0 -20px 20px", padding: "12px 12px" }}>

                    {/* Mercado Pago — primero */}
                    <div className="cs-pcard" onClick={() => togglePayOption("mp")}>
                      <div className="cs-pcard-row">
                        <svg viewBox="0 0 102 34" width="90" height="30" aria-label="Mercado Pago" style={{ flexShrink: 0 }}>
                          <rect width="102" height="34" rx="17" fill="#FFE600"/>
                          <circle cx="21" cy="17" r="11" fill="#009ee3"/>
                          <text x="21" y="21.5" textAnchor="middle" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="9.5" fill="#fff">mp</text>
                          <text x="65" y="14" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="9.5" fill="#009ee3">mercado</text>
                          <text x="65" y="25" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="9.5" fill="#009ee3">pago</text>
                        </svg>
                        <span className="cs-pcard-lbl" style={{ flex: 1 }}>Mercado Pago</span>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#c0c0c0", flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>

                    {/* Tarjeta de crédito/débito — segundo */}
                    <div className="cs-pcard" onClick={() => togglePayOption("card")}>
                      <div className="cs-pcard-row">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "#94a3b8" }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        <span className="cs-pcard-lbl" style={{ flex: 1 }}>Tarjeta de crédito o débito</span>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#c0c0c0", flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>

                  </div>
                ) : payOpen === "card" ? (
                  <div className="cs-pay-detail" style={{ marginBottom: 20 }}>

                    {/* Sub-header */}
                    <div className="cs-pay-view-hdr">
                      <button className="cs-pay-view-back" onClick={() => { setPayOpen(null); setPayment(null); }} aria-label="Volver a métodos de pago">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#64748b", flexShrink: 0 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      <span className="cs-pay-view-hdr-ttl">Tarjeta de crédito o débito</span>
                    </div>

                    {/* Card form */}
                    <div style={{ padding: "0 16px" }}>
                      {!mpPublicKey ? (
                        <div className="mp-not-ready" style={{ marginTop: 14 }}>MP_PUBLIC_KEY no configurada. Agregala en el .env.</div>
                      ) : (
                        <form id="cs-card-form" className="cs-card-form" onSubmit={e => e.preventDefault()}>
                          {/* Número de tarjeta */}
                          <div className="cs-card-field cs-card-field--auto">
                            <input id="cs-inp-cardNumber" className="cs-card-inp" inputMode="numeric" autoComplete="cc-number" />
                            <span className="cs-card-ico cs-card-ico--lock">&#128274;</span>
                          </div>
                          {/* Titular */}
                          <div className="cs-card-field cs-card-field--auto">
                            <input id="cs-inp-name" className="cs-card-inp" autoComplete="cc-name" />
                          </div>
                          {/* Vencimiento + CVV */}
                          <div className="cs-card-row2">
                            <div className="cs-card-field cs-card-field--auto">
                              <input id="cs-inp-expiration" className="cs-card-inp" inputMode="numeric" autoComplete="cc-exp" />
                            </div>
                            <div className="cs-card-field cs-card-field--auto">
                              <input id="cs-inp-cvv" className="cs-card-inp" inputMode="numeric" autoComplete="cc-csc" />
                              <span className="cs-card-ico cs-card-ico--cvv">?</span>
                            </div>
                          </div>
                          {/* Cuotas */}
                          <div className="cs-card-field cs-card-field--auto cs-card-field--sel">
                            <select id="cs-inp-installments" className="cs-card-inp cs-card-sel" />
                            <span className="cs-card-arrow">&#9662;</span>
                          </div>
                          {/* Tipo de documento */}
                          <div className="cs-card-field cs-card-field--auto cs-card-field--sel">
                            <select id="cs-inp-docType" className="cs-card-inp cs-card-sel" />
                            <span className="cs-card-arrow">&#9662;</span>
                          </div>
                          {/* Número de documento */}
                          <div className="cs-card-field cs-card-field--auto">
                            <input id="cs-inp-docNumber" className="cs-card-inp" inputMode="numeric" />
                          </div>
                          {/* Campos ocultos requeridos por MP */}
                          <div style={{ display: "none" }}>
                            <select id="cs-inp-issuer" />
                            <input id="cs-inp-email" type="email" defaultValue="comprador@boomhauss.com" />
                          </div>
                          {/* Dirección de facturación */}
                          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, fontWeight: 700, color: "rgba(11,18,32,.7)", cursor: "pointer", marginTop: 8 }}>
                            <input type="checkbox" checked={sameAddr} onChange={e => setSameAddr(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--primary)", flexShrink: 0, marginTop: 1 }} />
                            Usar la dirección de envío como dirección de facturación
                          </label>
                        </form>
                      )}
                    </div>

                    {/* Tarjetas aceptadas */}
                    <div className="cs-card-brands-row" style={{ margin: "0 16px 12px" }}>
                      <span className="cs-card-brands-lbl">Aceptamos:</span>
                      <LogoVisa /><LogoMC /><LogoAmex />
                    </div>

                    {/* Cambiar método */}
                    <div style={{ textAlign: "center", paddingBottom: 14 }}>
                      <button className="cs-pay-change" onClick={() => { setPayOpen(null); setPayment(null); }}>
                        ← Cambiar opción de pago
                      </button>
                    </div>

                  </div>
                ) : payOpen === "mp" ? (
                  <div className="cs-pay-detail" style={{ marginBottom: 20 }}>

                    {/* Sub-header */}
                    <div className="cs-pay-view-hdr">
                      <button className="cs-pay-view-back" onClick={() => { setPayOpen(null); setPayment(null); }} aria-label="Volver a métodos de pago">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <svg viewBox="0 0 102 34" width="78" height="26" aria-label="Mercado Pago" style={{ flexShrink: 0 }}>
                        <rect width="102" height="34" rx="17" fill="#FFE600"/>
                        <circle cx="21" cy="17" r="11" fill="#009ee3"/>
                        <text x="21" y="21.5" textAnchor="middle" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="9.5" fill="#fff">mp</text>
                        <text x="65" y="14" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="9.5" fill="#009ee3">mercado</text>
                        <text x="65" y="25" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="9.5" fill="#009ee3">pago</text>
                      </svg>
                    </div>

                    {/* MP panel */}
                    <div style={{ padding: "14px 16px 4px" }}>
                      <div className="cs-mp2-title">Pagá con tu cuenta de Mercado Pago</div>
                      <div className="cs-mp2-bullets">
                        <div className="cs-mp2-bullet">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><rect width="24" height="24" rx="6" fill="#e0f2fe"/><path d="M5 12h14M5 8h8" stroke="#009ee3" strokeWidth="2" strokeLinecap="round"/></svg>
                          <div><strong>Usá tus tarjetas guardadas,</strong> dinero disponible y mucho más.</div>
                        </div>
                        <div className="cs-mp2-bullet">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><rect width="24" height="24" rx="6" fill="#e0f2fe"/><circle cx="12" cy="12" r="5" stroke="#009ee3" strokeWidth="2"/><path d="M12 9v3l1.5 1.5" stroke="#009ee3" strokeWidth="2" strokeLinecap="round"/></svg>
                          <div><strong>Accedé a Cuotas sin Tarjeta</strong> para comprar ahora y pagar después.</div>
                        </div>
                      </div>
                      <div className="cs-mp2-logos">
                        <LogoVisa /><LogoMC /><LogoAmex />
                        <div className="cs-logo-badge">NX</div>
                        <div className="cs-logo-badge cs-logo-rapi">Rapipago</div>
                        <div className="cs-logo-badge cs-logo-pf">Pago Fácil</div>
                      </div>
                      <div className="cs-mp2-footer">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#009ee3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <div>
                          <div className="cs-mp2-footer-main">Te llevaremos a Mercado Pago</div>
                          <div className="cs-mp2-footer-sub">Si no tenés una cuenta, podés usar tu e-mail.</div>
                        </div>
                      </div>
                    </div>

                    {/* Cambiar método */}
                    <div style={{ textAlign: "center", padding: "10px 0 14px" }}>
                      <button className="cs-pay-change" onClick={() => { setPayOpen(null); setPayment(null); }}>
                        ← Cambiar opción de pago
                      </button>
                    </div>

                  </div>
                ) : null}

                {/* Total box */}
                <div className="cs-total-box" style={{ marginBottom: 16 }}>
                  {firstImg && (
                    <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0 }}>
                      <img src={firstImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>Total · {totalItems} artículo{totalItems !== 1 ? "s" : ""}</div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: "var(--text)" }}>{money(finalTotal)}</div>
                    {savings > 0 && <div style={{ fontSize: 12, fontWeight: 800, color: "#1D9E75" }}>Ahorrás {money(savings)}</div>}
                  </div>
                </div>

                {/* Policies */}
                <div className="cs-policies" style={{ marginTop: 14, marginBottom: 8 }}>
                  {["Política de reembolso","Envío","Política de privacidad","Términos del servicio"].map(t => (
                    <a key={t} href="#">{t}</a>
                  ))}
                </div>

                <div style={{ textAlign: "center", marginTop: 8, marginBottom: 4 }}>
                  <button className="cs-back" onClick={() => goToStep(1)}>← Volver</button>
                </div>
              </div>
            )}

            {/* ══════ STEP 3 — INTERSTITIAL MERCADO PAGO ══════ */}
            {step === 3 && (
              <div className="cs-mp-inter">
                <div className="cs-mp-inter-check" aria-hidden="true">✓</div>
                <h2 className="cs-mp-inter-title">¡Tu pedido está listo!</h2>
                <p className="cs-mp-inter-sub">
                  Te estamos llevando a <strong style={{ color: "#009ee3" }}>Mercado Pago</strong> para que completes el pago de forma segura.
                </p>

                <div className="cs-mp-inter-card">
                  <div className="cs-mp-inter-brand">
                    <svg viewBox="0 0 100 24" width="110" height="26" aria-label="Mercado Pago" style={{ display:"block" }}>
                      <rect width="100" height="24" rx="5" fill="#009ee3"/>
                      <text x="50" y="16" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="0.4">MERCADO PAGO</text>
                    </svg>
                    <span className="cs-mp-inter-brand-txt">Checkout oficial</span>
                  </div>
                  <div className="cs-mp-inter-total-lbl">Total a pagar</div>
                  <div className="cs-mp-inter-total">{money(totalPrice)}</div>
                  {(form.nombre || form.apellido) && (
                    <div className="cs-mp-inter-name">
                      Pedido a nombre de {form.nombre} {form.apellido}
                    </div>
                  )}
                </div>

                <div className="cs-mp-inter-count">
                  <span className="cs-mp-inter-spinner" aria-hidden="true" />
                  <span>
                    {mpCountdown > 0
                      ? `Redirigiendo en ${mpCountdown}...`
                      : "Abriendo Mercado Pago..."}
                  </span>
                </div>

                <button
                  className="cs-mp-inter-cta"
                  onClick={() => {
                    if (mpRedirectUrl) window.location.href = mpRedirectUrl;
                  }}
                >
                  Ir a Mercado Pago ahora →
                </button>

                <div className="cs-mp-inter-trust">
                  <span className="cs-mp-inter-trust-item">🔒 SSL 256 bits</span>
                  <span className="cs-mp-inter-trust-item">🛡️ Compra protegida</span>
                  <span className="cs-mp-inter-trust-item">✓ PCI-DSS</span>
                </div>

                <button
                  className="cs-mp-inter-back"
                  onClick={() => {
                    setMpRedirectUrl(null);
                    setMpCountdown(4);
                    goToStep(2);
                  }}
                >
                  ← Volver a los métodos de pago
                </button>
              </div>
            )}

            {/* ══════ STEP 4 — CONFIRMACIÓN ══════ */}
            {step === 4 && (() => {
              const isCod = confirmedPaymentMethod === "cod";
              const waNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");
              const storeName = import.meta.env.VITE_STORE_NAME || "BoomHausS";
              const waText = encodeURIComponent(`Hola ${storeName}! 👋 Acabo de hacer un pedido por ${money(confirmedTotal)} y quería confirmar los detalles de entrega.`);
              const waLink = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : null;
              const totalQty = confirmedItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
              return (
              <div className="cs-confirm4">
                {/* Animated checkmark circle */}
                <div className="cs-confirm4-circle">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path className="cs-confirm4-check" d="M5 12l4.5 4.5L19 7"/>
                  </svg>
                </div>

                <h2 className="cs-confirm4-title">¡Pedido recibido!</h2>
                <p className="cs-confirm4-sub">
                  {isCod
                    ? "Te contactamos por WhatsApp para coordinar la entrega y el pago al recibir."
                    : "Tu pago fue procesado. Te avisamos cuando tu pedido esté en camino."}
                </p>

                {/* Details card */}
                <div className="cs-confirm4-details">
                  <div className="cs-confirm4-row">
                    <span className="cs-confirm4-label">Artículos</span>
                    <span className="cs-confirm4-val">{totalQty} artículo{totalQty !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="cs-confirm4-row">
                    <span className="cs-confirm4-label">Envío</span>
                    <span className="cs-confirm4-val--green">GRATIS</span>
                  </div>
                  {isCod && (
                    <div className="cs-confirm4-row">
                      <span className="cs-confirm4-label">Pago</span>
                      <span className="cs-confirm4-val">Al recibir</span>
                    </div>
                  )}
                  <div className="cs-confirm4-row">
                    <span className="cs-confirm4-label">Total</span>
                    <span className="cs-confirm4-val cs-confirm4-val--total">{money(confirmedTotal)}</span>
                  </div>
                </div>

                {/* CTAs */}
                {waLink && (
                  <a href={waLink} target="_blank" rel="noreferrer" className="cs-confirm4-wa">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Escribinos por WhatsApp
                  </a>
                )}
                <button className="cs-confirm4-close" onClick={onClose}>Seguir viendo productos</button>
              </div>
              );
            })()}

          </div>

          {/* ─── STICKY CTA FOOTER (P1+P2 fix) ─── */}
          {step === 0 && (
            <div className="cs-footer">
              <button className="cs-cta" disabled={items.length === 0} onClick={() => {
                onClose();
                navigate("/checkout", { state: { skipCart: true } });
              }}>
                Finalizar compra · {money(finalTotal)}
              </button>
              <div style={{ textAlign:"center", fontSize:11, color:"#aaa", fontWeight:600, marginTop:6 }}>
                🔒 Continuar como invitado · Sin necesidad de crear cuenta
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="cs-footer">
              <button className="cs-cta" onClick={() => {
                if (!validateStep1()) return;
                captureAbandoned();
                track("AddPaymentInfo", { value: totalPrice, currency: "ARS", content_ids: items.map(i => i.productId), content_type: "product", num_items: totalItems });
                if (delivery === "caba") { setShowCabaConfirm(true); } else { goToStep(2); }
              }}>
                Continuar con el pago →
              </button>
              <div className="cs-trust-row" style={{ marginTop:8 }}>
                <span className="cs-trust-item">🔒 SSL 256 bits</span>
                <span className="cs-trust-item">🛡️ Compra protegida</span>
                <span className="cs-trust-item">✓ Datos encriptados</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, paddingTop:4, flexWrap:"wrap" }}>
                <LogoMP /><LogoVisa /><LogoMC /><LogoAmex />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="cs-footer">
              <button
                className="cs-cta cs-cta--dark"
                disabled={!payment || submitting || processingPayment}
                onClick={() => {
                  if (payment === "card" && cardFormInstance) { cardFormInstance.submit(); }
                  else if (payment === "mp") { handleSubmit(); }
                }}
              >
                {processingPayment ? "Procesando pago..." : submitting ? "Conectando con Mercado Pago..." :
                  payment === "mp" ? "Pagar a través de Mercado Pago" :
                  payment === "card" ? "Pagar con tarjeta" :
                  "Realizar pedido"}
              </button>
              {!payment && (
                <div style={{ textAlign:"center", fontSize:12, fontWeight:700, color:"#1D9E75", marginTop:6 }}>
                  👆 Elegí tu método de pago preferido para continuar
                </div>
              )}
              {errors.submit && (
                <div style={{ textAlign:"center", fontSize:13, fontWeight:700, color:"#c0392b", marginTop:6 }}>
                  {errors.submit}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── EXIT INTENT MODAL ─── */}
      {showExitIntent && (
        <div className="cs-exit-overlay" onClick={e => e.target === e.currentTarget && setShowExitIntent(false)}>
          <div className="cs-exit-card">
            <div className="cs-exit-emoji">🛒</div>
            <div className="cs-exit-title">¿Seguro que querés salir?</div>
            <div className="cs-exit-sub">
              Tu carrito se guardará y podés volver cuando quieras. ¡No pierdas la oferta!
            </div>
            <button className="cs-exit-stay" onClick={() => setShowExitIntent(false)}>
              Continuar comprando
            </button>
            <button className="cs-exit-leave" onClick={() => { setShowExitIntent(false); onClose(); }}>
              Salir sin comprar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
