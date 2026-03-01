// backend/src/services/emailService.js
const { Resend } = require('resend');

// Inicializamos Resend
const resend = process.env.RESEND_API_KEY 
    ? new Resend(process.env.RESEND_API_KEY) 
    : null;

async function sendOrderConfirmationEmail(order, opts = {}) {
    if (!resend) {
        console.error("⚠️ FALTA RESEND_API_KEY. No se envió el correo.");
        return false;
    }

    if (!order.customerEmail) return;

    try {
        const whatsappNumber = process.env.WHATSAPP_NUMBER || "5491112345678";
        const storeName = process.env.STORE_NAME || "BoomHausS";
        const mode = opts?.mode || (order.paymentMethod === "cod" ? "cod" : (order.paymentMethod === "mercadopago" ? "mercadopago" : "transfer"));

        const waBase = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;
        const orderId = order?._id;

        const ctaHtml = (() => {
            if (mode === "cod") {
                const msg = encodeURIComponent(`Hola ${storeName}! 👋 Confirmo el pedido #${orderId}. Estoy para coordinar la entrega (Pago al recibir).`);
                return `
                  <div style="text-align:center; margin-top: 18px;">
                    <p style="color:#0f172a; font-size: 15px; margin: 0;">
                      ✅ <strong>Pagás al recibir (solo CABA)</strong><br/>
                      Te llega en <strong>24 a 48hs hábiles</strong> y abonás en tu puerta.
                    </p>
                    ${waBase ? `<a href="${waBase}?text=${msg}" class="btn">📱 Confirmar por WhatsApp</a>` : ""}
                    <p style="color:#64748b; font-size: 12px; margin-top: 10px;">Te vamos a contactar por WhatsApp / teléfono para coordinar.</p>
                  </div>
                `;
            }

            if (mode === "mercadopago") {
                return `
                  <div style="text-align:center; margin-top: 18px;">
                    <p style="color:#0f172a; font-size: 15px; margin: 0;">
                      🔒 <strong>Pago seguro con Mercado Pago</strong><br/>
                      Si no completaste el pago, volvé a la página y finalizalo para confirmar tu pedido.
                    </p>
                  </div>
                `;
            }

            const msg = encodeURIComponent(`Hola ${storeName}! 👋 Te envío mi comprobante del pedido #${orderId}`);
            return `
              <div style="text-align: center;">
                <p style="color: #555; font-size: 15px;">👇 <strong>Para finalizar y coordinar el envío:</strong><br/>Por favor envianos el comprobante por WhatsApp.</p>
                ${waBase ? `<a href="${waBase}?text=${msg}" class="btn">📱 Enviar comprobante</a>` : ""}
              </div>
            `;
        })();

        // 1. Lista de productos (Diseño limpio y técnico)
        const productsHtml = order.items.map(item => `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 12px 0;">
                <span style="color: #333; font-weight: 500;">
                    <span style="color: #0B5CFF; font-weight: bold;">${item.quantity}x</span> 
                    ${item.title || item.name}
                </span>
                <span style="color: #333; font-weight: bold;">$${item.price}</span>
            </div>
        `).join('');

        // 2. HTML CON TU PALETA DE COLORES (#0B5CFF)
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f6f8; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                    
                    /* TUS COLORES */
                    .header { background-color: #0B5CFF; padding: 35px 20px; text-align: center; }
                    .logo { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 1px; text-transform: uppercase; }
                    
                    .content { padding: 40px 30px; }
                    .h1 { color: #0B5CFF; font-size: 24px; margin-bottom: 10px; text-align: center; font-weight: 700; }
                    .subtitle { color: #666; text-align: center; margin-bottom: 30px; font-size: 16px; }
                    
                    /* CAJA DEL PEDIDO CON COLOR SECONDARY SOFT */
                    .order-box { background-color: #DDF5FF; padding: 25px; border-radius: 12px; border: 1px solid #22C3FF; margin-bottom: 30px; }
                    .order-id { font-size: 13px; color: #0637A5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; font-weight: bold; }
                    
                    .total { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 2px solid #fff; font-size: 20px; font-weight: 800; color: #0B5CFF; }
                    
                    .btn { display: block; width: 80%; margin: 30px auto; padding: 16px; background-color: #25D366; color: white; text-align: center; text-decoration: none; font-weight: bold; border-radius: 50px; font-size: 16px; transition: background 0.3s; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.3); }
                    
                    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
                    .footer a { color: #0B5CFF; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">${storeName}</div>
                    </div>

                    <div class="content">
                        <h1 class="h1">¡Gracias por tu pedido! ✅</h1>
                        <p class="subtitle">Hola <strong>${order.customerName || 'Cliente'}</strong>, acá está el detalle de tu compra.</p>

                        <div class="order-box">
                            <div class="order-id">Orden #${order._id}</div>
                            
                            ${productsHtml}

                            <div class="total">
                                <span>TOTAL</span>
                                <span>$${order.totalAmount}</span>
                            </div>
                        </div>

                        ${ctaHtml}
                    </div>

                    <div class="footer">
                        <p><strong>${storeName}</strong></p>
                        <p>¿Necesitas ayuda? Responde a este correo.</p>
                        <p>© ${new Date().getFullYear()} ${storeName}. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // 3. ENVIAR EL CORREO
        const data = await resend.emails.send({
            from: 'BoomHausS <pedidos@boomhauss.com.ar>', 
            to: order.customerEmail, 
            subject: `✅ Confirmación de Pedido #${order._id} - ${storeName}`,
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
async function sendPasswordResetEmail(email, resetUrl) {
    if (!resend) return false;

    try {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <body style="font-family: 'Segoe UI', sans-serif; background-color: #f4f6f8; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background-color: #0B5CFF; padding: 20px; text-align: center;">
                        <h2 style="color: white; margin: 0;">Restablecer Contraseña 🔐</h2>
                    </div>
                    <div style="padding: 30px; text-align: center;">
                        <p style="color: #666; font-size: 16px;">Hola,</p>
                        <p style="color: #666; font-size: 16px;">Recibimos una solicitud para cambiar tu contraseña en <strong>BoomHausS</strong>.</p>
                        <p style="color: #666;">Haz clic en el botón de abajo para crear una nueva (este enlace expira en 1 hora):</p>
                        
                        <a href="${resetUrl}" style="display: inline-block; background-color: #0B5CFF; color: white; padding: 15px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0;">
                            Cambiar mi Contraseña
                        </a>
                        
                        <p style="font-size: 12px; color: #999;">Si no fuiste tú, ignora este correo.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await resend.emails.send({
            from: 'BoomHausS Security <seguridad@boomhauss.com.ar>',
            to: email,
            subject: '🔐 Recupera tu acceso a BoomHausS',
            html: htmlContent
        });
        return true;
    } catch (error) {
        console.error("Error enviando email password:", error);
        return false;
    }
}

module.exports = {
    sendOrderConfirmationEmail,
    sendPasswordResetEmail
};