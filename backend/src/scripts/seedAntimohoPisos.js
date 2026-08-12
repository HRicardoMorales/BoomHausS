// backend/src/scripts/seedAntimohoPisos.js
// ─────────────────────────────────────────────────────────────
// Da de alta (o actualiza) el producto de la landing "Anti-Moho PRO"
// (/lp/antimoho-pisos) con los valores PLACEHOLDER definidos en
// frontend/src/landings/AntimohoPisos/AntimohoPisos.jsx.
// Upsert por slug: podés correrlo las veces que quieras sin duplicar.
//
// ⚠️ No se pudo insertar directo a Mongo Atlas desde el entorno de Claude
// (sin salida de red a ese host) — por eso este script, para correrlo
// vos localmente donde el backend sí tiene conexión.
//
// Uso (desde la carpeta backend/):
//   node src/scripts/seedAntimohoPisos.js
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product.js');

// Imagen placeholder (mismo servicio que ya usa seedMundial.js) —
// reemplazar por fotos reales del producto cuando las tengas.
const PLACEHOLDER_IMG = 'https://placehold.co/600x600/0E2747/FFFFFF/png?text=Anti-Moho+PRO';

const antimohoProduct = {
  slug: 'antimoho-pisos',
  name: 'Anti-Moho PRO — Kit para Pisos y Juntas',
  description:
    'Removedor de moho y suciedad incrustada para juntas y pisos de cerámica/porcelanato. ' +
    'Fórmula de doble acción, sin cloro ni ácido clorhídrico. Incluye cepillo para limpiar de pie. ' +
    '[PLACEHOLDER — editar descripción, precios y fotos reales antes de publicar]',
  price: 24990,          // bundle "2 Botellas + Cepillo" (más elegido) — PLACEHOLDER
  compareAtPrice: 31980, // PLACEHOLDER
  category: 'hogar',
  images: [PLACEHOLDER_IMG],
  bundles: [
    { qty: 1, price: 13990, compareAt: 15990, label: '1 Botella + Cepillo',        badge: '',             popular: false },
    { qty: 2, price: 24990, compareAt: 31980, label: '2 Botellas + Cepillo',        badge: 'MÁS ELEGIDO',  popular: true  },
    { qty: 3, price: 34990, compareAt: 47970, label: '3 Botellas + Cepillo doble',  badge: 'MAYOR AHORRO', popular: false },
  ],
};

async function seedAntimoho() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ Falta MONGO_URI en el .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB para seed Anti-Moho PRO');

    const existing = await Product.findOne({ slug: antimohoProduct.slug });
    if (existing) {
      await Product.updateOne(
        { slug: antimohoProduct.slug },
        {
          $set: {
            name: antimohoProduct.name,
            description: antimohoProduct.description,
            price: antimohoProduct.price,
            compareAtPrice: antimohoProduct.compareAtPrice,
            category: antimohoProduct.category,
            images: antimohoProduct.images,
            bundles: antimohoProduct.bundles,
            isActive: true,
          },
        }
      );
      console.log(`🔄 Actualizado: ${antimohoProduct.slug}`);
    } else {
      await Product.create({ ...antimohoProduct, isActive: true });
      console.log(`🌱 Creado: ${antimohoProduct.slug}`);
    }

    console.log('\n🎉 Seed Anti-Moho PRO OK — revisalo en /admin/products y editá precios/fotos reales.');

    await mongoose.disconnect();
    console.log('👋 Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error haciendo seed de Anti-Moho PRO:', error);
    process.exit(1);
  }
}

seedAntimoho();
