// backend/src/controllers/products.controller.js
// ✅ CommonJS (require/module.exports). IMPORTANTE: NO usar "export" porque Node
// puede detectar sintaxis ESM y romper con: "require is not defined in ES module scope".

const Product = require('../models/Product');

// GET /api/products/single
async function getSingleProduct(req, res) {
    try {
        const id = process.env.SINGLE_PRODUCT_ID;
        if (!id) {
            return res.status(500).json({ ok: false, message: 'SINGLE_PRODUCT_ID not set' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ ok: false, message: 'Single product not found' });
        }

        return res.json({ ok: true, data: product });
    } catch (err) {
        console.error('getSingleProduct error:', err);
        return res.status(500).json({ ok: false, message: err.message || 'Server error' });
    }
}

// GET /api/products
async function getProducts(req, res, next) {
    try {
        const products = await Product.find({ isActive: true });
        res.json({ ok: true, data: products });
    } catch (error) {
        next(error);
    }
}

// GET /api/products/:id
async function getProductById(req, res, next) {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product || !product.isActive) {
            const err = new Error('Producto no encontrado');
            err.statusCode = 404;
            throw err;
        }

        res.json({ ok: true, data: product });
    } catch (error) {
        next(error);
    }
}

// GET /api/products/all
async function getAllProducts(req, res, next) {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        return res.json({ ok: true, data: products });
    } catch (error) {
        next(error);
    }
}

// POST /api/products
async function createProduct(req, res, next) {
    try {
        const { name, description, price, category } = req.body;

        if (!name || price === undefined) {
            const err = new Error('Nombre y precio son obligatorios.');
            err.statusCode = 400;
            throw err;
        }

        if (price < 0) {
            const err = new Error('El precio no puede ser negativo.');
            err.statusCode = 400;
            throw err;
        }

        const newProductData = {
            name,
            price,
            description: description || '',
            category: category || 'general'
        };

        const newProduct = await Product.create(newProductData);
        return res.status(201).json({ ok: true, data: newProduct });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/products/:id
async function updateProduct(req, res, next) {
    try {
        const { id } = req.params;
        const { name, description, price, category, images, isActive } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            const err = new Error('Producto no encontrado');
            err.statusCode = 404;
            throw err;
        }

        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = price;
        if (category !== undefined) product.category = category;
        if (images !== undefined) product.images = images;
        if (isActive !== undefined) product.isActive = isActive;

        const updatedProduct = await product.save();
        return res.json({ ok: true, data: updatedProduct });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getSingleProduct,
    getProducts,
    getProductById,
    getAllProducts,
    createProduct,
    updateProduct
};
