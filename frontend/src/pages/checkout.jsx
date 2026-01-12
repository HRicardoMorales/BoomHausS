// frontend/src/pages/Checkout.jsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getStoredAuth } from '../utils/auth';
import { useCart } from '../context/CartContext.jsx';
import { track } from '../lib/metaPixel';
import { warmUpApi } from "../services/api";

function money(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
}

function sanitizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

/**
 * ✅ Idempotencia (anti-duplicados)
 */
function getOrCreateClientOrderId() {
  const KEY = 'clientOrderId';
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  let id = '';
  try { if (crypto?.randomUUID) id = crypto.randomUUID(); } catch (_) { }
  if (!id) id = `co_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(KEY, id);
  return id;
}

function clearClientOrderId() {
  localStorage.removeItem('clientOrderId');
}

function Checkout() {
  const { user } = getStoredAuth();
  const isLogged = Boolean(user?.email);

  // ✅ Carrito (única fuente)
  const { items, totalPrice, clearCart } = useCart();
  const isCartEmpty = !Array.isArray(items) || items.length === 0;

  // --- Método de pago ---
  const [paymentMethod, setPaymentMethod] = useState('mercadopago'); // 'mercadopago' | 'transferencia'

  // --- Totales con descuento ---
  const transferDiscountPct = 0.10; // 10%
  const discountAmount = paymentMethod === 'transferencia' ? totalPrice * transferDiscountPct : 0;
  const finalTotal = totalPrice - discountAmount;

  const totalItems = useMemo(() => {
    return (items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  }, [items]);

  const contentIds = useMemo(() => {
    return (items || []).map((it) => it?.productId).filter(Boolean).map(String);
  }, [items]);

  // ✅ Env del negocio
  const storeName = import.meta.env.VITE_STORE_NAME || 'Encontratodo';
  const bankName = import.meta.env.VITE_BANK_NAME || 'Banco Galicia';
  const bankAlias = import.meta.env.VITE_BANK_ALIAS || 'TU.ALIAS.AQUI';
  const bankCbu = import.meta.env.VITE_BANK_CBU || '0000000000000000000000';
  const bankHolder = import.meta.env.VITE_BANK_HOLDER || 'TITULAR';
  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '';

  // ✅ Datos del cliente
  const [customerName, setCustomerName] = useState(isLogged ? user.name || '' : '');
  const [customerEmail, setCustomerEmail] = useState(isLogged ? user.email || '' : '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingMethod, setShippingMethod] = useState('correo_argentino');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pantalla final transferencia
  const [orderData, setOrderData] = useState(null);
  const [copied, setCopied] = useState({ alias: false, cbu: false });

  useEffect(() => {
    if (isLogged) {
      setCustomerName((prev) => prev || user.name || '');
      setCustomerEmail((prev) => prev || user.email || '');
    }
  }, [isLogged, user]);

  // Pixel tracking inicial
  const firedCheckoutRef = useRef(false);
  useEffect(() => {
    if (isCartEmpty) return;
    if (firedCheckoutRef.current) return;
    firedCheckoutRef.current = true;
    track('InitiateCheckout', {
      value: Number(totalPrice) || 0,
      currency: 'ARS',
      num_items: Number(totalItems) || 0,
      content_ids: contentIds,
      content_type: 'product',
    });
  }, [isCartEmpty, totalPrice, totalItems, contentIds]);

  useEffect(() => { warmUpApi(); }, []);

  const waUrl = useMemo(() => {
    if (!whatsapp) return null;
    const orderId = orderData?.orderId || orderData?._id || '';
    const msg = orderId
      ? `Hola! 👋 Te envío el comprobante del pedido #${orderId}`
      : `Hola! 👋 Quiero hacer una consulta sobre ${storeName}.`;
    return `https://wa.me/${sanitizePhone(whatsapp)}?text=${encodeURIComponent(msg)}`;
  }, [whatsapp, orderData, storeName]);

  function handleCopy(text, type) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(String(text))
      .then(() => {
        setCopied((prev) => ({ ...prev, [type]: true }));
        setTimeout(() => setCopied((prev) => ({ ...prev, [type]: false })), 1600);
      }).catch(() => { });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim() || !shippingAddress.trim()) {
      setError('Completá nombre, email y dirección.');
      return;
    }
    if (isCartEmpty) {
      setError('Tu carrito está vacío.');
      return;
    }

    track('AddPaymentInfo', {
      value: Number(finalTotal) || 0,
      currency: 'ARS',
      content_ids: contentIds,
      content_type: 'product',
      payment_type: paymentMethod
    });

    setLoading(true);
    setError('');

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
          quantity: item.quantity
        }))
      };

      const res = await api.post('/orders', body);

      if (!res?.data) {
        setError('No se pudo procesar el pedido.');
        return;
      }

      // ✅ Si el usuario eligió Mercado Pago, SOLO aceptamos la respuesta si viene un link
      if (paymentMethod === 'mercadopago') {
        const isProd = import.meta.env.MODE === 'production';
        const url = isProd
          ? res.data.init_point
          : (res.data.sandbox_init_point || res.data.init_point);

        if (url) {
          clearClientOrderId();
          window.location.href = url;
          return;
        }

        // Si no hay link, NO seguimos como transferencia
        clearClientOrderId(); // para que el próximo intento no quede marcado como duplicado
        setError('No se pudo generar el link de Mercado Pago. Probá de nuevo (ideal en incógnito si es test).');
        return;
      }

      // ✅ Transferencia: mostramos pantalla de datos bancarios
      if (res.data.ok || res.data.data) {
        clearClientOrderId();
        setOrderData(res.data.data || res.data);

        track('Purchase', {
          value: Number(finalTotal),
          currency: 'ARS',
          num_items: totalItems,
          content_ids: contentIds,
          content_type: 'product'
        });

        clearCart();
      } else {
        setError('Error: Respuesta inesperada del servidor.');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al procesar el pedido.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ✅ PANTALLA ÉXITO (Solo Transferencia)
  if (orderData) {
    const orderId = orderData.orderId || orderData._id;

    const subtotal = Number(totalPrice) || 0; // total sin descuento
    const discount = subtotal * transferDiscountPct; // 10%
    const toTransfer = subtotal - discount; // lo que debe transferir

    return (
      <main className="section">
        <div className="container">
          <section className="card reveal" style={{ padding: '1.2rem' }}>
            <span className="badge">Pedido creado</span>
            <h1 style={{ margin: '0.65rem 0 0.25rem', letterSpacing: '-0.05em' }}>
              ¡Listo! Ahora pagá por transferencia
            </h1>
            <p className="muted" style={{ marginTop: '0.35rem', lineHeight: 1.7 }}>
              Tu pedido ya está registrado. El siguiente paso es transferir y luego subir el comprobante.
            </p>

            <div style={{ marginTop: '0.95rem', display: 'grid', gap: '0.35rem' }}>
              <div className="muted"><strong>Pedido:</strong> {orderId}</div>
              <div className="muted"><strong>Subtotal:</strong> {money(orderData.totalAmount ?? totalPrice)}</div>
              <div className="muted" style={{ color: '#10b981' }}>
                <strong>Descuento transferencia (10%):</strong> -{money((orderData.totalAmount ?? totalPrice) * 0.10)}
              </div>
              <div className="muted">
                <strong>Total a transferir:</strong> <span style={{ fontWeight: 900 }}>{money((orderData.totalAmount ?? totalPrice) * 0.90)}</span>
              </div>


            </div>
          </section>

          <section className="card reveal" style={{ marginTop: '1rem', padding: '1.2rem' }}>
            <span className="badge">Datos de transferencia</span>
            <div style={{ marginTop: '0.85rem', display: 'grid', gap: '0.6rem' }}>
              <div className="muted"><strong>Banco:</strong> {bankName}</div>
              <div className="muted"><strong>Titular:</strong> {bankHolder}</div>

              <div className="card" style={{ padding: '1rem' }}>
                <div className="muted" style={{ fontWeight: 900 }}>Alias</div>
                <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 950, letterSpacing: '-0.02em' }}>{bankAlias}</div>
                  <button type="button" className="btn btn-ghost" onClick={() => handleCopy(bankAlias, 'alias')}>
                    {copied.alias ? 'Copiado ✅' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <div className="muted" style={{ fontWeight: 900 }}>CBU</div>
                <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 950, letterSpacing: '-0.02em' }}>{bankCbu}</div>
                  <button type="button" className="btn btn-ghost" onClick={() => handleCopy(bankCbu, 'cbu')}>
                    {copied.cbu ? 'Copiado ✅' : 'Copiar'}
                  </button>
                </div>
              </div>

              <p className="muted" style={{ marginTop: '0.2rem', lineHeight: 1.6 }}>
                Importante: al subir el comprobante, incluí el número de pedido.
              </p>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" to="/my-orders">Ir a Mis pedidos (subir comprobante) →</Link>
              {waUrl && <a className="btn btn-ghost" href={waUrl} target="_blank" rel="noreferrer">WhatsApp →</a>}
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ✅ CHECKOUT FORMULARIO
  return (
    <main className="section">
      <div className="container">
        <section className="card reveal" style={{ padding: '1.2rem' }}>
          <span className="badge">Checkout</span>
          <h1 style={{ margin: '0.65rem 0 0.25rem', letterSpacing: '-0.05em' }}>Confirmá tu pedido</h1>
          <p className="muted" style={{ marginTop: '0.35rem', lineHeight: 1.7 }}>
            Completá tus datos y elegí el método de pago.
          </p>
        </section>

        {/* Resumen */}
        <section className="card reveal" style={{ marginTop: '1rem', padding: '1.2rem' }}>
          <span className="badge">Resumen</span>
          {isCartEmpty ? (
            <p className="muted" style={{ marginTop: '0.75rem' }}>Tu carrito está vacío.</p>
          ) : (
            <>
              <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
                {items.map((it) => (
                  <div key={it.productId} className="card" style={{ padding: '0.9rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ fontWeight: 900 }}>{it.name}</div>
                    <div className="muted">{it.quantity} x {money(it.price)}</div>
                  </div>
                ))}
              </div>

              <hr style={{ margin: '1rem 0', opacity: 0.1 }} />

              {/* Detalle de precios */}
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Subtotal</span>
                  <span style={{ fontWeight: 600 }}>{money(totalPrice)}</span>
                </div>
                {paymentMethod === 'transferencia' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                    <span>Descuento Transferencia (10%)</span>
                    <span style={{ fontWeight: 700 }}>-{money(discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>Total Final</span>
                  <span style={{ fontWeight: 950, fontSize: '1.4rem', letterSpacing: '-0.04em' }}>{money(finalTotal)}</span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Form */}
        <section className="reveal" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: '1rem', alignItems: 'start' }}>
          <div className="card" style={{ padding: '1.2rem' }}>
            <span className="badge">Tus datos</span>
            {error && <p style={{ marginTop: '0.75rem', color: '#ef4444', fontWeight: 900 }}>{error}</p>}

            <form onSubmit={handleSubmit} style={{ marginTop: '0.9rem', display: 'grid', gap: '0.75rem' }}>
              <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>Nombre y apellido *
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={isLogged} required />
              </label>
              <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>Email *
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} disabled={isLogged} required />
              </label>
              <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>Teléfono (opcional)
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Ej: 11 1234 5678" />
              </label>
              <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>Dirección de envío *
                <textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Calle, número, ciudad..." required rows={3} />
              </label>
              <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>Método de envío
                <div className="card" style={{ padding: '1rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 900, marginBottom: '0.35rem' }}>🚚 Envíos y tiempos</div>
                  <p className="muted" style={{ margin: 0, lineHeight: 1.65 }}>
                    Enviamos a todo el país por <strong>Correo Argentino</strong> (con seguimiento).
                    <br />
                    <strong>Entrega estimada:</strong> 5 a 7 días hábiles.
                    <br />
                    <span className="muted">Despachamos tu pedido apenas se acredita el pago.</span>
                  </p>
                </div>
                <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)}>
                  <option value="correo_argentino">Correo Argentino</option>
                  <option value="moto">Moto (CABA/GBA)</option>
                </select>
              </label>

              {/* --- SECCIÓN PAGO --- */}
              <div style={{ marginTop: '1rem' }}>
                <span className="muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Forma de pago</span>
                <div style={{ display: 'grid', gap: '0.8rem' }}>

                  {/* Opción Mercado Pago */}
                  <label className="card" style={{
                    padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                    border: paymentMethod === 'mercadopago' ? '2px solid #009ee3' : '1px solid var(--border)',
                    background: paymentMethod === 'mercadopago' ? 'rgba(0, 158, 227, 0.05)' : 'transparent'
                  }}>
                    <input type="radio" name="payment" value="mercadopago"
                      checked={paymentMethod === 'mercadopago'}
                      onChange={() => setPaymentMethod('mercadopago')}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, color: '#009ee3' }}>Mercado Pago</div>
                      <div className="muted" style={{ fontSize: '0.85rem' }}>Tarjetas, dinero en cuenta.</div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontWeight: 900, color: '#009ee3', letterSpacing: '-0.02em' }}>
                      MP
                    </span>

                  </label>

                  {/* Opción Transferencia */}
                  <label className="card" style={{
                    padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                    border: paymentMethod === 'transferencia' ? '2px solid #10b981' : '1px solid var(--border)',
                    background: paymentMethod === 'transferencia' ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                  }}>
                    <input type="radio" name="payment" value="transferencia"
                      checked={paymentMethod === 'transferencia'}
                      onChange={() => setPaymentMethod('transferencia')}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, color: '#10b981' }}>Transferencia Bancaria</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#10b981' }}>10% de DESCUENTO</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>⚡</div>
                  </label>
                </div>
              </div>

              <label className="muted" style={{ display: 'grid', gap: '0.35rem', marginTop: '0.5rem' }}>Notas (opcional)
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </label>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || isCartEmpty}
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  fontSize: '1.1rem',
                  background: paymentMethod === 'mercadopago' ? '#009ee3' : undefined,
                  color: 'white'
                }}
              >
                {loading
                  ? 'Procesando...'
                  : paymentMethod === 'mercadopago' ? 'Pagar con Mercado Pago' : 'Finalizar Pedido'
                }
              </button>

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <Link className="btn btn-ghost" to="/cart">← Volver al carrito</Link>
              </div>
            </form>
          </div>

          {/* Side info */}
          <aside className="card" style={{ padding: '1.2rem', position: 'sticky', top: 90, borderRadius: 18, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
            <span className="badge">Info de Pago</span>
            <h3 style={{ margin: '0.7rem 0 0.25rem', letterSpacing: '-0.03em' }}>
              {paymentMethod === 'mercadopago' ? 'Pagá seguro con MP' : 'Pagá con Descuento'}
            </h3>
            <p className="muted" style={{ marginTop: '0.35rem', lineHeight: 1.7 }}>
              {paymentMethod === 'mercadopago'
                ? 'Al confirmar, serás redirigido a Mercado Pago para completar la transacción de forma segura.'
                : 'Al confirmar, verás los datos bancarios (CBU/Alias) para hacer la transferencia con el 10% OFF.'
              }
            </p>
            <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge">Seguro</span>
              <span className="badge">Rápido</span>
            </div>
          </aside>

          <style>{`
            @media (max-width: 980px){
              section.reveal[style*="grid-template-columns: 1fr 0.9fr"]{
                grid-template-columns: 1fr !important;
              }
              aside.card[style*="position: sticky"]{
                position: relative !important;
                top: auto !important;
              }
            }
          `}</style>
        </section>
      </div>
    </main>
  );
}

export default Checkout;
