// backend/src/scripts/seedMundial.js
// ─────────────────────────────────────────────────────────────
// Inserta los 8 productos de la landing B2B "mundial-revendedores".
// Usa upsert por slug, así que es idempotente: lo podés correr
// las veces que quieras sin duplicar.
//
// Uso:
//   node src/scripts/seedMundial.js
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product.js');

const BLUE = 'https://placehold.co/600x600/1B4D7E/FFFFFF/png?text=';

const mundialProducts = [
  {
    slug: 'kit-revendedor-mundial',
    name: 'Kit Completo Revendedor — Mundial Argentina',
    description:
      'Kit B2B completo con los 7 productos del mundial Argentina (10 unidades de cada uno) + REGALO: 10 pulseras y 10 banderas extra. Margen del ~103% sobre tu inversión.',
    price: 215900,
    compareAtPrice: 302260,
    category: 'mundial-revendedores',
    images: [BLUE + 'KIT+COMPLETO'],
    variants: [{ name: 'Kit x70 + 20 regalo', stock: 50 }],
  },
  {
    slug: 'bandera-auto-x10',
    name: 'Bandera para Auto Argentina (Pack x10)',
    description:
      'Pack mayorista de 10 banderas Argentina para colgar en la ventanilla del auto. Tela liviana, colores vivos.',
    price: 14000,
    compareAtPrice: 19600,
    category: 'mundial-revendedores',
    images: [BLUE + 'BANDERA+AUTO'],
    variants: [{ name: 'Pack x10', stock: 200 }],
  },
  {
    slug: 'corneta-x10',
    name: 'Corneta Argentina 16cm (Pack x10)',
    description:
      'Pack mayorista de 10 cornetas plásticas de 16cm en celeste y blanco. Sonido fuerte, ideal para alentar.',
    price: 16500,
    compareAtPrice: 23100,
    category: 'mundial-revendedores',
    images: [BLUE + 'CORNETA+16cm'],
    variants: [{ name: 'Pack x10', stock: 200 }],
  },
  {
    slug: 'gorro-3-pelotas-x10',
    name: 'Gorro 3 Pelotas Argentina (Pack x10)',
    description:
      'Pack mayorista de 10 gorros divertidos con 3 pelotas de fútbol arriba, en colores Argentina. Súper llamativo, alta rotación.',
    price: 68900,
    compareAtPrice: 96460,
    category: 'mundial-revendedores',
    images: [BLUE + 'GORRO+3+PELOTAS'],
    variants: [{ name: 'Pack x10', stock: 100 }],
  },
  {
    slug: 'gorro-arlequin-x10',
    name: 'Gorro Arlequín Argentina (Pack x10)',
    description:
      'Pack mayorista de 10 gorros arlequín en celeste y blanco. Tela suave, ajuste universal.',
    price: 58900,
    compareAtPrice: 82460,
    category: 'mundial-revendedores',
    images: [BLUE + 'GORRO+ARLEQUIN'],
    variants: [{ name: 'Pack x10', stock: 100 }],
  },
  {
    slug: 'inflables-x10',
    name: 'Inflables Argentina 2 Piezas (Pack x10)',
    description:
      'Pack mayorista de 10 sets de inflables (mano + martillo) en colores Argentina. Plástico resistente.',
    price: 13800,
    compareAtPrice: 19320,
    category: 'mundial-revendedores',
    images: [BLUE + 'INFLABLES'],
    variants: [{ name: 'Pack x10 sets', stock: 200 }],
  },
  {
    slug: 'peluca-afro-x10',
    name: 'Peluca Afro Argentina (Pack x10)',
    description:
      'Pack mayorista de 10 pelucas afro celeste y blancas, fibra suave, talle universal. Un clásico que nunca falla.',
    price: 36800,
    compareAtPrice: 51520,
    category: 'mundial-revendedores',
    images: [BLUE + 'PELUCA+AFRO'],
    variants: [{ name: 'Pack x10', stock: 150 }],
  },
  {
    slug: 'pulseras-silicon-x10',
    name: 'Pulseras Silicon Argentina (Pack x10)',
    description:
      'Pack mayorista de 10 pulseras de silicona Argentina. Liviano, regalable, alta rotación a salida de canchas.',
    price: 7000,
    compareAtPrice: 9800,
    category: 'mundial-revendedores',
    images: [BLUE + 'PULSERAS'],
    variants: [{ name: 'Pack x10', stock: 300 }],
  },
];

async function seedMundial() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ Falta MONGO_URI en el .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB para seed Mundial');

    let created = 0;
    let updated = 0;

    for (const p of mundialProducts) {
      const existing = await Product.findOne({ slug: p.slug });
      if (existing) {
        await Product.updateOne(
          { slug: p.slug },
          {
            $set: {
              name: p.name,
              description: p.description,
              price: p.price,
              compareAtPrice: p.compareAtPrice,
              category: p.category,
              images: p.images,
              variants: p.variants,
              isActive: true,
            },
          }
        );
        updated++;
        console.log(`🔄 Actualizado: ${p.slug}`);
      } else {
        await Product.create({ ...p, isActive: true });
        created++;
        console.log(`🌱 Creado: ${p.slug}`);
      }
    }

    console.log(`\n🎉 Seed Mundial OK — creados: ${created}, actualizados: ${updated}`);

    await mongoose.disconnect();
    console.log('👋 Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error haciendo seed de productos Mundial:', error);
    process.exit(1);
  }
}

seedMundial();
