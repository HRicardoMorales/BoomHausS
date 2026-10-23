import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import api from '../services/api';
import { trackPurchase } from '../lib/metaPixel';
import PaymentResult from '../components/payment/PaymentResult';

/*
 * Regreso desde Mercado Pago. Esta página solo orquesta: verifica el pago
 * contra el backend, limpia el carrito y dispara Purchase. La vista vive en
 * `components/payment/PaymentResult` (presentacional, sin efectos).
 */

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
      } catch {
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

    // trackPurchase eventID = "purchase_<orderRef>" — matches the server-side
    // sendPurchaseEvent that fires from the MP webhook. Guard localStorage
    // 30d dentro de trackPurchase evita doble disparo si el user recarga.
    trackPurchase(orderRef, {
      content_type:  'product',
      currency:      'ARS',
      ...(paymentId    ? { transaction_id: paymentId }    : {}),
      ...(externalRef  ? { order_id:       externalRef }  : {}),
      ...(backendAmount ? { value:         backendAmount } : {}),
    });
  }, [checking, backendVerified, paymentId, externalRef, backendAmount]);

  const paymentTypeLabel = paymentType === 'credit_card' ? 'Tarjeta de crédito'
    : paymentType === 'debit_card' ? 'Tarjeta de débito'
    : paymentType === 'ticket'      ? 'Efectivo'
    : paymentType || null;

  const kind = checking ? 'verifying'
    : isApproved ? 'approved'
    : isRejected ? 'rejected'
    : 'pending';

  return (
    <PaymentResult
      kind={kind}
      orderRef={externalRef}
      paymentId={paymentId}
      paymentLabel={paymentTypeLabel}
    />
  );
}
