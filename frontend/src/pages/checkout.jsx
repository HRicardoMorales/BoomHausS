// frontend/src/pages/checkout.jsx
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
  } catch (_) { }
  if (!id) id = `co_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(KEY, id);
  return id;
}

function clearClientOrderId() {
  localStorage.removeItem("clientOrderId");
}

export default function Checkout() {
  const { user } = getStoredAuth();
  const isLogged = Boolean(user?.email);
  const { pathname } = useLocation();

  // ✅ SCROLL TOP FORZADO
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => window.scrollTo(0, 0), 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  // ✅ Carrito
  const { items, totalPrice, clearCart } = useCart();
  const isCartEmpty = !Array.isArray(items) || items.length === 0;

  // --- Método de pago ---
  const [paymentMethod, setPaymentMethod] = useState("mercadopago");

  // ✅ Datos del negocio
  const storeName = import.meta.env.VITE_STORE_NAME || "BoomHausS";
  const bankName = import.meta.env.VITE_BANK_NAME || "Banco Galicia";
  const bankAlias = import.meta.env.VITE_BANK_ALIAS || "BOOM.HAUSS.MP";
  const bankCbu = import.meta.env.VITE_BANK_CBU || "0000000000000000000000";
  const bankHolder = import.meta.env.VITE_BANK_HOLDER || "BoomHausS Oficial";
  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || "";

  // ✅ Datos del cliente
  const [customerName, setCustomerName] = useState(isLogged ? user.name || "" : "");
  const [customerEmail, setCustomerEmail] = useState(isLogged ? user.email || "" : "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  // ⚡ Default a Envío
  const [shippingMethod, setShippingMethod] = useState("correo_argentino");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pantalla final transferencia
  const [orderData, setOrderData] = useState(null);
  const [copied, setCopied] = useState({ alias: false, cbu: false });

  useEffect(() => {
    if (isLogged) {
      setCustomerName((prev) => prev || user.name || "");
      setCustomerEmail((prev) => prev || user.email || "");
    }
  }, [isLogged, user]);

  // Totales / items
  const totalItems = useMemo(() => {
    return (items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  }, [items]);

  const contentIds = useMemo(() => {
    return (items || []).map((it) => it?.productId).filter(Boolean).map(String);
  }, [items]);

  // ✅ Precio "ANTES" (por ENV o fallback a 73350)
  const compareUnit = Number(import.meta.env.VITE_CHECKOUT_COMPARE_TOTAL || 73350);
  const compareTotal = useMemo(() => {
    if (!compareUnit || compareUnit <= 0) return 0;
    const qty = Math.max(1, Number(totalItems) || 1);
    return compareUnit * qty;
  }, [compareUnit, totalItems]);

  const showCompare = compareTotal > 0 && compareTotal > totalPrice;

  // ✅ Descuentos acumulables: Promo (vs "ANTES") + Transferencia
  const transferDiscountPct = 0.1;

  const promoSavings = useMemo(() => {
    if (!showCompare) return 0;
    const diff = compareTotal - totalPrice;
    return diff > 0 ? diff : 0;
  }, [showCompare, compareTotal, totalPrice]);

  const promoPct = useMemo(() => {
    if (!showCompare) return 0;
    return Math.round(((compareTotal - totalPrice) / compareTotal) * 100);
  }, [showCompare, compareTotal, totalPrice]);

  const transferSavings = paymentMethod === "transferencia" ? totalPrice * transferDiscountPct : 0;
  const finalTotal = totalPrice - transferSavings;

  // “Te queda en … (ahorrás …)” aunque NO elija transferencia (para empujar el cambio)
  const transferFinalTotalPreview = useMemo(() => {
    return totalPrice - totalPrice * transferDiscountPct;
  }, [totalPrice]);

  const transferExtraSavingsPreview = useMemo(() => {
    return totalPrice * transferDiscountPct;
  }, [totalPrice]);

  // Producto “principal” para mini resumen (thumbnail)
  const mainItem = useMemo(() => (items && items.length ? items[0] : null), [items]);
  const mainThumb = useMemo(() => {
    if (!mainItem) return null;
    return (
      mainItem.image ||
      mainItem.thumbnail ||
      mainItem.img ||
      mainItem.pictureUrl ||
      mainItem.photo ||
      null
    );
  }, [mainItem]);

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
      ? `Hola! 👋 Te envío el comprobante del pedido #${orderId}`
      : `Hola! 👋 Quiero hacer una consulta sobre ${storeName}.`;
    return `https://wa.me/${sanitizePhone(whatsapp)}?text=${encodeURIComponent(msg)}`;
  }, [whatsapp, orderData, storeName]);

  function handleCopy(text, type) {
    if (!navigator.clipboard) return;
    navigator.clipboard
      .writeText(String(text))
      .then(() => {
        setCopied((prev) => ({ ...prev, [type]: true }));
        setTimeout(() => setCopied((prev) => ({ ...prev, [type]: false })), 1600);
      })
      .catch(() => { });
  }

  // 🔥 CAPTURA SILENCIOSA DE ABANDONO
  const handleAbandonedCapture = async (field, value) => {
    if (!value || value.length < 5) return;

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
        api.post("/abandoned-cart", abandonedData).catch((err) =>
          console.log("Silent capture error:", err)
        );
      } catch (e) { }
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim() || !shippingAddress.trim()) {
      setError("Por favor completá todos los datos obligatorios.");
      return;
    }
    if (isCartEmpty) {
      setError("Tu carrito está vacío.");
      return;
    }

    track("AddPaymentInfo", {
      value: Number(finalTotal) || 0,
      currency: "ARS",
      content_ids: contentIds,
      content_type: "product",
      payment_type: paymentMethod,
    });

    setLoading(true);
    setError("");

    try {
      const clientOrderId = getOrCreateClientOrderId();

      const body = {
        clientOrderId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        shippingMethod,
        paymentMethod,
        notes: notes.trim(),
        total: finalTotal,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      };

      const res = await api.post("/orders", body);

      if (!res?.data) {
        setError("No se pudo procesar el pedido.");
        return;
      }

      if (paymentMethod === "mercadopago") {
        const isProd = import.meta.env.MODE === "production";
        const url = isProd ? res.data.init_point : res.data.sandbox_init_point || res.data.init_point;

        if (url) {
          clearClientOrderId();
          window.location.href = url;
          return;
        }

        clearClientOrderId();
        setError("Hubo un error generando el link de pago. Intenta de nuevo.");
        return;
      }

      if (res.data.ok || res.data.data) {
        clearClientOrderId();
        setOrderData(res.data.data || res.data);

        track("Purchase", {
          value: Number(finalTotal),
          currency: "ARS",
          num_items: totalItems,
          content_ids: contentIds,
          content_type: "product",
        });

        clearCart();
      } else {
        setError("Error: Respuesta inesperada del servidor.");
      }
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

  // ✅ Pantalla final transferencia
  if (orderData) {
    return (
      <main className="section">
        <div className="container">
          <section className="card reveal" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🎉</div>
            <h1 style={{ margin: "0.5rem 0", letterSpacing: "-0.03em" }}>¡Pedido Registrado!</h1>
            <p className="muted" style={{ fontSize: "1.05rem" }}>
              Ya falta poco. Realizá la transferencia para confirmar.
            </p>

            <div
              style={{
                background: "#f8fafc",
                padding: "15px",
                borderRadius: "12px",
                margin: "20px 0",
                border: "1px solid var(--border)",
              }}
            >
              <div className="muted" style={{ fontSize: "0.9rem" }}>
                Total a transferir:
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 1000, color: "#10b981" }}>
                {money(orderData.totalAmount ?? finalTotal)}
              </div>

              {showCompare && (
                <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                  <div className="muted" style={{ fontSize: "0.9rem", textDecoration: "line-through" }}>
                    {money(compareTotal)}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#10b981", fontWeight: 900 }}>
                    Ahorraste {money(compareTotal - (orderData.totalAmount ?? finalTotal))}
                  </div>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: "1.2rem", textAlign: "left", marginTop: "1rem" }}>
              <h3 style={{ marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                Datos Bancarios
              </h3>

              <div style={{ marginBottom: "15px" }}>
                <div className="muted" style={{ fontSize: "0.85rem" }}>
                  Alias
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "1.1rem" }}>{bankAlias}</strong>
                  <button
                    onClick={() => handleCopy(bankAlias, "alias")}
                    className="btn btn-ghost"
                    style={{ padding: "5px 10px", fontSize: "0.8rem" }}
                  >
                    {copied.alias ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              <div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>
                  CBU
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "1rem" }}>{bankCbu}</strong>
                  <button
                    onClick={() => handleCopy(bankCbu, "cbu")}
                    className="btn btn-ghost"
                    style={{ padding: "5px 10px", fontSize: "0.8rem" }}
                  >
                    {copied.cbu ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#64748b" }}>
                Titular: {bankHolder} ({bankName})
              </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <p className="muted" style={{ marginBottom: "10px" }}>
                Cuando transfieras, envianos el comprobante:
              </p>
              {waUrl && (
                <a
                  className="btn btn-primary"
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Enviar Comprobante por WhatsApp →
                </a>
              )}
              <Link
                to="/my-orders"
                style={{ display: "block", marginTop: "15px", fontWeight: 900, color: "var(--primary)" }}
              >
                Ver detalle de mi pedido
              </Link>
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
                <div className="ship-sub">Te avisamos por email</div>
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
                Usamos esto para factura y seguimiento del pedido.
              </p>

              {error && (
                <div
                  style={{
                    background: "#fee2e2",
                    color: "#ef4444",
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    fontWeight: 900,
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
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={isLogged}
                      required
                      placeholder="Como figura en tu DNI"
                    />
                  </label>

                  <label className="muted" style={{ display: "grid", gap: "0.35rem", fontWeight: 900 }}>
                    Teléfono
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      onBlur={(e) => handleAbandonedCapture("phone", e.target.value)}
                      placeholder="Ej: 11 1234 5678"
                    />
                  </label>
                </div>

                <label className="muted" style={{ display: "grid", gap: "0.35rem", fontWeight: 900 }}>
                  Email para la factura *
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    onBlur={(e) => handleAbandonedCapture("email", e.target.value)}
                    disabled={isLogged}
                    required
                    placeholder="tu@email.com"
                  />
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
                    ✅ Te enviaremos la factura y el seguimiento acá.
                  </span>
                </label>
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
                    onChange={(e) => setShippingMethod(e.target.value)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900 }}>Envío a Domicilio (Correo Arg)</div>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      Llega a todo el país. Seguimiento incluido.
                    </div>
                  </div>
                  <div style={{ fontSize: "1.2rem" }}>🚚</div>
                </label>

                {/* ✅ Reemplazo: Pago al recibir CABA */}
                <label className={`shipping-option ${shippingMethod === "caba_cod" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="caba_cod"
                    checked={shippingMethod === "caba_cod"}
                    onChange={(e) => setShippingMethod(e.target.value)}
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
                    onChange={(e) => setShippingMethod(e.target.value)}
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
                        Disponible solo en CABA. Te confirmamos la entrega por WhatsApp / email.
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
                      : "Dirección para factura (DNI/Fiscal) *"}
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
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
                  Notas adicionales (opcional)
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
                Método de Pago
              </h3>

              {/* Banner incentivo transferencia */}
              <div
                style={{
                  background: "#ecfdf5",
                  border: "1px solid #bbf7d0",
                  color: "#14532d",
                  padding: "12px",
                  borderRadius: "12px",
                  marginBottom: "12px",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ display: "grid", gap: 2 }}>
                  <div>💸 Con transferencia te queda en:</div>
                  <div style={{ fontSize: "1.05rem", color: "#059669" }}>{money(transferFinalTotalPreview)}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.95rem" }}>
                  Ahorrás{" "}
                  <span style={{ color: "#059669", fontWeight: 1000 }}>
                    {money(transferExtraSavingsPreview)}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gap: "0.8rem" }}>
                <label
                  className="card payment-option"
                  style={{
                    padding: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    cursor: "pointer",
                    border: paymentMethod === "mercadopago" ? "2px solid #009ee3" : "1px solid var(--border)",
                    background: paymentMethod === "mercadopago" ? "#f0faff" : "white",
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="mercadopago"
                    checked={paymentMethod === "mercadopago"}
                    onChange={() => setPaymentMethod("mercadopago")}
                    style={{ width: "20px", height: "20px", accentColor: "#009ee3" }}
                  />
                  <div>
                    <div style={{ fontWeight: 1000, color: "#009ee3" }}>Mercado Pago</div>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      Tarjetas, débito, dinero en cuenta.
                    </div>
                  </div>
                  <img
                    src="https://logowik.com/content/uploads/images/mercado-pago3162.logowik.com.webp"
                    alt="MP"
                    style={{ height: "24px", marginLeft: "auto", objectFit: "contain" }}
                  />
                </label>

                <label
                  className="card payment-option"
                  style={{
                    padding: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    cursor: "pointer",
                    border: paymentMethod === "transferencia" ? "2px solid #10b981" : "1px solid var(--border)",
                    background: paymentMethod === "transferencia" ? "#ecfdf5" : "white",
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="transferencia"
                    checked={paymentMethod === "transferencia"}
                    onChange={() => setPaymentMethod("transferencia")}
                    style={{ width: "20px", height: "20px", accentColor: "#10b981" }}
                  />
                  <div>
                    <div style={{ fontWeight: 1000, color: "#10b981" }}>Transferencia Bancaria</div>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      Alias / CBU
                    </div>
                  </div>
                  <div
                    style={{
                      marginLeft: "auto",
                      background: "#10b981",
                      color: "white",
                      fontWeight: 1000,
                      padding: "4px 8px",
                      borderRadius: "999px",
                      fontSize: "0.85rem",
                    }}
                  >
                    -10% EXTRA
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* DERECHA: RESUMEN (Sticky) */}
          <aside>
            <div className="card summary-card" style={{ padding: "1.5rem", position: "sticky", top: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Resumen del pedido</h3>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={smallBadgeStyle}>🚚 Envío GRATIS</span>
                  {showCompare && <span style={smallBadgeStyle}>🔥 {promoPct}% OFF</span>}
                </div>
              </div>

              {isCartEmpty ? (
                <p>El carrito está vacío</p>
              ) : (
                <>
                  {/* Mini producto + mini imagen */}
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(11,92,255,.12)",
                      background: "rgba(255,255,255,.7)",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        overflow: "hidden",
                        border: "1px solid rgba(11,92,255,.18)",
                        background: "rgba(234,241,255,.75)",
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {mainThumb ? (
                        <img src={mainThumb} alt="Producto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontWeight: 1000 }}>📦</span>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 1000, lineHeight: 1.2 }}>
                        {mainItem?.name || "Producto"}
                      </div>
                      <div className="muted" style={{ fontWeight: 900, fontSize: "0.9rem", marginTop: 2 }}>
                        {totalItems} item(s)
                      </div>
                    </div>

                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                      {showCompare && (
                        <div className="muted" style={{ textDecoration: "line-through", fontWeight: 900, fontSize: "0.9rem" }}>
                          {money(compareTotal)}
                        </div>
                      )}
                      <div style={{ fontWeight: 1100 }}>{money(totalPrice)}</div>
                    </div>
                  </div>

                  {/* ✅ Resumen simple: descuentos + total */}
                  <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                    {showCompare && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          color: "var(--primary)",
                          fontWeight: 1000,
                        }}
                      >
                        <span>Descuento aplicado</span>
                        <span>-{money(promoSavings)}</span>
                      </div>
                    )}

                    {paymentMethod === "transferencia" && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          color: "#10b981",
                          fontWeight: 1000,
                        }}
                      >
                        <span>10% extra por transferencia</span>
                        <span>-{money(transferSavings)}</span>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        paddingTop: 10,
                        borderTop: "1px solid #eef2f7",
                      }}
                    >
                      <span style={{ fontSize: "1rem", fontWeight: 1000, color: "rgba(11,18,32,.75)" }}>Total final</span>
                      <span style={{ fontSize: "1.55rem", fontWeight: 1200, letterSpacing: "-0.02em" }}>
                        {money(finalTotal)}
                      </span>
                    </div>

                    {/* mini hint transferencia (simple) */}
                    {paymentMethod !== "transferencia" && (
                      <div
                        style={{
                          fontSize: ".92rem",
                          fontWeight: 900,
                          color: "#059669",
                          background: "rgba(16,185,129,.08)",
                          border: "1px solid rgba(16,185,129,.20)",
                          borderRadius: 14,
                          padding: "10px 12px",
                        }}
                      >
                        💸 Con transferencia te queda en <span style={{ fontWeight: 1100 }}>{money(transferFinalTotalPreview)}</span> (ahorrás{" "}
                        <span style={{ fontWeight: 1100 }}>{money(transferExtraSavingsPreview)}</span>)
                      </div>
                    )}

                    <button
                      className="btn btn-primary"
                      type="submit"
                      form="checkout-form"
                      disabled={loading || isCartEmpty}
                      style={{
                        width: "100%",
                        marginTop: "0.35rem",
                        padding: "1.05rem",
                        fontSize: "1.05rem",
                        fontWeight: 1100,
                        background: paymentMethod === "mercadopago" ? "#009ee3" : "var(--primary)",
                        border: "none",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
                      }}
                    >
                      {loading ? "Procesando..." : paymentMethod === "mercadopago" ? "Pagar en Mercado Pago" : "Finalizar Pedido"}
                    </button>

                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        fontWeight: 850,
                      }}
                    >
                      🔒 Pago 100% seguro · Datos encriptados
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
          {/* ✅ estilos solo del checkout */}
          <style>{`
            /* trust row pro */
            .trustRow{
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-top: 12px;
              max-width: 760px;
              margin-left: auto;
              margin-right: auto;
            }
            .trustItem{
              display:flex;
              gap:10px;
              align-items:center;
              padding: 10px 12px;
              border-radius: 14px;
              background: rgba(255,255,255,.85);
              border: 1px solid rgba(11,92,255,.18);
            }
            .trustIcon{ font-size: 1.15rem; }
            .trustTop{ font-weight: 1000; line-height: 1.1; }
            .trustSub{ font-size: .9rem; font-weight: 850; color: rgba(11,18,32,.62); }
            @media (max-width: 560px){
              .trustRow{ grid-template-columns: 1fr; }
            }

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

            /* ✅ mobile sticky bar */
            .checkout-mobile-bar{
              position: fixed;
              bottom: 18px;
              left: 0;
              right: 0;
              width: 100%;
              z-index: 9999;
              padding: 0 12px;
              box-sizing: border-box;
              display: none;
            }
            .checkout-mobile-bar > div{
              width: min(1000px, calc(100% - 0px));
              margin: 0 auto;
              background: rgba(255,255,255,0.98);
              backdrop-filter: blur(12px);
              border: 1px solid #e2e8f0;
              border-radius: 999px;
              box-shadow: 0 15px 40px rgba(0,0,0,0.15);
              padding: 10px 12px;
              display:flex;
              align-items:center;
              justify-content: space-between;
              gap: 12px;
              overflow: hidden;
            }
            .checkout-mobile-pay-btn{
              background: var(--primary);
              color: #fff;
              border: none;
              padding: 12px 18px;
              border-radius: 999px;
              font-weight: 1000;
              cursor: pointer;
              box-shadow: 0 8px 25px rgba(11, 92, 255, 0.35);
              white-space: nowrap;
              flex-shrink: 0;
            }
            .checkout-mobile-pay-btn:active{ transform: scale(.98); }

            @media (max-width: 990px){
              .checkout-mobile-bar{ display:block; }
              /* evita que el sticky tape el contenido */
              body{ padding-bottom: 92px; }
            }
              .ship-banner{
  margin: 10px auto 2px;
  width: 100%;
  max-width: 780px;
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(11,92,255,.18);
  background: linear-gradient(180deg, rgba(239,246,255,.95), rgba(255,255,255,.9));
  box-shadow: 0 14px 40px rgba(10,20,40,.08);
   width: 100%;
  justify-content: center;  
}

.ship-banner__left{
  display:flex;
  align-items:center;
  gap: 10px;
  min-width: 0;
    justify-content: center;   /* ✅ centra dentro */
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
  .ship-pill{ display:none; } /* en cel se ve más limpio */
  .ship-sub{ max-width: 78vw; }
}

          `}</style>
        </div>
      </div>
    </main>
  );
}

/* helpers inline (los dejo como estaban) */
const chipStyle = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,.85)",
  border: "1px solid rgba(11,92,255,.18)",
  fontWeight: 1000,
  color: "rgba(11,18,32,.82)",
  fontSize: "0.9rem",
};

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
