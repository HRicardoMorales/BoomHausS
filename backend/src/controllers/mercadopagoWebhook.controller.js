// backend/src/controllers/mercadopagoWebhook.controller.js
//
// Webhook receiver for Mercado Pago payment notifications.
//
// Hardened pipeline (top-to-bottom):
//   1. Verify x-signature HMAC — reject unsigned/forged requests with 401.
//   2. Fetch the real payment from MP's API (never trust the body).
//   3. Load our own Order and cross-check external_reference + transaction_amount.
//   4. Short-circuit if the order was already approved for this same paymentId
//      (MP retries webhooks; without this guard we would resend email + Purchase).
//   5. Persist mpPaymentId when approving so future retries hit the guard.
//   6. Return codes: 401 (bad signature), 200 (processed OR ignored on purpose),
//      500 (real error → MP retries with backoff).

const crypto = require("crypto");
const Order = require("../models/order.js");
const { MercadoPagoConfig, Payment } = require("mercadopago");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { sendPurchaseEvent } = require("../services/metaCapi");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// ── HMAC verification ────────────────────────────────────────────────────────
// MP docs: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
// (section: "Validación del origen de la notificación")
//
// Manifest format: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
//   - data.id: from URL query param ?data.id=... (MP always sends it in the
//     URL, not only in the body). Lowercased iff the id is fully alphanumeric.
//   - x-request-id: from header
//   - ts: from the x-signature header (format "ts=<n>,v1=<hex>")
//
// Compare HMAC-SHA256(manifest, MP_WEBHOOK_SECRET) with v1 using
// crypto.timingSafeEqual to prevent timing-based leaks of the digest.
function verifyMpSignature(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: "missing_secret" };

  const signatureHeader = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"];
  if (!signatureHeader || !requestId) return { ok: false, reason: "missing_headers" };

  // Parse "ts=<n>,v1=<hex>[,...]" into an object. Tolerant of extra pairs.
  const parts = String(signatureHeader).split(",").reduce((acc, pair) => {
    const [k, v] = pair.split("=").map(s => (s ? s.trim() : ""));
    if (k && v) acc[k] = v;
    return acc;
  }, {});
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return { ok: false, reason: "malformed_signature" };

  // MP signs the id from the URL query param, not the body.
  const rawId = req.query?.["data.id"] || req.query?.id;
  if (rawId === undefined || rawId === null || rawId === "") {
    return { ok: false, reason: "missing_id" };
  }
  const idStr = String(rawId);
  const normalizedId = /^[a-zA-Z0-9]+$/.test(idStr) ? idStr.toLowerCase() : idStr;

  const manifest = `id:${normalizedId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(v1, "utf8");
  if (a.length !== b.length) return { ok: false, reason: "length_mismatch" };
  return crypto.timingSafeEqual(a, b)
    ? { ok: true }
    : { ok: false, reason: "hmac_mismatch" };
}

async function mercadopagoWebhook(req, res) {
  // 1) Signature first — anything unsigned/forged never touches the DB.
  const sig = verifyMpSignature(req);
  if (!sig.ok) {
    console.warn(`⚠️ MP webhook rechazado: firma inválida (${sig.reason})`);
    return res.status(401).json({ ok: false, error: "invalid_signature" });
  }

  try {
    const body = req.body || {};
    const query = req.query || {};

    // MP sends the payment id in different places depending on webhook type.
    const paymentId = body?.data?.id || query?.["data.id"] || query?.id;
    if (!paymentId) return res.status(200).json({ ok: true, ignored: true });

    // 2) Fetch the real payment from MP — never trust the body.
    const paymentApi = new Payment(client);
    const payment = await paymentApi.get({ id: String(paymentId) });

    const status = payment?.status; // approved | pending | rejected | ...
    const externalRef = payment?.external_reference; // our orderId
    const paidAmount = Number(payment?.transaction_amount);

    if (!externalRef) return res.status(200).json({ ok: true, ignored: true });

    // 3) Load our order to cross-check.
    const order = await Order.findById(externalRef);
    if (!order) {
      console.warn(`⚠️ Webhook MP: orden ${externalRef} no existe (paymentId=${paymentId})`);
      return res.status(200).json({ ok: true, ignored: true, reason: "order_not_found" });
    }

    // 4) Idempotency — MP retries webhooks; short-circuit if already processed
    //    with THIS paymentId so we don't re-send email or re-fire Purchase.
    if (
      order.paymentStatus === "approved" &&
      order.mpPaymentId &&
      String(order.mpPaymentId) === String(paymentId)
    ) {
      return res.status(200).json({ ok: true, alreadyProcessed: true });
    }

    // 5) For approvals, validate amount + reference before persisting.
    if (status === "approved") {
      const expected = Number(order.totalAmount);
      if (!Number.isFinite(paidAmount) || paidAmount !== expected) {
        console.warn(
          `⚠️ Webhook: monto/referencia no coincide — orden ${externalRef}: expected $${expected} vs MP $${paidAmount} (paymentId=${paymentId})`
        );
        // 200: this webhook is permanently invalid, no reason for MP to retry.
        return res.status(200).json({ ok: true, ignored: true, reason: "amount_mismatch" });
      }
      if (String(externalRef) !== String(order._id)) {
        console.warn(
          `⚠️ Webhook: external_reference no coincide con order._id — ref=${externalRef} order=${order._id}`
        );
        return res.status(200).json({ ok: true, ignored: true, reason: "ref_mismatch" });
      }
    }

    let newStatus = "pending";
    if (status === "approved") newStatus = "approved";
    else if (status === "rejected") newStatus = "rejected";

    // 6) Persist. mpPaymentId is set on approval so future retries hit the
    //    idempotency guard above.
    order.paymentStatus = newStatus;
    if (newStatus === "approved") order.mpPaymentId = String(paymentId);
    await order.save();

    if (newStatus === "approved") {
      try {
        await sendOrderConfirmationEmail(order, { mode: "mercadopago" });
      } catch (emailErr) {
        console.warn("⚠️ No se pudo enviar email de confirmación MP:", emailErr?.message || emailErr);
      }
      // Purchase for MP flows through here. clientIp/userAgent were captured
      // when the order was created, so no ctx needed. Fire-and-forget.
      sendPurchaseEvent(order);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook MP error:", err?.message || err);
    // 500 → MP will retry with backoff. Reserve for real infra failures
    // (MP API down, Mongo unreachable). Deliberate rejections use 200.
    return res.status(500).json({ ok: false });
  }
}

module.exports = { mercadopagoWebhook, verifyMpSignature };
