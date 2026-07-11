import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';
// import { trackPurchase } from '../lib/metaPixel'; // META DESACTIVADO

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #fff5f8 0%, #fdf2f8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Montserrat', 'Inter', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '48px 40px',
    maxWidth: 520,
    width: '100%',
    boxShadow: '0 8px 48px rgba(159,18,57,0.10)',
    textAlign: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 44,
    margin: '0 auto 24px',
  },
  badge: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '4px 12px',
    borderRadius: 999,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    margin: '0 0 12px',
    letterSpacing: '-0.02em',
  },
  sub: {
    fontSize: 15,
    lineHeight: 1.6,
    color: '#64748b',
    margin: '0 0 28px',
  },
  infoBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '20px 24px',
    marginBottom: 28,
    textAlign: 'left',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 14,
  },
  infoLabel: { color: '#94a3b8', fontWeight: 500 },
  infoVal: { fontWeight: 700, color: '#1e293b' },
  btnPrimary: {
    display: 'block',
    width: '100%',
    padding: '16px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #9F1239, #be185d)',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    letterSpacing: '0.02em',
    marginBottom: 12,
  },
  btnGhost: {
    display: 'block',
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    background: 'transparent',
    color: '#64748b',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 28,
    textAlign: 'left',
  },
  stepItem: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    fontSize: 14,
    color: '#475569',
    lineHeight: 1.5,
  },
  stepNum: {
    flexShrink: 0,
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#9F1239',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    borderTop: '1px solid #f1f5f9',
    margin: '20px 0',
  },
  checking: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  spinner: {
    width: 18,
    height: 18,
    border: '2px solid #e2e8f0',
    borderTopColor: '#9F1239',
    borderRadius: '50%',
    animation: 'ipl-spin 0.7s linear infinite',
  },
};

