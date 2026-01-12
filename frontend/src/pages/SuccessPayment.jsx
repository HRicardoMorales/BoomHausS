// frontend/src/pages/SuccessPayment.jsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { track } from '../lib/metaPixel';
import api from '../services/api';

export default function SuccessPayment() {
    const [searchParams] = useSearchParams();
    const { clearCart } = useCart();

    // MP params (pueden variar)
    const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
    const statusParam =
        searchParams.get('collection_status') ||
        searchParams.get('status') ||
        searchParams.get('payment_status');

    const paymentType = searchParams.get('payment_type');

    const [finalStatus, setFinalStatus] = useState(statusParam || 'pending');
    const [checking, setChecking] = useState(true);

    const isApproved = finalStatus === 'approved';
    const isRejected = finalStatus === 'rejected';
    const isPending = !isApproved && !isRejected; // pending / in_process / null

    // Si querés, podés mapear más statuses acá
    const label = useMemo(() => {
        if (isApproved) return { emoji: '🎉', title: '¡Pago exitoso!', color: '#10b981' };
        if (isRejected) return { emoji: '❌', title: 'Pago rechazado', color: '#ef4444' };
        return { emoji: '⏳', title: 'Pago pendiente', color: '#f59e0b' };
    }, [isApproved, isRejected]);

    // 1) Confirmación opcional por backend (más confiable que solo URL)
    useEffect(() => {
        let alive = true;

        async function verify() {
            try {
                if (!paymentId) {
                    // No hay payment id, nos quedamos con lo que venga en URL
                    if (alive) setChecking(false);
                    return;
                }

                // Endpoint opcional: si no existe, cae en catch y no rompe
                // (si querés, después te lo creo en backend)
                const res = await api.get(`/payments/mercadopago/${paymentId}`);
                const backendStatus = res?.data?.status;

                if (alive && backendStatus) {
                    setFinalStatus(backendStatus);
                }
            } catch (_) {
                // Si no existe endpoint o falla, no pasa nada
            } finally {
                if (alive) setChecking(false);
            }
        }

        verify();
        return () => { alive = false; };
    }, [paymentId]);

    // 2) Si queda aprobado, limpiamos carrito y trackeamos compra
    useEffect(() => {
        if (!isApproved) return;

        clearCart();

        track('Purchase', {
            value: 0,
            currency: 'ARS',
            payment_type: paymentType || 'mercadopago'
        });
    }, [isApproved, clearCart, paymentType]);

    return (
        <main
            className="section"
            style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <div className="container" style={{ textAlign: 'center' }}>
                <div className="card reveal" style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{label.emoji}</div>
                    <h1 style={{ color: label.color, fontWeight: 900 }}>
                        {checking ? 'Confirmando pago...' : label.title}
                    </h1>

                    <p className="muted" style={{ fontSize: '1.1rem', margin: '1rem 0' }}>
                        {checking
                            ? 'Estamos verificando el estado con Mercado Pago. Si cerraste la pestaña antes, igual lo confirmamos.'
                            : isApproved
                                ? 'Tu compra se procesó correctamente. Ya estamos preparando tu pedido.'
                                : isRejected
                                    ? 'El pago fue rechazado. Podés intentar nuevamente con otro medio de pago.'
                                    : 'El pago está en proceso. Si se aprueba, tu pedido se confirmará automáticamente.'}
                    </p>

                    <div
                        style={{
                            background: '#f8fafc',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            margin: '2rem 0',
                            border: '1px solid #e2e8f0',
                            textAlign: 'left'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className="muted">Estado:</span>
                            <span style={{ fontWeight: 800, color: label.color, textTransform: 'uppercase' }}>
                                {finalStatus || 'pending'}
                            </span>
                        </div>

                        {paymentId && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="muted">Operación MP:</span>
                                <span style={{ fontWeight: 800 }}>#{paymentId}</span>
                            </div>
                        )}
                    </div>

                    {isApproved ? (
                        <Link to="/my-orders" className="btn btn-primary" style={{ width: '100%', padding: '15px' }}>
                            Ver mis pedidos
                        </Link>
                    ) : (
                        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/checkout" className="btn btn-primary">Intentar de nuevo</Link>
                            <Link to="/" className="btn btn-ghost">Volver al inicio</Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
