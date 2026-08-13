// backend/src/models/order.js

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        // Mixed permite tanto ObjectId reales como slugs (productos de fallback)
        productId: { type: mongoose.Schema.Types.Mixed },
        productName: { type: String },
        name: { type: String }, // nombre enriquecido: incluye variante + color + qty
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        imageUrl: { type: String, default: null },
        bundleTotal: { type: Number, default: null },   // precio total del pack (precio real cobrado)
        compareAtPrice: { type: Number, default: null }, // precio tachado (antes de descuento)
        gifts: { type: [String], default: [] },          // regalos incluidos en el pack
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        // ✅ Anti-duplicados (idempotencia)
        clientOrderId: { type: String, unique: true, sparse: true, index: true },

        // opcional: link con user si está logueado
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        customerName: { type: String, required: true },
        customerEmail: { type: String, default: '' },
        // ✅ DNI (se pide en checkout)
        customerDni: { type: String, required: true },
        customerPhone: { type: String },

        shippingAddress: { type: String, required: true },
        shippingMethod: { type: String, default: 'correo_argentino' },
        shippingStatus: {
            type: String,
            enum: ['pending', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },

        items: { type: [orderItemSchema], default: [] },
        totalItems: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },

        paymentMethod: { type: String, default: 'bank_transfer' },
        paymentStatus: {
            type: String,
            enum: ["pending", "proof_uploaded", "approved", "confirmed", "rejected", "cancelled"],
            default: "pending",
        },
        paymentRejectionReason: { type: String, default: null },
        paymentProofUrl: { type: String, default: null },
        paymentProofPublicId: { type: String, default: null }, // opcional (cloudinary)
        paymentReviewedAt: { type: Date, default: null },
        paymentReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        // MP payment id persisted when a webhook approves the order — used by
        // mercadopagoWebhook to short-circuit duplicate webhooks for the same
        // paymentId (MP retries on 5xx and sometimes on 2xx too).
        mpPaymentId: { type: String, default: null, index: true, sparse: true },
        notes: { type: String, default: '' },
        cartCreatedAt: { type: Date, default: null },
        paymentInfoAt: { type: Date, default: null },
        // Meta CAPI — captured at order creation for server-side event tracking
        purchaseEventId:  { type: String, default: null }, // Deterministic "purchase_<orderId>" — shared by browser Pixel and CAPI for dedup
        fbp:              { type: String, default: null }, // _fbp cookie (plain text, not hashed)
        fbc:              { type: String, default: null }, // _fbc cookie (plain text, not hashed)
        clientIp:         { type: String, default: null }, // IP of the request that created the order
        clientUserAgent:  { type: String, default: null }, // User-Agent of that request
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
