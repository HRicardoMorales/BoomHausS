// backend/src/routes/abandonedCarts.routes.js
//
// Dos routers porque la captura pública usa el singular histórico
// (/api/abandoned-cart, lo llama el checkout) y la gestión de admin el plural.

const express = require('express');
const {
  captureAbandonedCart,
  listAbandonedCarts,
  markRecovered,
  reopenCart,
  markContacted,
  deleteAbandonedCart,
} = require('../controllers/abandonedCart.controller');
const { authRequired, adminOnly } = require('../middlewares/authMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');

// POST /api/abandoned-cart — captura silenciosa desde el checkout (sin login)
const captureRouter = express.Router();
captureRouter.post('/', captureAbandonedCart);

// /api/abandoned-carts — todo requiere admin
const adminRouter = express.Router();
adminRouter.use(authRequired, adminOnly);
adminRouter.param('id', validateObjectId('id'));

adminRouter.get('/', listAbandonedCarts);
adminRouter.post('/:id/recover', markRecovered);
adminRouter.post('/:id/reopen', reopenCart);
adminRouter.post('/:id/contacted', markContacted);
adminRouter.delete('/:id', deleteAbandonedCart);

module.exports = { captureRouter, adminRouter };
