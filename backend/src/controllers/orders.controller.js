// backend/src/controllers/orders.controller.js

const mongoose = require("mongoose");
const fs = require("fs");
const Order = require("../models/order.js");
const User = require("../models/User");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { uploadPaymentProofFromPath } = require("../services/cloudinaryService.js");
const { sendPurchaseEvent } = require("../services/metaCapi");
const {
    computeExpectedTotal,
    incrementCouponUsage,
    getEnforcementMode,
} = require("../services/orderPricing");

// Mercado Pago
const { MercadoPagoConfig, Preference } = require("mercadopago");

// Cliente MP (PRODUCCIÓN)
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

const allowedPaymentStatuses = [
    "pending",
    "proof_uploaded",
    "approved",
    "confirmed",
    "rejected",
    "cancelled",
];
const allowedShippingStatuses = ["pending", "shipped", "delivered", "cancelled"];

/* =============================
   CREATE ORDER
============================= */
async function createOrder(req, res, next) {
    try {
        console.log("------------------------------------------------");
        console.log("📥 NUEVA ORDEN RECIBIDA");

        if (!process.env.MP_ACCESS_TOKEN) {
            console.error("❌ ERROR CRÍTICO: No existe MP_ACCESS_TOKEN en el archivo .env");
        }

        const {
            clientOrderId,
            customerName,
            customerEmail,
            customerDni,
            customerPhone,
            shippingAddress,
            shippingMethod,
            items,
            notes,
            paymentMethod,
            total: frontendTotal,
            // Coupon aplicado por el usuario (opcional). Se usa para
            // recalcular el descuento server-side en orderPricing.
            couponCode,
            // Meta CAPI fields — sent by the checkout (CheckoutSheet.jsx / checkout.jsx)
            fbp,
            fbc,
        } = req.body || {};

        const badReq = (msg) => {
            const err = new Error(msg);
            err.statusCode = 400;
            return err;
        };

        const normalizeStr = (v) => String(v || "").trim();
        const isEmailValid = (email) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeStr(email).toLowerCase());
        const toNumber = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : NaN;
        };

        const name = normalizeStr(customerName);
        const email = normalizeStr(customerEmail).toLowerCase();
        const dni = normalizeStr(customerDni);
        const phone = normalizeStr(customerPhone);
        const address = normalizeStr(shippingAddress);
        const shipMethod = normalizeStr(shippingMethod) || "correo_argentino";

        const payMethod = normalizeStr(paymentMethod) || "bank_transfer";
        const userNotes = normalizeStr(notes);

        console.log("💳 Método procesado:", payMethod);

        if (!name) throw badReq("Falta customerName.");
        if (!dni) throw badReq("Falta customerDni.");
        if (email && !isEmailValid(email)) throw badReq("Email inválido.");
        if (!address) throw badReq("Falta shippingAddress.");

        if (!Array.isArray(items) || items.length === 0)
            throw badReq("El carrito no puede estar vacío.");

        const normalizedItems = items.map((it, idx) => {
            const productId = it?.productId || it?._id || it?.id;
            const itemName = normalizeStr(it?.name || it?.productName || it?.title);
            const qty = toNumber(it?.quantity);
            const price = toNumber(it?.price);

            if (!productId) throw badReq(`Item #${idx + 1}: falta productId.`);
            if (!itemName) throw badReq(`Item #${idx + 1}: falta name.`);
            if (!Number.isFinite(qty) || qty <= 0)
                throw badReq(`Item #${idx + 1}: quantity inválida.`);
            if (!Number.isFinite(price) || price < 0)
                throw badReq(`Item #${idx + 1}: price inválido.`);

            const normalized = { productId, name: itemName, price, quantity: qty };

            if (it?.imageUrl) normalized.imageUrl = normalizeStr(it.imageUrl);
            const bundleTotal = toNumber(it?.bundleTotal);
            if (Number.isFinite(bundleTotal) && bundleTotal > 0) normalized.bundleTotal = bundleTotal;
            const compareAtPrice = toNumber(it?.compareAtPrice);
            if (Number.isFinite(compareAtPrice) && compareAtPrice > 0) normalized.compareAtPrice = compareAtPrice;
            if (Array.isArray(it?.gifts) && it.gifts.length > 0) {
                normalized.gifts = it.gifts.filter(g => typeof g === 'string' && g.trim()).map(g => g.trim());
            }

            return normalized;
        });

        const totalItems = normalizedItems.reduce((acc, it) => acc + it.quantity, 0);
        const computedTotal = normalizedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
        const frontendTotalNum = Number(frontendTotal);
        const hasFrontendTotal = Number.isFinite(frontendTotalNum) && frontendTotalNum > 0;

        // ── PRICE_ENFORCEMENT ─────────────────────────────────────────
        // Recalculamos el total desde la BD (Product + Coupon + tabla de
        // envio) sin creerle al cliente. En 'shadow' logueamos las
        // discrepancias pero seguimos cobrando lo que mando el frontend
        // (transicion segura para acumular datos). En 'enforce' el server
        // manda: cualquier intento de bajar el precio queda bloqueado.
        const enforcementMode = getEnforcementMode();
        let expectedTotal = null;
        let priceBreakdown = null;
        let priceDiscrepancies = [];
        try {
            const result = await computeExpectedTotal({
                items: normalizedItems,
                shippingMethod: shipMethod,
                couponCode,
            });
            expectedTotal = result.expectedTotal;
            priceBreakdown = result.breakdown;
            priceDiscrepancies = result.discrepancies || [];

            if (hasFrontendTotal && expectedTotal !== Math.round(frontendTotalNum)) {
                const diff = Math.round(frontendTotalNum) - expectedTotal;
                const sign = diff > 0 ? "+" : "";
                console.warn(
                    `⚠️ DISCREPANCIA precio: frontend $${Math.round(frontendTotalNum)} vs server $${expectedTotal} (diff ${sign}$${diff}) [mode=${enforcementMode}]`,
                    {
                        breakdown: priceBreakdown,
                        discrepancies: priceDiscrepancies,
                        itemDetails: result.itemDetails,
                    }
                );
            } else if (priceDiscrepancies.length) {
                // Match de total pero hay items marcados como discrepancia
                // (ej. bundle_no_match donde el sumatorio compensó). Loguear
                // igual — es señal de datos raros.
                console.warn(
                    `⚠️ DISCREPANCIA items (total OK): server $${expectedTotal}`,
                    { discrepancies: priceDiscrepancies }
                );
            }
        } catch (priceErr) {
            // Nunca romper la orden por un fallo del recalculo. Log y sigue.
            console.error("❌ computeExpectedTotal falló:", priceErr?.message || priceErr);
        }

        const totalAmount = (() => {
            if (enforcementMode === 'enforce' && Number.isFinite(expectedTotal) && expectedTotal > 0) {
                return expectedTotal;
            }
            if (hasFrontendTotal) return Math.round(frontendTotalNum);
            return computedTotal;
        })();

        if (!Number.isFinite(totalAmount) || totalAmount <= 0)
            throw badReq("Total inválido.");

        // Helper: crear preferencia MP (PRODUCCIÓN)
        async function createMpPreference(externalReference) {
            const preference = new Preference(client);
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

            const result = await preference.create({
                body: {
                    items: [
                        {
                            id: "amelor-order",
                            title: "Compra en Amelor",
                            description: "Productos seleccionados en Amelor",
                            quantity: 1,
                            unit_price: Number(totalAmount),
                            currency_id: "ARS",
                            picture_url: process.env.MP_STORE_IMAGE_URL || undefined,
                        }
                    ],
                    payer: { name, email },
                    back_urls: {
                        success: `${frontendUrl}/success-payment`,
                        failure: `${frontendUrl}/success-payment`,
                        pending: `${frontendUrl}/success-payment`,
                    },
                    auto_return: "approved",
                    external_reference: String(externalReference),
                    statement_descriptor: "AMELOR",
                },
            });

            return result;
        }

        // Idempotencia
        if (clientOrderId) {
            const existing = await Order.findOne({ clientOrderId });

            if (existing) {
                console.log("⚠️ Orden duplicada detectada");

                if (payMethod === "mercadopago" || existing.paymentMethod === "mercadopago") {
                    try {
                        console.log("🔁 Regenerando link de Mercado Pago para orden duplicada...");
                        const result = await createMpPreference(existing._id.toString());

                        return res.status(200).json({
                            ok: true,
                            duplicated: true,
                            data: {
                                orderId: existing._id,
                                totalItems: existing.totalItems,
                                totalAmount: existing.totalAmount,
                                paymentStatus: existing.paymentStatus,
                                shippingMethod: existing.shippingMethod,
                            },
                            init_point: result.init_point,
                            sandbox_init_point: result.sandbox_init_point,
                        });
                    } catch (mpError) {
                        console.error("❌ ERROR MERCADO PAGO (duplicada):", mpError);
                        return res.status(500).json({
                            ok: false,
                            error: "No se pudo generar el link de Mercado Pago.",
                        });
                    }
                }

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

        const userId =
            req.user?.id ||
            req.user?.userId ||
            req.user?._id ||
            req.userId ||
            null;

        // 1) Crear orden en BD — incluye campos Meta CAPI
        const newOrder = await Order.create({
            clientOrderId: clientOrderId || undefined,
            userId: userId || undefined,
            customerName: name,
            customerEmail: email,
            customerDni: dni,
            customerPhone: phone || undefined,
            shippingAddress: address,
            shippingMethod: shipMethod,
            shippingStatus: "pending",
            items: normalizedItems,
            totalItems,
            totalAmount,
            paymentMethod: payMethod,
            paymentStatus: "pending",
            notes: userNotes || "",
            couponCode: couponCode ? String(couponCode).trim().toUpperCase() : null,
            // Meta CAPI — stored for server-side Purchase event.
            // purchaseEventId is set right below with the deterministic form
            // "purchase_<orderId>" so both browser Pixel and CAPI dedup on it.
            fbp:             fbp             || null,
            fbc:             fbc             || null,
            clientIp:        req.ip          || null,
            clientUserAgent: req.headers?.['user-agent'] || null,
        });

        // Deterministic purchaseEventId — shared by browser Pixel trackPurchase()
        // and server-side sendPurchaseEvent() so Meta deduplicates the pair.
        newOrder.purchaseEventId = `purchase_${newOrder._id}`;
        await newOrder.save();

        // Coupon.usedCount++ atomico con guard de maxUses + expiresAt.
        // Fire-and-forget: si falla (race, cupon agotado, cupon inactivo),
        // logueamos pero no rompemos la orden — la validacion ya paso en el
        // paso previo del checkout y el costo de una cuenta desviada es
        // menor que rechazar una compra buena.
        if (couponCode) {
            incrementCouponUsage(couponCode)
                .then(updated => {
                    if (!updated) {
                        console.warn(`⚠️ Cupón ${couponCode}: no se incrementó usedCount (agotado, expirado o inactivo)`);
                    }
                })
                .catch(err => {
                    console.warn(`⚠️ Cupón ${couponCode}: error incrementando usedCount:`, err?.message || err);
                });
        }

        // 2) COD — contra entrega (CABA)
        //    Purchase fires HERE, at order creation — same moment as the
        //    browser trackPurchase in CheckoutSheet.handleCodSubmit. Meta's
        //    dedup window is 48h; if we waited for the admin to mark the
        //    order approved (could be days later), the browser and server
        //    events would fall outside the window and Meta would count two
        //    Purchases. Firing here keeps them in sync and also gives us
        //    the freshest ip/UA from the actual customer request.
        if (payMethod === "cod") {
            console.log("💵 Procesando como pago al recibir (COD)...");

            try {
                await sendOrderConfirmationEmail(newOrder, { mode: "cod" });
            } catch (e) {
                console.warn("⚠️ No se pudo enviar email COD:", e?.message || e);
            }

            sendPurchaseEvent(newOrder, { ip: req.ip, userAgent: req.headers?.['user-agent'] });

            return res.status(201).json({
                ok: true,
                data: newOrder,
            });
        }

        // 3) Mercado Pago
        if (payMethod === "mercadopago") {
            console.log("🔄 Entrando a lógica de Mercado Pago...");

            try {
                const result = await createMpPreference(newOrder._id.toString());

                console.log("✅ LINK GENERADO (init_point):", result.init_point);
                console.log("✅ LINK SANDBOX:", result.sandbox_init_point);

                // No InitiateCheckout server-side here: the frontend fires it
                // via trackWithCapi() → /api/track. Purchase for MP fires from
                // mercadopagoWebhook when MP confirms payment approved.

                return res.status(201).json({
                    ok: true,
                    data: newOrder,
                    init_point: result.init_point,
                    sandbox_init_point: result.sandbox_init_point,
                });
            } catch (mpError) {
                console.error("❌ ERROR MERCADO PAGO:", mpError);
                throw new Error("Error interno de Mercado Pago: " + mpError.message);
            }
        }

        // 4) Transferencia bancaria
        console.log("🏦 Procesando como transferencia");
        try {
            await sendOrderConfirmationEmail(newOrder, { mode: "transfer" });
        } catch (e) {
            console.warn("⚠️ No se pudo enviar email:", e?.message || e);
        }
        // No InitiateCheckout server-side here: the frontend fires it via
        // trackWithCapi() → /api/track. Purchase for transfer fires from
        // verifyPaymentProofController when the admin approves the proof.

        return res.status(201).json({
            ok: true,
            data: {
                orderId: newOrder._id,
                totalAmount: newOrder.totalAmount,
                paymentStatus: newOrder.paymentStatus,
                duplicated: false,
            },
        });
    } catch (error) {
        console.error("❌ ERROR EN CREATE ORDER:", error);
        next(error);
    }
}

