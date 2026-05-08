// backend/src/scripts/seedCoupons.js
// Crea cupones de prueba en la base de datos.
// Uso: node backend/src/scripts/seedCoupons.js
// No borra los cupones existentes — solo agrega los que no existan.
require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

const TEST_COUPONS = [
  {
    code: 'BIENVENIDO10',
    type: 'percent',
    value: 10,
    minOrderAmount: 0,
    maxUses: null,
    expiresAt: null,
  },
  {
    code: 'DETOX15',
    type: 'percent',
    value: 15,
    minOrderAmount: 45000,
    maxUses: null,
    expiresAt: null,
  },
  {
    code: 'PROMO5000',
    type: 'fixed',
    value: 5000,
    minOrderAmount: 0,
    maxUses: 50,
    expiresAt: null,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Conectado a MongoDB');

  let created = 0;
  let skipped = 0;

  for (const c of TEST_COUPONS) {
    const exists = await Coupon.findOne({ code: c.code });
    if (exists) {
      console.log(`⏭  ${c.code} — ya existe, se omite`);
      skipped++;
    } else {
      await Coupon.create(c);
      console.log(`✅ ${c.code} — creado (${c.type === 'percent' ? c.value + '%' : '$' + c.value})`);
      created++;
    }
  }

  console.log(`\nListo: ${created} creados, ${skipped} omitidos.`);
  console.log('Cupones disponibles para probar en el checkout:');
  TEST_COUPONS.forEach(c => console.log(`  · ${c.code}`));

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
