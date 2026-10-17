// src/pages/CheckoutSheet.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCart } from '../hooks/useCart';
import { trackWithCapi, trackPurchase, getFbCookies } from "../lib/metaPixel";
import api from "../services/api";
import { useCountdown } from "../hooks/useCountdown";
import { PROVINCES, money, calcItemTotal } from "../components/checkout/checkoutFormat";
import { LogoVisa, LogoMC, LogoAmex, LogoMP } from "../components/checkout/PaymentLogos";
import { CabaConfirmModal } from "../components/checkout/CabaConfirmModal";
import { OrderConfirmation } from "../components/checkout/OrderConfirmation";
import { ExitIntentModal } from "../components/checkout/ExitIntentModal";
import { CheckoutNav } from "../components/checkout/CheckoutNav";
import { OrderSummaryBar } from "../components/checkout/OrderSummaryBar";
import { CartStep } from "../components/checkout/CartStep";
import "../components/checkout/CheckoutSheet.css";

// Meta cookies/eventId helpers viven en lib/metaPixel.js — usar getFbCookies()
// y trackWithCapi() para respetar el canal único de funnel events.

const INITIAL_FORM = {
  nombre: "", dni: "", tel: "", email: "",
  apellido: "", direccion: "", extra: "",
  cp: "", ciudad: "", provincia: "Buenos Aires", notes: "",
};

