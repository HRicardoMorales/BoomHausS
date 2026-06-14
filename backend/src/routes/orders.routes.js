// backend/src/routes/orders.routes.js (CommonJS limpio)

const { Router } = require("express");
const router = Router();

const {
  createOrder,
  getOrders,
  updateOrderStatus,
  getMyOrders,
  uploadPaymentProofController,
  verifyPaymentProofController,
  rejectPaymentProofController,
} = require("../controllers/orders.controller");

const { authRequired, adminOnly } = require("../middlewares/authMiddleware");
const { uploadPaymentProof } = require("../middlewares/uploadMiddleware");
const { MercadoPagoConfig, Payment } = require("mercadopago");
const Order = require("../models/order");

/**
 * Público:
 * - Public key de Mercado Pago para inicializar el SDK en el frontend
 */
router.get("/mp-public-key", (req, res) => {
  const publicKey = process.env.MP_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).json({ ok: false, message: "MP_PUBLIC_KEY no configurada en el servidor." });
  }
  res.json({ publicKey });
});

/**
 * Público:
 * - Pago directo con tarjeta via Mercado Pago (token generado por MP.js)
 */
router.post("/card-payment", async (req, res) => {
  try {
    const {
      token,
      paymentMethodId,
      issuerId,
      installments,
      amount,
      email,
      identificationNumber,
      identificationType,
      customerName,
      orderId,
    } = req.body;

    if (!token || !amount) {
      return res.status(400).json({ ok: false, message: "Faltan datos del pago (token o amount)." });
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        token,
        description: "Compra en BoomHausS",
        installments: Number(installments) || 1,
        payment_method_id: paymentMethodId,
        issuer_id: issuerId ? Number(issuerId) : undefined,
        payer: {
          email: email || "comprador@boomhauss.com",
          identification: {
            type: identificationType || "DNI",
            number: String(identificationNumber || ""),
          },
        },
      },
    });

    if (result.status === "approved" && orderId) {
      try {
        await Order.findByIdAndUpdate(orderId, { paymentStatus: "approved" });
      } catch (dbErr) {
        console.warn("No se pudo actualizar el estado del pedido:", dbErr.message);
      }
    }

    res.json({
      ok: true,
      status: result.status,
      statusDetail: result.status_detail,
      paymentId: result.id,
    });
  } catch (err) {
    console.error("MP card payment error:", err);
    res.status(500).json({
      ok: false,
      message: err?.cause?.[0]?.description || err.message || "Error al procesar el pago",
    });
  }
});

/**
 * Público:
 * - Crear orden
 */
router.post("/", createOrder);

/**
 * User:
 * - Mis pedidos
 */
router.get("/my", authRequired, getMyOrders);

/**
 * User:
 * - Subir comprobante (campo: paymentProof)
 */
router.post(
  "/:id/payment-proof",
  authRequired,
  uploadPaymentProof,
  uploadPaymentProofController
);

/**
 * Admin:
 * - Listar pedidos
 */
router.get("/", authRequired, adminOnly, getOrders);

/**
 * Admin:
 * - Actualizar estados (pago/envío)
 */
router.patch("/:id", authRequired, adminOnly, updateOrderStatus);

/**
 * Admin:
 * - Aprobar comprobante
 */
router.patch("/:id/verify", authRequired, adminOnly, verifyPaymentProofController);

/**
 * Admin:
 * - Rechazar comprobante (con reason opcional)
 */
router.patch("/:id/reject", authRequired, adminOnly, rejectPaymentProofController);

module.exports = router;
