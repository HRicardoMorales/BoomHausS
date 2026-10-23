// frontend/src/pages/myOrders.jsx — historial del cliente.
// La lógica de carga y de subida de comprobante es la de siempre; la vista
// se apoya en OrderCard (presentacional) y en los estados compartidos.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatePanel from '../components/ui/StatePanel.jsx';
import { SkeletonGroup } from '../components/ui/Skeleton.jsx';
import OrderCard, { OrderCardSkeleton } from '../components/orders/OrderCard.jsx';
import { isPaymentSettled, money, orderSteps } from '../components/orders/orderStatus.js';
import './myOrders.css';

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
    }, []);

    const totalOrders = orders.length;

    const totalSpent = useMemo(() => {
        return (orders || []).reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
    }, [orders]);

    // Pedidos que todavía esperan algo (pago o envío): lo primero que el
    // cliente quiere saber al entrar.
    const inProgress = useMemo(
        () => orders.filter((o) => orderSteps(o).some((s) => s.state === 'current')).length,
        [orders]
    );

    function toggleExpand(orderId) {
        setExpandedId((cur) => (cur === orderId ? null : orderId));
    }

    function openFilePicker(order) {
        setUploadError('');

        // ✅ Guardamos el pedido seleccionado en un ref (no depende del timing del setState)
        selectedOrderIdRef.current = order._id;

        // ✅ si está verificado, no dejamos subir
        const verified = isPaymentSettled(order);

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
        const verified = isPaymentSettled(order);

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

    const header = (
        <header className="mo-head">
            <p className="mo-eyebrow">Tu cuenta</p>
            <h1 className="mo-title">Mis pedidos</h1>
        </header>
    );

    if (loading) {
        return (
            <main className="mo">
                {header}
                <SkeletonGroup label="Cargando tus pedidos…" className="mo-list">
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                </SkeletonGroup>
            </main>
        );
    }

    if (error) {
        return (
            <main className="mo">
                {header}
                <StatePanel
                    tone="error"
                    size="inline"
                    eyebrow="Algo falló"
                    title="No pudimos cargar tus pedidos"
                    actions={
                        <>
                            <button type="button" className="btn btn-primary" onClick={fetchMyOrders}>
                                Reintentar
                            </button>
                            <Link className="btn btn-ghost" to="/">
                                Ir al inicio
                            </Link>
                        </>
                    }
                >
                    <p>{error} Revisá tu conexión y probá de nuevo.</p>
                </StatePanel>
            </main>
        );
    }

    if (!orders.length) {
        return (
            <main className="mo">
                {header}
                <StatePanel
                    icon="receipt"
                    size="inline"
                    eyebrow="Todavía nada por acá"
                    title="Todavía no hiciste pedidos"
                    actions={
                        <Link className="btn btn-primary" to="/products">
                            Ver productos
                        </Link>
                    }
                >
                    <p>Cuando compres, vas a poder seguir el pago y el envío desde esta página.</p>
                </StatePanel>
            </main>
        );
    }

    return (
        <main className="mo">
            {/* input oculto reutilizable */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                hidden
                tabIndex={-1}
                aria-hidden="true"
                onChange={onFileChange}
            />

            <div className="mo-top">
                {header}
                <button type="button" className="mo-refresh" onClick={fetchMyOrders}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
                    </svg>
                    Actualizar
                </button>
            </div>

            <dl className="mo-stats">
                <div>
                    <dt>Pedidos</dt>
                    <dd>{totalOrders}</dd>
                </div>
                <div>
                    <dt>En curso</dt>
                    <dd>{inProgress}</dd>
                </div>
                <div>
                    <dt>Total</dt>
                    <dd>{money(totalSpent)}</dd>
                </div>
            </dl>

            <div className="mo-alert" role="alert">
                {uploadError ? <p>{uploadError}</p> : null}
            </div>

            <section className="mo-list" aria-label="Historial de pedidos">
                {orders.map((o, i) => (
                    <OrderCard
                        key={o._id}
                        order={o}
                        index={i}
                        expanded={expandedId === o._id}
                        onToggle={() => toggleExpand(o._id)}
                        onUpload={() => openFilePicker(o)}
                        uploading={uploadingId === o._id}
                        preview={selected.orderId === o._id ? selected.previewUrl : null}
                    />
                ))}
            </section>

            <p className="mo-help">
                ¿Algo no coincide? Escribinos con el número de pedido o mirá{' '}
                <Link to="/returns">cambios y devoluciones</Link>.
            </p>
        </main>
    );
}
