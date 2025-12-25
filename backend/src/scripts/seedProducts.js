require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product.js');

async function seedProducts() {

    try{

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB para seed')

    await Product.deleteMany({});
    console.log('🧹 Productos anteriores eliminados')

    const sampleProducts = [{
        name: 'Remera basica negra',
        description: 'remera basica negra unisex 100% algodon',
        price: 8999,
        category: 'remeras',
        images: [],
        variants: [
            { name: 'S', stock: 10 },
            { name: 'M', stock: 18 },
            { name: 'L', stock: 23 },
        ]
    },
    {
        name: 'Pantalón jogger gris',
        description: 'Pantalón jogger cómodo, ideal para uso diario.',
        price: 14999,
        category: 'pantalones',
        images: [],
        variants: [
            { name: 'M', stock: 5 },
            { name: 'L', stock: 7 }
        ]
    },

    {
        name: 'Buzo hoodie oversize',
        description: 'Buzo con capucha oversize, súper abrigado.',
        price: 19999,
        category: 'buzos',
        images: [],
        variants: [
            { name: 'Único', stock: 12 }
        ]
    }
    ];

    await Product.insertMany(sampleProducts)
    console.log('🌱 Productos de prueba insertados correctamente');

    await mongoose.disconnect();
    console.log('👋 Conexión cerrada');
    process.exit(0);
    }catch (error) {
        console.error('❌ Error haciendo seed de productos:', error);
        process.exit(1);
    }
}

seedProducts();
