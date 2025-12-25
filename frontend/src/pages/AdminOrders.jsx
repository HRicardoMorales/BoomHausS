// frontend/src/pages/AdminOrders.jsx

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function money(n) {
    const num = Number(n);
    if (Number.isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
}

function formatDate(d) {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleString('es-AR');
    } catch {
        return '—';
    }
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // filtros
    const [filterStatus, setFilterStatus] = useState('todos');

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchOrders() {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/orders');

            if (res.data?.ok) {
                setOrders(res.data.data || []);
            } else {
                setError('No se pudieron obtener los pedidos.');
            }
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Error al cargar los pedidos.'
            );
        } finally {
            setLoading(false);
        }
    }

    // opciones de estado
    const paymentStatusOptions = ['pending', 'confirmed', 'cancelled'];
    const shippingStatusOptions = ['pending', 'shipped', 'delivered'];

    // filtro dinámico según pedidos existentes
    const statusOptions = useMemo(() => {
        const unique = Array.from(
            new Set(
                (orders || [])
                    .map((o) => o.paymentStatus)
                    .filter((s) => s && typeof s === 'string')
            )
        );
        return ['todos', ...unique];
    }, [orders]);

    const filteredOrders =
        filterStatus === 'todos'
            ? orders
            : orders.filter((o) => o.paymentStatus === filterStatus);

    const totalOrders = filteredOrders.length;
    const totalAmount = useMemo(() => {
        return (filteredOrders || []).reduce(
            (acc, o) => acc + (Number(o.totalAmount) || 0),
            0
        );
    }, [filteredOrders]);

    function toggleExpand(orderId) {
        setExpandedOrderId((cur) => (cur === orderId ? null : orderId));
    }

    // ✅ Update de estados (pago/envío)
    async function handleUpdateOrder(order, partialUpdate) {
        try {
            setUpdateError(null);
            setUpdatingOrderId(order._id);

            const res = await api.patch(`/orders/${order._id}`, partialUpdate);

            if (res.data?.ok) {
                const updated = res.data.data;
                setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
            } else {
                setUpdateError('No se pudo actualizar el pedido.');
            }
        } catch (err) {
            console.error(err);
            setUpdateError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Error al actualizar el pedido.'
            );
        } finally {
            setUpdatingOrderId(null);
        }
    }

    // ✅ Verificar comprobante (endpoint oficial único)
    async function handleVerify(order) {
        try {
            setVerifyError(null);
            setVerifyingOrderId(order._id);

            const res = await api.patch(`/orders/${order._id}/verify`);

            // esperamos orden actualizada
            const updated = res.data?.data;
            if (res.data?.ok && updated?._id) {
                setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
            } else {
                // si backend no devuelve data, refrescamos lista
                await fetchOrders();
            }
        } catch (err) {
            console.error(err);
            setVerifyError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'No se pudo verificar el comprobante.'
            );
        } finally {
            setVerifyingOrderId(null);
        }
    }

    if (loading) {
        return (
            <main className="section">
                <div className="container">
                    <section className="card reveal" style={{ padding: '1.2rem' }}>
                        <span className="badge">Admin</span>
                        <h1 style={{ margin: '0.65rem 0 0.25rem', letterSpacing: '-0.05em' }}>
                            Pedidos (admin)
                        </h1>
                        <p className="muted" style={{ marginTop: '0.35rem' }}>Cargando pedidos…</p>
                    </section>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="section">
                <div className="container">
                    <section className="card reveal" style={{ padding: '1.2rem' }}>
                        <span className="badge">Admin</span>
                        <h1 style={{ margin: '0.65rem 0 0.25rem', letterSpacing: '-0.05em' }}>
                            Pedidos (admin)
                        </h1>
                        <p style={{ color: 'rgba(255,180,180,1)', fontWeight: 900, marginTop: '0.75rem' }}>
                            {error}
                        </p>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" onClick={fetchOrders}>
                                Reintentar
                            </button>
                            <Link className="btn btn-ghost" to="/">
                                Volver
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="section">
            <div className="container">
                <section className="card reveal" style={{ padding: '1.2rem' }}>
                    <span className="badge">Admin</span>
                    <h1 style={{ margin: '0.65rem 0 0.25rem', letterSpacing: '-0.05em' }}>
                        Pedidos (admin)
                    </h1>

                    {(updateError || verifyError) ? (
                        <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.35rem' }}>
                            {updateError ? (
                                <p style={{ color: 'rgba(255,210,140,1)', fontWeight: 900, margin: 0 }}>
                                    {updateError}
                                </p>
                            ) : null}
                            {verifyError ? (
                                <p style={{ color: 'rgba(255,210,140,1)', fontWeight: 900, margin: 0 }}>
                                    {verifyError}
                                </p>
                            ) : null}
                        </div>
                    ) : null}

                    {/* Resumen + filtro */}
                    <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="muted">
                            Pedidos mostrados: <strong>{totalOrders}</strong>
                        </div>
                        <div className="muted">
                            Total acumulado: <strong>{money(totalAmount)}</strong>
                        </div>

                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="muted">Filtrar:</span>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 12,
                                    border: '1px solid var(--border)',
                                    background: 'rgba(255,255,255,0.02)',
                                    color: 'rgba(255,255,255,0.9)',
                                    fontWeight: 900
                                }}
                            >
                                {statusOptions.map((s) => (
                                    <option key={s} value={s} style={{ color: '#111' }}>
                                        {s === 'todos' ? 'Todos' : s}
                                    </option>
                                ))}
                            </select>

                            <button className="btn btn-ghost" onClick={fetchOrders}>
                                Refrescar
                            </button>
                        </div>
                    </div>
                </section>

                {!filteredOrders.length ? (
                    <section className="card reveal" style={{ marginTop: '1rem', padding: '1.2rem' }}>
                        <span className="badge">Sin pedidos</span>
                        <p className="muted" style={{ marginTop: '0.75rem' }}>
                            No hay pedidos para mostrar.
                        </p>
                    </section>
                ) : (
                    <section className="reveal" style={{ marginTop: '1rem', display: 'grid', gap: '0.85rem' }}>
                        {filteredOrders.map((order) => {
                            const createdAt = formatDate(order.createdAt);
                            const isExpanded = expandedOrderId === order._id;

                            const amount = Number(order.totalAmount) || 0;
                            const items = Array.isArray(order.items) ? order.items : [];

                            // ✅ comprobante
                            const hasProof = Boolean(order.paymentProofUrl);
                            const verified =
                                Boolean(order.paymentProofVerified) ||
                                String(order.paymentStatus || '').toLowerCase() === 'confirmed';

                            const proofLabel = verified
                                ? 'Comprobante: Verificado ✅'
                                : hasProof
                                    ? 'Comprobante: Subido ✅'
                                    : 'Comprobante: Pendiente';

                            return (
                                <article key={order._id} className="card" style={{ padding: '1.1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'grid', gap: '0.35rem' }}>
                                            <div className="muted">
                                                <strong>ID:</strong> {order._id}
                                            </div>
                                            <div className="muted">
                                                <strong>Cliente:</strong> {order.customerName || '—'}
                                            </div>
                                            <div className="muted">
                                                <strong>Email:</strong> {order.customerEmail || '—'}
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                                <span className="badge">Pago: {order.paymentStatus || 'pending'}</span>
                                                <span className="badge">{proofLabel}</span>
                                                <span className="badge">Envío: {order.shippingStatus || 'pending'}</span>
                                            </div>

                                            <div className="muted" style={{ marginTop: '0.25rem' }}>
                                                <strong>Total:</strong> {money(amount)}
                                            </div>
                                            <div className="muted">
                                                <strong>Creado:</strong> {createdAt}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <button className="btn btn-ghost" onClick={() => toggleExpand(order._id)}>
                                                {isExpanded ? 'Ocultar' : 'Ver detalles'}
                                            </button>

                                            {hasProof ? (
                                                <a className="btn btn-ghost" href={order.paymentProofUrl} target="_blank" rel="noreferrer">
                                                    Ver comprobante
                                                </a>
                                            ) : null}

                                            {hasProof && !verified ? (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleVerify(order)}
                                                    disabled={verifyingOrderId === order._id}
                                                >
                                                    {verifyingOrderId === order._id ? 'Verificando…' : 'Verificar ✅'}
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* ✅ Edición de estados + detalles */}
                                    {isExpanded ? (
                                        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
                                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                <div className="muted">
                                                    <strong>Estado pago:</strong>{' '}
                                                    <select
                                                        value={order.paymentStatus || 'pending'}
                                                        disabled={updatingOrderId === order._id}
                                                        onChange={(e) =>
                                                            handleUpdateOrder(order, { paymentStatus: e.target.value })
                                                        }
                                                        style={{
                                                            marginLeft: 8,
                                                            padding: '10px 12px',
                                                            borderRadius: 12,
                                                            border: '1px solid var(--border)',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            color: 'rgba(255,255,255,0.9)',
                                                            fontWeight: 900
                                                        }}
                                                    >
                                                        {paymentStatusOptions.map((s) => (
                                                            <option key={s} value={s} style={{ color: '#111' }}>
                                                                {s}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="muted">
                                                    <strong>Estado envío:</strong>{' '}
                                                    <select
                                                        value={order.shippingStatus || 'pending'}
                                                        disabled={updatingOrderId === order._id}
                                                        onChange={(e) =>
                                                            handleUpdateOrder(order, { shippingStatus: e.target.value })
                                                        }
                                                        style={{
                                                            marginLeft: 8,
                                                            padding: '10px 12px',
                                                            borderRadius: 12,
                                                            border: '1px solid var(--border)',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            color: 'rgba(255,255,255,0.9)',
                                                            fontWeight: 900
                                                        }}
                                                    >
                                                        {shippingStatusOptions.map((s) => (
                                                            <option key={s} value={s} style={{ color: '#111' }}>
                                                                {s}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="muted">
                                                    <strong>Método pago:</strong> {order.paymentMethod || '—'}
                                                </div>

                                                <div className="muted">
                                                    <strong>Método envío:</strong> {order.shippingMethod || '—'}
                                                </div>

                                                <div className="muted">
                                                    <strong>Dirección:</strong> {order.shippingAddress || '—'}
                                                </div>

                                                {order.customerPhone ? (
                                                    <div className="muted">
                                                        <strong>Teléfono:</strong> {order.customerPhone}
                                                    </div>
                                                ) : null}

                                                {order.notes ? (
                                                    <div className="muted">
                                                        <strong>Notas:</strong> {order.notes}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div style={{ marginTop: '0.85rem' }}>
                                                <h3 style={{ margin: 0, letterSpacing: '-0.03em' }}>Ítems</h3>
                                                <div style={{ marginTop: '0.55rem', display: 'grid', gap: '0.45rem' }}>
                                                    {!items.length ? (
                                                        <p className="muted" style={{ margin: 0 }}>Sin ítems.</p>
                                                    ) : (
                                                        items.map((it, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="card"
                                                                style={{
                                                                    padding: '0.85rem',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    gap: '1rem',
                                                                    flexWrap: 'wrap'
                                                                }}
                                                            >
                                                                <div style={{ fontWeight: 900 }}>
                                                                    {it.productName || it.name || 'Producto'}
                                                                </div>
                                                                <div className="muted">
                                                                    {it.quantity} x {money(it.price)}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </article>
                            );
                        })}
                    </section>
                )}

                <div style={{ marginTop: '1.25rem' }}>
                    <Link className="btn btn-ghost" to="/">
                        ← Volver al inicio
                    </Link>
                </div>
            </div>
        </main>
    );
}
