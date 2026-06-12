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
 *
 * El monto a cobrar SIEMPRE se toma de la orden ya creada en BD
 * (Order.totalAmount, que fue validado server-side al crearse la orden).
 * Nunca se acepta `amount` desde el body — ese campo es ignorado.
 */
router.post("/card-payment", async (req, res) => {
  try {
    const {
      token,
      paymentMethodId,
      issuerId,
      installments,
      email,
      identificationNumber,
      identificationType,
      orderId,
    } = req.body;

    if (!token || !orderId) {
      return res.status(400).json({
        ok: false,
        message: "Faltan datos del pago (token u orderId).",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ ok: false, message: "Orden no encontrada." });
    }

    // Evitar doble cobro: si ya está aprobada/confirmada/cancelada, no procesamos
    if (order.paymentStatus === "approved" || order.paymentStatus === "confirmed") {
      return res.status(400).json({
        ok: false,
        message: "Esta orden ya tiene un pago aprobado.",
      });
    }
    if (order.paymentStatus === "cancelled") {
      return res.status(400).json({
        ok: false,
        message: "Esta orden fue cancelada.",
      });
    }

    const amount = Number(order.totalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        ok: false,
        message: "La orden no tiene un monto válido.",
      });
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: amount,
        token,
        description: "Compra en Amelor",
        installments: Number(installments) || 1,
        payment_method_id: paymentMethodId,
        issuer_id: issuerId ? Number(issuerId) : undefined,
        external_reference: String(order._id),
        payer: {
          email: email || order.customerEmail || "comprador@boomhauss.com",
          identification: {
            type: identificationType || "DNI",
            number: String(identificationNumber || order.customerDni || ""),
          },
        },
      },
    });

    if (result.status === "approved") {
      try {
        await Order.findByIdAndUpdate(order._id, { paymentStatus: "approved" });
      } catch (dbErr) {
        console.warn("No se pudo actualizar el estado del pedido:", dbErr.message);
      }
    }

    res.json({
      ok: true,
      status: result.status,
      statusDetail: result.status_detail,
      paymentId: result.id,
      amount, // devolvemos el monto real que se cobró (no el que mandó el FE)
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
