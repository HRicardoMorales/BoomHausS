// frontend/src/pages/AdminOrders.jsx

import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

// --- Utilerías ---
function money(n) {
    const num = Number(n);
    if (Number.isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
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

// Colores para los estados (Adaptado para leer 'approved')
function getStatusColor(status) {
    switch (String(status).toLowerCase()) {
        case 'approved': // ✅ Usamos approved
        case 'confirmed': // Por compatibilidad
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
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtros y búsqueda
    const [filterStatus, setFilterStatus] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');

    // UI States
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    // Visor de Imagen (Lightbox)
    const [imageToView, setImageToView] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/orders');
            if (res.data?.ok) {
                const sorted = (res.data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(sorted);
            } else {
                setError('No se pudieron obtener los pedidos.');
            }
        } catch (err) {
            console.error(err);
            setError('Error al cargar pedidos.');
        } finally {
            setLoading(false);
        }
    }

    // Actualizar estado genérico
    async function handleUpdateOrder(orderId, changes) {
        try {
            setUpdatingOrderId(orderId);
            const res = await api.patch(`/orders/${orderId}`, changes);

            if (res.data?.ok) {
                const updatedOrder = res.data.data;
                setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
            } else {
                alert('No se pudo actualizar el pedido.');
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || err.message || 'Error desconocido');
        } finally {
            setUpdatingOrderId(null);
        }
    }

    // Verificar comprobante
    async function handleVerify(order) {
        try {
            setUpdatingOrderId(order._id);
            const res = await api.patch(`/orders/${order._id}/verify`);
            const updated = res.data?.data;
            if (res.data?.ok && updated?._id) {
                setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
            } else {
                fetchOrders();
            }
        } catch (err) {
            alert('Error al verificar comprobante.');
        } finally {
            setUpdatingOrderId(null);
        }
    }

    // --- Configuración adaptada a tu Backend ---
    // ✅ Usamos 'approved' en lugar de 'confirmed'
    const paymentStatusOptions = ['pending', 'proof_uploaded', 'approved', 'rejected'];
    const shippingStatusOptions = ['pending', 'shipped', 'delivered'];

    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            const matchStatus = filterStatus === 'todos' ? true : o.paymentStatus === filterStatus;
            const searchLower = searchTerm.toLowerCase();
            const matchSearch =
                o._id.toLowerCase().includes(searchLower) ||
                (o.customerName || '').toLowerCase().includes(searchLower) ||
                (o.customerEmail || '').toLowerCase().includes(searchLower);
            return matchStatus && matchSearch;
        });
    }, [orders, filterStatus, searchTerm]);

    if (loading) return <div className="container section"><p>Cargando panel...</p></div>;

    return (
        <main className="section" style={{ paddingBottom: '4rem' }}>
            <div className="container">

                {/* Header */}
                <div className="card reveal" style={{ padding: '1.2rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span className="badge">Admin</span>
                            <h1 style={{ margin: '0.5rem 0 0.5rem', fontSize: '1.8rem' }}>Pedidos</h1>
                        </div>
                        <button className="btn btn-ghost" onClick={fetchOrders} title="Recargar">🔄</button>
                    </div>

                    {/* Buscador y Filtros */}
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                        <input
                            type="text"
                            placeholder="🔍 Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ flex: '1 1 200px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ flex: '0 1 150px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#222', color: 'white', fontWeight: 'bold' }}
                        >
                            <option value="todos">Todos</option>
                            <option value="pending">Pendientes</option>
                            <option value="proof_uploaded">Con Comprobante</option>
                            <option value="approved">Aprobados</option>
                            <option value="rejected">Rechazados</option>
                        </select>
                    </div>
                </div>

                {/* Lista de Pedidos */}
                {!filteredOrders.length ? (
                    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}><p className="muted">No se encontraron pedidos.</p></div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {filteredOrders.map((order) => {
                            const isExpanded = expandedOrderId === order._id;
                            const hasProof = Boolean(order.paymentProofUrl);
                            // ✅ Verificamos contra 'approved'
                            const isApproved = order.paymentStatus === 'approved';
                            const fullProofUrl = getImageUrl(order.paymentProofUrl);
                            const pColor = getStatusColor(order.paymentStatus);

                            // Traducción visual para el usuario
                            let displayStatus = order.paymentStatus;
                            if (order.paymentStatus === 'approved') displayStatus = 'APROBADO';
                            if (order.paymentStatus === 'proof_uploaded') displayStatus = 'REVISAR FOTO';

                            return (
                                <article key={order._id} className="card" style={{ padding: 0, overflow: 'hidden', border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--border)' }}>

                                    {/* Cabecera Clickable */}
                                    <div
                                        onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                                        style={{
                                            padding: '1rem', cursor: 'pointer',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent'
                                        }}
                                    >
                                        <div style={{ display: 'grid', gap: '2px' }}>
                                            <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{order.customerName || 'Cliente Anónimo'}</div>
                                            <div className="muted" style={{ fontSize: '0.8rem' }}>{formatDate(order.createdAt)}</div>
                                            <div style={{ fontWeight: 900, fontSize: '1.1rem', marginTop: '2px' }}>{money(order.totalAmount)}</div>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{
                                                padding: '5px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                                                background: pColor.bg, color: pColor.color, border: pColor.border
                                            }}>
                                                {displayStatus}
                                            </span>
                                            <div className="muted" style={{ fontSize: '0.8rem', marginTop: '6px' }}>
                                                {isExpanded ? '▲' : '▼'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detalles Expandidos */}
                                    {isExpanded && (
                                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>

                                            {/* BOTONES DE ACCIÓN RÁPIDA */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>

                                                {/* 1. Ver Foto (si existe) */}
                                                {hasProof && (
                                                    <button
                                                        className="btn btn-ghost"
                                                        onClick={() => setImageToView(fullProofUrl)}
                                                        style={{ background: '#333', color: 'white' }}
                                                    >
                                                        🖼️ Ver Comprobante
                                                    </button>
                                                )}

                                                {/* 2. APROBAR PAGO (Manual o Verificar) */}
                                                {!isApproved && (
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => {
                                                            if (hasProof) {
                                                                handleVerify(order);
                                                            } else {
                                                                if (window.confirm('¿Confirmar pago MANUALMENTE (WSP/Efectivo)?')) {
                                                                    // ✅ Enviamos 'approved' para evitar error 400
                                                                    handleUpdateOrder(order._id, { paymentStatus: 'approved' });
                                                                }
                                                            }
                                                        }}
                                                        disabled={updatingOrderId === order._id}
                                                    >
                                                        {updatingOrderId === order._id ? 'Procesando...' : (hasProof ? '✅ Aprobar Foto' : '⚡ Aprobar Manual')}
                                                    </button>
                                                )}

                                                {/* 3. WhatsApp */}
                                                {order.customerPhone && (
                                                    <a
                                                        href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                                                        target="_blank" rel="noreferrer"
                                                        className="btn"
                                                        style={{ background: '#25D366', color: 'white', textAlign: 'center', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                    >
                                                        💬 WhatsApp
                                                    </a>
                                                )}
                                            </div>

                                            {/* SELECTORES DE ESTADO (Para correcciones manuales) */}
                                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: 8, marginBottom: '1rem' }}>
                                                <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', opacity: 0.8 }}>Gestión de Estados</h4>
                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>

                                                    {/* Selector PAGO */}
                                                    <div style={{ flex: '1 1 150px' }}>
                                                        <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: 4 }}>Pago</label>
                                                        <select
                                                            value={order.paymentStatus || 'pending'}
                                                            onChange={(e) => handleUpdateOrder(order._id, { paymentStatus: e.target.value })}
                                                            disabled={updatingOrderId === order._id}
                                                            style={{ width: '100%', padding: '10px', borderRadius: 6, background: '#111', color: 'white', border: '1px solid #444', fontWeight: 'bold' }}
                                                        >
                                                            {paymentStatusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Selector ENVÍO */}
                                                    <div style={{ flex: '1 1 150px' }}>
                                                        <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: 4 }}>Envío</label>
                                                        <select
                                                            value={order.shippingStatus || 'pending'}
                                                            onChange={(e) => handleUpdateOrder(order._id, { shippingStatus: e.target.value })}
                                                            disabled={updatingOrderId === order._id}
                                                            style={{ width: '100%', padding: '10px', borderRadius: 6, background: '#111', color: 'white', border: '1px solid #444', fontWeight: 'bold' }}
                                                        >
                                                            {shippingStatusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                                        </select>
                                                    </div>

                                                </div>
                                            </div>

                                            {/* DATOS DEL PEDIDO */}
                                            <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                                                <div style={{ display: 'grid', gap: '5px', marginBottom: '15px' }}>
                                                    <div>📧 <span className="muted">Email:</span> {order.customerEmail}</div>
                                                    <div>📞 <span className="muted">Tel:</span> {order.customerPhone || '—'}</div>
                                                    <div>📍 <span className="muted">Dirección:</span> {order.shippingAddress}</div>
                                                    <div>🚚 <span className="muted">Método:</span> {order.shippingMethod}</div>
                                                    {order.notes && <div style={{ color: 'orange', marginTop: '5px' }}>📝 Nota: {order.notes}</div>}
                                                </div>

                                                <div style={{ borderTop: '1px solid #444', paddingTop: '10px' }}>
                                                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Productos:</div>
                                                    {(order.items || []).map((it, idx) => (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <span>{it.quantity}x {it.name}</span>
                                                            <span>{money(it.price * it.quantity)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* --- MODAL / LIGHTBOX (Visor de imagen) --- */}
                {imageToView && (
                    <div
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.95)', zIndex: 10000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '20px'
                        }}
                        onClick={() => setImageToView(null)}
                    >
                        <div style={{ position: 'relative', width: '100%', maxWidth: '800px', textAlign: 'center' }}>
                            <img
                                src={imageToView}
                                alt="Comprobante"
                                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }}
                                onClick={(e) => e.stopPropagation()} // Click en la imagen no cierra
                            />

                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    className="btn"
                                    onClick={() => setImageToView(null)}
                                    style={{ background: '#444', color: 'white' }}
                                >
                                    Cerrar ❌
                                </button>
                                <a
                                    href={imageToView}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-primary"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Descargar / Pestaña Nueva 🔗
                                </a>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}