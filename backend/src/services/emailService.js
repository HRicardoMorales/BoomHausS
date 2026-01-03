// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

// Configuración para intentar saltar el bloqueo de Render
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,      // CAMBIO: Usamos 587 (STARTTLS)
    secure: false,  // CAMBIO: false para puerto 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    // Opciones de red críticas
    family: 4, // Forzar IPv4
    tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
    },
    // Timeouts cortos para que no cuelgue el servidor si falla
    connectionTimeout: 5000, 
    greetingTimeout: 5000,
    socketTimeout: 5000
});

// ---------------------------------------------------------
// 🚨 IMPORTANTE: HE COMENTADO ESTO PARA QUE TU SERVER ARRANQUE
// Si Render bloquea el puerto, esta verificación impedía que
// tu página web cargara (Error 503).
// ---------------------------------------------------------
/*
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Error SMTP:', error.message);
    } else {
        console.log('✅ Servidor de correos listo.');
    }
});
*/

async function sendOrderConfirmationEmail(order) {
    if (!order.customerEmail) return;

    try {
        const storeName = process.env.STORE_NAME || "BoomHausS";
        
        // HTML simple para probar
        const htmlContent = `
            <div style="font-family: sans-serif; padding: 20px;">
                <h1>¡Gracias por tu compra!</h1>
                <p>Orden: #${order._id}</p>
                <p>Total: $${order.totalAmount}</p>
            </div>
        `;

        const info = await transporter.sendMail({
            from: `"${storeName}" <${process.env.SMTP_USER}>`,
            to: order.customerEmail,
            subject: `Confirmación de pedido #${order._id}`,
            html: htmlContent
        });

        console.log(`📧 Email enviado ID: ${info.messageId}`);
        return true;

    } catch (err) {
        // Aquí capturamos el error sin tumbar el servidor
        console.error('❌ FALLÓ EL ENVÍO DE CORREO:', err.message);
        if (err.code === 'ETIMEDOUT') {
            console.error('⚠️ CAUSA: Render está bloqueando la conexión a Gmail.');
        }
        return false; // Retornamos false pero la orden se sigue guardando
    }
}

module.exports = {
    sendOrderConfirmationEmail
};