export function CheckoutSheet({ onClose, allowCod = true, primaryColor = "#1b4d3e", primaryHover = "#153d31", accentColor = "#1D9E75", fontFamily = null, accentBg = "#fff0f5", accentBorder = "#FFC6C6", accentText = "#a0003e" }) {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart, calcItemTotal: ctxCalc } = useCart();
  const calc = ctxCalc || calcItemTotal;

  const [step, setStep] = useState(0);
  const [delivery, setDelivery] = useState("sucursal");

  // Opciones de envío — los `val` matchean SHIPPING_COSTS del backend
  // (backend/src/services/orderPricing.js). NO cambiar las keys sin actualizar
  // el backend también.
  const SHIP_OPTS = [
    { val: "sucursal",    title: "Envío a sucursal",                       sub: "2 a 4 días hábiles", price: 0,    badge: null      },
    { val: "domicilio",   title: "Envío a domicilio + seguimiento",        sub: "1 a 3 días hábiles", price: 2980, badge: null      },
    { val: "prioritario", title: "Envío prioritario + seguimiento",        sub: "1 a 2 días hábiles", price: 4890, badge: null      },
    { val: "caba_cod",    title: "Pagás al recibir",                       sub: "Pagás cuando te llega", price: 0,  badge: "Solo CABA" },
  ];
  const [payment, setPayment] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showExitIntent, setShowExitIntent] = useState(false);
  const cartTime = useCountdown("pd_cd_v2", 335);
  const socialProofCount = useMemo(() => 18 + Math.floor(Math.random() * 12), []);
  const [sameAddr, setSameAddr] = useState(true);
  const [payOpen, setPayOpen] = useState(null); // null | 'card' | 'mp'
  const [subscribeEmail, setSubscribeEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [confirmedShippingCost, setConfirmedShippingCost] = useState(0);
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
  const bodyRef  = useRef(null);
  // Guard: un solo InitiateCheckout por apertura del sheet, no importa cuántas
  // veces el usuario avance/retroceda entre steps.
  const icFiredRef = useRef(false);
  const totalItems = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

  // Full price (without promos) for savings calc
  // For bundle items use compareAtPrice when available (the "tachado" price)
  const fullPrice = items.reduce((s, i) => {
    if (i.bundleTotal && i.compareAtPrice) return s + Number(i.compareAtPrice);
    return s + (Number(i.price) || 0) * (Number(i.quantity) || 0);
  }, 0);
  const savings = Math.max(0, fullPrice - totalPrice);

  // Costo de envío según la opción seleccionada
  const shippingCost = useMemo(() => {
    const opt = SHIP_OPTS.find(o => o.val === delivery);
    return opt ? opt.price : 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery]);

  // Descuento del cupón — siempre en sincronía con totalPrice actual
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") return Math.round(totalPrice * appliedCoupon.value / 100);
    return Math.min(appliedCoupon.value, totalPrice);
  }, [appliedCoupon, totalPrice]);

  const finalTotal = Math.max(0, totalPrice - discountAmount + shippingCost);

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
      bodyRef.current?.scrollTo({ top: 0, behavior: "instant" });
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
    const { fbp, fbc } = getFbCookies();
    const cartItems = items.map(i => ({
      productId:      i.productId,
      name:           i.name,
      price:          i.price,
      quantity:       i.quantity,
      imageUrl:       i.imageUrl       || undefined,
      bundleTotal:    i.bundleTotal    || undefined,
      compareAtPrice: i.compareAtPrice || undefined,
      gifts:          i.gifts?.length  ? i.gifts : undefined,
    }));
    const res = await api.post("/orders", {
      customerName:    `${form.nombre} ${form.apellido}`.trim(),
      customerEmail:   form.email.trim(),
      customerDni:     form.dni.trim(),
      customerPhone:   form.tel,
      shippingAddress: [form.direccion, form.extra, form.ciudad, form.cp, form.provincia].filter(Boolean).join(", ") || form.provincia || "Sin especificar",
      shippingMethod:  delivery,
      paymentMethod:   payment === "mp" ? "mercadopago" : "card",
      notes:           [form.notes, appliedCoupon ? `Cupón: ${appliedCoupon.code}` : ""].filter(Boolean).join(" | ") || "",
      // Meta CAPI — fbp/fbc para armar user_data en el Purchase server-side.
      // purchaseEventId lo setea el server (determinístico "purchase_<orderId>").
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
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
      const { fbp, fbc } = getFbCookies();
      const cartItems = items.map(i => ({
        productId:      i.productId,
        name:           i.name,
        price:          i.price,
        quantity:       i.quantity,
        imageUrl:       i.imageUrl       || undefined,
        bundleTotal:    i.bundleTotal    || undefined,
        compareAtPrice: i.compareAtPrice || undefined,
        gifts:          i.gifts?.length  ? i.gifts : undefined,
      }));
      const res = await api.post("/orders", {
        customerName:    `${form.nombre} ${form.apellido}`.trim(),
        customerEmail:   form.email.trim(),
        customerDni:     form.dni.trim(),
        customerPhone:   form.tel,
        shippingAddress: [form.direccion, form.extra, form.ciudad, form.cp, form.provincia].filter(Boolean).join(", ") || form.provincia || "Sin especificar",
        shippingMethod:  delivery,
        paymentMethod:   "mercadopago",
        notes:           [form.notes, appliedCoupon ? `Cupón: ${appliedCoupon.code}` : ""].filter(Boolean).join(" | ") || "",
        total:           finalTotal,
        items:           cartItems,
        // Meta CAPI — fbp/fbc para el Purchase server-side desde el webhook MP.
        ...(fbp ? { fbp } : {}),
        ...(fbc ? { fbc } : {}),
      });

      const isProd = import.meta.env.MODE === "production";
      const url = isProd
        ? res.data.init_point
        : res.data.sandbox_init_point || res.data.init_point;

      if (url) {
        // NO disparar Purchase aquí — el usuario todavía no pagó.
        // Purchase se dispara en SuccessPayment cuando MP confirma el pago aprobado.
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
      const { fbp, fbc } = getFbCookies();
      const cartItems = items.map(i => ({
        productId:      i.productId,
        name:           i.name,
        price:          i.price,
        quantity:       i.quantity,
        imageUrl:       i.imageUrl       || undefined,
        bundleTotal:    i.bundleTotal    || undefined,
        compareAtPrice: i.compareAtPrice || undefined,
      }));
      const codRes = await api.post("/orders", {
        customerName:    `${form.nombre} ${form.apellido}`.trim(),
        customerEmail:   form.email.trim(),
        customerDni:     form.dni.trim(),
        customerPhone:   form.tel,
        shippingAddress: [form.direccion, form.extra, form.ciudad, form.cp, form.provincia].filter(Boolean).join(", ") || form.provincia || "Sin especificar",
        shippingMethod:  delivery,
        paymentMethod:   "cod",
        notes:           ["Pago al recibir", form.notes, appliedCoupon ? `Cupón: ${appliedCoupon.code}` : ""].filter(Boolean).join(". "),
        total:           finalTotal,
        items:           cartItems,
        // Meta CAPI — fbp/fbc para el Purchase server-side (COD dispara
        // sendPurchaseEvent cuando el admin marca la orden como aprobada).
        ...(fbp ? { fbp } : {}),
        ...(fbc ? { fbc } : {}),
      });
      const codOrderId = codRes?.data?.data?._id || codRes?.data?.data?.orderId || codRes?.data?._id;
      // Purchase browser inmediato en COD (el usuario ya "confirmó comprar").
      // eventID = "purchase_<orderId>" — mismo que sendPurchaseEvent server-side.
      trackPurchase(codOrderId, {
        value:        parseFloat(finalTotal) || 0,
        currency:     "ARS",
        content_ids:  items.map(i => String(i.productId)),
        num_items:    totalItems,
        content_type: "product",
      });
      setConfirmedTotal(finalTotal);
      setConfirmedShippingCost(shippingCost);
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
        email: email || "comprador@Amelor.com",
        identificationType, identificationNumber,
        customerName: `${form.nombre} ${form.apellido}`.trim(),
        orderId,
      });

      const { status, statusDetail } = res.data;

      if (status === "approved") {
        // Purchase browser inmediato en card (el pago ya fue aprobado por MP).
        // eventID = "purchase_<orderId>" — mismo que sendPurchaseEvent server-side
        // desde orders.routes/card-payment.
        trackPurchase(orderId, {
          value:        parseFloat(amount) || 0,
          currency:     "ARS",
          content_ids:  items.map(i => String(i.productId)),
          num_items:    totalItems,
          content_type: "product",
        });
        setConfirmedTotal(Number(amount));
        setConfirmedShippingCost(shippingCost);
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
        try { cardFormRef.current.unmount(); } catch { /* best-effort: se ignora */ }
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
        try { cardFormRef.current.unmount(); } catch { /* best-effort: se ignora */ }
        cardFormRef.current = null;
        setCardFormInstance(null);
      }
    };
  // Flujo de pago: el CardForm se monta por método/SDK/clave; totalPrice se lee
  // al montar a propósito. No modificar deps sin revisar el flujo de MercadoPago.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {showCabaConfirm && (
        <CabaConfirmModal
          address={(form.direccion || form.ciudad) ? [form.direccion, form.extra, form.ciudad, form.cp].filter(Boolean).join(", ") : ""}
          submitting={submitting}
          error={errors.submit}
          primaryColor={primaryColor}
          onConfirm={handleCodSubmit}
          onCancel={() => setShowCabaConfirm(false)}
        />
      )}

      <div className="cs-overlay" onClick={handleOverlayClick} style={{ '--primary': primaryColor, '--primary-hover': primaryHover, '--cs-done': accentColor, '--text': '#0b1220', '--border': '#ebebeb', '--border2': '#d0d0d0', '--bg': '#f8f8f8', '--cs-accent-bg': accentBg, '--cs-accent-border': accentBorder, '--cs-accent-text': accentText }}>
        <div className="cs-sheet" ref={sheetRef} style={fontFamily ? { fontFamily } : undefined}>

          <CheckoutNav
            step={step}
            storeName={import.meta.env.VITE_STORE_NAME || "Amelor"}
            onExit={onClose}
            onBack={() => goToStep(step - 1)}
            onClose={handleClose}
          />

          {/* Resumen colapsable + progreso (pasos 1 y 2) */}
          {(step === 1 || step === 2) && (
            <OrderSummaryBar
              step={step}
              items={items}
              calc={calc}
              accentColor={accentColor}
              appliedCoupon={appliedCoupon}
              totalPrice={totalPrice}
              fullPrice={fullPrice}
              savings={savings}
              discountAmount={discountAmount}
              shippingCost={shippingCost}
              finalTotal={finalTotal}
            />
          )}

          {/* ─── BODY ─── */}
          <div ref={bodyRef} className={`cs-body${stepTransition === "exiting" ? " cs-body--exiting" : stepTransition === "entering" ? " cs-body--entering" : ""}`}>

            {/* ══════ STEP 0 — CART ══════ */}
            {step === 0 && (
              <CartStep
                items={items}
                calc={calc}
                accent={{ color: accentColor, bg: accentBg, border: accentBorder, text: accentText }}
                totals={{ shippingCost, savings, discountAmount, totalPrice, finalTotal }}
                coupon={{
                  applied: appliedCoupon,
                  open: couponOpen,
                  onToggle: () => setCouponOpen(o => !o),
                  input: couponInput,
                  onInputChange: (v) => { setCouponInput(v); setCouponError(""); },
                  applying: couponApplying,
                  error: couponError,
                  onApply: applyCoupon,
                  onRemove: removeCoupon,
                }}
                cartTime={cartTime}
                socialProofCount={socialProofCount}
              />
            )}

            {/* ══════ STEP 1 — INFO + ENTREGA ══════ */}
            {step === 1 && (
              <div style={{ padding: "20px 20px 0" }}>

                {/* Contacto */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 18, color: "#111" }}>Contacto</div>
                  <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>Iniciar sesión</a>
                </div>

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

                {/* Checkbox novedades */}
                <label style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 4px", cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 400, userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={subscribeEmail}
                    onChange={e => setSubscribeEmail(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "var(--primary)", flexShrink: 0 }}
                  />
                  Enviarme novedades y ofertas por correo electrónico
                </label>

                <div className="cs-divider" />

                {/* Entrega */}
                <div style={{ fontWeight: 600, fontSize: 18, color: "#111", marginBottom: 14 }}>Entrega</div>

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

                {/* Shipping methods — solo se habilitan al llenar la dirección */}
                {allowCod && (() => {
                  const deliveryUnlocked = form.direccion.trim().length > 1 || form.ciudad.trim().length > 1 || form.cp.trim().length > 0;
                  return (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 10, color: "#111" }}>Método de envío</div>
                      {!deliveryUnlocked ? (
                        <div style={{ border: "1.5px dashed #d1d5db", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "#9ca3af", fontSize: 13, fontWeight: 500 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          Completá la dirección para ver las opciones de envío
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                          {SHIP_OPTS.map(opt => (
                            <div key={opt.val} className={`cs-opt ${delivery === opt.val ? "cs-opt--active" : ""}`} onClick={() => setDelivery(opt.val)}>
                              <input type="radio" name="delivery" checked={delivery === opt.val} onChange={() => setDelivery(opt.val)} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                  {opt.title}
                                  {opt.badge && <span style={{ fontSize: 11, background: "rgba(0,0,0,.06)", border: "1px solid rgba(0,0,0,.12)", color: "var(--primary)", borderRadius: 999, padding: "2px 7px", fontWeight: 700 }}>{opt.badge}</span>}
                                </div>
                                <div style={{ fontSize: 13, color: "#888", fontWeight: 500, marginTop: 2 }}>{opt.sub}</div>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: opt.price > 0 ? "var(--text)" : accentColor, flexShrink: 0 }}>
                                {opt.price > 0 ? money(opt.price) : "GRATIS"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}

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
                {(() => {
                  const sel = SHIP_OPTS.find(o => o.val === delivery) || SHIP_OPTS[0];
                  return (
                    <div className="cs-ship-summary">
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>Envío</div>
                        <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{sel.title}</div>
                      </div>
                      <div style={{ fontWeight: 900, color: sel.price > 0 ? "var(--text)" : accentColor, fontSize: 14 }}>
                        {sel.price > 0 ? money(sel.price) : "GRATIS"}
                      </div>
                    </div>
                  );
                })()}

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
                            <input id="cs-inp-email" type="email" defaultValue="comprador@Amelor.com" />
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
                          <div className="cs-mp2-footer-sub">Allí podés elegir pagar en 3 cuotas sin interés. Si no tenés cuenta, usá tu e-mail.</div>
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
                    {savings > 0 && <div style={{ fontSize: 12, fontWeight: 800, color: accentColor }}>Ahorrás {money(savings)}</div>}
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
                  Allí podés elegir o confirmar las <strong>3 cuotas sin interés</strong>.
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
                  <div className="cs-mp-inter-total">{money(finalTotal)}</div>
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

            {step === 4 && (
              <OrderConfirmation
                isCod={confirmedPaymentMethod === "cod"}
                items={confirmedItems}
                total={confirmedTotal}
                shippingCost={confirmedShippingCost}
                onClose={onClose}
              />
            )}

          </div>

          {/* ─── STICKY CTA FOOTER (P1+P2 fix) ─── */}
          {step === 0 && (
            <div className="cs-footer">
              <button className="cs-cta" disabled={items.length === 0} onClick={() => {
                if (appliedCoupon) {
                  try { sessionStorage.setItem("pendingCoupon", JSON.stringify(appliedCoupon)); } catch { /* best-effort: se ignora */ }
                } else {
                  try { sessionStorage.removeItem("pendingCoupon"); } catch { /* best-effort: se ignora */ }
                }
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
                // InitiateCheckout: un solo disparo por apertura del sheet.
                // trackWithCapi hace el Pixel + POST /api/track con eventID
                // compartido — Meta deduplica.
                if (!icFiredRef.current) {
                  icFiredRef.current = true;
                  trackWithCapi("InitiateCheckout", {
                    value:        finalTotal,
                    currency:     "ARS",
                    content_ids:  items.map(i => String(i.productId)),
                    num_items:    totalItems,
                    content_type: "product",
                  });
                }
                // AddPaymentInfo se dispara en el mismo click porque el user
                // acaba de completar sus datos y entra a la pantalla de pago.
                trackWithCapi("AddPaymentInfo", {
                  value:        finalTotal,
                  currency:     "ARS",
                  content_ids:  items.map(i => String(i.productId)),
                  num_items:    totalItems,
                  content_type: "product",
                });
                if (delivery === "caba_cod") { setShowCabaConfirm(true); } else { goToStep(2); }
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
                <div style={{ textAlign:"center", fontSize:12, fontWeight:700, color:accentColor, marginTop:6 }}>
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

      {showExitIntent && (
        <ExitIntentModal
          onStay={() => setShowExitIntent(false)}
          onLeave={() => { setShowExitIntent(false); onClose(); }}
        />
      )}
    </>
  );
}
