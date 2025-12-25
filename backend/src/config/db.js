// backend/src/config/db.js
const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        // Si falla la conexión, cerramos la app con código 1 (error)
        process.exit(1);
    }
}

module.exports = connectDB;
