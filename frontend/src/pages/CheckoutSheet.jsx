// src/pages/CheckoutSheet.jsx
import { useEffect, useRef, useState } from "react";
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
  tel: "", nombre: "", apellido: "", direccion: "", extra: "",
  cp: "", ciudad: "", provincia: "Buenos Aires",
};

export function CheckoutSheet({ onClose }) {
  const { items, totalPrice, updateQty, removeItem, clearCart, calcItemTotal: ctxCalc } = useCart();
  const calc = ctxCalc || calcItemTotal;

  const [step, setStep] = useState(0);
  const [delivery, setDelivery] = useState("correo");
  const [payment, setPayment] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [sameAddr, setSameAddr] = useState(true);
  const [payOpen, setPayOpen] = useState(null); // null | 'card' | 'mp'
  const [submitting, setSubmitting] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [confirmedItems, setConfirmedItems] = useState([]);
  const [showCabaConfirm, setShowCabaConfirm] = useState(false);
  const [confirmedPaymentMethod, setConfirmedPaymentMethod] = useState(null); // 'cod' | 'mp' | 'card'

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

  // ── Captura silenciosa de carrito abandonado ──
  // Se dispara on blur cuando el cliente deja algún dato de contacto.
  // El backend hace upsert por teléfono o email, así que se puede llamar varias veces.
  function captureAbandoned(extra = {}) {
    const phone = (extra.phone ?? form.tel ?? "").trim();
    const email = (extra.email ?? "").trim();
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

  function validateStep1() {
    const e = {};
    if (!form.tel.trim()) e.tel = "El celular es obligatorio.";
    if (!form.apellido.trim()) e.apellido = "El apellido es obligatorio.";
    if (!form.direccion.trim()) e.direccion = "La dirección es obligatoria.";
    if (!form.ciudad.trim()) e.ciudad = "La ciudad es obligatoria.";
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
      customerEmail:   "",
      customerDni:     "00000000",
      customerPhone:   form.tel,
      shippingAddress: [form.direccion, form.extra, form.ciudad, form.cp, form.provincia].filter(Boolean).join(", "),
      shippingMethod:  delivery === "caba" ? "caba_cod" : "correo_argentino",
      paymentMethod:   payment === "mp" ? "mercadopago" : "card",
      notes:           "",
      total:           totalPrice,
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
        customerEmail:   "",
        customerDni:     "00000000",
        customerPhone:   form.tel,
        shippingAddress: [form.direccion, form.extra, form.ciudad, form.cp, form.provincia].filter(Boolean).join(", "),
        shippingMethod:  delivery === "caba" ? "caba_cod" : "correo_argentino",
        paymentMethod:   "mercadopago",
        notes:           "",
        total:           totalPrice,
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
          value: totalPrice,
          content_ids: items.map(i => i.productId),
          content_type: "product",
          num_items: totalItems,
        });
        setMpRedirectUrl(url);
        setMpCountdown(4);
        setStep(3);
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
        customerEmail:   "",
        customerDni:     "00000000",
        customerPhone:   form.tel,
        shippingAddress: [form.direccion, form.extra, form.ciudad, form.cp, form.provincia].filter(Boolean).join(", "),
        shippingMethod:  "caba_cod",
        paymentMethod:   "cod",
        notes:           "Pago al recibir",
        total:           totalPrice,
        items:           cartItems,
      });
      track("Purchase", { currency: "ARS", value: totalPrice, content_ids: items.map(i => i.productId), num_items: totalItems });
      setConfirmedTotal(totalPrice);
      setConfirmedItems([...items]);
      setConfirmedPaymentMethod("cod");
      clearCart();
      setShowCabaConfirm(false);
      setStep(4);
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
        setStep(4);
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
    if (e.target === e.currentTarget) onClose();
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
        .cs-body { overflow-y: auto; flex: 1; padding: 0 0 24px; }
        .cs-body::-webkit-scrollbar { width: 4px; }
        .cs-body::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

        /* Floating label */
        .cs-field { position: relative; }
        .cs-field input, .cs-field select, .cs-field textarea {
          width: 100%; box-sizing: border-box;
          padding: 22px 14px 8px; font-size: 15px; font-weight: 600;
          border: 1.5px solid #d0d0d0; border-radius: 8px;
          background: #fff; color: var(--text);
          outline: none; transition: border-color .18s;
          -webkit-appearance: none; appearance: none;
        }
        .cs-field input:focus, .cs-field select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(27,77,62,.10);
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

        /* CTA button */
        .cs-cta {
          width: 100%; padding: 15px; border: none; border-radius: 10px;
          font-size: 16px; font-weight: 900; cursor: pointer;
          background: var(--primary); color: #fff;
          transition: background .15s, transform .1s;
        }
        .cs-cta:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }
        .cs-cta:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* Confirm success */
        .cs-confirm { text-align: center; padding: 40px 24px; }
        .cs-confirm-icon { font-size: 56px; margin-bottom: 12px; }

        /* Divider */
        .cs-divider { height: 8px; background: #f5f7fa; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin: 20px 0; }

        /* Back link */
        .cs-back { background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 700; color: var(--text); text-decoration: underline; padding: 0; }

        /* Total box step 2 */
        .cs-total-box { display: flex; align-items: center; gap: 14px; background: #f8faff; border: 1.5px solid var(--border); border-radius: 10px; padding: 14px 16px; }

        /* Policies */
        .cs-policies { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; font-size: 11px; }
        .cs-policies a { color: #999; text-decoration: underline; font-weight: 600; }

        /* ── Card form (inputs manuales, cada campo es una card) ── */
        .cs-card-form {
          display: flex; flex-direction: column; gap: 8px;
          margin-top: 14px; margin-bottom: 14px;
        }
        .cs-card-field {
          position: relative;
          border: 1px solid #d0d0d0; border-radius: 8px;
          background: #fff; min-height: 56px;
          display: flex; flex-direction: column; justify-content: center;
          padding: 0 44px 0 14px;
          transition: border-color .15s; cursor: text;
        }
        .cs-card-field:focus-within { border-color: #222; border-width: 1.5px; }
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

      <div className="cs-overlay" onClick={handleOverlayClick}>
        <div className="cs-sheet" ref={sheetRef}>

          {/* ─── HEADER ─── */}
          {step === 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontWeight: 900, fontSize: 17, color: "var(--text)" }}>
                Tu carrito ({totalItems})
              </span>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#888", lineHeight: 1 }}>✕</button>
            </div>
          )}

          {(step === 1 || step === 2) && (
            <div>
              {/* Store name + close */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0" }}>
                <div style={{ flex: 1 }} />
                <span style={{ fontWeight: 900, fontSize: 16, color: "var(--text)", flex: 1, textAlign: "center" }}>
                  {import.meta.env.VITE_STORE_NAME || "BoomHausS"}
                </span>
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#888" }}>✕</button>
                </div>
              </div>

              {/* Collapsible order summary */}
              <div className="cs-summary-toggle" onClick={() => setSummaryOpen(o => !o)}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  Resumen del pedido
                  <span style={{ fontSize: 11, color: "#888", transform: summaryOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform .2s" }}>▼</span>
                </span>
                <div style={{ textAlign: "right" }}>
                  {savings > 0 && <div style={{ fontSize: 11, color: "#888", textDecoration: "line-through" }}>{money(fullPrice)}</div>}
                  <div style={{ fontWeight: 900, fontSize: 15, color: "var(--text)" }}>{money(totalPrice)}</div>
                </div>
              </div>

              {summaryOpen && (
                <div className="cs-summary-items">
                  {items.map((it, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: "var(--text)" }}>{it.name} × {it.quantity}</span>
                      <span>{money(calc(it))}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#1D9E75", paddingTop: 6, borderTop: "1px solid var(--border)", marginTop: 6 }}>
                    <span>Envío</span><span>GRATIS</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, paddingTop: 8 }}>
                    <span>Total</span><span>{money(totalPrice)}</span>
                  </div>
                </div>
              )}

              {/* Progress */}
              <div style={{ padding: "14px 28px 0" }}>
                <div className="cs-progress">
                  <div className={`cs-step-circle ${step >= 1 && step < 2 ? "active" : step >= 2 ? "done" : ""}`}>{step >= 2 ? "✓" : "1"}</div>
                  <div className={`cs-step-line ${step >= 2 ? "done" : ""}`} />
                  <div className={`cs-step-circle ${step === 2 ? "active" : step > 2 ? "done" : ""}`}>{step > 2 ? "✓" : "2"}</div>
                  <div className="cs-step-line" />
                  <div className={`cs-step-circle ${step === 2 ? "active" : ""}`}>3</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 8px" }}>
                  {["Información", "Envío", "Pago"].map((l, i) => {
                    const done = (i === 0 && step >= 2) || (i === 1 && step >= 2);
                    const active = (i === 0 && step === 1) || (i === 1 && step === 1) || (i === 2 && step === 2);
                    return <span key={l} className={`cs-step-label ${done ? "done" : active ? "active" : ""}`}>{l}</span>;
                  })}
                </div>
              </div>
            </div>
          )}

          {(step === 3 || step === 4) && (
            <div style={{ display: "flex", justifyContent: "center", padding: "18px 20px 14px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontWeight: 900, fontSize: 16 }}>{import.meta.env.VITE_STORE_NAME || "BoomHausS"}</span>
            </div>
          )}

          {/* ─── BODY ─── */}
          <div className="cs-body">

            {/* ══════ STEP 0 — CART ══════ */}
            {step === 0 && (() => {
              // ✅ Detecta si el carrito tiene el Kit Completo del mundial
              const hasKit = items.some((it) => {
                const n = (it.name || "").toLowerCase();
                return n.includes("kit") && n.includes("revendedor");
              });
              return (
              <div>
                {/* Hero benefits bar — envío gratis protagonista */}
                <div className="cs-hero-benefits">
                  <div className="cs-hero-free">
                    <span className="cs-hero-free-ico" aria-hidden="true">🚚</span>
                    <div className="cs-hero-free-txt">
                      <div className="cs-hero-free-title">ENVÍO GRATIS</div>
                      <div className="cs-hero-free-sub">a todo el país · llega en 3 a 7 días</div>
                    </div>
                  </div>
                  {hasKit && (
                    <div className="cs-hero-gifts">
                      <span className="cs-hero-gifts-ico" aria-hidden="true">🎁</span>
                      <div className="cs-hero-gifts-txt">
                        <div className="cs-hero-gifts-title">+20 UNIDADES DE REGALO</div>
                        <div className="cs-hero-gifts-sub">10 Pulseras + 10 Banderas extra incluidas</div>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding: "8px 16px", textAlign: "center", fontSize: 12, fontWeight: 800, color: "#0a5c3a", background: "#f0fdf8", borderBottom: "1px solid #b7f0dc" }}>
                  ✓ ¡Felicidades! Desbloqueaste todos los beneficios
                </div>

                {/* Cart items */}
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
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
                      <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center", background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}>
                        {/* Image + qty badge */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", background: "#f0f4ff", display: "grid", placeItems: "center" }}>
                            {thumb ? <img src={thumb} alt={it.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22 }}>📦</span>}
                          </div>
                          <span style={{ position: "absolute", top: -6, right: -6, background: "var(--text)", color: "#fff", borderRadius: 999, width: 20, height: 20, fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{it.quantity}</span>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3 }}>{it.name}</div>
                          {hasDiscount && it.promo?.discountPct > 0 && (
                            <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 999, padding: "2px 8px", fontWeight: 800, display: "inline-block", marginTop: 3 }}>
                              -{it.promo.discountPct}% PROMO
                            </span>
                          )}
                          {hasDiscount && it.bundleTotal && (
                            <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", border: "1px solid #86efac", borderRadius: 999, padding: "2px 8px", fontWeight: 800, display: "inline-block", marginTop: 3 }}>
                              PACK AHORRO
                            </span>
                          )}
                          {/* Qty controls */}
                          {String(it?.productId || '').includes('lampara-magnetica') ? (
                            <div style={{ marginTop: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(11,18,32,.50)" }}>Cant: {it.quantity}</span>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                              <button onClick={() => it.quantity <= 1 ? removeItem(it.productId) : updateQty(it.productId, it.quantity - 1)}
                                style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border2)", background: "#f8faff", cursor: "pointer", fontWeight: 900, fontSize: 15, display: "grid", placeItems: "center" }}>
                                {it.quantity <= 1 ? "×" : "−"}
                              </button>
                              <span style={{ fontWeight: 800, minWidth: 20, textAlign: "center" }}>{it.quantity}</span>
                              <button onClick={() => updateQty(it.productId, it.quantity + 1)}
                                style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border2)", background: "#f8faff", cursor: "pointer", fontWeight: 900, fontSize: 15, display: "grid", placeItems: "center" }}>+</button>
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          {hasDiscount && origTotal !== itemTotal && (
                            <div style={{ fontSize: 12, textDecoration: "line-through", color: "#aaa", fontWeight: 700 }}>{money(origTotal)}</div>
                          )}
                          <div style={{ fontWeight: 900, fontSize: 15, color: hasDiscount ? "#1D9E75" : "var(--text)" }}>{money(itemTotal)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div style={{ padding: "0 16px 16px" }}>
                  <div className="cs-totals">
                    <div className="cs-total-row"><span>Subtotal</span><span>{money(totalPrice)}</span></div>
                    <div className="cs-total-row"><span>Envío</span><span style={{ color: "#1D9E75" }}>GRATIS</span></div>
                    {savings > 0 && <div className="cs-total-row" style={{ color: "#1D9E75" }}><span>Ahorrás</span><span>-{money(savings)}</span></div>}
                    <div className="cs-total-row final"><span>Total</span><span>{money(totalPrice)}</span></div>
                  </div>

                  {/* CTA */}
                  <button
                    className="cs-cta"
                    style={{ marginTop: 16 }}
                    disabled={items.length === 0}
                    onClick={() => setStep(1)}
                  >
                    Finalizar compra · {money(totalPrice)}
                  </button>

                  {/* Payment logos */}
                  <div className="cs-pay-logos" style={{ justifyContent: "center", marginTop: 14 }}>
                    <LogoVisa /><LogoMC /><LogoAmex /><LogoMP />
                    <span className="cs-logo-badge cs-logo-rapi">Rapipago</span>
                    <span className="cs-logo-badge cs-logo-pf">Pago Fácil</span>
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
                <div className="cs-field">
                  <input
                    value={form.tel}
                    onChange={e => setF("tel", e.target.value)}
                    onBlur={e => captureAbandoned({ phone: e.target.value })}
                    className={`${form.tel ? "hv" : ""} ${errors.tel ? "cs-err" : ""}`}
                    inputMode="tel"
                    style={{ marginBottom: 0 }}
                  />
                  <label>Número de celular *</label>
                </div>
                {errors.tel && <div className="cs-field-err">{errors.tel}</div>}

                <div className="cs-divider" />

                {/* Entrega */}
                <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 14, color: "var(--text)" }}>Entrega</div>

                {/* Provincia */}
                <div className="cs-field" style={{ marginBottom: 12 }}>
                  <select value={form.provincia} onChange={e => setF("provincia", e.target.value)}>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <label>Provincia / Estado</label>
                </div>

                {/* Nombre + Apellido */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <div className="cs-field">
                      <input value={form.nombre} onChange={e => setF("nombre", e.target.value)} className={form.nombre ? "hv" : ""} />
                      <label>Nombre (opcional)</label>
                    </div>
                  </div>
                  <div>
                    <div className="cs-field">
                      <input value={form.apellido} onChange={e => setF("apellido", e.target.value)} className={`${form.apellido ? "hv" : ""} ${errors.apellido ? "cs-err" : ""}`} />
                      <label>Apellidos *</label>
                    </div>
                    {errors.apellido && <div className="cs-field-err">{errors.apellido}</div>}
                  </div>
                </div>

                {/* Dirección */}
                <div className="cs-field" style={{ marginBottom: 4 }}>
                  <input
                    value={form.direccion}
                    onChange={e => setF("direccion", e.target.value)}
                    onBlur={() => captureAbandoned()}
                    className={`${form.direccion ? "hv" : ""} ${errors.direccion ? "cs-err" : ""}`}
                  />
                  <label>Dirección *</label>
                </div>
                {errors.direccion && <div className="cs-field-err" style={{ marginBottom: 8 }}>{errors.direccion}</div>}

                <div className="cs-field" style={{ marginBottom: 12, marginTop: errors.direccion ? 0 : 12 }}>
                  <input value={form.extra} onChange={e => setF("extra", e.target.value)} className={form.extra ? "hv" : ""} />
                  <label>Casa, apartamento, etc. (opcional)</label>
                </div>

                {/* CP + Ciudad */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div className="cs-field">
                    <input value={form.cp} onChange={e => setF("cp", e.target.value)} className={form.cp ? "hv" : ""} inputMode="numeric" />
                    <label>Código postal</label>
                  </div>
                  <div>
                    <div className="cs-field">
                      <input value={form.ciudad} onChange={e => setF("ciudad", e.target.value)} className={`${form.ciudad ? "hv" : ""} ${errors.ciudad ? "cs-err" : ""}`} />
                      <label>Ciudad *</label>
                    </div>
                    {errors.ciudad && <div className="cs-field-err">{errors.ciudad}</div>}
                  </div>
                </div>

                {/* Save info checkbox */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, fontWeight: 700, color: "rgba(11,18,32,.7)", cursor: "pointer", marginBottom: 20 }}>
                  <input type="checkbox" style={{ width: 16, height: 16, accentColor: "var(--primary)", flexShrink: 0, marginTop: 1 }} />
                  Guardar mi información para consultar más rápidamente la próxima vez
                </label>

                {/* Shipping methods */}
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

                {/* Buttons */}
                <button className="cs-cta" onClick={() => {
                  if (!validateStep1()) return;
                  captureAbandoned();
                  track("AddPaymentInfo", {
                    value: totalPrice,
                    currency: "ARS",
                    content_ids: items.map(i => i.productId),
                    content_type: "product",
                    num_items: totalItems,
                  });
                  if (delivery === "caba") {
                    setShowCabaConfirm(true);
                  } else {
                    setStep(2);
                  }
                }}>
                  Continuar con el pago →
                </button>
                <div style={{ textAlign: "center", marginTop: 12, marginBottom: 8 }}>
                  <button className="cs-back" onClick={() => setStep(0)}>← Volver al carrito</button>
                </div>
              </div>
            )}

            {/* ══════ STEP 2 — PAGO ══════ */}
            {step === 2 && (
              <div style={{ padding: "20px 20px 0" }}>

                {/* Shipping summary */}
                <div style={{ background: "#f5f7fa", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>Envío</div>
                    <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{delivery === "caba" ? "Pagás al recibir (CABA)" : "Envío a Domicilio (Correo Arg)"}</div>
                  </div>
                  <div style={{ fontWeight: 900, color: "#1D9E75", fontSize: 14 }}>GRATIS</div>
                </div>

                {/* Payment section */}
                <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4, color: "var(--text)" }}>Pago</div>
                <div style={{ fontSize: 13, color: "#888", fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🔒</span> Todas las transacciones son seguras y están encriptadas.
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1.5px solid #d0d0d0", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>

                  {/* Option: Card */}
                  <div style={{ borderBottom: payOpen === "card" ? "1px solid #e0e0e0" : "none" }}>
                    <div
                      className={`cs-opt ${payOpen === "card" ? "cs-opt--active" : ""}`}
                      style={{ borderRadius: 0, border: "none", borderBottom: "1px solid #e0e0e0" }}
                      onClick={() => togglePayOption("card")}
                    >
                      <input type="radio" name="pay" checked={payOpen === "card"} onChange={() => togglePayOption("card")} />
                      <div style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>Tarjeta de crédito / débito</div>
                      <div className="cs-pay-logos">
                        <LogoVisa /><LogoMC /><LogoAmex /><LogoDiners />
                      </div>
                    </div>

                    {payOpen === "card" && (
                      <div className="cs-pay-panel" style={{ padding: "0 16px 16px" }}>
                        {!mpPublicKey ? (
                          <div className="mp-loading">
                            <span className="mp-not-ready">MP_PUBLIC_KEY no configurada. Agregala en el .env.</span>
                          </div>
                        ) : (
                          <form id="cs-card-form" className="cs-card-form" onSubmit={e => e.preventDefault()}>

                            {/* Numero de tarjeta */}
                            <div className="cs-card-field cs-card-field--auto">
                              <input id="cs-inp-cardNumber" className="cs-card-inp" inputMode="numeric" autoComplete="cc-number" />
                              <span className="cs-card-ico cs-card-ico--lock">&#128274;</span>
                            </div>

                            {/* Fecha de vencimiento */}
                            <div className="cs-card-field cs-card-field--auto">
                              <input id="cs-inp-expiration" className="cs-card-inp" inputMode="numeric" autoComplete="cc-exp" />
                            </div>

                            {/* Codigo de seguridad */}
                            <div className="cs-card-field cs-card-field--auto">
                              <input id="cs-inp-cvv" className="cs-card-inp" inputMode="numeric" autoComplete="cc-csc" />
                              <span className="cs-card-ico cs-card-ico--cvv">?</span>
                            </div>

                            {/* Nombre del titular */}
                            <div className="cs-card-field cs-card-field--auto">
                              <input id="cs-inp-name" className="cs-card-inp" autoComplete="cc-name" />
                            </div>

                            {/* Documento + Numero */}
                            <div className="cs-card-row2">
                              <div className="cs-card-field cs-card-field--auto cs-card-field--sel">
                                <select id="cs-inp-docType" className="cs-card-inp cs-card-sel" />
                                <span className="cs-card-arrow">&#9662;</span>
                              </div>
                              <div className="cs-card-field cs-card-field--auto">
                                <input id="cs-inp-docNumber" className="cs-card-inp" inputMode="numeric" />
                              </div>
                            </div>

                            {/* Cuotas (MP las llena automaticamente) */}
                            <div className="cs-card-field cs-card-field--auto cs-card-field--sel">
                              <select id="cs-inp-installments" className="cs-card-inp cs-card-sel" />
                              <span className="cs-card-arrow">&#9662;</span>
                            </div>

                            {/* Campos ocultos requeridos por MP */}
                            <div style={{ display: "none" }}>
                              <select id="cs-inp-issuer" />
                              <input id="cs-inp-email" type="email" defaultValue="comprador@boomhauss.com" />
                            </div>

                            {/* Direccion de facturacion */}
                            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, fontWeight: 700, color: "rgba(11,18,32,.7)", cursor: "pointer", marginTop: 6 }}>
                              <input type="checkbox" checked={sameAddr} onChange={e => setSameAddr(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--primary)", flexShrink: 0, marginTop: 1 }} />
                              Usar la direccion de envio como direccion de facturacion
                            </label>
                          </form>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Option: Mercado Pago */}
                  <div>
                    <div
                      className={`cs-opt ${payOpen === "mp" ? "cs-opt--active" : ""}`}
                      style={{ borderRadius: 0, border: "none" }}
                      onClick={() => togglePayOption("mp")}
                    >
                      <input type="radio" name="pay" checked={payOpen === "mp"} onChange={() => togglePayOption("mp")} />
                      <div style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>Mercado Pago</div>
                      <div className="cs-pay-logos">
                        <LogoMP /><LogoVisa /><LogoMC />
                        <span style={{ fontSize: 11, color: "#888", fontWeight: 700 }}>+3</span>
                      </div>
                    </div>

                    {payOpen === "mp" && (
                      <div className="cs-pay-panel" style={{ padding: "0 16px 16px" }}>
                        <div className="cs-mp-panel">
                          <div className="cs-mp-panel-head">
                            <div className="cs-mp-logo-wrap">
                              <svg viewBox="0 0 80 22" width="82" height="22" aria-label="Mercado Pago" style={{ display:"block" }}>
                                <rect width="80" height="22" rx="4" fill="#009ee3"/>
                                <text x="40" y="15" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="0.3">MERCADO PAGO</text>
                              </svg>
                            </div>
                            <div className="cs-mp-head-txt">
                              <div className="cs-mp-head-title">Pagá como quieras, 100% seguro</div>
                              <div className="cs-mp-head-sub">Tarjeta · Débito · Transferencia · Efectivo · Cuotas</div>
                            </div>
                          </div>
                          <ul className="cs-mp-benefits">
                            <li><span className="cs-mp-check">✓</span> Pagás con el método que prefieras (hasta 12 cuotas)</li>
                            <li><span className="cs-mp-check">✓</span> Compra protegida: si no recibís el producto, te devolvemos tu dinero</li>
                            <li><span className="cs-mp-check">✓</span> No guardamos tus datos bancarios — los procesa Mercado Pago</li>
                          </ul>
                          <div className="cs-mp-trust">
                            <span className="cs-mp-trust-item">🔒 SSL 256 bits</span>
                            <span className="cs-mp-trust-dot">·</span>
                            <span className="cs-mp-trust-item">PCI-DSS</span>
                            <span className="cs-mp-trust-dot">·</span>
                            <span className="cs-mp-trust-item">Encriptado</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total box */}
                <div className="cs-total-box" style={{ marginBottom: 16 }}>
                  {firstImg && (
                    <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0 }}>
                      <img src={firstImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>Total · {totalItems} artículo{totalItems !== 1 ? "s" : ""}</div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: "var(--text)" }}>{money(totalPrice)}</div>
                    {savings > 0 && <div style={{ fontSize: 12, fontWeight: 800, color: "#1D9E75" }}>Ahorrás {money(savings)}</div>}
                  </div>
                </div>

                {/* CTA */}
                <button
                  className="cs-cta"
                  disabled={!payment || submitting || processingPayment}
                  onClick={() => {
                    if (payment === "card" && cardFormInstance) {
                      cardFormInstance.submit();
                    } else if (payment === "mp") {
                      handleSubmit();
                    }
                  }}
                  style={{ marginBottom: payment ? 0 : 4 }}
                >
                  {processingPayment ? "Procesando pago..." : submitting ? "Conectando con Mercado Pago..." : "Pagar ahora"}
                </button>
                {!payment && (
                  <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#c0392b", marginTop: 6, marginBottom: 4 }}>
                    Seleccioná un método de pago para continuar
                  </div>
                )}
                {errors.submit && (
                  <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#c0392b", marginTop: 6 }}>
                    {errors.submit}
                  </div>
                )}

                {/* Policies */}
                <div className="cs-policies" style={{ marginTop: 14, marginBottom: 8 }}>
                  {["Política de reembolso","Envío","Política de privacidad","Términos del servicio"].map(t => (
                    <a key={t} href="#">{t}</a>
                  ))}
                </div>

                <div style={{ textAlign: "center", marginTop: 8, marginBottom: 4 }}>
                  <button className="cs-back" onClick={() => setStep(1)}>← Volver</button>
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
                    setStep(2);
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
              return (
              <div className="cs-confirm">
                {isCod ? (
                  <>
                    <div style={{ fontSize: 60, marginBottom: 8 }}>🎉</div>
                    <h2 style={{ fontWeight: 900, fontSize: 22, margin: "0 0 10px", color: "var(--text)", lineHeight: 1.2 }}>
                      ¡Felicitaciones!<br/>Tu pedido está confirmado
                    </h2>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#64748b", margin: "0 0 20px", lineHeight: 1.6, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                      Te vamos a contactar por <strong style={{ color: "#25d366" }}>WhatsApp</strong> para coordinar la entrega y el pago al recibir.
                    </p>

                    {/* COD info card */}
                    <div style={{ background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)", border: "1.5px solid #34d399", borderRadius: 14, padding: "16px", textAlign: "left", marginBottom: 20, boxShadow: "0 8px 24px rgba(52,211,153,.12)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px dashed #a7f3d0" }}>
                        <span style={{ fontSize: 22 }}>📦</span>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 14, color: "#065f46" }}>Resumen del pedido</div>
                          <div style={{ fontSize: 12, color: "#047857", fontWeight: 700 }}>
                            {confirmedItems.reduce((s,i) => s + (Number(i.quantity)||0), 0)} artículo{confirmedItems.reduce((s,i) => s + (Number(i.quantity)||0), 0) !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      {confirmedItems.map((it, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>
                          <span>{it.name} × {it.quantity}</span>
                          <span>{money(it.bundleTotal || (it.price * it.quantity))}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, color: "#065f46", paddingTop: 10, marginTop: 6, borderTop: "1px solid #a7f3d0" }}>
                        <span>Total a pagar</span>
                        <span>{money(confirmedTotal)}</span>
                      </div>
                    </div>

                    {/* Next steps */}
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", textAlign: "left", marginBottom: 20 }}>
                      <div style={{ fontWeight: 900, fontSize: 11, color: "#0b1220", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>Próximos pasos</div>
                      {[
                        { icon: "💬", text: "Te contactamos por WhatsApp para confirmar tu dirección" },
                        { icon: "🚚", text: "Coordinamos la fecha y horario de entrega" },
                        { icon: "💵", text: "Pagás el total en efectivo cuando recibís el pedido" },
                      ].map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#334155", lineHeight: 1.4 }}>{s.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* WhatsApp CTA */}
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: "14px 0", borderRadius: 12, background: "#25d366", color: "#fff", fontWeight: 900, fontSize: 15, textDecoration: "none", marginBottom: 12, boxShadow: "0 8px 20px rgba(37,211,102,.25)", transition: "filter .15s" }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Escribinos por WhatsApp
                      </a>
                    )}
                    <button className="cs-cta" style={{ background: "transparent", border: "1.5px solid var(--border2)", color: "var(--text)" }} onClick={onClose}>Seguir viendo productos</button>
                  </>
                ) : (
                  <>
                    <div className="cs-confirm-icon">✅</div>
                    <h2 style={{ fontWeight: 900, fontSize: 24, margin: "0 0 8px", color: "var(--text)" }}>¡Pedido confirmado!</h2>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#888", margin: "0 0 24px", lineHeight: 1.6 }}>
                      Tu pago fue procesado exitosamente. Te contactamos por WhatsApp para coordinar la entrega.
                    </p>
                    <div style={{ background: "#f8faff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px", textAlign: "left", marginBottom: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#888" }}>Productos</span>
                        <span style={{ fontWeight: 800, fontSize: 13 }}>{confirmedItems.reduce((s,i) => s + (Number(i.quantity)||0), 0)} artículo{confirmedItems.reduce((s,i) => s + (Number(i.quantity)||0), 0) !== 1 ? "s" : ""}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#888" }}>Total</span>
                        <span style={{ fontWeight: 900, fontSize: 15 }}>{money(confirmedTotal)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#888" }}>Método de pago</span>
                        <span style={{ fontWeight: 800, fontSize: 13 }}>{confirmedPaymentMethod === "card" ? "Tarjeta" : "Mercado Pago"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#888" }}>Entrega</span>
                        <span style={{ fontWeight: 800, fontSize: 13 }}>Envío a domicilio</span>
                      </div>
                    </div>
                    <button className="cs-cta" onClick={onClose}>Seguir comprando</button>
                  </>
                )}
              </div>
              );
            })()}

          </div>
        </div>
      </div>
    </>
  );
}
