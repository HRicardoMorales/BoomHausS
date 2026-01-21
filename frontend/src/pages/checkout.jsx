import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');

  // --- Totales con descuento ---
  const transferDiscountPct = 0.10;
  const discountAmount = paymentMethod === 'transferencia' ? totalPrice * transferDiscountPct : 0;
  const finalTotal = totalPrice - discountAmount;

  const totalItems = useMemo(() => {
    return (items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  }, [items]);

  const contentIds = useMemo(() => {
    return (items || []).map((it) => it?.productId).filter(Boolean).map(String);
  }, [items]);

  // ✅ Env del negocio
  const storeName = import.meta.env.VITE_STORE_NAME || 'BoomHausS';
  const bankName = import.meta.env.VITE_BANK_NAME || 'Banco Galicia';
  const bankAlias = import.meta.env.VITE_BANK_ALIAS || 'BOOM.HAUSS.MP';
  const bankCbu = import.meta.env.VITE_BANK_CBU || '0000000000000000000000';
  const bankHolder = import.meta.env.VITE_BANK_HOLDER || 'BoomHausS Oficial';
  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '';

  // ✅ Datos del cliente
  const [customerName, setCustomerName] = useState(isLogged ? user.name || '' : '');
  const [customerEmail, setCustomerEmail] = useState(isLogged ? user.email || '' : '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  // ⚡ Default a Envío
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

  // 🔥 ESTRATEGIA: CAPTURA FURTIVA DE CARRITO ABANDONADO 🔥
  // Se ejecuta cuando el usuario saca el foco (onBlur) del input de email o teléfono
  const handleAbandonedCapture = async (field, value) => {
    if (!value || value.length < 5) return; // Validación mínima

    // Armamos el objeto con lo que tengamos hasta ahora
    const abandonedData = {
        email: field === 'email' ? value : customerEmail,
        phone: field === 'phone' ? value : customerPhone,
        name: customerName,
        items: items, // Qué productos tiene
        total: finalTotal, // Cuánta plata es
        step: 'checkout_form'
    };

    // Solo enviamos si tenemos al menos un dato de contacto clave
    if (abandonedData.email || abandonedData.phone) {
        try {
            // Enviamos al backend sin bloquear la UI (sin await bloqueante ni loading)
            api.post('/abandoned-cart', abandonedData).catch(err => console.log('Silent capture error:', err));
        } catch (e) {
            // Ignoramos errores para no molestar al usuario
        }
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim() || !shippingAddress.trim()) {
      setError('Por favor completá todos los datos obligatorios.');
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

        clearClientOrderId();
        setError('Hubo un error generando el link de pago. Intenta de nuevo.');
        return;
      }

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

  if (orderData) {
    return (
      <main className="section">
        <div className="container">
          <section className="card reveal" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎉</div>
            <h1 style={{ margin: '0.5rem 0', letterSpacing: '-0.03em' }}>
              ¡Pedido Registrado!
            </h1>
            <p className="muted" style={{ fontSize: '1.1rem' }}>
              Ya falta poco. Realizá la transferencia para confirmar.
            </p>

            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', margin: '20px 0', border: '1px solid var(--border)' }}>
              <div className="muted" style={{ fontSize: '0.9rem' }}>Total a transferir:</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>{money((orderData.totalAmount ?? totalPrice) * 0.90)}</div>
              <div className="muted" style={{ fontSize: '0.85rem', textDecoration: 'line-through' }}>{money(orderData.totalAmount ?? totalPrice)}</div>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>¡Ahorraste {money((orderData.totalAmount ?? totalPrice) * 0.10)}!</div>
            </div>

            <div className="card" style={{ padding: '1.2rem', textAlign: 'left', marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Datos Bancarios</h3>
              <div style={{ marginBottom: '15px' }}>
                <div className="muted" style={{ fontSize: '0.85rem' }}>Alias</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1.1rem' }}>{bankAlias}</strong>
                  <button onClick={() => handleCopy(bankAlias, 'alias')} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                    {copied.alias ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: '0.85rem' }}>CBU</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1rem' }}>{bankCbu}</strong>
                  <button onClick={() => handleCopy(bankCbu, 'cbu')} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                    {copied.cbu ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#64748b' }}>Titular: {bankHolder} ({bankName})</div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <p className="muted" style={{ marginBottom: '10px' }}>Cuando transfieras, envianos el comprobante:</p>
              {waUrl && <a className="btn btn-primary" href={waUrl} target="_blank" rel="noreferrer" style={{ width: '100%', justifyContent: 'center' }}>Enviar Comprobante por WhatsApp →</a>}
              <Link to="/my-orders" style={{ display: 'block', marginTop: '15px', fontWeight: 700, color: 'var(--primary)' }}>Ver detalle de mi pedido</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: '1000px' }}>

        <h1 style={{ margin: '0 0 1.5rem', letterSpacing: '-0.05em', textAlign: 'center' }}>Finalizar Compra</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', gap: '2rem' }} className="checkout-grid">

          {/* COLUMNA IZQUIERDA: DATOS */}
          <div className="reveal">

            {/* 1. TUS DATOS */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'var(--primary)', color: 'white', width: '25px', height: '25px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>1</span>
                Datos de Contacto
              </h3>

              {error && <div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontWeight: 600 }}>⚠️ {error}</div>}

              <form id="checkout-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>Nombre y apellido *
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={isLogged} required placeholder="Como figura en tu DNI" />
                  </label>
                  <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>Teléfono
                    <input 
                        value={customerPhone} 
                        onChange={(e) => setCustomerPhone(e.target.value)} 
                        onBlur={(e) => handleAbandonedCapture('phone', e.target.value)} // 👈 AQUÍ ESTÁ LA MAGIA
                        placeholder="Ej: 11 1234 5678" 
                    />
                  </label>
                </div>
                
                <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>Email para la factura *
                  <input 
                    type="email" 
                    value={customerEmail} 
                    onChange={(e) => setCustomerEmail(e.target.value)} 
                    onBlur={(e) => handleAbandonedCapture('email', e.target.value)} // 👈 AQUÍ ESTÁ LA MAGIA
                    disabled={isLogged} 
                    required 
                    placeholder="tu@email.com" 
                  />
                  <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    ✅ Te enviaremos la factura y seguimiento aquí.
                  </span>
                </label>
              </form>
            </div>

            {/* 2. ENTREGA (ACTUALIZADO CON MENSAJES Y DIRECCIÓN) */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <span style={{ background: 'var(--primary)', color: 'white', width: '25px', height: '25px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>2</span>
                Forma de Entrega
              </h3>

              <div style={{ display: 'grid', gap: '10px' }}>
                {/* Opción Correo */}
                <label className={`shipping-option ${shippingMethod === 'correo_argentino' ? 'selected' : ''}`}>
                  <input type="radio" name="shipping" value="correo_argentino" checked={shippingMethod === 'correo_argentino'} onChange={(e) => setShippingMethod(e.target.value)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>Envío a Domicilio (Correo Arg)</div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>Llega a todo el país. Seguimiento incluido.</div>
                  </div>
                  <div style={{ fontSize: '1.2rem' }}>🚚</div>
                </label>

                {/* Opción Punto de Encuentro */}
                <label className={`shipping-option ${shippingMethod === 'punto_encuentro' ? 'selected' : ''}`}>
                  <input type="radio" name="shipping" value="punto_encuentro" checked={shippingMethod === 'punto_encuentro'} onChange={(e) => setShippingMethod(e.target.value)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>Punto de Encuentro (CABA)</div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>Acordamos un lugar conveniente en Capital.</div>
                  </div>
                  <div style={{ fontSize: '1.2rem' }}>📍</div>
                </label>

                {/* Opción Retiro */}
                <label className={`shipping-option ${shippingMethod === 'retiro_oficina' ? 'selected' : ''}`}>
                  <input type="radio" name="shipping" value="retiro_oficina" checked={shippingMethod === 'retiro_oficina'} onChange={(e) => setShippingMethod(e.target.value)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>Retiro por Oficina</div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>Pasá a buscarlo cuando quieras.</div>
                  </div>
                  <div style={{ fontSize: '1.2rem' }}>🏢</div>
                </label>
              </div>

              {/* MENSAJES Y DIRECCIÓN DINÁMICA */}
              <div style={{ marginTop: '1.5rem' }}>
                
                {/* Caso 1: Punto de encuentro */}
                {shippingMethod === 'punto_encuentro' && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', padding: '12px', borderRadius: '10px', marginBottom: '15px', fontSize: '0.9rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                     <span style={{fontSize: '1.2rem'}}>📱</span>
                     <div>
                       <strong>¡Genial!</strong> Una vez confirmada la compra, escribinos por WhatsApp para coordinar día y horario en CABA.
                     </div>
                  </div>
                )}

                {/* Caso 2: Retiro Oficina */}
                {shippingMethod === 'retiro_oficina' && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#14532d', padding: '12px', borderRadius: '10px', marginBottom: '15px', fontSize: '0.9rem' }}>
                     <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px'}}>
                       <span style={{fontSize: '1.2rem'}}>📍</span>
                       <strong>Retiro por:</strong>
                     </div>
                     <div style={{paddingLeft: '32px'}}>
                       Crisólogo Larralde 2471, Saavedra, Capital Federal.<br/>
                       <span style={{fontSize: '0.8rem', opacity: 0.85}}>Te avisaremos cuando tu pedido esté listo.</span>
                     </div>
                  </div>
                )}

                {/* INPUT DE DIRECCIÓN (Siempre presente pero cambia el texto) */}
                <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>
                  {shippingMethod === 'correo_argentino' ? 'Dirección de envío completa *' : 'Dirección para la Factura (DNI/Fiscal) *'}
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder={shippingMethod === 'correo_argentino' ? "Calle, altura, piso, ciudad, código postal..." : "Calle y altura (necesario para el comprobante)"}
                    required
                    rows={2}
                    style={{ background: '#f9f9f9' }}
                  />
                </label>
              </div>

              <label className="muted" style={{ display: 'grid', gap: '0.35rem', marginTop: '1rem' }}>Notas adicionales (opcional)
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: El timbre no anda, dejar en portería." />
              </label>
            </div>

            {/* 3. PAGO */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <span style={{ background: 'var(--primary)', color: 'white', width: '25px', height: '25px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>3</span>
                Método de Pago
              </h3>

              <div style={{ display: 'grid', gap: '0.8rem' }}>
                <label className="card payment-option" style={{
                  padding: '1rem', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer',
                  border: paymentMethod === 'mercadopago' ? '2px solid #009ee3' : '1px solid var(--border)',
                  background: paymentMethod === 'mercadopago' ? '#f0faff' : 'white'
                }}>
                  <input type="radio" name="payment" value="mercadopago"
                    checked={paymentMethod === 'mercadopago'}
                    onChange={() => setPaymentMethod('mercadopago')}
                    style={{ width: '20px', height: '20px', accentColor: '#009ee3' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, color: '#009ee3' }}>Mercado Pago</div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>Tarjetas de crédito, débito, dinero en cuenta.</div>
                  </div>
                  <img src="https://logotipoz.com/wp-content/uploads/2021/10/version-horizontal-logo-mercado-pago.webp" alt="MP" style={{ height: '24px', marginLeft: 'auto', objectFit: 'contain' }} />
                </label>

                <label className="card payment-option" style={{
                  padding: '1rem', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer',
                  border: paymentMethod === 'transferencia' ? '2px solid #10b981' : '1px solid var(--border)',
                  background: paymentMethod === 'transferencia' ? '#ecfdf5' : 'white'
                }}>
                  <input type="radio" name="payment" value="transferencia"
                    checked={paymentMethod === 'transferencia'}
                    onChange={() => setPaymentMethod('transferencia')}
                    style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, color: '#10b981' }}>Transferencia Bancaria</div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>Alias / CBU</div>
                  </div>
                  <div style={{ marginLeft: 'auto', background: '#10b981', color: 'white', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                    -10% OFF
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: RESUMEN (Sticky) */}
          <aside>
            <div className="card summary-card" style={{ padding: '1.5rem', position: 'sticky', top: '20px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Resumen del pedido</h3>

              {isCartEmpty ? (
                <p>El carrito está vacío</p>
              ) : (
                <>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '5px' }}>
                    {items.map((it) => (
                      <div key={it.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
                        <div><span style={{ fontWeight: 700 }}>{it.quantity}x</span> {it.name}</div>
                        <div className="muted">{money(it.price * it.quantity)}</div>
                      </div>
                    ))}
                  </div>

                  <hr style={{ border: 0, borderTop: '1px solid #eee', margin: '15px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="muted">Subtotal</span>
                    <span>{money(totalPrice)}</span>
                  </div>

                  {paymentMethod === 'transferencia' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#10b981' }}>
                      <span>Descuento Transferencia</span>
                      <span style={{ fontWeight: 700 }}>-{money(discountAmount)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>Total</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900 }}>{money(finalTotal)}</span>
                  </div>

                  <button
                    className="btn btn-primary"
                    type="submit"
                    form="checkout-form"
                    disabled={loading || isCartEmpty}
                    style={{
                      width: '100%',
                      marginTop: '1.5rem',
                      padding: '1.1rem',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      background: paymentMethod === 'mercadopago' ? '#009ee3' : 'var(--primary)',
                      border: 'none',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  >
                    {loading
                      ? 'Procesando...'
                      : paymentMethod === 'mercadopago' ? 'Pagar en Mercado Pago' : 'Finalizar Pedido'
                    }
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    🔒 Pago 100% seguro y encriptado
                  </div>
                </>
              )}
            </div>
          </aside>

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
                 margin-bottom: 20px;
              }
            }
          `}</style>
        </div>
      </div>
    </main>
  );
}

export default Checkout;