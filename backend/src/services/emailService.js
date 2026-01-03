// backend/src/services/emailService.js
const { Resend } = require('resend');

// Inicializamos Resend
const resend = process.env.RESEND_API_KEY 
    ? new Resend(process.env.RESEND_API_KEY) 
    : null;

async function sendOrderConfirmationEmail(order) {
    if (!resend) {
        console.error("⚠️ FALTA LA VARIABLE RESEND_API_KEY. El correo no se enviará.");
        return false;
    }

    if (!order.customerEmail) return;

    try {
        const storeName = "BoomHausS";
        const whatsappNumber = "5491112345678"; // 🔴 CAMBIA ESTO por tu número real

        // 1. Generamos la lista de productos (HTML dinámico)
        // Asumimos que order.items es un array con { title, quantity, price }
        const productsHtml = order.items.map(item => `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding: 10px 0;">
                <span style="color: #e0e0e0;">${item.quantity}x ${item.title || item.name}</span>
                <span style="color: #fff; font-weight: bold;">$${item.price}</span>
            </div>
        `).join('');

        // 2. HTML PROFESIONAL CON ESTILO "DARK PREMIUM"
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #000000; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; color: #ffffff; border-radius: 8px; overflow: hidden; }
                    .header { background-color: #000; padding: 30px; text-align: center; border-bottom: 3px solid #d4af37; }
                    .logo { font-size: 28px; font-weight: bold; color: #fff; letter-spacing: 2px; text-decoration: none; }
                    .content { padding: 40px 30px; }
                    .h1 { color: #d4af37; font-size: 24px; margin-bottom: 10px; text-align: center; }
                    .text { color: #cccccc; line-height: 1.6; font-size: 16px; margin-bottom: 20px; text-align: center; }
                    .order-box { background-color: #252525; padding: 20px; border-radius: 8px; margin: 30px 0; }
                    .total { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #d4af37; font-size: 20px; font-weight: bold; color: #d4af37; }
                    .btn { display: block; width: 80%; margin: 30px auto; padding: 15px; background-color: #25D366; color: white; text-align: center; text-decoration: none; font-weight: bold; border-radius: 50px; font-size: 18px; }
                    .footer { background-color: #111; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <span class="logo">BOOMHAUSS</span>
                    </div>

                    <div class="content">
                        <h1 class="h1">¡Gracias por tu compra, ${order.customerName || 'Cliente'}! 🥩</h1>
                        <p class="text">Hemos recibido tu pedido correctamente. A continuación te dejamos el detalle de tu selección premium.</p>

                        <div class="order-box">
                            <p style="margin-top:0; color:#888; font-size:14px;">Orden #${order._id}</p>
                            
                            ${productsHtml}

                            <div class="total">
                                <span>TOTAL</span>
                                <span>$${order.totalAmount}</span>
                            </div>
                        </div>

                        <div style="text-align: center; margin-top: 40px;">
                            <p class="text">👇 <strong>Para finalizar tu pedido:</strong><br>Envíanos el comprobante de pago o coordina el envío por WhatsApp.</p>
                            
                            <a href="https://wa.me/${whatsappNumber}?text=Hola%20BoomHausS,%20aquí%20mi%20pedido%20#${order._id}" class="btn">
                                📱 Enviar Comprobante
                            </a>
                        </div>
                    </div>

                    <div class="footer">
                        <p>BoomHausS - Carnes Premium</p>
                        <p>Si tienes alguna duda, responde a este correo.</p>
                        <p>© ${new Date().getFullYear()} Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // 3. ENVIAR EL CORREO (Configuración Final)
        const data = await resend.emails.send({
            // ✅ AHORA SÍ: Usamos tu dominio real
            from: 'BoomHausS <pedidos@boomhauss.com.ar>', 
            
            // ✅ Enviamos al cliente real
            to: order.customerEmail, 
            
            subject: `🥩 Confirmación de Pedido #${order._id} - BoomHausS`,
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