// === RESTO DE FUNCIONES (Admin/User) ===

async function getOrders(req, res, next) {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        return res.json({ ok: true, data: orders });
    } catch (error) {
        next(error);
    }
}

async function updateOrderStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { paymentStatus, shippingStatus } = req.body;
        const updateData = {};
        if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
        if (shippingStatus !== undefined) updateData.shippingStatus = shippingStatus;

        const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true });

        // No Purchase re-fire here for COD: it was already sent at order
        // creation (see createOrder) to stay within Meta's 48h dedup window
        // against the browser event. Firing again on admin confirmation
        // would count as a second Purchase.

        return res.json({ ok: true, data: updatedOrder });
    } catch (error) {
        next(error);
    }
}

async function getMyOrders(req, res, next) {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?._id || req.userId;
        const user = await User.findById(userId);
        if (!user) throw new Error("Usuario no encontrado.");

        const orders = await Order.find({ customerEmail: user.email }).sort({ createdAt: -1 });
        return res.json({ ok: true, data: orders });
    } catch (error) {
        next(error);
    }
}

async function uploadPaymentProofController(req, res, next) {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) throw new Error("Pedido no encontrado.");

        const localPath = req.file.path;
        const uploaded = await uploadPaymentProofFromPath(localPath);

        order.paymentProofUrl = uploaded.url;
        order.paymentStatus = "proof_uploaded";
        await order.save();

        try {
            fs.unlinkSync(localPath);
        } catch (_) { }

        return res.json({ ok: true, data: order });
    } catch (error) {
        next(error);
    }
}

async function verifyPaymentProofController(req, res, next) {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        order.paymentStatus = "confirmed";
        await order.save();

        // Purchase for bank transfer fires when the admin verifies the proof.
        sendPurchaseEvent(order);

        return res.json({ ok: true, data: order });
    } catch (error) {
        next(error);
    }
}

async function rejectPaymentProofController(req, res, next) {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        order.paymentStatus = "rejected";
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
