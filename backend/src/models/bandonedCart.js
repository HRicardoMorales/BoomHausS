const mongoose = require('mongoose');

const AbandonedCartSchema = new mongoose.Schema({
  email: { type: String, index: true }, // Indexado para buscar rápido
  phone: { type: String, index: true },
  name: String,
  items: Array, // Guardamos qué productos tenía
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now, expires: '30d' }, // Se borra solo a los 30 días
  recovered: { type: Boolean, default: false } // Para marcar si luego compró
});

module.exports = mongoose.model('AbandonedCart', AbandonedCartSchema);