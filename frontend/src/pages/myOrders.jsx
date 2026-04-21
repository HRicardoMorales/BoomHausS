// frontend/src/pages/MyOrders.jsx

import { useEffect, useMemo, useRef, useState } from 'react';
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

export default function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI estado
    const [expandedId, setExpandedId] = useState(null);

    // Upload state
    const fileInputRef = useRef(null);

    // ✅ Guardamos el pedido al que el usuario le dio "Subir comprobante"
    // Esto evita errores de timing del setState cuando se abre el file picker.
    const selectedOrderIdRef = useRef(null);

    const [uploadingId, setUploadingId] = useState(null);
    const [uploadError, setUploadError] = useState('');
    const [selected, setSelected] = useState({
        orderId: null,
        file: null,
        previewUrl: null
    });

    async function fetchMyOrders() {
        try {
            setLoading(true);
            setError('');

            const res = await api.get('/orders/my');

            if (res.data?.ok) {
                setOrders(res.data.data || []);
            } else {
                setError('No se pudieron cargar tus pedidos.');
            }
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                    err.response?.data?.error ||
                    'Error al cargar tus pedidos.'
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMyOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalOrders = orders.length;

    const totalSpent = useMemo(() => {
        return (orders || []).reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
    }, [orders]);

    function toggleExpand(orderId) {
        setExpandedId((cur) => (cur === orderId ? null : orderId));
    }

    function openFilePicker(order) {
        setUploadError('');

        // ✅ Guardamos el pedido seleccionado en un ref (no depende del timing del setState)
        selectedOrderIdRef.current = order._id;

        // ✅ si está verificado, no dejamos subir
        const verified =
            Boolean(order.paymentProofVerified) ||
            String(order.paymentStatus || '').toLowerCase() === 'confirmed';

        if (verified) {
            setUploadError('Este pedido ya fue verificado. No necesitás subir otro comprobante.');
            return;
        }

        setSelected({ orderId: order._id, file: null, previewUrl: null });
        fileInputRef.current?.click();
    }

    function onFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validación simple
        const maxSize = 6 * 1024 * 1024; // 6MB
        if (file.size > maxSize) {
            setUploadError('El archivo es muy pesado (máx 6MB).');
            e.target.value = '';
            return;
        }

        const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!okTypes.includes(file.type)) {
            setUploadError('Formato no permitido. Subí JPG/PNG/WEBP o PDF.');
            e.target.value = '';
            return;
        }

        // Preview solo para imagen
        const isImage = file.type.startsWith('image/');
        const previewUrl = isImage ? URL.createObjectURL(file) : null;

        setSelected((prev) => ({
            orderId: prev.orderId,
            file,
            previewUrl
        }));

        // ✅ UX: al elegir el archivo, lo subimos automáticamente (1 solo paso)
        const orderId = selectedOrderIdRef.current;
        const order = orders.find((o) => o._id === orderId);

        if (!order) {
            setUploadError('No se encontró el pedido seleccionado para subir el comprobante.');
            return;
        }

        // Subimos inmediatamente (sin pedir segundo click)
        uploadPaymentProof(order, file);
    }

    async function uploadPaymentProof(order, fileOverride = null) {
        // ✅ si está verificado, bloqueamos
        const verified =
            Boolean(order.paymentProofVerified) ||
            String(order.paymentStatus || '').toLowerCase() === 'confirmed';

        if (verified) {
            setUploadError('Este pedido ya fue verificado. No necesitás subir otro comprobante.');
            return;
        }

        const orderId = order?._id;
        const fileToUpload = fileOverride || selected.file;

        if (!orderId) {
            setUploadError('No se pudo identificar el pedido.');
            return;
        }

        if (!fileToUpload) {
            setUploadError('Seleccioná un archivo antes de subirlo.');
            return;
        }

        // Si NO pasamos fileOverride, aseguramos que el archivo seleccionado corresponda a este pedido
        if (!fileOverride && selected.orderId !== orderId) {
            setUploadError('Seleccioná el archivo para este pedido antes de subirlo.');
            return;
        }

        try {
            setUploadingId(orderId);
            setUploadError('');

            const form = new FormData();
            // ⚠️ Campo esperado por multer
            form.append('paymentProof', fileToUpload);

            const res = await api.post(`/orders/${orderId}/payment-proof`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.ok) {
                const updated = res.data.data;

                setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));

                // limpiar selección
                if (selected.previewUrl) URL.revokeObjectURL(selected.previewUrl);
                setSelected({ orderId: null, file: null, previewUrl: null });

                // limpiamos el ref del pedido seleccionado
                selectedOrderIdRef.current = null;

                // reset input
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                setUploadError('No se pudo subir el comprobante.');
            }
        } catch (err) {
            console.error(err);
            setUploadError(
                err.response?.data?.message ||
                    err.response?.data?.error ||
                    'Error al subir comprobante.'
            );
        } finally {
            setUploadingId(null);
        }
    }

    // Limpieza de preview al desmontar/cambiar
    useEffect(() => {
        return () => {
            if (selected.previewUrl) URL.revokeObjectURL(selected.previewUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <main style={{ padding: '1.5rem' }}>
                <h1>Mis pedidos</h1>
                <p>Cargando...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main style={{ padding: '1.5rem' }}>
                <h1>Mis pedidos</h1>
                <p style={{ color: 'tomato' }}>{error}</p>
                <button className="btn" onClick={fetchMyOrders}>
                    Reintentar
                </button>
                <div style={{ marginTop: '1rem' }}>
                    <Link to="/">← Volver</Link>
                </div>
            </main>
        );
    }

    return (
        <main style={{ padding: '1.5rem' }}>
            {/* input oculto reutilizable */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={onFileChange}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ margin: '0.65rem 0 0.25rem', letterSpacing: '-0.02em' }}>Mis pedidos</h1>
                    <div className="muted">
                        Pedidos: <strong>{totalOrders}</strong> — Total gastado:{' '}
                        <strong>{money(totalSpent)}</strong>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className="btn" onClick={fetchMyOrders}>
                        Actualizar
                    </button>
                    <Link className="btn" to="/">
                        Volver
                    </Link>
                </div>
            </div>

            {uploadError ? (
                <div style={{ marginTop: '0.9rem' }} className="alert alert-warn">
                    {uploadError}
                </div>
            ) : null}

            {!orders.length ? (
                <div style={{ marginTop: '1rem' }} className="card">
                    <p style={{ margin: 0 }}>Todavía no tenés pedidos.</p>
                </div>
            ) : (
                <section style={{ marginTop: '1rem', display: 'grid', gap: '0.85rem' }}>
                    {orders.map((o) => {
                        const isExpanded = expandedId === o._id;

                        const hasProof = Boolean(o.paymentProofUrl);
                        const verified =
                            Boolean(o.paymentProofVerified) ||
                            String(o.paymentStatus || '').toLowerCase() === 'confirmed';

                        const proofLabel = verified ? 'Verificado ✅' : hasProof ? 'Subido ✅' : 'Pendiente';

                        const payLabel = verified ? 'Pago confirmado ✅' : `Pago: ${o.paymentStatus || 'pending'}`;

                        return (
                            <article key={o._id} className="card" style={{ padding: '1.1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                                        <div className="muted">
                                            <strong>Pedido:</strong> {o._id}
                                        </div>
                                        <div className="muted">
                                            <strong>Fecha:</strong> {formatDate(o.createdAt)}
                                        </div>
                                        <div className="muted">
                                            <strong>Total:</strong> {money(o.totalAmount)}
                                        </div>
                                        <div className="muted">
                                            <strong>Envío:</strong> {o.shippingMethod || '—'} — {o.shippingStatus || 'pending'}
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                            <span className="badge">{payLabel}</span>
                                            <span className="badge">Comprobante: {proofLabel}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <button className="btn" type="button" onClick={() => toggleExpand(o._id)}>
                                            {isExpanded ? 'Ocultar' : 'Ver'}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => openFilePicker(o)}
                                            disabled={verified || uploadingId === o._id}
                                            title={verified ? 'Este pedido ya fue verificado' : 'Subir comprobante'}
                                        >
                                            {uploadingId === o._id ? 'Subiendo...' : verified ? 'Verificado ✅' : hasProof ? 'Re-subir' : 'Subir comprobante'}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded ? (
                                    <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
                                        <div style={{ display: 'grid', gap: '0.35rem' }}>
                                            <div className="muted">
                                                <strong>Dirección:</strong> {o.shippingAddress || '—'}
                                            </div>

                                            {o.paymentProofUrl ? (
                                                <div className="muted">
                                                    <strong>Comprobante:</strong>{' '}
                                                    <a href={o.paymentProofUrl} target="_blank" rel="noreferrer">
                                                        Ver archivo
                                                    </a>
                                                </div>
                                            ) : null}

                                            {selected.previewUrl && selected.orderId === o._id ? (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <div className="muted" style={{ marginBottom: '0.35rem' }}>
                                                        Preview (imagen):
                                                    </div>
                                                    <img
                                                        src={selected.previewUrl}
                                                        alt="Preview comprobante"
                                                        style={{
                                                            width: 'min(380px, 100%)',
                                                            borderRadius: '12px',
                                                            border: '1px solid var(--border)'
                                                        }}
                                                    />
                                                </div>
                                            ) : null}

                                            <div style={{ marginTop: '0.85rem' }}>
                                                <div className="muted" style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Productos
                                                </div>
                                                <div style={{ display: 'grid', gap: '0.6rem' }}>
                                                    {(o.items || []).map((it, idx) => {
                                                        const itemTotal = it.bundleTotal
                                                            ? Number(it.bundleTotal)
                                                            : (Number(it.price) || 0) * (Number(it.quantity) || 1);
                                                        const hasDiscount = it.compareAtPrice && Number(it.compareAtPrice) > itemTotal;
                                                        return (
                                                            <div key={idx} style={{
                                                                display: 'flex', gap: '0.75rem', alignItems: 'center',
                                                                background: 'rgba(255,255,255,0.04)',
                                                                border: '1px solid var(--border)',
                                                                borderRadius: 12,
                                                                padding: '10px 12px',
                                                            }}>
                                                                {/* Imagen */}
                                                                {it.imageUrl && (
                                                                    <div style={{ width: 52, height: 52, borderRadius: 9, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                                                                        <img src={it.imageUrl} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                                    </div>
                                                                )}
                                                                {/* Info */}
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.3 }}>
                                                                        {it.productName || it.name || 'Producto'}
                                                                    </div>
                                                                    <div className="muted" style={{ fontSize: '0.75rem', marginTop: 3 }}>
                                                                        Cantidad: <strong>{it.quantity}</strong>
                                                                        {' · '}
                                                                        {money(it.price)} c/u
                                                                    </div>
                                                                </div>
                                                                {/* Total */}
                                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                                    {hasDiscount && (
                                                                        <div style={{ fontSize: '0.72rem', textDecoration: 'line-through', color: 'var(--muted)', fontWeight: 700 }}>
                                                                            {money(it.compareAtPrice)}
                                                                        </div>
                                                                    )}
                                                                    <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>{money(itemTotal)}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}
