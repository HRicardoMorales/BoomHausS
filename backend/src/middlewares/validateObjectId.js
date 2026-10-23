// backend/src/middlewares/validateObjectId.js
//
// Corta con 400 los ids mal formados antes de llegar a Mongoose
// (si no, el CastError termina como 500 genérico).

const mongoose = require('mongoose');

function validateObjectId(param = 'id') {
  return function checkObjectId(req, res, next) {
    if (mongoose.isValidObjectId(req.params[param])) return next();
    return res.status(400).json({ ok: false, message: 'Identificador inválido.' });
  };
}

module.exports = validateObjectId;
