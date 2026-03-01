// backend/src/models/Product.js

const mongoose = require('mongoose');

// Definimos el esquema del producto
const productSchema = new mongoose.Schema(
    {
        // Nombre del producto
        name: {
            type: String,
            required: true,
            trim: true
        },

        // ✅ Slug público para Landing Pages (ej: "porta-cepillos", "consola-retro")
        slug: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
            trim: true
        },

        // Descripción
        description: {
            type: String,
            default: ''
        },

        // Precio (ARS)
        price: {
            type: Number,
            required: true,
            min: 0
        },

        // ✅ Precio "ANTES" (opcional) para mostrar descuento en la landing
        compareAtPrice: {
            type: Number,
            default: 0,
            min: 0
        },

        // Categoría (ej: "remeras", "pantalones")
        category: {
            type: String,
            default: 'general',
            index: true
        },

        // URLs de imágenes
        images: {
            type: [String],
            default: []
        },

        // Variantes (por ejemplo talles, colores) con su stock
        variants: {
            type: [
                {
                    name: String, // ej: "S", "M", "Negro"
                    stock: {
                        type: Number,
                        default: 0,
                        min: 0
                    }
                }
            ],
            default: []
        },

        // Si está activo en el catálogo o no
        isActive: {
            type: Boolean,
            default: true
        } 
    },
    {
        // Agrega createdAt y updatedAt automáticamente
        timestamps: true
    }
);

// Creamos el modelo Product
const Product = mongoose.model('Product', productSchema);

// 👇 ESTA LÍNEA ES CLAVE
module.exports = Product;

