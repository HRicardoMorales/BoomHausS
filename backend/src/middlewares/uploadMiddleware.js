// backend/src/middlewares/uploadMiddleware.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');

// aseguramos carpeta uploads/
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext || '.bin';
    const name = `proof_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`;
    cb(null, name);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Formato no permitido. Solo JPG/PNG/WEBP o PDF.'), false);
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 6 * 1024 * 1024 } // 6MB
});

// ✅ Export fijo: middleware listo
const uploadPaymentProof = upload.single('paymentProof');

module.exports = { uploadPaymentProof };
