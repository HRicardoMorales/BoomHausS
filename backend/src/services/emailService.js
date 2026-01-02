// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,      // <--- CAMBIO: Puerto estándar alternativo
    secure: false,  // <--- IMPORTANTE: Tiene que ser FALSE para puerto 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    }
});

// Verificación (Misma de antes)
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Error SMTP (Puerto 587):', error.message);
    } else {
        console.log('✅ Conectado a Gmail por puerto 587.');
    }
});

// ... (El resto de la función sendOrderConfirmationEmail igual que antes)
async function sendOrderConfirmationEmail(order) {
    // ... tu código ...
}

module.exports = { sendOrderConfirmationEmail };