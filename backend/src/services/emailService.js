// backend/src/services/emailService.js

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true si usás puerto 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendOrderConfirmationEmail(order) {
    if (!order.customerEmail) {
        console.warn('⚠️ Orden sin email de cliente, no se manda correo');
        return;
    }

    const subject = `Confirmación de pedido #${order._id}`;

    const itemsText = (order.items || [])
        .map((item) => `- ${item.name} x ${item.quantity} ($${item.price} c/u)`)
        .join('\n');

    const text = `
Hola ${order.customerName || ''},

¡Gracias por tu compra en nuestra tienda!

Datos de tu pedido:

Número de pedido: ${order._id}
Total: $${order.totalAmount}
Estado de pago: ${order.paymentStatus}
Método de pago: Transferencia bancaria
Método de envío: ${order.shippingMethod || 'correo_argentino'}
Dirección de envío: ${order.shippingAddress || '—'}

Productos:
${itemsText}

Por favor, realizá la transferencia bancaria a la siguiente cuenta:

Banco: [TU BANCO]
CBU/Alias: [TU CBU O ALIAS]
Titular: [NOMBRE TITULAR]

Una vez realizada la transferencia, envianos el comprobante por WhatsApp o email indicando tu número de pedido.

¡Muchas gracias!
`;

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: order.customerEmail,
            subject,
            text
        });

        console.log(
            `📧 Email de confirmación enviado a ${order.customerEmail} para la orden ${order._id}`
        );
    } catch (err) {
        console.error('❌ Error al enviar email de confirmación:', err);
    }
}

// 👇 IMPORTANTE: exportar como objeto con esa key
module.exports = {
    sendOrderConfirmationEmail
};
