// backend/src/controllers/orders.controller.js (CommonJS limpio y statuses correctos)

const mongoose = require("mongoose");
const fs = require("fs");

const Order = require("../models/order.js");
const User = require("../models/User");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { uploadPaymentProofFromPath } = require("../services/cloudinaryService.js");

// ✅ según tu Order model (enum)
const allowedPaymentStatuses = ["pending", "proof_uploaded", "approved", "rejected"];
const allowedShippingStatuses = ["pending", "shipped", "delivered"];

/* =============================
   CREATE ORDER
============================= */
async function createOrder(req, res, next) {
    try {
        const {
            clientOrderId,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            shippingMethod,
            items,
            notes,
        } = req.body || {};

        const badReq = (msg) => {
            const err = new Error(msg);
            err.statusCode = 400;
            return err;
        };

        const normalizeStr = (v) => String(v || "").trim();
        const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeStr(email).toLowerCase());
        const toNumber = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : NaN;
        };

        const name = normalizeStr(customerName);
        const email = normalizeStr(customerEmail).toLowerCase();
        const phone = normalizeStr(customerPhone);
        const address = normalizeStr(shippingAddress);
        const shipMethod = normalizeStr(shippingMethod) || "correo_argentino";
        const userNotes = normalizeStr(notes);

        if (!name) throw badReq("Falta customerName.");
        if (!email) throw badReq("Falta customerEmail.");
        if (!isEmailValid(email)) throw badReq("Email inválido.");
        if (!address) throw badReq("Falta shippingAddress.");

        if (!Array.isArray(items) || items.length === 0) throw badReq("El carrito no puede estar vacío.");

        const normalizedItems = items.map((it, idx) => {
            const productId = it?.productId || it?._id || it?.id;
            const itemName = normalizeStr(it?.name || it?.productName || it?.title);
            const qty = toNumber(it?.quantity);
            const price = toNumber(it?.price);

            if (!productId) throw badReq(`Item #${idx + 1}: falta productId.`);
            if (!itemName) throw badReq(`Item #${idx + 1}: falta name.`);
            if (!Number.isFinite(qty) || qty <= 0) throw badReq(`Item #${idx + 1}: quantity inválida.`);
            if (!Number.isFinite(price) || price < 0) throw badReq(`Item #${idx + 1}: price inválido.`);

            return { productId, name: itemName, price, quantity: qty };
        });

        const totalItems = normalizedItems.reduce((acc, it) => acc + it.quantity, 0);
        const totalAmount = normalizedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

        if (!Number.isFinite(totalAmount) || totalAmount <= 0) throw badReq("Total inválido.");

        // Idempotencia
        if (clientOrderId) {
            const existing = await Order.findOne({ clientOrderId });
            if (existing) {
                return res.status(200).json({
                    ok: true,
                    data: {
                        orderId: existing._id,
                        totalItems: existing.totalItems,
                        totalAmount: existing.totalAmount,
                        paymentStatus: existing.paymentStatus,
                        shippingMethod: existing.shippingMethod,
                        duplicated: true,
                    },
                });
            }
        }

        const userId = req.user?.id || req.user?.userId || req.user?._id || req.userId || null;

        const newOrder = await Order.create({
            clientOrderId: clientOrderId || undefined,
            userId: userId || undefined,

            customerName: name,
            customerEmail: email,
            customerPhone: phone || undefined,

            shippingAddress: address,
            shippingMethod: shipMethod,
            shippingStatus: "pending",

            items: normalizedItems,
            totalItems,
            totalAmount,

            paymentMethod: "bank_transfer",
            paymentStatus: "pending",

            notes: userNotes || "",
        });

        try {
            await sendOrderConfirmationEmail(newOrder);
        } catch (e) {
            console.warn("⚠️ No se pudo enviar email de confirmación:", e?.message || e);
        }

        return res.status(201).json({
            ok: true,
            data: {
                orderId: newOrder._id,
                totalItems: newOrder.totalItems,
                totalAmount: newOrder.totalAmount,
                paymentStatus: newOrder.paymentStatus,
                shippingMethod: newOrder.shippingMethod,
                duplicated: false,
            },
        });
    } catch (error) {
        next(error);
    }
}

/* =============================
   GET ORDERS (admin)
============================= */
async function getOrders(req, res, next) {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        return res.json({ ok: true, data: orders });
    } catch (error) {
        next(error);
    }
}

