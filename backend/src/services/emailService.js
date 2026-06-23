// backend/src/services/emailService.js
const { Resend } = require('resend');
const nodemailer = require('nodemailer');

// Primario: Resend. Fallback: SMTP (Gmail u otro).
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const smtpTransport = (!resend && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    : null;

async function sendEmail({ from, to, subject, html }) {
    if (resend) {
        const result = await resend.emails.send({ from, to, subject, html });
        if (result.error) throw new Error(JSON.stringify(result.error));
        console.log('✅ Email enviado via Resend. ID:', result.data?.id);
        return;
    }
    if (smtpTransport) {
        const info = await smtpTransport.sendMail({
            from: process.env.SMTP_FROM || from,
            to,
            subject,
            html,
        });
        console.log('✅ Email enviado via SMTP. ID:', info.messageId);
        return;
    }
    throw new Error('Sin proveedor de email: configurá RESEND_API_KEY o SMTP_HOST/USER/PASS en .env');
}

async function sendOrderConfirmationEmail(order, opts = {}) {
    if (!resend && !smtpTransport) {
        console.error("⚠️ Sin proveedor de email. Configurá RESEND_API_KEY o SMTP_* en .env");
        return false;
    }

    if (!order.customerEmail) return;

    try {
        const whatsappNumber = process.env.WHATSAPP_NUMBER || "";
        const storeName = process.env.STORE_NAME || "Amelor";
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

        // 1. Número de seguimiento (condicional)
        const trackingHtml = order.trackingNumber ? `
          <div style="margin-top:16px;padding:12px;background:#ecfdf5;border-radius:8px;border:1px solid #bbf7d0;">
            <p style="margin:0;color:#065f46;font-weight:700;font-size:14px;">
              📦 Número de seguimiento: <strong>${order.trackingNumber}</strong>
            </p>
          </div>` : '';

        const productsHtml = order.items.map(item => `
            <div class="product-row">
                <span><span class="product-qty">${item.quantity}x</span><span class="product-name">${item.title || item.name}</span></span>
                <span class="product-price">${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(item.price || 0)}</span>
            </div>
        `).join('');

        const totalFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(order.totalAmount || 0);

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                    .header { background-color: #8B1A4A; padding: 32px 20px; text-align: center; }
                    .logo { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
                    .content { padding: 36px 28px; }
                    .h1 { color: #1a1a2e; font-size: 22px; margin: 0 0 8px; text-align: center; font-weight: 800; }
                    .subtitle { color: #555; text-align: center; margin: 0 0 28px; font-size: 15px; line-height: 1.5; }
                    .order-box { background-color: #fff5f8; padding: 22px; border-radius: 10px; border: 1px solid #f0c0d0; margin-bottom: 24px; }
                    .order-id { font-size: 12px; color: #8B1A4A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; font-weight: 800; }
                    .product-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f0c0d0; padding: 10px 0; font-size: 14px; }
                    .product-qty { color: #8B1A4A; font-weight: 800; margin-right: 6px; }
                    .product-name { color: #333; font-weight: 500; flex: 1; }
                    .product-price { color: #333; font-weight: 700; white-space: nowrap; }
                    .total-row { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 14px; border-top: 2px solid #e0a0b5; font-size: 18px; font-weight: 900; color: #8B1A4A; }
                    .btn { display: block; width: 80%; margin: 24px auto; padding: 15px; background-color: #25D366; color: white; text-align: center; text-decoration: none; font-weight: 800; border-radius: 50px; font-size: 15px; box-shadow: 0 4px 12px rgba(37,211,102,0.3); }
                    .footer { background-color: #f9f0f3; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
                    .footer strong { color: #8B1A4A; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">${storeName}</div>
                    </div>
                    <div class="content">
                        <h1 class="h1">¡Gracias por tu compra! ✅</h1>
                        <p class="subtitle">Hola <strong>${order.customerName || 'Cliente'}</strong>, recibimos tu pedido y ya está en preparación.</p>

                        <div class="order-box">
                            <div class="order-id">Pedido #${order._id}</div>
                            ${productsHtml}
                            ${trackingHtml}
                            <div class="total-row">
                                <span>Total</span>
                                <span>${totalFormatted}</span>
                            </div>
                        </div>

                        ${ctaHtml}
                    </div>
                    <div class="footer">
                        <p><strong>${storeName}</strong></p>
                        <p>¿Tenés alguna duda? Respondé este correo y te ayudamos.</p>
                        <p>© ${new Date().getFullYear()} ${storeName}. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // 3. ENVIAR EL CORREO
        await sendEmail({
            from: `${storeName} <pedidos@boomhauss.com.ar>`,
            to: order.customerEmail,
            subject: `✅ Confirmación de Pedido #${order._id} - ${storeName}`,
            html: htmlContent,
        });
        return true;

    } catch (err) {
        console.error('❌ Error enviando con Resend:', err);
        return false;
    }
}
async function sendPasswordResetEmail(email, resetUrl) {
    if (!resend && !smtpTransport) return false;

    const storeName = process.env.STORE_NAME || "Amelor";

    try {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <body style="font-family: 'Segoe UI', sans-serif; background-color: #f4f6f8; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="background-color: #8B1A4A; padding: 20px; text-align: center;">
                        <h2 style="color: white; margin: 0;">Restablecer Contraseña 🔐</h2>
                    </div>
                    <div style="padding: 30px; text-align: center;">
                        <p style="color: #666; font-size: 16px;">Hola,</p>
                        <p style="color: #666; font-size: 16px;">Recibimos una solicitud para cambiar tu contraseña en <strong>${storeName}</strong>.</p>
                        <p style="color: #666;">Hacé clic en el botón de abajo para crear una nueva (este enlace expira en 1 hora):</p>

                        <a href="${resetUrl}" style="display: inline-block; background-color: #8B1A4A; color: white; padding: 15px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0;">
                            Cambiar mi Contraseña
                        </a>

                        <p style="font-size: 12px; color: #999;">Si no fuiste vos, ignorá este correo.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await sendEmail({
            from: `${storeName} <pedidos@boomhauss.com.ar>`,
            to: email,
            subject: `🔐 Recuperá tu acceso a ${storeName}`,
            html: htmlContent,
        });
        return true;
    } catch (error) {
        console.error("Error enviando email password:", error);
        return false;
    }
}

async function sendAbandonedCartEmail(cart) {
  if (!resend) return false;
  if (!cart.email) return false;

  try {
    const storeName = process.env.STORE_NAME || 'BoomHausS';
    const whatsappNumber = process.env.WHATSAPP_NUMBER || '';
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.boomhauss.com.ar';

    const productsHtml = (cart.items || []).map(item => `
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:10px 0;">
        <span style="color:#333;font-weight:500;">${item.quantity || 1}x ${item.name}</span>
        <span style="color:#333;font-weight:bold;">$${item.price}</span>
      </div>
    `).join('');

    const waMsg = encodeURIComponent(`Hola ${storeName}! 👋 Quería retomar mi compra, necesito ayuda para completarla.`);
    const waUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${waMsg}` : null;

    const htmlContent = `
    <!DOCTYPE html><html><head><style>
      body{font-family:'Segoe UI',sans-serif;margin:0;padding:0;background:#f4f6f8;}
      .container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;}
      .header{background:#0B5CFF;padding:30px 20px;text-align:center;}
      .logo{font-size:24px;font-weight:800;color:#fff;text-transform:uppercase;}
      .content{padding:36px 28px;}
      .title{color:#0B5CFF;font-size:22px;font-weight:700;text-align:center;margin-bottom:8px;}
      .sub{color:#64748b;text-align:center;margin-bottom:28px;font-size:15px;}
      .order-box{background:#f0f7ff;padding:22px;border-radius:12px;border:1px solid #bfdbfe;margin-bottom:24px;}
      .total{display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:2px solid #fff;font-size:18px;font-weight:800;color:#0B5CFF;}
      .btn{display:block;width:80%;margin:0 auto 12px;padding:15px;background:#0B5CFF;color:#fff;text-align:center;text-decoration:none;font-weight:700;border-radius:50px;font-size:15px;}
      .btn-wa{background:#25D366;}
      .footer{background:#f9fafb;padding:18px;text-align:center;font-size:12px;color:#888;border-top:1px solid #eee;}
    </style></head>
    <body><div class="container">
      <div class="header"><div class="logo">${storeName}</div></div>
      <div class="content">
        <h1 class="title">¡Olvidaste algo! 🛒</h1>
        <p class="sub">Hola${cart.name ? ` <strong>${cart.name}</strong>` : ''}, dejaste productos en tu carrito. ¡Todavía están disponibles!</p>
        <div class="order-box">
          ${productsHtml}
          <div class="total"><span>Total</span><span>$${cart.totalAmount || cart.total || 0}</span></div>
        </div>
        <a href="${frontendUrl}" class="btn">✅ Completar mi compra →</a>
        ${waUrl ? `<a href="${waUrl}" class="btn btn-wa">📱 Tengo una pregunta</a>` : ''}
      </div>
      <div class="footer"><p><strong>${storeName}</strong> — Si ya completaste tu compra, ignorá este mail.</p></div>
    </div></body></html>
    `;

    await sendEmail({
      from: `${storeName} <pedidos@boomhauss.com.ar>`,
      to: cart.email,
      subject: `🛒 ¿Olvidaste algo? Tu carrito te espera — ${storeName}`,
      html: htmlContent,
    });
    console.log('✅ Email abandoned cart enviado a:', cart.email);
    return true;
  } catch (err) {
    console.error('❌ Error sendAbandonedCartEmail:', err);
    return false;
  }
}

module.exports = {
    sendOrderConfirmationEmail,
    sendPasswordResetEmail,
    sendAbandonedCartEmail,
};