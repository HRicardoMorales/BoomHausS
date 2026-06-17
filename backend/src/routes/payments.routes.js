// backend/src/routes/payments.routes.js
const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// POST /api/payments/card
router.post('/card', async (req, res) => {
  try {
    const { token, amount, installments, payment_method_id, issuer_id, payer } = req.body;

    if (!token || !amount || !payer?.email) {
      return res.status(400).json({ ok: false, message: 'Faltan datos del pago.' });
    }

    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        token,
        description: 'Compra en tienda',
        installments: Number(installments) || 1,
        payment_method_id,
        issuer_id,
        payer: {
          email: payer.email,
          identification: payer.identification || undefined,
        },
      },
    });

    const status = result.status;

    if (status === 'approved') {
      return res.json({ ok: true, status, id: result.id });
    }

    // rejected / in_process / pending
    return res.status(422).json({
      ok: false,
      status,
      status_detail: result.status_detail,
      id: result.id,
    });
  } catch (err) {
    console.error('❌ Error en POST /api/payments/card:', err);
    const mpError = err?.cause?.[0]?.description || err.message || 'Error procesando el pago.';
    return res.status(500).json({ ok: false, message: mpError });
  }
});

/**
 * GET /api/payments/mercadopago/:paymentId
 *
 * Verifica con la API de Mercado Pago el estado REAL de un pago.
 * Lo usa SuccessPayment.jsx para confirmar que el pago está aprobado
 * antes de disparar el evento Purchase del Meta Pixel — así evitamos
 * que cualquiera pueda forzar el Purchase entrando a
 * /success-payment?collection_status=approved sin haber pagado.
 *
 * Endpoint público: solo devuelve datos del pago (no realiza acciones).
 * El paymentId que llega es público (viene del redirect de MP), así que
 * no estamos exponiendo nada nuevo.
 */
router.get('/mercadopago/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId) {
      return res.status(400).json({ ok: false, message: 'Falta paymentId.' });
    }

    const payment = new Payment(client);
    const result = await payment.get({ id: String(paymentId) });

    return res.json({
      ok: true,
      status: result?.status || 'pending',
      status_detail: result?.status_detail || null,
      transaction_amount: Number(result?.transaction_amount) || null,
      external_reference: result?.external_reference || null,
      payment_type_id: result?.payment_type_id || null,
      currency_id: result?.currency_id || 'ARS',
    });
  } catch (err) {
    console.error('❌ Error en GET /api/payments/mercadopago/:paymentId:', err?.message || err);
    // 404 si MP no encuentra el pago, 500 para errores reales
    const isNotFound = err?.status === 404 || /not found/i.test(err?.message || '');
    return res.status(isNotFound ? 404 : 500).json({
      ok: false,
      message: isNotFound ? 'Pago no encontrado en Mercado Pago.' : 'Error consultando el pago.',
    });
  }
});

module.exports = router;
