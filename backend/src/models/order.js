// backend/src/models/order.js

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String },
        name: { type: String }, // compat
        price: { type: Number, required: true },
        quantity: { type: Number, required: true }
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
        customerEmail: { type: String, required: true },
        customerPhone: { type: String },

        shippingAddress: { type: String, required: true },
        shippingMethod: { type: String, default: 'correo_argentino' },
        shippingStatus: {
            type: String,
            enum: ['pending', 'shipped', 'delivered'],
            default: 'pending'
        },

        items: { type: [orderItemSchema], default: [] },
        totalItems: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },

        paymentMethod: { type: String, default: 'bank_transfer' },
        paymentStatus: {
            type: String,
            enum: ["pending", "proof_uploaded", "approved", "rejected"],
            default: "pending",
        },
        paymentRejectionReason: { type: String, default: null },
        paymentProofUrl: { type: String, default: null },
        paymentProofPublicId: { type: String, default: null }, // opcional (cloudinary)
        paymentReviewedAt: { type: Date, default: null },
        paymentReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        paymentRejectionReason: { type: String, default: null },
        notes: { type: String, default: '' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
