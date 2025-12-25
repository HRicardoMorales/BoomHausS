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
