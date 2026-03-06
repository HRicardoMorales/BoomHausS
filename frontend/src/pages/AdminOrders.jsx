// frontend/src/pages/AdminOrders.jsx

import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

// --- Utilerías ---
function money(n) {
    const num = Number(n);
    if (Number.isNaN(num)) return '$0';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);
}

function formatDate(d) {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleString('es-AR', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    } catch {
        return '—';
    }
}

function getStatusColor(status) {
    switch (String(status).toLowerCase()) {
        case 'approved':
        case 'confirmed':
        case 'delivered':
        case 'shipped':
            return { bg: 'rgba(50, 255, 100, 0.15)', color: '#4fec85', border: '1px solid rgba(50, 255, 100, 0.3)' };
        case 'cancelled':
        case 'rejected':
            return { bg: 'rgba(255, 80, 80, 0.15)', color: '#ff6b6b', border: '1px solid rgba(255, 80, 80, 0.3)' };
        case 'proof_uploaded':
            return { bg: 'rgba(50, 150, 255, 0.15)', color: '#66b3ff', border: '1px solid rgba(50, 150, 255, 0.3)' };
        case 'pending':
        default:
            return { bg: 'rgba(255, 200, 0, 0.15)', color: '#ffca2c', border: '1px solid rgba(255, 200, 0, 0.3)' };
    }
}

// Helper para obtener URL completa de imagen
const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    return `${BASE_URL}/${cleanPath}`;
};

