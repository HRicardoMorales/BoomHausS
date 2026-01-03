// backend/src/controllers/auth.controller.js

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

// POST /api/auth/login
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            const err = new Error('Email y contraseña son obligatorios.');
            err.statusCode = 400;
            throw err;
        }

        const user = await User.findOne({ email });

        if (!user) {
            const err = new Error('Credenciales inválidas.');
            err.statusCode = 401;
            throw err;
        }

        // Soportar tanto passwordHash (modelo actual) como password (por si quedó algo viejo)
        const hash = user.passwordHash || user.password || '';

        const isValid = await bcrypt.compare(password, hash);

        if (!isValid) {
            const err = new Error('Credenciales inválidas.');
            err.statusCode = 401;
            throw err;
        }

        const payload = {
            id: user._id,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        const userSafe = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };

        return res.json({
            ok: true,
            data: {
                token,
                user: userSafe
            }
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/auth/register
async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            const err = new Error('Nombre, email y contraseña son obligatorios.');
            err.statusCode = 400;
            throw err;
        }

        if (password.length < 6) {
            const err = new Error('La contraseña debe tener al menos 6 caracteres.');
            err.statusCode = 400;
            throw err;
        }

        const existing = await User.findOne({ email });

        if (existing) {
            const err = new Error('Ya existe un usuario registrado con ese email.');
            err.statusCode = 409;
            throw err;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            passwordHash: hashedPassword,
            role: 'customer'
        });

        const userSafe = {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt
        };

        return res.status(201).json({
            ok: true,
            data: userSafe
        });
    } catch (error) {
        next(error);
    }
}

// PUT /api/auth/make-admin/:id
async function makeAdmin(req, res, next) {
    try {
        // Tu lógica actual para convertir en admin (o dejar vacío si no se usa aun)
        res.json({ message: "Función makeAdmin (pendiente de implementar)" });
    } catch (error) {
        next(error);
    }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No existe cuenta con ese email" });
        }

        // Generar token aleatorio
        const token = crypto.randomBytes(20).toString('hex');

        // Guardar token y expiración (1 hora = 3600000 ms)
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        // Crear link. IMPORTANTE: Esto debe apuntar a tu Frontend
        const frontendUrl = process.env.FRONTEND_URL || "https://boomhauss.com.ar";
        const resetUrl = `${frontendUrl}/reset-password/${token}`;

        // Enviar email
        await sendPasswordResetEmail(user.email, resetUrl);

        res.json({ message: "Correo de recuperación enviado" });

    } catch (error) {
        next(error);
    }
}

// POST /api/auth/reset-password/:token
async function resetPassword(req, res, next) {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Buscar usuario por token y verificar que no haya expirado
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // $gt = Mayor que ahora
        });

        if (!user) {
            return res.status(400).json({ message: "El token es inválido o ha expirado" });
        }

        // 🟢 IMPORTANTE: Encriptar la contraseña antes de guardar
        // Usamos la misma lógica que en Register para mantener consistencia
        const hashedPassword = await bcrypt.hash(password, 10);
        user.passwordHash = hashedPassword;
        
        // Limpiar el token usado
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: "Contraseña actualizada correctamente" });

    } catch (error) {
        next(error);
    }
}

// ✅ AQUÍ ESTABA EL ERROR: Faltaba exportar las funciones nuevas
module.exports = {
    login,
    register,
    makeAdmin,
    forgotPassword,
    resetPassword
};