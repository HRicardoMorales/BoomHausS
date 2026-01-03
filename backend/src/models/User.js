// backend/src/models/User.js

const mongoose = require('mongoose');

// 1) Definimos el esquema del usuario
const userSchema = new mongoose.Schema(
    {
        // Nombre del usuario
        name: {
            type: String,
            required: true,
            trim: true
        },

        // Email del usuario (único)
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // Hash de la contraseña (NUNCA guardamos la contraseña en texto plano)
        passwordHash: {
            type: String,
            required: true
        },

        // Rol del usuario: cliente normal o admin
        role: {
            type: String,
            enum: ['customer', 'admin'],
            default: 'customer'
        },

        // Si la cuenta está activa (en el futuro podemos bloquear usuarios)
        isActive: {
            type: Boolean,
            default: true
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date
    },
    {
        // 2) Opciones del esquema
        timestamps: true // agrega createdAt y updatedAt automáticamente
    }
);

// 3) Creamos el modelo User
const User = mongoose.model('User', userSchema);

// 4) Exportamos el modelo
module.exports = User;