export default function AdminOrders() {
    // ESTADO PRINCIPAL: TABS
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'abandoned'

    // ESTADOS DE PEDIDOS
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [imageToView, setImageToView] = useState(null);

    // ESTADOS DE CARRITOS ABANDONADOS
    const [abandonedCarts, setAbandonedCarts] = useState([]);
    const [loadingAbandoned, setLoadingAbandoned] = useState(false);

    useEffect(() => {
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'abandoned') fetchAbandonedCarts();
    }, [activeTab]);

    // --- LÓGICA PEDIDOS ---
    async function fetchOrders() {
        try {
            setLoading(true);
            const res = await api.get('/orders');
            if (res.data?.ok) {
                const sorted = (res.data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(sorted);
            }
        } catch (err) {
            console.error(err);
            setError('Error al cargar pedidos.');
        } finally {
            setLoading(false);
        }
    }

    // --- LÓGICA ABANDONADOS ---
    async function fetchAbandonedCarts() {
        try {
            setLoadingAbandoned(true);
            // Asegúrate de tener esta ruta en tu backend (GET /api/abandoned-carts)
            const res = await api.get('/abandoned-carts');
            // Si tu API devuelve directo el array o { ok: true, data: [] }
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setAbandonedCarts(data);
        } catch (err) {
            console.error("Error cargando abandonados", err);
        } finally {
            setLoadingAbandoned(false);
        }
    }

    async function recoverCart(id) {
        if (!window.confirm("¿Marcar como recuperado/descartado?")) return;
        try {
            await api.post(`/abandoned-carts/${id}/recover`);
            fetchAbandonedCarts(); // Refrescar lista
        } catch (e) {
            alert("Error al actualizar");
        }
    }

    const getWhatsAppLink = (lead) => {
        if (!lead.phone) return null;
        let phone = lead.phone.replace(/[^\d]/g, "");
        if (!phone.startsWith("54")) phone = "549" + phone;

        const nombre = lead.name || "Hola";
        const producto = lead.items?.[0]?.name || "el producto";

        // MENSAJE DE RECUPERACIÓN
        const mensaje = `Hola ${nombre}! 👋 Te escribo de BoomHausS. Vi que estabas por comprar ${producto} pero no finalizaste. ¿Tuviste algún problema con el pago? Avisame y te ayudo.`;

        return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
    };

    // Actualizar estado pedido
    async function handleUpdateOrder(orderId, changes) {
        try {
            setUpdatingOrderId(orderId);
            const res = await api.patch(`/orders/${orderId}`, changes);
            if (res.data?.ok) {
                const updatedOrder = res.data.data;
                setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
            }
        } catch (err) {
            alert('Error al actualizar');
        } finally {
            setUpdatingOrderId(null);
        }
    }

    async function handleVerify(order) {
        try {
            setUpdatingOrderId(order._id);
            const res = await api.patch(`/orders/${order._id}/verify`);
            if (res.data?.ok && res.data.data) {
                const updated = res.data.data;
                setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
            } else fetchOrders();
        } catch (err) { alert('Error verificando'); }
        finally { setUpdatingOrderId(null); }
    }

    const paymentStatusOptions = ['pending', 'proof_uploaded', 'approved', 'confirmed', 'rejected', 'cancelled'];
    const shippingStatusOptions = ['pending', 'shipped', 'delivered', 'cancelled'];

    const paymentStatusLabel = { pending: 'Pendiente', proof_uploaded: 'Con Comprobante', approved: 'Aprobado', confirmed: 'Confirmado', rejected: 'Rechazado', cancelled: 'Cancelado' };
    const shippingStatusLabel = { pending: 'Pendiente', shipped: 'En Camino', delivered: 'Entregado', cancelled: 'Cancelado' };

    const stats = useMemo(() => {
        const total = orders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
        const pending = orders.filter(o => o.paymentStatus === 'pending').length;
        const toReview = orders.filter(o => o.paymentStatus === 'proof_uploaded').length;
        const approved = orders.filter(o => ['approved', 'confirmed'].includes(o.paymentStatus)).length;
        const multiItem = orders.filter(o => (o.items?.length || 0) > 1).length;
        return { total, pending, toReview, approved, multiItem };
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            const matchStatus = filterStatus === 'todos' ? true : o.paymentStatus === filterStatus;
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = !searchLower ||
                (o._id || '').toLowerCase().includes(searchLower) ||
                (o.customerName || '').toLowerCase().includes(searchLower) ||
                (o.customerEmail || '').toLowerCase().includes(searchLower) ||
                (o.customerPhone || '').toLowerCase().includes(searchLower) ||
                (o.customerDni || '').toLowerCase().includes(searchLower) ||
                (o.items || []).some(it => (it.name || '').toLowerCase().includes(searchLower));
            return matchStatus && matchSearch;
        });
    }, [orders, filterStatus, searchTerm]);


    return (
        <main className="section" style={{ paddingBottom: '4rem' }}>
            <div className="container">

                {/* TÍTULO Y TABS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <span className="badge">Admin Panel</span>
                        <h1 style={{ margin: '5px 0 0', fontSize: '1.8rem' }}>Gestión de Ventas</h1>
                    </div>
                </div>

                {/* PESTAÑAS DE NAVEGACIÓN */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className="btn"
                        style={{
                            background: activeTab === 'orders' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'orders' ? 'white' : '#888',
                            border: activeTab === 'orders' ? 'none' : '1px solid #444'
                        }}
                    >
                        📦 Pedidos ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('abandoned')}
                        className="btn"
                        style={{
                            background: activeTab === 'abandoned' ? '#eab308' : 'transparent',
                            color: activeTab === 'abandoned' ? 'black' : '#888',
                            border: activeTab === 'abandoned' ? 'none' : '1px solid #444',
                            fontWeight: 'bold'
                        }}
                    >
                        🛒 Carritos Abandonados
                    </button>
                </div>

                {/* =========================================================
                    VISTA 1: PEDIDOS (ORDERS)
                   ========================================================= */}
                {activeTab === 'orders' && (
                    <>
                        {/* Stats rápidas */}
                        {!loading && orders.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '1.2rem' }}>
                                {[
                                    { label: 'Recaudado', value: money(stats.total), color: '#4ade80' },
                                    { label: 'Aprobados', value: stats.approved, color: '#4ade80' },
                                    { label: 'A Revisar', value: stats.toReview, color: '#facc15' },
                                    { label: 'Pendientes', value: stats.pending, color: '#94a3b8' },
                                    { label: 'Con Extras', value: stats.multiItem, color: '#a78bfa' },
                                ].map(s => (
                                    <div key={s.label} className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="card reveal" style={{ padding: '1.2rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar por nombre, email o teléfono..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ flex: '1 1 200px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    style={{ flex: '0 1 170px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#222', color: 'white' }}
                                >
                                    <option value="todos">Todos</option>
                                    <option value="pending">Pendientes</option>
                                    <option value="proof_uploaded">Con Comprobante</option>
                                    <option value="approved">Aprobados</option>
                                    <option value="confirmed">Confirmados</option>
                                    <option value="rejected">Rechazados</option>
                                    <option value="cancelled">Cancelados</option>
                                </select>
                                <button className="btn btn-ghost" onClick={fetchOrders} title="Recargar">🔄</button>
                            </div>
                        </div>

                        {loading ? <p>Cargando...</p> : !filteredOrders.length ? (
                            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}><p className="muted">No se encontraron pedidos.</p></div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {filteredOrders.map((order) => {
                                    const isExpanded = expandedOrderId === order._id;
                                    const hasProof = Boolean(order.paymentProofUrl);
                                    const isApproved = ['approved', 'confirmed'].includes(order.paymentStatus);
                                    const fullProofUrl = getImageUrl(order.paymentProofUrl);
                                    const pColor = getStatusColor(order.paymentStatus);
                                    const isMP = order.paymentMethod === 'mercadopago';
                                    const isCod = order.paymentMethod === 'cod';
                                    const hasExtras = (order.items?.length || 0) > 1;

                                    const methodLabel = isMP ? 'Mercado Pago' : isCod ? 'Pago al recibir' : 'Transferencia';
                                    const methodColor = isMP ? { bg: '#e0f2fe', color: '#0284c7', border: '#7dd3fc' } : isCod ? { bg: '#dcfce7', color: '#15803d', border: '#86efac' } : { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db' };

                                    const waText = `Hola ${order.customerName || ''}! 👋 Te escribo de BoomHausS sobre tu pedido del ${formatDate(order.createdAt)}. ${order.items?.map(it => `${it.quantity}x ${it.name}`).join(', ')}. Total: ${money(order.totalAmount)}`;
                                    const waLink = order.customerPhone ? `https://wa.me/${'549' + order.customerPhone.replace(/\D/g, '').replace(/^549/, '')}?text=${encodeURIComponent(waText)}` : null;

                                    return (
                                        <article key={order._id} className="card" style={{ padding: 0, overflow: 'hidden', border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--border)' }}>

                                            {/* Cabecera */}
                                            <div
                                                onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                                                style={{ padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 900, fontSize: '1rem' }}>{order.customerName || 'Cliente Anónimo'}</span>
                                                        {hasExtras && (
                                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: 'rgba(167,139,250,.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,.3)' }}>
                                                                +EXTRAS
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>{formatDate(order.createdAt)}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 900, fontSize: '1.05rem' }}>{money(order.totalAmount)}</span>
                                                        <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: methodColor.bg, color: methodColor.color, border: `1px solid ${methodColor.border}` }}>
                                                            {methodLabel}
                                                        </span>
                                                        <span style={{ fontSize: '0.72rem', color: '#666' }}>
                                                            {order.totalItems || order.items?.reduce((a, it) => a + it.quantity, 0) || 0} ud · {order.items?.length || 0} producto{(order.items?.length || 0) !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <span style={{ padding: '5px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', background: pColor.bg, color: pColor.color, border: pColor.border, display: 'block' }}>
                                                        {paymentStatusLabel[order.paymentStatus] || order.paymentStatus}
                                                    </span>
                                                    <div style={{ fontSize: '0.78rem', color: '#555', marginTop: 5 }}>{isExpanded ? '▲' : '▼'}</div>
                                                </div>
                                            </div>

                                            {/* Detalles Expandidos */}
                                            {isExpanded && (
                                                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.12)' }}>

                                                    {/* Acciones rápidas */}
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                                        {hasProof && (
                                                            <button className="btn btn-ghost" onClick={() => setImageToView(fullProofUrl)} style={{ background: '#333', color: 'white', fontSize: '0.85rem' }}>
                                                                🖼️ Ver Comprobante
                                                            </button>
                                                        )}
                                                        {!isApproved && (
                                                            <button
                                                                className="btn btn-primary"
                                                                onClick={() => {
                                                                    if (hasProof) handleVerify(order);
                                                                    else if (window.confirm('¿Aprobar pago manualmente?')) handleUpdateOrder(order._id, { paymentStatus: 'approved' });
                                                                }}
                                                                disabled={updatingOrderId === order._id}
                                                                style={{ fontSize: '0.85rem' }}
                                                            >
                                                                {updatingOrderId === order._id ? 'Procesando...' : (hasProof ? '✅ Aprobar' : '⚡ Aprobar manual')}
                                                            </button>
                                                        )}
                                                        {waLink && (
                                                            <a href={waLink} target="_blank" rel="noreferrer" className="btn" style={{ background: '#25D366', color: 'white', fontSize: '0.85rem' }}>
                                                                💬 WhatsApp
                                                            </a>
                                                        )}
                                                    </div>

                                                    {/* Selectores de estado */}
                                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: 8, marginBottom: '1rem' }}>
                                                        <div style={{ flex: '1 1 140px' }}>
                                                            <label style={{ fontSize: '0.72rem', color: '#aaa', display: 'block', marginBottom: 4 }}>Estado Pago</label>
                                                            <select value={order.paymentStatus || 'pending'} onChange={(e) => handleUpdateOrder(order._id, { paymentStatus: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: 6, background: '#111', color: 'white', border: '1px solid #444', fontSize: '0.85rem' }}>
                                                                {paymentStatusOptions.map(s => <option key={s} value={s}>{paymentStatusLabel[s]}</option>)}
                                                            </select>
                                                        </div>
                                                        <div style={{ flex: '1 1 140px' }}>
                                                            <label style={{ fontSize: '0.72rem', color: '#aaa', display: 'block', marginBottom: 4 }}>Estado Envío</label>
                                                            <select value={order.shippingStatus || 'pending'} onChange={(e) => handleUpdateOrder(order._id, { shippingStatus: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: 6, background: '#111', color: 'white', border: '1px solid #444', fontSize: '0.85rem' }}>
                                                                {shippingStatusOptions.map(s => <option key={s} value={s}>{shippingStatusLabel[s]}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Datos del cliente */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', fontSize: '0.85rem', color: '#ccc', marginBottom: '1rem' }}>
                                                        {order.customerDni && <div>🪪 DNI: <b style={{ color: '#fff' }}>{order.customerDni}</b></div>}
                                                        {order.customerEmail && <div>📧 {order.customerEmail}</div>}
                                                        {order.customerPhone && <div>📞 {order.customerPhone}</div>}
                                                        <div>📍 {order.shippingAddress}</div>
                                                        <div>🚚 <b style={{ color: '#fff' }}>{order.shippingMethod === 'caba_cod' ? 'CABA (pago al recibir)' : order.shippingMethod === 'correo_argentino' ? 'Correo Argentino' : order.shippingMethod === 'retiro_oficina' ? 'Retiro en oficina' : order.shippingMethod}</b></div>
                                                        {order.notes && <div style={{ color: '#f59e0b' }}>📝 {order.notes}</div>}
                                                    </div>

                                                    {/* Productos del pedido */}
                                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                                                        <div style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>Productos del pedido</div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                            {(order.items || []).map((it, idx) => (
                                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                                    <div>
                                                                        <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{it.name || '—'}</div>
                                                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>x{it.quantity} · {money(it.price)} c/u</div>
                                                                    </div>
                                                                    <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#4ade80' }}>{money(it.price * it.quantity)}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                            <span style={{ fontSize: '0.85rem', color: '#aaa' }}>Total del pedido</span>
                                                            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff' }}>{money(order.totalAmount)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* =========================================================
                    VISTA 2: CARRITOS ABANDONADOS
                   ========================================================= */}
                {activeTab === 'abandoned' && (
                    <div className="reveal">
                        <div className="card" style={{ padding: '1.5rem', marginBottom: '20px', borderLeft: '4px solid #eab308' }}>
                            <h3 style={{ marginTop: 0 }}>🎣 Recuperación de Ventas</h3>
                            <p className="muted">Aquí están las personas que dejaron sus datos pero no pagaron. ¡Escribiles por WhatsApp para cerrar la venta!</p>
                            <button className="btn btn-ghost" onClick={fetchAbandonedCarts}>🔄 Actualizar lista</button>
                        </div>

                        {loadingAbandoned ? <p>Cargando...</p> : abandonedCarts.length === 0 ? (
                            <p>¡No hay carritos abandonados pendientes!</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {abandonedCarts.map(cart => {
                                    const waLink = getWhatsAppLink(cart);
                                    // --- CORRECCIÓN NaN ---
                                    // Usamos updatedAt, si no existe usamos createdAt, si falla usamos "ahora"
                                    const dateSource = cart.updatedAt || cart.createdAt || new Date();
                                    let timeAgo = Math.round((new Date() - new Date(dateSource)) / 1000 / 60);
                                    if (isNaN(timeAgo)) timeAgo = 0; // Doble seguridad
                                    // ----------------------

                                    return (
                                        <div key={cart._id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <strong style={{ fontSize: '1.1rem' }}>{cart.name || 'Sin Nombre'}</strong>
                                                    <span style={{ fontSize: '0.8rem', color: timeAgo < 60 ? '#ef4444' : '#888', fontWeight: 'bold' }}>
                                                        (Hace {timeAgo < 60 ? `${timeAgo} min` : `${Math.round(timeAgo / 60)} hs`})
                                                    </span>
                                                </div>
                                                <div className="muted" style={{ fontSize: '0.9rem' }}>
                                                    {cart.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                                </div>
                                                <div style={{ fontWeight: 'bold', marginTop: '5px', color: '#10b981' }}>
                                                    Total: {money(cart.totalAmount)}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {waLink ? (
                                                    <a href={waLink} target="_blank" rel="noreferrer" className="btn" style={{ background: '#25D366', color: 'white', fontWeight: 'bold' }}>
                                                        💬 Rescatar
                                                    </a>
                                                ) : <span className="muted">Sin Tel</span>}

                                                <button onClick={() => recoverCart(cart._id)} className="btn btn-ghost" style={{ border: '1px solid #444' }}>
                                                    ✅ Listo
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL / LIGHTBOX */}
                {imageToView && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setImageToView(null)}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '800px', textAlign: 'center' }}>
                            <img src={imageToView} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }} onClick={(e) => e.stopPropagation()} />
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button className="btn" onClick={() => setImageToView(null)} style={{ background: '#444', color: 'white' }}>Cerrar ❌</button>
                                <a href={imageToView} target="_blank" rel="noreferrer" className="btn btn-primary" onClick={(e) => e.stopPropagation()}>Descargar 🔗</a>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}