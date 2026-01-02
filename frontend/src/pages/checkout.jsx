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
    try {
        if (crypto?.randomUUID) id = crypto.randomUUID();
    } catch (_) { }

    if (!id) {
        id = `co_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }

    localStorage.setItem(KEY, id);
    return id;
}


function clearClientOrderId() {
    localStorage.removeItem('clientOrderId');
}

function Checkout() {
    const { user } = getStoredAuth();
    const isLogged = Boolean(user?.email);

    useEffect(() => {
        if (!isCartEmpty) {
            const numItems = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

            track("InitiateCheckout", {
                value: Number(totalPrice) || 0,
                currency: "ARS",
                num_items: numItems,
                content_ids: items.map(i => String(i.productId)),
                contents: items.map(i => ({
                    id: String(i.productId),
                    quantity: Number(i.quantity) || 1,
                    item_price: Number(i.price) || 0
                }))
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // ✅ Carrito (única fuente)
    const { items, totalPrice, clearCart } = useCart();
    const isCartEmpty = !Array.isArray(items) || items.length === 0;

    const totalItems = useMemo(() => {
        return (items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    }, [items]);

    // content_ids para Meta (usa productId)
    const contentIds = useMemo(() => {
        return (items || [])
            .map((it) => it?.productId)
            .filter(Boolean)
            .map(String);
    }, [items]);

    // ✅ Env del negocio
    const storeName = import.meta.env.VITE_STORE_NAME || 'Encontratodo';
    const bankName = import.meta.env.VITE_BANK_NAME || 'Banco Galicia';
    const bankAlias = import.meta.env.VITE_BANK_ALIAS || 'TU.ALIAS.AQUI';
    const bankCbu = import.meta.env.VITE_BANK_CBU || '0000000000000000000000';
    const bankHolder = import.meta.env.VITE_BANK_HOLDER || 'TITULAR';
    const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || ''; // ej: 54911XXXXXXXXX

    // ✅ Si está logueado, prefill nombre/email
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

    // copiar alias/cbu
    const [copied, setCopied] = useState({ alias: false, cbu: false });

    useEffect(() => {
        if (isLogged) {
            setCustomerName((prev) => prev || user.name || '');
            setCustomerEmail((prev) => prev || user.email || '');
        }
    }, [isLogged, user]);

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

        navigator.clipboard
            .writeText(String(text))
            .then(() => {
                setCopied((prev) => ({ ...prev, [type]: true }));
                setTimeout(() => setCopied((prev) => ({ ...prev, [type]: false })), 1600);
            })
            .catch(() => { });
    }

    // ✅ Pixel: InitiateCheckout al entrar a /checkout (una sola vez)
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
    useEffect(() => {
        warmUpApi();
    }, []);

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

        // ✅ Pixel: AddPaymentInfo al apretar "Crear pedido"
        track('AddPaymentInfo', {
            value: Number(totalPrice) || 0,
            currency: 'ARS',
            num_items: Number(totalItems) || 0,
            content_ids: contentIds,
            content_type: 'product',
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
                notes: notes.trim(),
                items: items.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            };

            const res = await api.post('/orders', body);

            if (res.data?.ok) {
                clearClientOrderId();

                setOrderData(res.data.data);

                // ✅ Pixel: como es transferencia, recomiendo "Lead" cuando se crea la orden
                const total = Number(res.data.data?.totalAmount ?? totalPrice) || 0;
                track('Lead', {
                    value: total,
                    currency: 'ARS',
                    content_ids: contentIds,
                    content_type: 'product',
                });

                const orderValue = Number(res.data.data?.totalAmount ?? totalPrice) || 0;
                const numItems = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

                track("Purchase", {
                    value: orderValue,
                    currency: "ARS",
                    num_items: numItems,
                    content_ids: items.map(i => String(i.productId)),
                    contents: items.map(i => ({
                        id: String(i.productId),
                        quantity: Number(i.quantity) || 1,
                        item_price: Number(i.price) || 0
                    }))
                });

                // Si algún día querés optimizar directo a Purchase (ojo: acá NO está pagado):
                // track('Purchase', { value: total, currency: 'ARS', content_ids: contentIds, content_type: 'product' });

                clearCart();
            } else {
                setError('No se pudo crear la orden. Probá de nuevo.');
            }
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Error al crear el pedido.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    // ✅ Pantalla final transferencia
    if (orderData) {
        const orderId = orderData.orderId || orderData._id;

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
                            <div className="muted">
                                <strong>Pedido:</strong> {orderId}
                            </div>
                            <div className="muted">
                                <strong>Total:</strong> {money(orderData.totalAmount ?? totalPrice)}
                            </div>
                            <div className="muted">
                                <strong>Estado:</strong> {String(orderData.paymentStatus || 'pending')}
                            </div>
                            <div className="muted">
                                <strong>Envío:</strong> {String(orderData.shippingMethod || shippingMethod)}
                            </div>
                        </div>
                    </section>

                    <section className="card reveal" style={{ marginTop: '1rem', padding: '1.2rem' }}>
                        <span className="badge">Datos de transferencia</span>

                        <div style={{ marginTop: '0.85rem', display: 'grid', gap: '0.6rem' }}>
                            <div className="muted">
                                <strong>Banco:</strong> {bankName}
                            </div>
                            <div className="muted">
                                <strong>Titular:</strong> {bankHolder}
                            </div>

                            <div className="card" style={{ padding: '1rem' }}>
                                <div className="muted" style={{ fontWeight: 900 }}>Alias</div>
                                <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 950, letterSpacing: '-0.02em' }}>{bankAlias}</div>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={() => handleCopy(bankAlias, 'alias')}
                                        disabled={!navigator.clipboard}
                                    >
                                        {copied.alias ? 'Copiado ✅' : 'Copiar'}
                                    </button>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '1rem' }}>
                                <div className="muted" style={{ fontWeight: 900 }}>CBU</div>
                                <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 950, letterSpacing: '-0.02em' }}>{bankCbu}</div>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={() => handleCopy(bankCbu, 'cbu')}
                                        disabled={!navigator.clipboard}
                                    >
                                        {copied.cbu ? 'Copiado ✅' : 'Copiar'}
                                    </button>
                                </div>
                            </div>

                            <p className="muted" style={{ marginTop: '0.2rem', lineHeight: 1.6 }}>
                                Importante: al subir el comprobante, incluí el número de pedido.
                            </p>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                            <Link className="btn btn-primary" to="/my-orders">
                                Ir a Mis pedidos (subir comprobante) →
                            </Link>

                            {waUrl ? (
                                <a className="btn btn-ghost" href={waUrl} target="_blank" rel="noreferrer">
                                    WhatsApp →
                                </a>
                            ) : null}

                            <Link className="btn btn-ghost" to="/">
                                Volver al inicio
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    // ✅ Checkout normal
    return (
        <main className="section">
            <div className="container">
                <section className="card reveal" style={{ padding: '1.2rem' }}>
                    <span className="badge">Checkout</span>
                    <h1 style={{ margin: '0.65rem 0 0.25rem', letterSpacing: '-0.05em' }}>
                        Confirmá tu pedido
                    </h1>
                    <p className="muted" style={{ marginTop: '0.35rem', lineHeight: 1.7 }}>
                        Pagás por transferencia y después subís el comprobante.
                    </p>

                    {!isLogged ? (
                        <p className="muted" style={{ marginTop: '0.65rem', lineHeight: 1.7 }}>
                            Estás comprando como invitado. Si preferís, podés <Link to="/login">iniciar sesión</Link>.
                        </p>
                    ) : (
                        <p className="muted" style={{ marginTop: '0.65rem', lineHeight: 1.7 }}>
                            Estás logueado como <strong>{user.email}</strong>. (Nombre y email se autocompletan)
                        </p>
                    )}
                </section>

                {/* Resumen */}
                <section className="card reveal" style={{ marginTop: '1rem', padding: '1.2rem' }}>
                    <span className="badge">Resumen</span>

                    {isCartEmpty ? (
                        <p className="muted" style={{ marginTop: '0.75rem' }}>
                            Tu carrito está vacío. <Link to="/products">Ir a la tienda</Link>
                        </p>
                    ) : (
                        <>
                            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
                                {items.map((it) => (
                                    <div
                                        key={it.productId}
                                        className="card"
                                        style={{
                                            padding: '0.9rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: '1rem',
                                            flexWrap: 'wrap'
                                        }}
                                    >
                                        <div style={{ fontWeight: 900 }}>{it.name}</div>
                                        <div className="muted">
                                            {it.quantity} x {money(it.price)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                <div className="muted" style={{ fontWeight: 900 }}>Total</div>
                                <div style={{ fontWeight: 950, fontSize: '1.4rem', letterSpacing: '-0.04em' }}>
                                    {money(totalPrice)}
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* Form */}
                <section
                    className="reveal"
                    style={{
                        marginTop: '1rem',
                        display: 'grid',
                        gridTemplateColumns: '1fr 0.9fr',
                        gap: '1rem',
                        alignItems: 'start'
                    }}
                >
                    <div className="card" style={{ padding: '1.2rem' }}>
                        <span className="badge">Tus datos</span>

                        {error ? (
                            <p style={{ marginTop: '0.75rem', color: 'rgba(255,180,180,1)', fontWeight: 900 }}>
                                {error}
                            </p>
                        ) : null}

                        <form onSubmit={handleSubmit} style={{ marginTop: '0.9rem', display: 'grid', gap: '0.75rem' }}>
                            <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>
                                Nombre y apellido *
                                <input
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    disabled={isLogged}
                                    required
                                />
                            </label>

                            <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>
                                Email *
                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    disabled={isLogged}
                                    required
                                />
                            </label>

                            <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>
                                Teléfono (opcional)
                                <input
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="Ej: 11 1234 5678"
                                />
                            </label>

                            <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>
                                Dirección de envío *
                                <textarea
                                    value={shippingAddress}
                                    onChange={(e) => setShippingAddress(e.target.value)}
                                    placeholder="Calle, número, piso/depto, barrio, ciudad, provincia"
                                    required
                                    rows={4}
                                />
                            </label>

                            <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>
                                Método de envío
                                <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)}>
                                    <option value="correo_argentino">Correo Argentino</option>
                                    <option value="andreani">Andreani</option>
                                    <option value="oca">OCA</option>
                                    <option value="moto">Moto (CABA/GBA)</option>
                                </select>
                            </label>

                            <label className="muted" style={{ display: 'grid', gap: '0.35rem' }}>
                                Notas (opcional)
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Horarios, referencias, etc."
                                    rows={3}
                                />
                            </label>

                            <button className="btn btn-primary" type="submit" disabled={loading || isCartEmpty}>
                                {loading ? 'Creando pedido…' : 'Crear pedido →'}
                            </button>

                            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                                <Link className="btn btn-ghost" to="/cart">← Volver al carrito</Link>
                                <Link className="btn btn-ghost" to="/products">Seguir viendo</Link>
                            </div>
                        </form>
                    </div>

                    {/* Side info */}
                    <aside
                        className="card"
                        style={{
                            padding: '1.2rem',
                            position: 'sticky',
                            top: 90,
                            borderRadius: 18,
                            border: '1px solid var(--border)',
                            background: 'rgba(255,255,255,0.03)'
                        }}
                    >
                        <span className="badge">Importante</span>
                        <h3 style={{ margin: '0.7rem 0 0.25rem', letterSpacing: '-0.03em' }}>
                            Pagás por transferencia
                        </h3>
                        <p className="muted" style={{ marginTop: '0.35rem', lineHeight: 1.7 }}>
                            Después de crear el pedido, te mostramos los datos para transferir y el botón para ir a “Mis pedidos” y subir el comprobante.
                        </p>

                        <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="badge">Sin tarjeta</span>
                            <span className="badge">Comprobante</span>
                            <span className="badge">Envíos</span>
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
