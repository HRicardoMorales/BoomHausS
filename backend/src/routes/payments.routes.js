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

module.exports = router;
