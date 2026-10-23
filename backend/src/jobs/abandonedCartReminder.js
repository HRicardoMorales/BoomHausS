// backend/src/jobs/abandonedCartReminder.js
//
// Mail de recuperación de carrito abandonado, disparado por cron.
//
// Reglas:
// - Solo carritos con email, no recuperados y sin recordatorio previo
//   (reminderSentAt vacío), abandonados hace entre MIN_AGE y MAX_AGE.
// - Si esa persona ya hizo un pedido después de abandonar el carrito, no se
//   manda nada y el carrito queda marcado como recuperado.
// - El carrito se "reserva" con un findOneAndUpdate condicional antes de
//   mandar, así dos instancias del backend no mandan el mismo mail dos veces.
//
// Apagado por defecto: se activa con ABANDONED_CART_EMAILS=true (además hace
// falta RESEND_API_KEY para que emailService mande algo).

const mongoose = require('mongoose');
const cron = require('node-cron');
const AbandonedCart = require('../models/AbandonedCart');
const Order = require('../models/order');
const { sendAbandonedCartEmail } = require('../services/emailService');
const logger = require('../utils/logger').child('abandoned-cart-job');

const HOUR = 60 * 60 * 1000;
const MIN_AGE_MS = 2 * HOUR;   // no molestar a quien sigue comprando
const MAX_AGE_MS = 48 * HOUR;  // después de 2 días ya no tiene sentido
const BATCH_SIZE = 25;
const SCHEDULE = '*/30 * * * *'; // cada 30 minutos

// Filtro de Mongo para los carritos que corresponde recordar (puro, testeable).
function reminderQuery(now = new Date()) {
  const t = now.getTime();
  return {
    email: { $exists: true, $nin: [null, ''] },
    recovered: { $ne: true },
    reminderSentAt: null,
    updatedAt: { $lte: new Date(t - MIN_AGE_MS), $gte: new Date(t - MAX_AGE_MS) },
  };
}

async function hasOrderedSince(email, since, OrderModel = Order) {
  const order = await OrderModel.findOne({
    customerEmail: email,
    createdAt: { $gte: since },
  }).select('_id').lean();
  return Boolean(order);
}

async function runAbandonedCartReminders({
  now = new Date(),
  CartModel = AbandonedCart,
  OrderModel = Order,
  send = sendAbandonedCartEmail,
} = {}) {
  const result = { checked: 0, sent: 0, skippedOrdered: 0, failed: 0 };
  const candidates = await CartModel.find(reminderQuery(now))
    .sort({ updatedAt: 1 })
    .limit(BATCH_SIZE)
    .select('_id')
    .lean();

  for (const { _id } of candidates) {
    // Reserva atómica: solo sigue quien logra marcar reminderSentAt.
    const cart = await CartModel.findOneAndUpdate(
      { _id, reminderSentAt: null },
      { $set: { reminderSentAt: now } },
      { new: true }
    ).lean();
    if (!cart) continue;
    result.checked += 1;

    if (await hasOrderedSince(cart.email, cart.updatedAt || cart.createdAt, OrderModel)) {
      await CartModel.updateOne({ _id }, { $set: { recovered: true, recoveredAt: now } });
      result.skippedOrdered += 1;
      continue;
    }

    const ok = await send(cart);
    if (ok) {
      result.sent += 1;
    } else {
      // No se pudo mandar (sin Resend o error): liberar para el próximo ciclo.
      await CartModel.updateOne({ _id }, { $set: { reminderSentAt: null } });
      result.failed += 1;
    }
  }
  return result;
}

function startAbandonedCartReminderJob() {
  if (process.env.ABANDONED_CART_EMAILS !== 'true') {
    logger.info('Recordatorios de carrito abandonado apagados (ABANDONED_CART_EMAILS != true)');
    return null;
  }
  const task = cron.schedule(SCHEDULE, async () => {
    if (mongoose.connection.readyState !== 1) return; // sin base, no hay nada que hacer
    try {
      const r = await runAbandonedCartReminders();
      if (r.checked) logger.info('Recordatorios de carrito abandonado', r);
    } catch (err) {
      logger.error('Falló el job de carritos abandonados', err);
    }
  });
  logger.info('Recordatorios de carrito abandonado activos', { schedule: SCHEDULE });
  return task;
}

module.exports = {
  reminderQuery,
  runAbandonedCartReminders,
  startAbandonedCartReminderJob,
  MIN_AGE_MS,
  MAX_AGE_MS,
};
