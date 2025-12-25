// backend/src/controllers/auth.controller.js

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// const jwt = require('jsonwebtoken'); // si ya lo usás para login, lo dejás

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
// Crea un nuevo usuario "customer"
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

// PUT /api/auth/make-admin/:id (o como lo tengas)
async function makeAdmin(req, res, next) {
    try {
        // ... tu lógica actual para convertir en admin ...
    } catch (error) {
        next(error);
    }
}

module.exports = {
    login,
    register,
    makeAdmin
};

