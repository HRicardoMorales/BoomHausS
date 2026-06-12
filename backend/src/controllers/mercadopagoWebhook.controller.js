// backend/src/controllers/mercadopagoWebhook.controller.js

const Order = require("../models/order.js");
const { MercadoPagoConfig, Payment } = require("mercadopago");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { verifyMpWebhookSignature } = require("../services/mpSignature");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

async function mercadopagoWebhook(req, res) {
  try {
    const body = req.body || {};
    const query = req.query || {};

    // ── 1) Extraer payment id desde query o body ────────────────────────
    const paymentId =
      query?.["data.id"] ||
      query?.id ||
      body?.data?.id;

    if (!paymentId) {
      // MP manda algunos webhooks sin data.id (ej: test pings); los ignoramos.
      return res.status(200).json({ ok: true, ignored: "missing data.id" });
    }

    // ── 2) Verificar firma HMAC ─────────────────────────────────────────
    // Sin esto, cualquiera puede POST a este endpoint y aprobar órdenes.
    const sig = verifyMpWebhookSignature({
      xSignature: req.headers["x-signature"],
      xRequestId: req.headers["x-request-id"],
      dataId: paymentId,
      secret: process.env.MP_WEBHOOK_SECRET,
    });

    if (!sig.ok) {
      console.warn(
        `⚠️ Webhook MP rechazado (${sig.reason})`,
        { ip: req.ip, ua: req.headers["user-agent"] },
      );
      return res.status(401).json({ ok: false, error: "invalid signature" });
    }

    // ── 3) Consultar el pago real a la API de MP ────────────────────────
    // El payload del webhook NUNCA se usa como autoridad: traemos el pago
    // real desde MP usando el id verificado por la firma.
    const paymentApi = new Payment(client);
    const payment = await paymentApi.get({ id: String(paymentId) });

    const status = payment?.status; // approved | pending | rejected | etc.
    const externalRef = payment?.external_reference; // tu orderId
    const transactionAmount = Number(payment?.transaction_amount);

    if (!externalRef) {
      return res.status(200).json({ ok: true, ignored: "missing external_reference" });
    }

    // ── 4) Cargar la orden ──────────────────────────────────────────────
    const order = await Order.findById(externalRef);
    if (!order) {
      console.warn(`⚠️ Webhook MP: orden ${externalRef} no existe`);
      return res.status(200).json({ ok: true, ignored: "order not found" });
    }

    // ── 5) Idempotencia: si ya está aprobada, respondemos 200 sin tocar nada.
    // MP reintenta webhooks varias veces.
    if (order.paymentStatus === "approved") {
      return res.status(200).json({ ok: true, idempotent: true });
    }

    // ── 6) Validar que el monto cobrado coincida con el de la orden.
    // Si MP reporta un monto distinto, NO aprobamos y logueamos: puede ser
    // un intento de manipulación o un bug de cálculo en el frontend.
    let newStatus = "pending";
    if (status === "approved") {
      const orderTotal = Number(order.totalAmount);
      if (
        !Number.isFinite(transactionAmount) ||
        Math.abs(transactionAmount - orderTotal) > 1
      ) {
        console.error(
          `❌ Webhook MP: monto inconsistente. order=${externalRef} ` +
          `orderTotal=${orderTotal} mpTransactionAmount=${transactionAmount}. ` +
          `NO se aprueba.`,
        );
        // Respondemos 200 para que MP no reintente — el problema requiere
        // intervención manual del admin.
        return res.status(200).json({ ok: true, ignored: "amount mismatch" });
      }
      newStatus = "approved";
    } else if (status === "rejected" || status === "cancelled") {
      newStatus = "rejected";
    }

    // ── 7) Actualizar la orden ──────────────────────────────────────────
    const updatedOrder = await Order.findByIdAndUpdate(
      externalRef,
      { paymentStatus: newStatus },
      { new: true },
    );

    if (newStatus === "approved" && updatedOrder) {
      try {
        await sendOrderConfirmationEmail(updatedOrder, { mode: "mercadopago" });
      } catch (emailErr) {
        console.warn(
          "⚠️ No se pudo enviar email de confirmación MP:",
          emailErr?.message || emailErr,
        );
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook MP error:", err?.message || err);
    // Respondemos 200 igual para evitar reintentos infinitos mientras debugueás
    return res.status(200).json({ ok: true });
  }
}

module.exports = { mercadopagoWebhook };
