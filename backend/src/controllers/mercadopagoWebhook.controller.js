const Order = require("../models/order.js");
const { MercadoPagoConfig, Payment } = require("mercadopago");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { sendPurchaseEvent } = require("../services/metaCapi");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

async function mercadopagoWebhook(req, res) {
  try {
    const body = req.body || {};
    const query = req.query || {};

    // MP manda el payment id en distintos formatos según el tipo de webhook
    const paymentId =
      body?.data?.id ||
      query?.id ||
      query?.["data.id"];

    if (!paymentId) return res.status(200).json({ ok: true, ignored: true });

    const paymentApi = new Payment(client);
    const payment = await paymentApi.get({ id: String(paymentId) });

    const status = payment?.status; // approved | pending | rejected | etc.
    const externalRef = payment?.external_reference; // tu orderId

    if (!externalRef) return res.status(200).json({ ok: true, ignored: true });

    let newStatus = "pending";
    if (status === "approved") newStatus = "approved";
    else if (status === "rejected") newStatus = "rejected";

    const updatedOrder = await Order.findByIdAndUpdate(
      externalRef,
      { paymentStatus: newStatus },
      { new: true }
    );

    if (newStatus === "approved" && updatedOrder) {
      try {
        await sendOrderConfirmationEmail(updatedOrder, { mode: "mercadopago" });
      } catch (emailErr) {
        console.warn("⚠️ No se pudo enviar email de confirmación MP:", emailErr?.message || emailErr);
      }
      try {
        await sendPurchaseEvent(updatedOrder);
      } catch (capiErr) {
        console.warn("⚠️ Meta CAPI error (MP webhook):", capiErr?.message || capiErr);
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
