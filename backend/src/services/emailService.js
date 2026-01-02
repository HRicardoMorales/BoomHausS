// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

// Configuración del transporte
// Usamos las variables de entorno para flexibilidad, con valores por defecto seguros para Gmail
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465, // Aseguramos que sea número
    secure: process.env.SMTP_SECURE === 'true',   // Convertimos string 'true' a booleano true
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    // Opciones adicionales para evitar timeouts en redes restrictivas como Render
    tls: {
        rejectUnauthorized: false // Acepta certificados auto-firmados si fuera necesario
    },
    // Aumentar timeouts por si la red está lenta
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// Verificamos la conexión al iniciar el servidor
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Error de conexión SMTP (Correos):', error.message);
        // No mates el proceso, solo avisa
    } else {
        console.log('✅ Servidor de correos listo para enviar mensajes.');
    }
});

async function sendOrderConfirmationEmail(order) {
    if (!order.customerEmail) {
        console.warn('⚠️ Orden sin email de cliente, no se manda correo');
        return;
    }

    try {
        const storeName = process.env.STORE_NAME || "BoomHausS"; // Usar nombre dinámico si quieres
        const subject = `🥩 Confirmación de pedido #${order._id} - ${storeName}`;

        // Formato de lista de productos para HTML
        const itemsHtml = (order.items || [])
            .map(item => `<li><strong>${item.name}</strong> x ${item.quantity} - $${item.price} c/u</li>`)
            .join('');

        // Datos bancarios
        const bankInfo = {
            bank: process.env.BANK_NAME || 'TU BANCO',
            alias: process.env.BANK_ALIAS || 'TU.ALIAS.BANCARIO',
            cbu: process.env.BANK_CBU || '000000000000000000',
            holder: process.env.BANK_HOLDER || 'Nombre del Titular'
        };

        // Cuerpo del correo en HTML
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                <h2 style="color: #0B5CFF; text-align: center;">¡Gracias por tu compra en ${storeName}! 🚀</h2>
                
                <p>Hola <strong>${order.customerName || 'Cliente'}</strong>,</p>
                <p>Hemos recibido tu pedido correctamente. A continuación te dejamos los detalles:</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">📦 Resumen del Pedido #${order._id}</h3>
                    <ul>${itemsHtml}</ul>
                    <hr style="border: 0; border-top: 1px solid #ddd;">
                    <p style="font-size: 1.2em; font-weight: bold; text-align: right;">Total: $${order.totalAmount}</p>
                </div>

                <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 5px solid #2196F3;">
                    <h3 style="margin-top: 0; color: #0d47a1;">🏦 Datos para la Transferencia</h3>
                    <p>Por favor, realizá el pago a la siguiente cuenta:</p>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Banco:</strong> ${bankInfo.bank}</li>
                        <li><strong>Alias:</strong> ${bankInfo.alias}</li>
                        <li><strong>CBU:</strong> ${bankInfo.cbu}</li>
                        <li><strong>Titular:</strong> ${bankInfo.holder}</li>
                    </ul>
                    <p><em>Cuando termines, enviá el comprobante por WhatsApp.</em></p>
                </div>

                <p style="margin-top: 30px; text-align: center; color: #777; font-size: 12px;">
                    ${storeName}<br>
                    Si tienes dudas, contáctanos por WhatsApp.
                </p>
            </div>
        `;

        await transporter.sendMail({
            from: `"${storeName}" <${process.env.SMTP_USER}>`,
            to: order.customerEmail,
            subject,
            html: htmlContent
        });

        console.log(`📧 Email enviado a ${order.customerEmail} (Orden ${order._id})`);
        return true;

    } catch (err) {
        console.error('❌ Error CRÍTICO enviando email:', err);
        return false;
    }
}

module.exports = {
    sendOrderConfirmationEmail
};