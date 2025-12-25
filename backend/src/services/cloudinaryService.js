// backend/src/services/cloudinaryService.js

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

function assertCloudinaryConfigured() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const err = new Error('Cloudinary no está configurado. Faltan env vars CLOUDINARY_*');
    err.statusCode = 500;
    throw err;
  }
}

/**
 * Sube un archivo por PATH (multer diskStorage).
 * resource_type: 'auto' permite pdf o imagen.
 */
async function uploadPaymentProofFromPath(filePath) {
  assertCloudinaryConfigured();

  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'encontratodo/payment_proofs',
    resource_type: 'auto'
  });

  return {
    url: result.secure_url,
    publicId: result.public_id
  };
}

module.exports = {
  uploadPaymentProofFromPath
};
