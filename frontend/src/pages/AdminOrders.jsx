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


    return (
        <main className="section" style={{ paddingBottom: '4rem' }}>
            <div className="container">

                {/* TÍTULO Y TABS */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
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
                        <div className="card reveal" style={{ padding: '1.2rem', marginBottom: '1.5rem' }}>
                            {/* Filtros */}
                            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar pedido..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ flex: '1 1 200px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    style={{ flex: '0 1 150px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#222', color: 'white' }}
                                >
                                    <option value="todos">Todos</option>
                                    <option value="pending">Pendientes</option>
                                    <option value="proof_uploaded">Con Comprobante</option>
                                    <option value="approved">Aprobados</option>
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
                                    const isApproved = order.paymentStatus === 'approved';
                                    const fullProofUrl = getImageUrl(order.paymentProofUrl);
                                    const pColor = getStatusColor(order.paymentStatus);
                                    
                                    // Detectar método de pago
                                    const isMP = order.paymentMethod === 'mercadopago';

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
                                                    
                                                    {/* PRECIO + METODO DE PAGO */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                                        <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{money(order.totalAmount)}</div>
                                                        <span style={{ 
                                                            fontSize: '0.7rem', 
                                                            fontWeight: 'bold', 
                                                            padding: '2px 6px', 
                                                            borderRadius: '4px',
                                                            background: isMP ? '#e0f2fe' : '#dcfce7',
                                                            color: isMP ? '#0284c7' : '#16a34a',
                                                            border: isMP ? '1px solid #7dd3fc' : '1px solid #86efac'
                                                        }}>
                                                            {isMP ? 'MP' : 'TRANSF'}
                                                        </span>
                                                    </div>
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
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
                                                        {hasProof && (
                                                            <button className="btn btn-ghost" onClick={() => setImageToView(fullProofUrl)} style={{ background: '#333', color: 'white' }}>
                                                                🖼️ Ver Comprobante
                                                            </button>
                                                        )}
                                                        {!isApproved && (
                                                            <button
                                                                className="btn btn-primary"
                                                                onClick={() => {
                                                                    if (hasProof) handleVerify(order);
                                                                    else if (window.confirm('¿Confirmar pago MANUALMENTE?')) handleUpdateOrder(order._id, { paymentStatus: 'approved' });
                                                                }}
                                                                disabled={updatingOrderId === order._id}
                                                            >
                                                                {updatingOrderId === order._id ? 'Procesando...' : (hasProof ? '✅ Aprobar Foto' : '⚡ Aprobar Manual')}
                                                            </button>
                                                        )}
                                                        {order.customerPhone && (
                                                            <a href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn" style={{ background: '#25D366', color: 'white', justifyContent: 'center' }}>
                                                                💬 WhatsApp
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: 8, marginBottom: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                            <div style={{ flex: '1 1 150px' }}>
                                                                <label style={{ fontSize: '0.75rem', color: '#aaa' }}>Estado Pago</label>
                                                                <select
                                                                    value={order.paymentStatus || 'pending'}
                                                                    onChange={(e) => handleUpdateOrder(order._id, { paymentStatus: e.target.value })}
                                                                    style={{ width: '100%', padding: '8px', borderRadius: 4, background: '#111', color: 'white', border: '1px solid #444' }}
                                                                >
                                                                    {paymentStatusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                                                </select>
                                                            </div>
                                                            <div style={{ flex: '1 1 150px' }}>
                                                                <label style={{ fontSize: '0.75rem', color: '#aaa' }}>Estado Envío</label>
                                                                <select
                                                                    value={order.shippingStatus || 'pending'}
                                                                    onChange={(e) => handleUpdateOrder(order._id, { shippingStatus: e.target.value })}
                                                                    style={{ width: '100%', padding: '8px', borderRadius: 4, background: '#111', color: 'white', border: '1px solid #444' }}
                                                                >
                                                                    {shippingStatusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                                                        <div style={{ display: 'grid', gap: '5px', marginBottom: '15px' }}>
                                                            <div>📧 {order.customerEmail}</div>
                                                            <div>📞 {order.customerPhone || '—'}</div>
                                                            <div>📍 {order.shippingAddress}</div>
                                                            <div>🚚 {order.shippingMethod}</div>
                                                            {order.notes && <div style={{ color: 'orange' }}>📝 {order.notes}</div>}
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
                    </>
                )}

                {/* =========================================================
                    VISTA 2: CARRITOS ABANDONADOS
                   ========================================================= */}
                {activeTab === 'abandoned' && (
                    <div className="reveal">
                        <div className="card" style={{padding: '1.5rem', marginBottom: '20px', borderLeft: '4px solid #eab308'}}>
                            <h3 style={{marginTop:0}}>🎣 Recuperación de Ventas</h3>
                            <p className="muted">Aquí están las personas que dejaron sus datos pero no pagaron. ¡Escribiles por WhatsApp para cerrar la venta!</p>
                            <button className="btn btn-ghost" onClick={fetchAbandonedCarts}>🔄 Actualizar lista</button>
                        </div>

                        {loadingAbandoned ? <p>Cargando...</p> : abandonedCarts.length === 0 ? (
                            <p>¡No hay carritos abandonados pendientes!</p>
                        ) : (
                            <div style={{display: 'grid', gap: '15px'}}>
                                {abandonedCarts.map(cart => {
                                    const waLink = getWhatsAppLink(cart);
                                    const timeAgo = Math.round((new Date() - new Date(cart.updatedAt)) / 1000 / 60);

                                    return (
                                        <div key={cart._id} className="card" style={{padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'}}>
                                            <div style={{flex: 1}}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                    <strong style={{fontSize: '1.1rem'}}>{cart.name || 'Sin Nombre'}</strong>
                                                    <span style={{fontSize: '0.8rem', color: timeAgo < 60 ? '#ef4444' : '#888', fontWeight: 'bold'}}>
                                                        (Hace {timeAgo < 60 ? `${timeAgo} min` : `${Math.round(timeAgo/60)} hs`})
                                                    </span>
                                                </div>
                                                <div className="muted" style={{fontSize: '0.9rem'}}>
                                                    {cart.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                                </div>
                                                <div style={{fontWeight: 'bold', marginTop: '5px', color: '#10b981'}}>
                                                    Total: {money(cart.totalAmount)}
                                                </div>
                                            </div>

                                            <div style={{display: 'flex', gap: '10px'}}>
                                                {waLink ? (
                                                    <a href={waLink} target="_blank" rel="noreferrer" className="btn" style={{background: '#25D366', color: 'white', fontWeight: 'bold'}}>
                                                        💬 Rescatar
                                                    </a>
                                                ) : <span className="muted">Sin Tel</span>}
                                                
                                                <button onClick={() => recoverCart(cart._id)} className="btn btn-ghost" style={{border: '1px solid #444'}}>
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