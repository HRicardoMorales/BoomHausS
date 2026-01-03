// backend/src/services/emailService.js
const { Resend } = require('resend');

// Inicializamos Resend. Si no hay clave, no explotará el servidor al arrancar.
const resend = process.env.RESEND_API_KEY 
    ? new Resend(process.env.RESEND_API_KEY) 
    : null;

async function sendOrderConfirmationEmail(order) {
    // Si no configuraste la API Key, avisamos y salimos sin romper nada.
    if (!resend) {
        console.error("⚠️ FALTA LA VARIABLE RESEND_API_KEY EN RENDER. El correo no se enviará.");
        return false;
    }

    if (!order.customerEmail) return;

    try {
        const storeName = process.env.STORE_NAME || "BoomHausS";
        
        // HTML de tu correo (simplificado para el ejemplo, puedes pegar el tuyo largo aquí)
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                <h2 style="color: #0B5CFF;">¡Gracias por tu compra en ${storeName}! 🚀</h2>
                <p>Hola <strong>${order.customerName || 'Cliente'}</strong>,</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
                    <h3>📦 Pedido #${order._id}</h3>
                    <p style="font-size: 1.2em; font-weight: bold;">Total a pagar: $${order.totalAmount}</p>
                </div>
                <p>Por favor envía el comprobante de pago por WhatsApp.</p>
            </div>
        `;

        // ENVIAR EL CORREO
        const data = await resend.emails.send({
            // IMPORTANTE: En modo prueba de Resend, SOLO puedes enviar desde este correo:
            from: 'onboarding@resend.dev', 
            // Y SOLO puedes enviar A tu propio correo (el de registro en Resend)
            to: order.customerEmail, 
            subject: `Confirmación de pedido #${order._id} - ${storeName}`,
            html: htmlContent
        });

        if (data.error) {
            console.error('❌ Error de Resend:', data.error);
            return false;
        }

        console.log('✅ Email enviado con éxito. ID:', data.data?.id);
        return true;

    } catch (err) {
        console.error('❌ Error enviando con Resend:', err);
        return false;
    }
}

module.exports = {
    sendOrderConfirmationEmail
};