/* =============================
   UPDATE ORDER (admin)
============================= */
async function updateOrderStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { paymentStatus, shippingStatus } = req.body;

        if (paymentStatus === undefined && shippingStatus === undefined) {
            const err = new Error("Debes enviar paymentStatus y/o shippingStatus para actualizar.");
            err.statusCode = 400;
            throw err;
        }

        const updateData = {};

        if (paymentStatus !== undefined) {
            if (!allowedPaymentStatuses.includes(paymentStatus)) {
                const err = new Error(`paymentStatus inválido. Permitidos: ${allowedPaymentStatuses.join(", ")}`);
                err.statusCode = 400;
                throw err;
            }
            updateData.paymentStatus = paymentStatus;
        }

        if (shippingStatus !== undefined) {
            if (!allowedShippingStatuses.includes(shippingStatus)) {
                const err = new Error(`shippingStatus inválido. Permitidos: ${allowedShippingStatuses.join(", ")}`);
                err.statusCode = 400;
                throw err;
            }
            updateData.shippingStatus = shippingStatus;
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedOrder) {
            const err = new Error("Pedido no encontrado.");
            err.statusCode = 404;
            throw err;
        }

        return res.json({ ok: true, data: updatedOrder });
    } catch (error) {
        next(error);
    }
}

/* =============================
   MY ORDERS (user)
============================= */
async function getMyOrders(req, res, next) {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?._id || req.userId;

        if (!userId) {
            const err = new Error("No se pudo identificar al usuario.");
            err.statusCode = 401;
            throw err;
        }

        const user = await User.findById(userId);
        if (!user) {
            const err = new Error("Usuario no encontrado.");
            err.statusCode = 404;
            throw err;
        }

        const orders = await Order.find({ customerEmail: user.email }).sort({ createdAt: -1 });
        return res.json({ ok: true, data: orders });
    } catch (error) {
        next(error);
    }
}

/* =============================
   UPLOAD PAYMENT PROOF (user)
   POST /api/orders/:id/payment-proof
============================= */
async function uploadPaymentProofController(req, res, next) {
    try {
        const { id } = req.params;

        if (!req.file) {
            const err = new Error("No se recibió archivo. Campo esperado: paymentProof");
            err.statusCode = 400;
            throw err;
        }

        const order = await Order.findById(id);
        if (!order) {
            const err = new Error("Pedido no encontrado.");
            err.statusCode = 404;
            throw err;
        }

        // Si ya está aprobado, no permitimos re-subir
        if (order.paymentStatus === "approved") {
            const err = new Error("Este pedido ya fue aprobado. No se puede subir otro comprobante.");
            err.statusCode = 400;
            throw err;
        }

        const localPath = req.file.path;
        const uploaded = await uploadPaymentProofFromPath(localPath);

        order.paymentProofUrl = uploaded.url;
        order.paymentProofPublicId = uploaded.publicId || null;

        order.paymentStatus = "proof_uploaded";
        order.paymentRejectionReason = null;
        order.paymentReviewedAt = null;
        order.paymentReviewedBy = null;

        await order.save();

        // Limpieza local
        try { fs.unlinkSync(localPath); } catch (_) { }

        return res.json({ ok: true, data: order });
    } catch (error) {
        next(error);
    }
}

/* =============================
   VERIFY / APPROVE PROOF (admin)
   PATCH /api/orders/:id/verify
============================= */
async function verifyPaymentProofController(req, res, next) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const err = new Error("ID inválido.");
            err.statusCode = 400;
            throw err;
        }

        const order = await Order.findById(id);
        if (!order) {
            const err = new Error("Pedido no encontrado.");
            err.statusCode = 404;
            throw err;
        }

        if (!order.paymentProofUrl) {
            const err = new Error("El pedido no tiene comprobante subido.");
            err.statusCode = 400;
            throw err;
        }

        // Idempotente
        if (order.paymentStatus === "approved") {
            return res.json({ ok: true, data: order });
        }

        order.paymentStatus = "approved";
        order.paymentRejectionReason = null;
        order.paymentReviewedAt = new Date();
        order.paymentReviewedBy = req.user?.id || req.userId || null;

        await order.save();

        return res.json({ ok: true, data: order });
    } catch (error) {
        next(error);
    }
}

/* =============================
   REJECT PROOF (admin)
   PATCH /api/orders/:id/reject
============================= */
async function rejectPaymentProofController(req, res, next) {
    try {
        const { id } = req.params;
        const reason = String(req.body?.reason || "").trim() || "Comprobante inválido";

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const err = new Error("ID inválido.");
            err.statusCode = 400;
            throw err;
        }

        const order = await Order.findById(id);
        if (!order) {
            const err = new Error("Pedido no encontrado.");
            err.statusCode = 404;
            throw err;
        }

        if (!order.paymentProofUrl) {
            const err = new Error("El pedido no tiene comprobante subido.");
            err.statusCode = 400;
            throw err;
        }

        if (order.paymentStatus === "approved") {
            const err = new Error("El pedido ya está aprobado. No se puede rechazar.");
            err.statusCode = 400;
            throw err;
        }

        order.paymentStatus = "rejected";
        order.paymentRejectionReason = reason;
        order.paymentReviewedAt = new Date();
        order.paymentReviewedBy = req.user?.id || req.userId || null;

        await order.save();

        return res.json({ ok: true, data: order });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createOrder,
    getOrders,
    updateOrderStatus,
    getMyOrders,
    uploadPaymentProofController,
    verifyPaymentProofController,
    rejectPaymentProofController,
};
