// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

console.log("intentando conectar con: ", process.env.SMTP_USER); // Para depurar en los logs

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true para 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    // 👇 ESTA ES LA SOLUCIÓN AL TIMEOUT 👇
    // Fuerza a usar IPv4 porque Render a veces falla con IPv6 en Gmail
    family: 4, 
    
    // Opciones extra de red
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000, 
    greetingTimeout: 10000
});

// Verificamos la conexión al iniciar
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Error SMTP DETALLADO:', error);
    } else {
        console.log('✅ Servidor de correos CONECTADO exitosamente.');
    }
});

async function sendOrderConfirmationEmail(order) {
    if (!order.customerEmail) return;

    try {
        const storeName = process.env.STORE_NAME || "BoomHausS";
        const subject = `🥩 Confirmación de pedido #${order._id} - ${storeName}`;

        // ... (Tu código HTML de siempre) ...
        // Para no hacer el código gigante aquí, usa el mismo HTML que tenías antes
        // o copia el del mensaje anterior.
        const htmlContent = `<h1>Gracias por tu compra #${order._id}</h1><p>Total: $${order.totalAmount}</p>`;

        const info = await transporter.sendMail({
            from: `"${storeName}" <${process.env.SMTP_USER}>`,
            to: order.customerEmail,
            subject,
            html: htmlContent
        });

        console.log(`📧 Email enviado: ${info.messageId}`);
        return true;

    } catch (err) {
        console.error('❌ Error enviando email:', err);
        return false;
    }
}

module.exports = {
    sendOrderConfirmationEmail
};