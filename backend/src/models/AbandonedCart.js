const mongoose = require('mongoose');

const AbandonedCartSchema = new mongoose.Schema(
  {
    // Contacto
    email: { type: String, index: true },
    phone: { type: String, index: true },
    name:  { type: String },

    // Dirección de envío (lo que haya capturado)
    address:    { type: String },
    city:       { type: String },
    province:   { type: String },
    postalCode: { type: String },

    // Carrito
    items:       { type: Array, default: [] },
    totalAmount: { type: Number, default: 0 },
    totalItems:  { type: Number, default: 0 },

    // Contexto
    step:          { type: String }, // "cart" | "info" | "shipping" | "payment"
    landingSource: { type: String }, // slug de la landing o URL
    paymentMethod: { type: String }, // "card" | "mercadopago" | null

    // Gestión admin
    recovered:       { type: Boolean, default: false, index: true },
    contactedAt:     { type: Date },
    recoveredAt:     { type: Date },
    adminNotes:      { type: String },

    // TTL: se borra solo a los 45 días de creado
    createdAt: { type: Date, default: Date.now, expires: '45d' },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

module.exports = mongoose.model('AbandonedCart', AbandonedCartSchema);
