import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import { getStoredAuth } from "../utils/auth";
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";
import { warmUpApi } from "../services/api";

function money(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(num);
}

function sanitizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function onlyDigits(s) {
  return String(s || "").replace(/[^\d]/g, "");
}

/**
 * ✅ Idempotencia (anti-duplicados)
 */
function getOrCreateClientOrderId() {
  const KEY = "clientOrderId";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  let id = "";
  try {
    if (crypto?.randomUUID) id = crypto.randomUUID();
  } catch (_) {}
  if (!id) id = `co_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(KEY, id);
  return id;
}

function clearClientOrderId() {
  localStorage.removeItem("clientOrderId");
}

export function CheckoutContent({ embedded = false, onClose } = {}) {
  const { user } = getStoredAuth();
  const isLogged = Boolean(user?.email);
  const { pathname } = useLocation();

  // ✅ SCROLL TOP FORZADO
  useEffect(() => {
    if (embedded) return;
    window.scrollTo(0, 0);
    const timer = setTimeout(() => window.scrollTo(0, 0), 50);
    return () => clearTimeout(timer);
  }, [pathname, embedded]);

  // ✅ Carrito
  const { items, totalPrice, clearCart, calcItemTotal, updateQty, removeItem } = useCart();
  const isCartEmpty = !Array.isArray(items) || items.length === 0;

  // ✅ Método de pago (único online): Mercado Pago
  const paymentMethod = "mercadopago";

  // ✅ Datos del negocio
  const storeName = import.meta.env.VITE_STORE_NAME || "BoomHausS";
  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || "";

  // ✅ Datos del cliente
  const [customerName, setCustomerName] = useState(isLogged ? user.name || "" : "");
  const [customerEmail, setCustomerEmail] = useState(isLogged ? user.email || "" : "");
  const [customerDni, setCustomerDni] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  // ⚡ Default a Envío
  const [shippingMethod, setShippingMethod] = useState("correo_argentino");
  const [notes, setNotes] = useState("");

  // ✅ FIX RACE CONDITION: refs que se actualizan síncronamente con cada keystroke.
  // handleSubmit lee desde acá en vez del state (que puede estar un render atrasado).
  const refName    = useRef(isLogged ? user.name  || "" : "");
  const refEmail   = useRef(isLogged ? user.email || "" : "");
  const refDni     = useRef("");
  const refPhone   = useRef("");
  const refAddress = useRef("");
  const refMethod  = useRef("correo_argentino");

  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false); // ✅ overlay "Conectando con MP"
  const [error, setError] = useState("");
  const errorRef = useRef(null);
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  };

  // ✅ Cupones de descuento
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, pct }
  const [couponError, setCouponError] = useState("");

  const VALID_COUPONS = {
    "DESCUENTO10": 10,
    "PROMO15":     15,
    "WELCOME20":   20,
    "VIP25":       25,
  };

  const handleApplyCoupon = () => {
    setCouponError("");
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError("Ingresá un cupón"); return; }
    const pct = VALID_COUPONS[code];
    if (!pct) { setCouponError("Cupón inválido o expirado"); return; }
    setAppliedCoupon({ code, pct });
    setCouponError("");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  // Guardamos order data por si querés usarlo luego (aunque MP redirige)
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (isLogged) {
      setCustomerName((prev) => prev || user.name || "");
      setCustomerEmail((prev) => prev || user.email || "");
      if (!refName.current  && user.name)  refName.current  = user.name;
      if (!refEmail.current && user.email) refEmail.current = user.email;
    }
  }, [isLogged, user]);

  // Totales / items
  const totalItems = useMemo(() => {
    return (items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  }, [items]);

  const contentIds = useMemo(() => {
    return (items || []).map((it) => it?.productId).filter(Boolean).map(String);
  }, [items]);

  // Precio "ANTES": suma de precio * cantidad sin descuentos (solo items con promo)
  const compareTotal = useMemo(() => {
    return (items || []).reduce((acc, it) => {
      if (!it?.promo) return acc;
      return acc + (Number(it.price) || 0) * (Number(it.quantity) || 0);
    }, 0);
  }, [items]);

  // Total sin promos para calcular el ahorro real
  const fullTotal = useMemo(() => {
    return (items || []).reduce((acc, it) => {
      return acc + (Number(it.price) || 0) * (Number(it.quantity) || 0);
    }, 0);
  }, [items]);

  const showCompare = compareTotal > 0 && fullTotal > totalPrice;

  const promoSavings = useMemo(() => {
    if (!showCompare) return 0;
    return Math.max(0, fullTotal - totalPrice);
  }, [showCompare, fullTotal, totalPrice]);

  const promoPct = useMemo(() => {
    if (!showCompare || !fullTotal) return 0;
    return Math.round((promoSavings / fullTotal) * 100);
  }, [showCompare, fullTotal, promoSavings]);

  // ✅ Total final: aplica cupón si existe
  const couponDiscount = appliedCoupon ? Math.round(totalPrice * appliedCoupon.pct / 100) : 0;
  const finalTotal = totalPrice - couponDiscount;

  // ✅ Validación DNI simple (7 u 8 dígitos)
  const dniDigits = useMemo(() => onlyDigits(customerDni), [customerDni]);
  const isDniOk = dniDigits.length >= 7 && dniDigits.length <= 8;

  // ✅ Requisitos para habilitar CTA (según método de entrega)
  const canSubmit = useMemo(() => {
    if (loading || isCartEmpty) return false;
    if (!customerName.trim()) return false;
    if (!shippingAddress.trim()) return false;
    if (!isDniOk) return false;

    // ✅ SOLO COD CABA: teléfono obligatorio
    if (shippingMethod === "caba_cod") {
      const digits = onlyDigits(customerPhone);
      if (digits.length < 8) return false;
    }
    return true;
  }, [loading, isCartEmpty, customerName, customerEmail, shippingAddress, shippingMethod, customerPhone, isDniOk]);

  const isCod = shippingMethod === "caba_cod";

  // Pixel tracking inicial
  const firedCheckoutRef = useRef(false);
  useEffect(() => {
    if (isCartEmpty) return;
    if (firedCheckoutRef.current) return;
    firedCheckoutRef.current = true;
    track("InitiateCheckout", {
      value: Number(totalPrice) || 0,
      currency: "ARS",
      num_items: Number(totalItems) || 0,
      content_ids: contentIds,
      content_type: "product",
    });
  }, [isCartEmpty, totalPrice, totalItems, contentIds]);

  useEffect(() => {
    warmUpApi();
  }, []);

  const waUrl = useMemo(() => {
    if (!whatsapp) return null;

    const orderId = orderData?.orderId || orderData?._id || "";
    const msg = orderId
      ? `Hola! 👋 Quiero confirmar la entrega del pedido #${orderId}`
      : `Hola! 👋 Quiero coordinar mi entrega con ${storeName}.`;

    return `https://wa.me/${sanitizePhone(whatsapp)}?text=${encodeURIComponent(msg)}`;
  }, [whatsapp, orderData, storeName]);

  // 🔥 CAPTURA SILENCIOSA DE ABANDONO
  const handleAbandonedCapture = async (field, value) => {
    if (!value || String(value).length < 5) return;

    const abandonedData = {
      email: field === "email" ? value : customerEmail,
      phone: field === "phone" ? value : customerPhone,
      name: customerName,
      items: items,
      total: finalTotal,
      step: "checkout_form",
    };

    if (abandonedData.email || abandonedData.phone) {
      try {
        api.post("/abandoned-cart", abandonedData).catch(() => {});
      } catch (_) {}
    }
  };

  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    // ✅ FIX RACE CONDITION: leer de refs (síncronos) en vez de state (puede estar un render atrasado)
    const name    = refName.current.trim();
    const email   = refEmail.current.trim();
    const dni     = onlyDigits(refDni.current);
    const phone   = refPhone.current.trim();
    const address = refAddress.current.trim();
    const method  = refMethod.current;

    const dniOk = dni.length >= 7 && dni.length <= 8;

    if (!name || !address) {
      showError("Completá Nombre y Dirección para continuar.");
      return;
    }
    if (!dniOk) {
      showError("Ingresá un DNI válido (7 u 8 dígitos).");
      return;
    }
    if (method === "caba_cod") {
      if (onlyDigits(phone).length < 8) {
        showError("Para CABA (pagás al recibir) el teléfono es obligatorio.");
        return;
      }
    }
    if (isCartEmpty) {
      showError("Tu carrito está vacío.");
      return;
    }

    track("AddPaymentInfo", {
      value: Number(finalTotal) || 0,
      currency: "ARS",
      content_ids: contentIds,
      content_type: "product",
      payment_type: method === "caba_cod" ? "cod" : "mercadopago",
    });

    setLoading(true);
    setError("");

    try {
      const clientOrderId = getOrCreateClientOrderId();

      const body = {
        clientOrderId,
        customerName:    name,
        customerEmail:   email,
        customerDni:     dni,
        customerPhone:   phone,
        shippingAddress: address,
        shippingMethod:  method,
        paymentMethod:   method === "caba_cod" ? "cod" : "mercadopago",
        notes:           notes.trim(),
        coupon:          appliedCoupon ? appliedCoupon.code : null,
        couponDiscount:  couponDiscount,
        total:           finalTotal,
        items: items.map((item) => ({
          productId: item.productId,
          name:      item.name,
          price:     item.price,
          quantity:  item.quantity,
        })),
      };

      const res = await api.post("/orders", body);

      if (!res?.data) {
        setError("No se pudo procesar el pedido.");
        return;
      }

      // ✅ COD: mostrar pantalla de gracias
      if (method === "caba_cod") {
        clearClientOrderId();
        const data = res.data.data || res.data;
        setOrderData(data);
        track("Purchase", {
          value:       Number(finalTotal),
          currency:    "ARS",
          num_items:   totalItems,
          content_ids: contentIds,
          content_type: "product",
        });
        clearCart();
        return;
      }

      // ✅ Mercado Pago: mostrar overlay antes de redirigir
      const isProd = import.meta.env.MODE === "production";
      const url = isProd ? res.data.init_point : res.data.sandbox_init_point || res.data.init_point;

      if (url) {
        clearClientOrderId();
        setRedirecting(true); // ← activa overlay "Conectando con Mercado Pago"
        setTimeout(() => {
          window.location.href = url;
        }, 1200); // pequeño delay para que el usuario vea el feedback
        return;
      }

      clearClientOrderId();
      setError("Hubo un error generando el link de Mercado Pago. Intentá de nuevo.");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error al procesar el pedido.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Pantalla final COD
  if (orderData && shippingMethod === "caba_cod") {
    const orderId = orderData?.orderId || orderData?._id || "";
    const msg = orderId
      ? `Hola! 👋 Confirmo la entrega del pedido #${orderId}. Puedo pagar en efectivo o transferencia al recibir.`
      : `Hola! 👋 Confirmo la entrega. Puedo pagar en efectivo o transferencia al recibir.`;
    const codWaUrl = whatsapp
      ? `https://wa.me/${sanitizePhone(whatsapp)}?text=${encodeURIComponent(msg)}`
      : null;

    return (
      <main className="section">
        <div className="container">
          <section className="card reveal" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🎉</div>
            <h1 style={{ margin: "0.5rem 0", letterSpacing: "-0.03em" }}>¡Gracias por tu pedido!</h1>

            <p className="muted" style={{ fontSize: "1.02rem", fontWeight: 800, lineHeight: 1.45 }}>
              Tu pedido llega en <b>24 a 48 hs hábiles</b> (solo CABA) y lo abonás en la puerta con total comodidad.
            </p>

            <div
              style={{
                marginTop: 14,
                background: "rgba(16,185,129,.08)",
                border: "1px solid rgba(16,185,129,.22)",
                borderRadius: 14,
                padding: "12px",
                fontWeight: 900,
                color: "#065f46",
                textAlign: "left",
              }}
            >
              ✅ Te confirmamos la entrega por <b>WhatsApp</b> o por teléfono.<br />
              💵 Podés pagar en <b>efectivo</b> o <b>transferencia en el lugar</b>.
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              {codWaUrl && (
                <a
                  className="btn btn-primary"
                  href={codWaUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Confirmar por WhatsApp →
                </a>
              )}

              <Link
                to="/my-orders"
                style={{ display: "block", fontWeight: 1000, color: "var(--primary)" }}
              >
                Ver mis pedidos
              </Link>

              {typeof onClose === "function" && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onClose}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Volver a la landing
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: "1000px" }}>
        {/* Header “hook” */}
        <div style={{ textAlign: "center", marginBottom: "1.1rem" }}>
          <h1 style={{ margin: "0 0 0.5rem", letterSpacing: "-0.05em" }}>
            Conseguí el tuyo hoy 🔥
          </h1>

          {/* ✅ Banner entrega */}
          <div className="ship-banner">
            <div className="ship-banner__left">
              <div className="ship-dot" />
              <div>
                <div className="ship-title">LLEGA EN 1 A 3 DÍAS HÁBILES</div>
                <div className="ship-sub">Te avisamos por WhatsApp / email</div>
              </div>
            </div>
            <div className="ship-pill">🚚 ENVÍO RÁPIDO</div>
          </div>

          {/* Steps pills */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: 14,
            }}
          >
            <span style={stepPillStyle(1)}>1 Contacto</span>
            <span style={stepPillStyle(2)}>2 Entrega</span>
            <span style={stepPillStyle(3)}>3 Pago</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: "2rem" }} className="checkout-grid">
          {/* IZQUIERDA */}
          <div className="reveal">
            {/* 1. CONTACTO */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={stepCircleStyle}>1</span>
                Datos de Contacto
              </h3>

              <p className="muted" style={{ marginTop: 4, marginBottom: 14, fontWeight: 750 }}>
                Usamos esto para factura, seguimiento y coordinación.
              </p>

              {error && (
                <div
                  ref={errorRef}
                  style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    marginBottom: "15px",
                    fontWeight: 900,
                    border: "2px solid #dc2626",
                    fontSize: ".9rem",
                    animation: "shakeError .4s ease",
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <form id="checkout-form" onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <label className="muted" style={{ display: "grid", gap: "0.35rem", fontWeight: 900 }}>
                    Nombre y apellido
                    <input
                      value={customerName}
                      onChange={(e) => { setCustomerName(e.target.value); refName.current = e.target.value; }}
                      disabled={isLogged}
                      required
                      placeholder="Como figura en tu DNI"
                    />
                  </label>

                  <label className="muted" style={{ display: "grid", gap: "0.35rem", fontWeight: 900 }}>
                    DNI 
                    <input
                      inputMode="numeric"
                      value={customerDni}
                      onChange={(e) => { const v = onlyDigits(e.target.value); setCustomerDni(v); refDni.current = v; }}
                      placeholder="Ej: 40123456"
                      required
                    />
                    {!customerDni ? null : !isDniOk ? (
                      <span style={{ fontSize: ".82rem", color: "#ef4444", fontWeight: 900 }}>
                        DNI inválido (7 u 8 dígitos)
                      </span>
                    ) : (
                      <span style={{ fontSize: ".82rem", color: "#10b981", fontWeight: 900 }}>
                        ✅ DNI OK
                      </span>
                    )}
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <label className="muted" style={{ display: "grid", gap: "0.35rem", fontWeight: 900 }}>
                    Email (opcional)
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => { setCustomerEmail(e.target.value); refEmail.current = e.target.value; }}
                      onBlur={(e) => handleAbandonedCapture("email", e.target.value)}
                      disabled={isLogged}
                      placeholder="tu@email.com"
                    />
                  </label>

                  <label className="muted" style={{ display: "grid", gap: "0.35rem", fontWeight: 900 }}>
                    {isCod ? "Teléfono *" : "Teléfono"}
                    <input
                      value={customerPhone}
                      onChange={(e) => { setCustomerPhone(e.target.value); refPhone.current = e.target.value; }}
                      onBlur={(e) => handleAbandonedCapture("phone", e.target.value)}
                      placeholder="Ej: 11 1234 5678"
                      required={isCod}
                    />
                    {isCod && (
                      <span style={{ fontSize: ".82rem", color: "rgba(11,18,32,.65)", fontWeight: 850 }}>
                        Lo usamos para coordinar la entrega.
                      </span>
                    )}
                  </label>
                </div>

                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 900,
                  }}
                >
                  ✅ Factura + seguimiento por email / WhatsApp.
                </span>
              </form>
            </div>

            {/* 2. ENTREGA */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                <span style={stepCircleStyle}>2</span>
                Forma de Entrega
              </h3>

              <div style={{ display: "grid", gap: "10px" }}>
                <label className={`shipping-option ${shippingMethod === "correo_argentino" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="correo_argentino"
                    checked={shippingMethod === "correo_argentino"}
                    onChange={(e) => { setShippingMethod(e.target.value); refMethod.current = e.target.value; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900 }}>Envío a Domicilio (Correo Arg)</div>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      Llega a todo el país. Seguimiento incluido.
                    </div>
                  </div>
                  <div style={{ fontSize: "1.2rem" }}>🚚</div>
                </label>

                <label className={`shipping-option ${shippingMethod === "caba_cod" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="caba_cod"
                    checked={shippingMethod === "caba_cod"}
                    onChange={(e) => { setShippingMethod(e.target.value); refMethod.current = e.target.value; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      Pagás al recibir (solo CABA)
                      <span
                        style={{
                          fontSize: ".78rem",
                          fontWeight: 1000,
                          padding: "4px 8px",
                          borderRadius: 999,
                          border: "1px solid rgba(16,185,129,.25)",
                          background: "rgba(16,185,129,.10)",
                          color: "#065f46",
                        }}
                      >
                        + Confianza
                      </span>
                    </div>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      Entrega coordinada. Pagás cuando te llega.
                    </div>
                  </div>
                  <div style={{ fontSize: "1.2rem" }}>💵</div>
                </label>

                <label className={`shipping-option ${shippingMethod === "retiro_oficina" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="retiro_oficina"
                    checked={shippingMethod === "retiro_oficina"}
                    onChange={(e) => { setShippingMethod(e.target.value); refMethod.current = e.target.value; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900 }}>Retiro por Oficina</div>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      Pasás a buscarlo cuando quieras.
                    </div>
                  </div>
                  <div style={{ fontSize: "1.2rem" }}>🏢</div>
                </label>
              </div>

              <div style={{ marginTop: "1.25rem" }}>
                {shippingMethod === "caba_cod" && (
                  <div
                    style={{
                      background: "#ecfdf5",
                      border: "1px solid #bbf7d0",
                      color: "#14532d",
                      padding: "12px",
                      borderRadius: "10px",
                      marginBottom: "15px",
                      fontSize: "0.95rem",
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      fontWeight: 900,
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 1000 }}>Pagás cuando te llega</div>
                      <div style={{ fontSize: ".9rem", fontWeight: 850, opacity: 0.9 }}>
                        Solo CABA. Confirmamos entrega por WhatsApp / teléfono.
                      </div>
                    </div>
                  </div>
                )}

                {shippingMethod === "retiro_oficina" && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#14532d",
                      padding: "12px",
                      borderRadius: "10px",
                      marginBottom: "15px",
                      fontSize: "0.95rem",
                      fontWeight: 800,
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "1.2rem" }}>📍</span>
                      <strong>Retiro por:</strong>
                    </div>
                    <div style={{ paddingLeft: "32px" }}>
                      Crisólogo Larralde 2471, Saavedra, CABA.
                      <br />
                      <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                        Te avisamos cuando esté listo.
                      </span>
                    </div>
                  </div>
                )}

                <label className="muted" style={{ display: "grid", gap: "0.35rem", fontWeight: 900 }}>
                  {shippingMethod === "correo_argentino"
                    ? "Dirección de envío completa *"
                    : shippingMethod === "caba_cod"
                    ? "Dirección de entrega en CABA *"
                    : "Dirección para factura *"}
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => { setShippingAddress(e.target.value); refAddress.current = e.target.value; }}
                    placeholder={
                      shippingMethod === "correo_argentino"
                        ? "Calle, altura, piso, ciudad, código postal..."
                        : shippingMethod === "caba_cod"
                        ? "Barrio + calle + altura + piso/depto (si aplica)"
                        : "Calle y altura (necesario para el comprobante)"
                    }
                    required
                    rows={2}
                    style={{ background: "#f9f9f9" }}
                  />
                </label>

                <label className="muted" style={{ display: "grid", gap: "0.35rem", marginTop: "1rem", fontWeight: 900 }}>
                  Notas (opcional)
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: El timbre no anda, dejar en portería."
                  />
                </label>
              </div>
            </div>

            {/* 3. PAGO */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                <span style={stepCircleStyle}>3</span>
                {isCod ? "Confirmación" : "Pago (Seguro)"}
              </h3>

              {isCod ? (
                <div
                  style={{
                    background: "rgba(16,185,129,.08)",
                    border: "1px solid rgba(16,185,129,.22)",
                    borderRadius: 14,
                    padding: "12px",
                    fontWeight: 900,
                    color: "#065f46",
                  }}
                >
                  ✅ En CABA abonás al recibir. Podés pagar en <b>efectivo</b> o <b>transferencia en el lugar</b>.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "0.8rem" }}>
                  <div
                    className="card payment-option"
                    style={{
                      padding: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      border: "2px solid #009ee3",
                      background: "#f0faff",
                    }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: 999, background: "#009ee3" }} />
                    <div>
                      <div style={{ fontWeight: 1100, color: "#009ee3" }}>Mercado Pago</div>
                      <div className="muted" style={{ fontSize: "0.9rem" }}>
                        Pagá con <b>débito</b>, <b>crédito</b>, <b>dinero en cuenta</b> y más.
                        <br />
                        <span style={{ fontWeight: 900 }}>3 cuotas sin interés (según tarjeta)</span>.
                      </div>
                    </div>
                    <img
                      src="https://logowik.com/content/uploads/images/mercado-pago3162.logowik.com.webp"
                      alt="MP"
                      style={{ height: "24px", marginLeft: "auto", objectFit: "contain" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DERECHA: RESUMEN */}
          <aside>
            <div className="card summary-card" style={{ padding: "1.5rem", position: "sticky", top: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: "0.75rem" }}>
                <h3 style={{ margin: 0 }}>Resumen del pedido</h3>
                <button
                  type="button"
                  onClick={() => { if (window.confirm("¿Vaciar el carrito?")) clearCart(); }}
                  style={{ fontSize: ".75rem", fontWeight: 800, color: "rgba(11,18,32,.38)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 6, textDecoration: "underline" }}
                >
                  Vaciar
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "0.75rem" }}>
                <span style={smallBadgeStyle}>🚚 Envío GRATIS</span>
                {showCompare && <span style={smallBadgeStyle}>🔥 {promoPct}% OFF</span>}
              </div>

              {isCartEmpty ? (
                <p>El carrito está vacío</p>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {items.map((item, i) => {
                      const thumb = item.imageUrl || item.image || item.thumbnail || item.img || null;
                      const itemTotal = calcItemTotal(item);
                      return (
                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(11,92,255,.12)", background: "rgba(255,255,255,.7)" }}>
                          <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(11,92,255,.18)", background: "rgba(234,241,255,.75)", flexShrink: 0, display: "grid", placeItems: "center" }}>
                            {thumb
                              ? <img src={thumb} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <span style={{ fontSize: "1.3rem" }}>📦</span>}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: "0.88rem", lineHeight: 1.25 }}>{item.name || "Producto"}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                              <button
                                type="button"
                                onClick={() => item.quantity <= 1 ? removeItem(item.productId) : updateQty(item.productId, item.quantity - 1)}
                                style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid rgba(11,18,32,.15)", background: "rgba(11,18,32,.04)", cursor: "pointer", display: "grid", placeItems: "center", fontSize: ".85rem", fontWeight: 900, color: "rgba(11,18,32,.55)", lineHeight: 1 }}
                              >{item.quantity <= 1 ? "×" : "−"}</button>
                              <span style={{ fontSize: "0.82rem", fontWeight: 800, minWidth: 18, textAlign: "center" }}>{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQty(item.productId, item.quantity + 1)}
                                style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid rgba(11,18,32,.15)", background: "rgba(11,18,32,.04)", cursor: "pointer", display: "grid", placeItems: "center", fontSize: ".85rem", fontWeight: 900, color: "rgba(11,18,32,.55)", lineHeight: 1 }}
                              >+</button>
                              {item.promo?.type === "bundle2" && item.promo?.discountPct > 0 && (
                                <span style={{ marginLeft: 4, color: "#16a34a", fontWeight: 800, fontSize: ".75rem" }}>−{item.promo.discountPct}% PROMO</span>
                              )}
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: "right" }}>
                            {item.compareAtPrice && item.compareAtPrice > item.price && (
                              <div style={{ fontSize: "0.75rem", textDecoration: "line-through", color: "rgba(11,18,32,.35)", fontWeight: 700 }}>
                                {money(item.compareAtPrice)}
                              </div>
                            )}
                            <div style={{ fontWeight: 900, fontSize: "0.95rem", color: item.compareAtPrice && item.compareAtPrice > item.price ? "#16a34a" : "inherit" }}>
                              {money(itemTotal)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    {/* Envío gratis */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".88rem", fontWeight: 800, color: "rgba(11,18,32,.5)" }}>
                      <span>Envío</span>
                      <span style={{ color: "#16a34a", fontWeight: 900 }}>GRATIS</span>
                    </div>

                    {/* Descuento */}
                    {showCompare && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(22,163,74,.07)", border: "1px solid rgba(22,163,74,.18)", borderRadius: 10, padding: "7px 10px" }}>
                        <span style={{ fontSize: ".88rem", fontWeight: 900, color: "#15803d" }}>🏷️ Descuento promo ({promoPct}%)</span>
                        <span style={{ fontSize: ".92rem", fontWeight: 1000, color: "#15803d" }}>-{money(promoSavings)}</span>
                      </div>
                    )}

                    {/* Cupón de descuento */}
                    <div style={{ marginTop: 4 }}>
                      {!appliedCoupon ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            type="text"
                            placeholder="Cupón de descuento"
                            value={couponInput}
                            onChange={e => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                            style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(11,18,32,.12)", fontSize: ".85rem", fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", outline: "none" }}
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "rgba(11,18,32,.08)", fontWeight: 800, fontSize: ".82rem", cursor: "pointer", color: "rgba(11,18,32,.65)", whiteSpace: "nowrap" }}
                          >
                            Aplicar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(22,163,74,.07)", border: "1px solid rgba(22,163,74,.18)", borderRadius: 10, padding: "8px 12px" }}>
                          <span style={{ fontSize: ".85rem", fontWeight: 900, color: "#15803d" }}>🎟️ {appliedCoupon.code} (-{appliedCoupon.pct}%)</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: ".88rem", fontWeight: 900, color: "#15803d" }}>-{money(couponDiscount)}</span>
                            <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: ".82rem", fontWeight: 800, color: "rgba(11,18,32,.38)", textDecoration: "underline", padding: 0 }}
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      )}
                      {couponError && <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#dc2626", marginTop: 4 }}>{couponError}</div>}
                    </div>

                    {/* Total */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1.5px solid #eef2f7", marginTop: 2 }}>
                      <span style={{ fontSize: "1rem", fontWeight: 900, color: "rgba(11,18,32,.7)" }}>Total final</span>
                      <span style={{ fontSize: "1.6rem", fontWeight: 1200, letterSpacing: "-0.03em", color: "rgba(11,18,32,.92)" }}>
                        {money(finalTotal)}
                      </span>
                    </div>

                    {/* ✅ Hint de lo que falta */}
                    {!canSubmit && !isCartEmpty && (
                      <div
                        style={{
                          fontSize: ".92rem",
                          fontWeight: 900,
                          color: "rgba(11,18,32,.72)",
                          background: "rgba(148,163,184,.12)",
                          border: "1px solid rgba(148,163,184,.22)",
                          borderRadius: 14,
                          padding: "10px 12px",
                        }}
                      >
                        {isCod
                          ? "Completá Nombre, DNI, Teléfono y Dirección para confirmar el pedido."
                          : "Completá Nombre, DNI y Dirección para habilitar el pago."}
                      </div>
                    )}

                    <button
                      className={`btn btn-primary checkout-pay-btn${loading ? " is-loading" : ""}`}
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading || redirecting}
                      style={{
                        width: "100%",
                        marginTop: "0.35rem",
                        padding: "1.05rem",
                        fontSize: "1.05rem",
                        fontWeight: 1100,
                        background: isCod ? "var(--primary)" : "#009ee3",
                        border: "none",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
                        cursor: (loading || redirecting) ? "not-allowed" : "pointer",
                        position: "relative",
                        overflow: "hidden",
                        transition: "transform .1s ease, box-shadow .1s ease",
                      }}
                    >
                      {/* Ripple visual on press via CSS */}
                      <span className="btn-ripple" />
                      {redirecting
                        ? "🔄 Conectando con Mercado Pago..."
                        : loading
                        ? "⏳ Procesando tu pedido..."
                        : isCod
                        ? `Confirmar pedido · ${money(finalTotal)}`
                        : `Pagar ${money(finalTotal)} en Mercado Pago →`}
                    </button>

                    {/* ✅ Overlay "Conectando con MP" — aparece antes del redirect */}
                    {redirecting && (
                      <div style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 99999,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,158,227,0.96)",
                        backdropFilter: "blur(6px)",
                        gap: 20,
                        animation: "mpFadeIn .25s ease",
                      }}>
                        <div style={{ fontSize: "3.5rem" }}>💳</div>
                        <div style={{ fontWeight: 1200, fontSize: "1.45rem", color: "#fff", textAlign: "center", lineHeight: 1.25 }}>
                          Conectando con<br />Mercado Pago
                        </div>
                        <div style={{ fontWeight: 900, fontSize: ".98rem", color: "rgba(255,255,255,.85)", textAlign: "center" }}>
                          Vas a ser redirigido para completar el pago 🔒
                        </div>
                        <div className="mp-spinner" />
                        <div style={{ fontSize: ".85rem", color: "rgba(255,255,255,.65)", fontWeight: 850 }}>
                          No cerrés esta pantalla
                        </div>
                      </div>
                    )}

                    {/* Trust badges */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginTop: 2 }}>
                      {[
                        { icon: "🔒", label: "Pago seguro" },
                        { icon: "🚚", label: "Envío gratis" },
                        { icon: "⭐", label: "+500 clientes" },
                      ].map(({ icon, label }) => (
                        <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <span style={{ fontSize: "1.1rem" }}>{icon}</span>
                          <span style={{ fontSize: ".72rem", fontWeight: 800, color: "rgba(11,18,32,.45)", letterSpacing: ".03em" }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* ✅ estilos solo del checkout */}
          <style>{`
            .shipping-option {
              display: flex;
              align-items: center;
              gap: 15px;
              padding: 15px;
              border: 1px solid var(--border);
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.2s ease;
              background: white;
              max-width: 100%;
            }
            .shipping-option:hover {
              border-color: var(--primary);
              background: #f8fbff;
            }
            .shipping-option.selected {
              border: 2px solid var(--primary);
              background: #f0f7ff;
            }
            .shipping-option input[type="radio"] {
              width: 18px;
              height: 18px;
              accent-color: var(--primary);
              flex-shrink: 0;
            }
            .payment-option:hover {
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            }

            /* ✅ Botón pagar: animación táctil */
            .checkout-pay-btn {
              transform: scale(1);
              transition: transform .1s ease, box-shadow .1s ease, background .15s ease !important;
              user-select: none;
              -webkit-tap-highlight-color: transparent;
            }
            .checkout-pay-btn:active:not(:disabled) {
              transform: scale(0.97) !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.18) !important;
            }
            .checkout-pay-btn.is-loading {
              background: rgba(0,130,200,.85) !important;
            }

            /* ✅ Overlay MP spinner */
            .mp-spinner {
              width: 44px;
              height: 44px;
              border-radius: 999px;
              border: 4px solid rgba(255,255,255,.25);
              border-top-color: #fff;
              animation: mpSpin .75s linear infinite;
            }
            @keyframes mpSpin {
              to { transform: rotate(360deg); }
            }
            @keyframes mpFadeIn {
              from { opacity: 0; transform: scale(.96); }
              to   { opacity: 1; transform: scale(1); }
            }

            @media (max-width: 980px){
              .checkout-grid {
                grid-template-columns: 1fr !important;
                gap: 1rem !important;
              }
              .summary-card {
                position: relative !important;
                top: auto !important;
                order: -1;
                margin-bottom: 16px;
              }
            }

            .ship-banner{
              margin: 10px auto 2px;
              width: 100%;
              max-width: 780px;
              display:flex;
              align-items:center;
              justify-content: center;
              gap: 12px;
              padding: 12px 14px;
              border-radius: 16px;
              border: 1px solid rgba(11,92,255,.18);
              background: linear-gradient(180deg, rgba(239,246,255,.95), rgba(255,255,255,.9));
              box-shadow: 0 14px 40px rgba(10,20,40,.08);
            }
            .ship-banner__left{
              display:flex;
              align-items:center;
              gap: 10px;
              min-width: 0;
              justify-content: center;
              text-align: center;
            }
            .ship-dot{
              width: 10px;
              height: 10px;
              border-radius: 999px;
              background: rgba(16,185,129,1);
              box-shadow: 0 0 0 6px rgba(16,185,129,.14);
              flex-shrink: 0;
            }
            .ship-title{
              font-weight: 1100;
              letter-spacing: .06em;
              text-transform: uppercase;
              color: rgba(11,18,32,.92);
              font-size: .92rem;
              line-height: 1.1;
            }
            .ship-sub{
              margin-top: 3px;
              font-weight: 850;
              color: rgba(11,18,32,.60);
              font-size: .88rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: none;
            }
            .ship-pill{
              flex-shrink: 0;
              padding: 8px 12px;
              border-radius: 999px;
              font-weight: 1000;
              letter-spacing: .03em;
              border: 1px solid rgba(16,185,129,.25);
              background: rgba(16,185,129,.10);
              color: #065f46;
            }
            @media (max-width: 520px){
              .ship-pill{ display:none; }
              .ship-sub{ max-width: 78vw; }
            }

            /* ── Retoque visual checkout ── */
            @keyframes ckFadeUp{
              from{ opacity:0; transform:translateY(14px); }
              to{ opacity:1; transform:translateY(0); }
            }
            .section .card, .section .ship-banner{
              animation: ckFadeUp .38s cubic-bezier(.22,1,.36,1) both;
            }
            .section .card:nth-child(2){ animation-delay:.07s; }
            .section .card:nth-child(3){ animation-delay:.14s; }

            /* Smooth input focus */
            input, select, textarea{
              transition: border-color .18s ease, box-shadow .18s ease;
            }
            input:focus, select:focus, textarea:focus{
              outline:none;
              border-color: rgba(11,92,255,.55) !important;
              box-shadow: 0 0 0 3px rgba(11,92,255,.10);
            }

            /* Summary items hover */
            .ck-item{
              transition: background .15s ease;
              border-radius: 10px;
              padding: 4px 6px;
              margin: 0 -6px;
            }
            .ck-item:hover{ background: rgba(11,92,255,.03); }

            /* Pay button pulse on idle */
            @keyframes payPulse{
              0%,100%{ box-shadow:0 8px 28px rgba(11,92,255,.32); }
              50%{ box-shadow:0 12px 38px rgba(11,92,255,.52); }
            }
            @keyframes shakeError{
              0%,100%{ transform:translateX(0); }
              20%{ transform:translateX(-6px); }
              40%{ transform:translateX(6px); }
              60%{ transform:translateX(-4px); }
              80%{ transform:translateX(4px); }
            }
            button[type="submit"]{
              animation: payPulse 3s ease-in-out infinite;
              transition: transform .15s ease;
            }
            button[type="submit"]:hover{ transform: translateY(-1px); }
            button[type="submit"]:active{ transform: scale(.98); animation:none; }
          `}</style>
        </div>
      </div>
    </main>
  );
}

/* helpers inline */
const stepCircleStyle = {
  background: "var(--primary)",
  color: "white",
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.95rem",
  fontWeight: 1000,
  flexShrink: 0,
};

function stepPillStyle(n) {
  return {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(11,92,255,.18)",
    background: "rgba(255,255,255,.85)",
    fontWeight: 1000,
    color: "rgba(11,18,32,.82)",
    fontSize: "0.9rem",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}

const smallBadgeStyle = {
  fontSize: "0.85rem",
  fontWeight: 1000,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(11,92,255,.18)",
  background: "rgba(11,92,255,.08)",
  color: "var(--primary)",
};

// ✅ Mantiene compatibilidad con la ruta /checkout
export default function Checkout() {
  return <CheckoutContent />;
}