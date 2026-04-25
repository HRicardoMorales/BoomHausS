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
                    name: String,
                    stock: { type: Number, default: 0, min: 0 }
                }
            ],
            default: []
        },

        // Bundles/paquetes con precios editables desde el admin
        // Sobreescriben los precios del config de la landing
        bundles: {
            type: [
                {
                    qty:        { type: Number, required: true },
                    price:      { type: Number, required: true },
                    compareAt:  { type: Number, default: 0 },
                    label:      { type: String, default: '' },
                    badge:      { type: String, default: '' },
                    benefit:    { type: String, default: '' },
                    popular:    { type: Boolean, default: false },
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

