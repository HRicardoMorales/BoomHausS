// frontend/src/pages/AdminOrders.jsx

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

// Colores para los estados
function getStatusColor(status) {
    switch (String(status).toLowerCase()) {
        case 'confirmed':
        case 'delivered':
        case 'shipped':
            return { bg: 'rgba(50, 255, 100, 0.15)', color: '#4fec85', border: '1px solid rgba(50, 255, 100, 0.3)' };
        case 'cancelled':
            return { bg: 'rgba(255, 80, 80, 0.15)', color: '#ff6b6b', border: '1px solid rgba(255, 80, 80, 0.3)' };
        case 'pending':
        default:
            return { bg: 'rgba(255, 200, 0, 0.15)', color: '#ffca2c', border: '1px solid rgba(255, 200, 0, 0.3)' };
    }
}

// Formatear teléfono para link de WhatsApp
function getWhatsAppLink(phone) {
    if (!phone) return null;
    // Eliminar caracteres no numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // filtros y búsqueda
    const [filterStatus, setFilterStatus] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');

    // UI
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    // errores UI
    const [updateError, setUpdateError] = useState(null);
    const [verifyError, setVerifyError] = useState(null);

    // verificando
    const [verifyingOrderId, setVerifyingOrderId] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/orders');

            if (res.data?.ok) {
                // Ordenar por fecha (más reciente primero)
                const sorted = (res.data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(sorted);
            } else {
                setError('No se pudieron obtener los pedidos.');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al cargar los pedidos.');
        } finally {
            setLoading(false);
        }
    }

    // Opciones para selectores
    const paymentStatusOptions = ['pending', 'confirmed', 'cancelled'];
    const shippingStatusOptions = ['pending', 'shipped', 'delivered'];

    // Filtro dinámico de estados disponibles
    const statusOptions = useMemo(() => {
        const unique = Array.from(new Set((orders || []).map((o) => o.paymentStatus).filter(Boolean)));
        return ['todos', ...unique];
    }, [orders]);

    // Lógica de filtrado combinada (Status + Buscador)
    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            // 1. Filtro por estado
            const matchStatus = filterStatus === 'todos' ? true : o.paymentStatus === filterStatus;
            
            // 2. Filtro por buscador (ID, Nombre, Email)
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = 
                o._id.toLowerCase().includes(searchLower) ||
                (o.customerName || '').toLowerCase().includes(searchLower) ||
                (o.customerEmail || '').toLowerCase().includes(searchLower);

            return matchStatus && matchSearch;
        });
    }, [orders, filterStatus, searchTerm]);

    const totalOrders = filteredOrders.length;
    const totalAmount = useMemo(() => {
        return filteredOrders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
    }, [filteredOrders]);

    function toggleExpand(orderId) {
        setExpandedOrderId((cur) => (cur === orderId ? null : orderId));
    }

    // Copiar ID al portapapeles
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        // Podrías poner un toast aquí si tienes librería de notificaciones
    }

    // Actualizar estado
    async function handleUpdateOrder(order, partialUpdate) {
        try {
            setUpdateError(null);
            setUpdatingOrderId(order._id);
            const res = await api.patch(`/orders/${order._id}`, partialUpdate);

            if (res.data?.ok) {
                const updated = res.data.data;
                setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
            } else {
                setUpdateError('No se pudo actualizar.');
            }
        } catch (err) {
            setUpdateError('Error de conexión o servidor.');
        } finally {
            setUpdatingOrderId(null);
        }
    }

    // Verificar comprobante
    async function handleVerify(order) {
        try {
            setVerifyError(null);
            setVerifyingOrderId(order._id);
            const res = await api.patch(`/orders/${order._id}/verify`);
            const updated = res.data?.data;
            if (res.data?.ok && updated?._id) {
                setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
            } else {
                await fetchOrders();
            }
        } catch (err) {
            setVerifyError('Error al verificar.');
        } finally {
            setVerifyingOrderId(null);
        }
    }

    // --- RENDER ---

    if (loading) return <div className="container section"><p className="muted">Cargando panel...</p></div>;
    if (error) return <div className="container section"><p style={{ color: 'red' }}>{error}</p><button className="btn" onClick={fetchOrders}>Reintentar</button></div>;

    return (
        <main className="section" style={{ paddingBottom: '4rem' }}>
            <div className="container">
                
                {/* Header del Panel */}
                <section className="card reveal" style={{ padding: '1.2rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <span className="badge">Admin Panel</span>
                            <h1 style={{ margin: '0.5rem 0 0', letterSpacing: '-0.03em', fontSize: '1.8rem' }}>
                                Gestión de Pedidos
                            </h1>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="muted" style={{ fontSize: '0.9rem' }}>Ventas mostradas</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{money(totalAmount)}</div>
                            <div className="muted" style={{ fontSize: '0.8rem' }}>({totalOrders} pedidos)</div>
                        </div>
                    </div>

                    {/* Barra de Herramientas (Buscador y Filtro) */}
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        
                        {/* Buscador */}
                        <div style={{ flex: '1 1 200px' }}>
                            <input 
                                type="text"
                                placeholder="🔍 Buscar por ID, nombre o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'rgba(0,0,0,0.2)',
                                    color: 'white'
                                }}
                            />
                        </div>

                        {/* Filtro Status */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                flex: '0 1 150px',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: '#222',
                                color: 'white',
                                fontWeight: 'bold'
                            }}
                        >
                            {statusOptions.map((s) => (
                                <option key={s} value={s}>{s === 'todos' ? 'Todos los estados' : s.toUpperCase()}</option>
                            ))}
                        </select>

                        <button className="btn btn-ghost" onClick={fetchOrders} title="Recargar lista">
                            🔄
                        </button>
                    </div>

                    {/* Mensajes de error globales */}
                    {(updateError || verifyError) && (
                        <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255,0,0,0.1)', borderRadius: 6 }}>
                            <small style={{ color: '#ff6b6b' }}>{updateError || verifyError}</small>
                        </div>
                    )}
                </section>

                {/* Lista de Pedidos */}
                {!filteredOrders.length ? (
                    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <p className="muted">No se encontraron pedidos con esos filtros.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {filteredOrders.map((order) => {
                            const isExpanded = expandedOrderId === order._id;
                            const hasProof = Boolean(order.paymentProofUrl);
                            const verified = Boolean(order.paymentProofVerified) || String(order.paymentStatus).toLowerCase() === 'confirmed';
                            
                            // Estilos dinámicos
                            const pStatusStyle = getStatusColor(order.paymentStatus);
                            const sStatusStyle = getStatusColor(order.shippingStatus);

                            return (
                                <article key={order._id} className="card" style={{ padding: '0', overflow: 'hidden', border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
                                    
                                    {/* Cabecera de la Tarjeta (Visible siempre) */}
                                    <div 
                                        onClick={() => toggleExpand(order._id)}
                                        style={{ 
                                            padding: '1rem', 
                                            cursor: 'pointer',
                                            background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '1rem',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        {/* Info Principal */}
                                        <div style={{ flex: '1 1 180px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>{order.customerName || 'Cliente Anónimo'}</span>
                                                {verified && <span title="Verificado">✅</span>}
                                            </div>
                                            <div className="muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                📅 {formatDate(order.createdAt)}
                                            </div>
                                            <div 
                                                className="muted" 
                                                style={{ fontSize: '0.75rem', marginTop: '4px', cursor: 'copy' }}
                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(order._id); }}
                                                title="Click para copiar ID"
                                            >
                                                ID: {order._id.slice(-6)}... 📋
                                            </div>
                                        </div>

                                        {/* Badges de Estado */}
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{ 
                                                padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                                                background: pStatusStyle.bg, color: pStatusStyle.color, border: pStatusStyle.border
                                            }}>
                                                Pago: {order.paymentStatus}
                                            </span>
                                            <span style={{ 
                                                padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                                                background: sStatusStyle.bg, color: sStatusStyle.color, border: sStatusStyle.border
                                            }}>
                                                Envío: {order.shippingStatus}
                                            </span>
                                        </div>

                                        {/* Precio y Flecha */}
                                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{money(order.totalAmount)}</div>
                                            <div className="muted" style={{ fontSize: '0.8rem' }}>{isExpanded ? '▲' : '▼'} Ver más</div>
                                        </div>
                                    </div>

                                    {/* Detalles Expandibles */}
                                    {isExpanded && (
                                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
                                            
                                            {/* Acciones Rápidas (WhatsApp, Comprobante) */}
                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                                {order.customerPhone && (
                                                    <a 
                                                        href={getWhatsAppLink(order.customerPhone)} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="btn"
                                                        style={{ background: '#25D366', color: '#fff', border: 'none', flex: '1' }}
                                                    >
                                                        💬 WhatsApp
                                                    </a>
                                                )}
                                                {hasProof && (
                                                    <a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ flex: '1' }}>
                                                        📄 Ver Comprobante
                                                    </a>
                                                )}
                                                {hasProof && !verified && (
                                                    <button 
                                                        className="btn btn-primary" 
                                                        onClick={() => handleVerify(order)}
                                                        disabled={verifyingOrderId === order._id}
                                                        style={{ flex: '2' }}
                                                    >
                                                        {verifyingOrderId === order._id ? 'Verificando...' : 'Aprobar Pago ✅'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Datos del Cliente */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 0.5rem', opacity: 0.7 }}>Datos de Contacto</h4>
                                                    <p style={{ margin: 0 }}>📧 {order.customerEmail}</p>
                                                    <p style={{ margin: 0 }}>📞 {order.customerPhone || 'No indicado'}</p>
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: '0 0 0.5rem', opacity: 0.7 }}>Envío ({order.shippingMethod})</h4>
                                                    <p style={{ margin: 0 }}>📍 {order.shippingAddress || 'Sin dirección'}</p>
                                                    {order.notes && <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'orange' }}>📝 Nota: {order.notes}</p>}
                                                </div>
                                            </div>

                                            {/* Gestión de Estados */}
                                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem' }}>
                                                <h4 style={{ margin: '0 0 0.8rem' }}>Actualizar Estados</h4>
                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label className="muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Estado del Pago</label>
                                                        <select
                                                            className="full-width-mobile"
                                                            value={order.paymentStatus || 'pending'}
                                                            disabled={updatingOrderId === order._id}
                                                            onChange={(e) => handleUpdateOrder(order, { paymentStatus: e.target.value })}
                                                            style={{ padding: '8px', borderRadius: 6, width: '100%', background: '#333', color: 'white' }}
                                                        >
                                                            {paymentStatusOptions.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                                                        </select>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label className="muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Estado del Envío</label>
                                                        <select
                                                            className="full-width-mobile"
                                                            value={order.shippingStatus || 'pending'}
                                                            disabled={updatingOrderId === order._id}
                                                            onChange={(e) => handleUpdateOrder(order, { shippingStatus: e.target.value })}
                                                            style={{ padding: '8px', borderRadius: 6, width: '100%', background: '#333', color: 'white' }}
                                                        >
                                                            {shippingStatusOptions.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lista de Items */}
                                            <div>
                                                <h4 style={{ margin: '0 0 0.5rem', opacity: 0.7 }}>Productos ({order.items?.length || 0})</h4>
                                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                    {(order.items || []).map((it, idx) => (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                                                            <span>{it.quantity}x {it.productName || it.name}</span>
                                                            <span style={{ fontWeight: 'bold' }}>{money(it.price * it.quantity)}</span>
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
            </div>
        </main>
    );
}