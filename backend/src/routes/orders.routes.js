// backend/src/routes/orders.routes.js (CommonJS limpio)

const { Router } = require("express");
const rateLimit = require("express-rate-limit");
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
const { sendPurchaseEvent } = require("../services/metaCapi");

// Rate limiter dedicado para /card-payment: 10 req/hora por IP.
// Card-testing attackers necesitan probar cientos de tarjetas rapidamente;
// 10/hora rompe el ataque sin molestar a un usuario legitimo (que a lo
// sumo reintenta 2-3 veces con distintas tarjetas). El limiter global de
// ordenes (60/10min) sigue aplicando encima.
const cardPaymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Demasiados intentos de pago con tarjeta. Esperá una hora e intentá de nuevo." },
});

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
 * El monto NO se toma del body: sale de order.totalAmount (autoridad = BD).
 * El body solo aporta credenciales del pago (token, payment_method, etc).
 * X-Idempotency-Key = orderId previene doble cobro por doble click: si el
 * usuario dispara el submit dos veces, MP devuelve la misma respuesta cacheada
 * de la primera llamada en vez de generar un segundo cargo.
 */
router.post("/card-payment", cardPaymentLimiter, async (req, res) => {
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

    if (!token) {
      return res.status(400).json({ ok: false, message: "Falta token del pago." });
    }
    if (!orderId) {
      return res.status(400).json({ ok: false, message: "Falta orderId." });
    }

    // Cargar orden autoritativa. Si no existe → 404, si ya fue pagada → 400.
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ ok: false, message: "Orden no encontrada." });
    }
    if (order.paymentStatus !== "pending") {
      return res.status(400).json({
        ok: false,
        message: "Esta orden ya no admite pagos (estado: " + order.paymentStatus + ").",
      });
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: Number(order.totalAmount), // autoridad = BD, no cliente
        token,
        description: "Compra en BoomHausS",
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
      requestOptions: {
        // Doble click = misma request idempotente = MP devuelve el pago
        // original en vez de generar un segundo cargo.
        idempotencyKey: String(order._id),
      },
    });

    if (result.status === "approved") {
      try {
        // Guardamos mpPaymentId igual que en el webhook: si el webhook llega
        // despues para el mismo paymentId, el guard de idempotencia corta.
        order.paymentStatus = "approved";
        order.mpPaymentId = String(result.id);
        await order.save();
        // Purchase for card flows through here. ctx provides ip/userAgent
        // en caso de que la orden se haya creado sin ellos (ej. rows legacy).
        sendPurchaseEvent(order, { ip: req.ip, userAgent: req.headers['user-agent'] });
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