export default function SuccessPayment() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const paymentId    = searchParams.get('payment_id') || searchParams.get('collection_id');
  const statusParam  = searchParams.get('collection_status') || searchParams.get('status') || searchParams.get('payment_status');
  const externalRef  = searchParams.get('external_reference');
  const paymentType  = searchParams.get('payment_type');

  const [finalStatus, setFinalStatus] = useState(statusParam || 'pending');
  const [checking, setChecking]       = useState(true);
  // backendVerified: true SOLO si /payments/mercadopago/<paymentId> confirmó
  // que el pago realmente está aprobado. Nunca confiamos en URL params para
  // disparar Purchase.
  const [backendVerified, setBackendVerified] = useState(false);
  const [backendAmount, setBackendAmount] = useState(null);

  const isApproved = finalStatus === 'approved';
  const isRejected = finalStatus === 'rejected' || finalStatus === 'cancelled';
  const isPending  = !isApproved && !isRejected;

  const cfg = useMemo(() => {
    if (isApproved) return {
      iconBg: '#f0fdf4',
      icon: '✅',
      badgeBg: '#dcfce7',
      badgeColor: '#16a34a',
      badgeText: 'PAGO APROBADO',
      titleColor: '#15803d',
      title: '¡Tu compra fue exitosa!',
      sub: 'Recibimos tu pago y ya estamos preparando tu pedido. Te enviamos la confirmación por email.',
    };
    if (isRejected) return {
      iconBg: '#fef2f2',
      icon: '❌',
      badgeBg: '#fee2e2',
      badgeColor: '#dc2626',
      badgeText: 'PAGO RECHAZADO',
      titleColor: '#dc2626',
      title: 'El pago no se pudo procesar',
      sub: 'No se realizó ningún cobro. Podés intentar nuevamente con otro medio de pago.',
    };
    return {
      iconBg: '#fffbeb',
      icon: '⏳',
      badgeBg: '#fef9c3',
      badgeColor: '#ca8a04',
      badgeText: 'PAGO PENDIENTE',
      titleColor: '#b45309',
      title: 'Tu pago está siendo verificado',
      sub: 'Una vez que se confirme, tu pedido se activa automáticamente. Te avisamos por email.',
    };
  }, [isApproved, isRejected]);

  useEffect(() => {
    let alive = true;
    async function verify() {
      try {
        if (!paymentId) { if (alive) setChecking(false); return; }
        const res = await api.get(`/payments/mercadopago/${paymentId}`);
        const backendStatus = res?.data?.status;
        const backendAmt    = Number(res?.data?.transaction_amount ?? res?.data?.amount);
        if (alive && backendStatus) {
          setFinalStatus(backendStatus);
          if (backendStatus === 'approved') setBackendVerified(true);
          if (Number.isFinite(backendAmt) && backendAmt > 0) setBackendAmount(backendAmt);
        }
      } catch (_) {
        // endpoint opcional, no bloquea
      } finally {
        if (alive) setChecking(false);
      }
    }
    verify();
    return () => { alive = false; };
  }, [paymentId]);

  useEffect(() => {
    if (!isApproved) return;
    clearCart();
  }, [isApproved, clearCart]);

  // Disparar Purchase SOLO cuando:
  //   1. checking terminó (no estamos esperando la verificación del backend)
  //   2. backendVerified === true (el backend confirmó approved — no confiamos
  //      en URL params como ?collection_status=approved que cualquiera puede
  //      poner)
  //   3. Hay un orderId (externalRef o paymentId) — sin ID no se trackea
  //
  // El guard contra duplicados vive dentro de trackPurchase (localStorage
  // por orderId, eventID determinístico). Cross-tab safe.
  useEffect(() => {
    if (checking) return;
    if (!backendVerified) return;

    const orderRef = externalRef || paymentId;
    if (!orderRef) return;

    // META DESACTIVADO
    // trackPurchase(orderRef, {
    //   content_type: 'product',
    //   ...(paymentId  ? { transaction_id: paymentId } : {}),
    //   ...(externalRef ? { order_id: externalRef }    : {}),
    //   ...(backendAmount ? { value: backendAmount }   : {}),
    // });
  }, [checking, backendVerified, paymentId, externalRef, backendAmount]);

  const paymentTypeLabel = paymentType === 'credit_card' ? 'Tarjeta de crédito'
    : paymentType === 'debit_card' ? 'Tarjeta de débito'
    : paymentType === 'ticket'      ? 'Efectivo'
    : paymentType || null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        @keyframes sp-spin { to { transform: rotate(360deg) } }
        .sp-spinner { animation: sp-spin 0.7s linear infinite; }
      `}</style>

      <div style={S.page}>
        <div style={S.card}>

          {/* Ícono */}
          <div style={{ ...S.iconWrap, background: cfg.iconBg }}>
            {cfg.icon}
          </div>

          {/* Badge */}
          <span style={{ ...S.badge, background: cfg.badgeBg, color: cfg.badgeColor }}>
            {cfg.badgeText}
          </span>

          {/* Checking spinner */}
          {checking && (
            <div style={S.checking}>
              <div className="sp-spinner" style={S.spinner} />
              Confirmando pago con Mercado Pago…
            </div>
          )}

          {/* Título */}
          <h1 style={{ ...S.title, color: cfg.titleColor }}>
            {checking ? 'Verificando tu pago…' : cfg.title}
          </h1>

          <p style={S.sub}>{cfg.sub}</p>

          {/* Info box */}
          {(paymentId || externalRef || paymentTypeLabel) && (
            <div style={S.infoBox}>
              {externalRef && (
                <div style={S.infoRow}>
                  <span style={S.infoLabel}>Número de pedido</span>
                  <span style={S.infoVal}>#{externalRef.slice(-6).toUpperCase()}</span>
                </div>
              )}
              {paymentId && (
                <div style={{ ...S.infoRow, borderBottom: 'none' }}>
                  <span style={S.infoLabel}>Operación MP</span>
                  <span style={S.infoVal}>#{paymentId}</span>
                </div>
              )}
              {paymentTypeLabel && (
                <div style={{ ...S.infoRow, borderBottom: 'none', paddingTop: 0 }}>
                  <span style={S.infoLabel}>Medio de pago</span>
                  <span style={S.infoVal}>{paymentTypeLabel}</span>
                </div>
              )}
            </div>
          )}

          {/* Pasos / próximos pasos */}
          {isApproved && !checking && (
            <div style={S.steps}>
              <div style={S.stepItem}>
                <div style={S.stepNum}>1</div>
                <span>Recibirás un <strong>email de confirmación</strong> con el detalle de tu pedido.</span>
              </div>
              <div style={S.stepItem}>
                <div style={S.stepNum}>2</div>
                <span>Preparamos tu pedido y te enviamos el <strong>número de seguimiento</strong> cuando despachemos.</span>
              </div>
              <div style={S.stepItem}>
                <div style={S.stepNum}>3</div>
                <span>Entrega estimada: <strong>3 a 7 días hábiles</strong> a todo el país.</span>
              </div>
            </div>
          )}

          <div style={S.divider} />

          {/* CTAs */}
          {isApproved ? (
            <>
              <Link to="/my-orders" style={S.btnPrimary}>Ver mis pedidos</Link>
              <Link to="/" style={S.btnGhost}>Volver al inicio</Link>
            </>
          ) : isRejected ? (
            <>
              <Link to="/checkout" style={S.btnPrimary}>Reintentar pago</Link>
              <Link to="/" style={S.btnGhost}>Volver al inicio</Link>
            </>
          ) : (
            <>
              <Link to="/my-orders" style={S.btnPrimary}>Ver estado de mi pedido</Link>
              <Link to="/" style={S.btnGhost}>Volver al inicio</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
