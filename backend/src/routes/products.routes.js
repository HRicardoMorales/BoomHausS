// backend/src/routes/products.routes.js

const { Router } = require('express');
const {
    getSingleProduct,
    getProducts,
    getProductById,
    getAllProducts,
    createProduct,
    updateProduct
} = require('../controllers/products.controller');

const { authRequired, adminRequired } = require('../middlewares/authMiddleware');

const router = Router();

// ✅ Producto único (público)
router.get('/single', getSingleProduct);

// GET /api/products (público)
router.get('/', getProducts);

// GET /api/products/all (admin)
router.get('/all', authRequired, adminRequired, getAllProducts);

// POST /api/products (admin)
router.post('/', authRequired, adminRequired, createProduct);

// PATCH /api/products/:id (admin)
router.patch('/:id', authRequired, adminRequired, updateProduct);

// GET /api/products/:id (público)
router.get('/:id', getProductById);

module.exports = router;
