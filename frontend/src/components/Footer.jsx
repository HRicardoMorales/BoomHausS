// frontend/src/components/Footer.jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";

function buildWhatsAppLink({ phone, text }) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  const encoded = encodeURIComponent(text || "");
  return `https://wa.me/${digits}?text=${encoded}`;
}

export default function Footer() {
  const storeName = import.meta.env.VITE_STORE_NAME || "BoomHausS";
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "";
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || "";

  const waLink = useMemo(() => {
    if (!whatsappNumber) return null;
    return buildWhatsAppLink({
      phone: whatsappNumber,
      text: `Hola! 👋 Quería hacer una consulta sobre ${storeName}.`,
    });
  }, [whatsappNumber, storeName]);

  return (
    <footer className="af">
      <div className="container af__container">
        <div className="af__card">
          {/* Brand row */}
          <div className="af__row af__row--top">
            <div className="af__brand">
              <div className="af__logo" aria-hidden="true" />
              <div className="af__brandText">
                <div className="af__name">{storeName}</div>
                <div className="af__sub">
                  Pagá con <span className="af__mp">Mercado Pago</span> (débito, crédito o dinero en cuenta)
                </div>
              </div>
            </div>

            <div className="af__cta">
              {waLink ? (
                <a className="af__btn" href={waLink} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              ) : (
                <span className="af__hint">Configurar WhatsApp</span>
              )}
              {supportEmail ? (
                <a className="af__mail" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              ) : null}
            </div>
          </div>

          {/* Links row */}
          <div className="af__row af__row--links">
            <nav className="af__nav" aria-label="Footer">
              <Link className="af__link" to="/products">Producto</Link>
              <Link className="af__link" to="/my-orders">Mis pedidos</Link>
              <Link className="af__link af__hideMobile" to="/returns">Cambios</Link>
              <Link className="af__link af__hideMobile" to="/privacy">Privacidad</Link>
              <Link className="af__link af__hideMobile" to="/terms">Términos</Link>
            </nav>

            <div className="af__badges">
              <span className="af__badge">🔒 Datos protegidos</span>
              <span className="af__badge af__hideMobile">⚡ Checkout simple</span>
              <span className="af__badge af__hideMobile">🚚 Envíos a todo el país</span>
            </div>
          </div>

          {/* Bottom row */}
          <div className="af__row af__row--bottom">
            <div className="af__copy">
              © {new Date().getFullYear()} {storeName}
            </div>
            <div className="af__meta">
              <span>Pagos: Mercado Pago</span>
              <span className="af__dot">•</span>
              <span className="af__hideXs">Débito · Crédito · Dinero en cuenta</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Apple-minimal footer: aire + orden + nada de “efectos gamer” */
        .af{
          margin-top: 2.2rem;
          background: #070A12;
          border-top: 1px solid rgba(255,255,255,.08);
          overflow: hidden;
        }
        .af__container{
          padding: 1.25rem 0 1.1rem;
        }
        .af__card{
          border-radius: 20px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.10);
          box-shadow: 0 24px 70px rgba(0,0,0,.45);
          padding: 18px 18px 14px;
        }

        .af__row{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 14px;
        }
        .af__row--links{
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,.10);
        }
        .af__row--bottom{
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,.10);
        }

        /* Brand */
        .af__brand{
          display:flex;
          align-items:center;
          gap: 12px;
          min-width: 0;
        }
        .af__logo{
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.88);
          box-shadow: 0 0 0 6px rgba(255,255,255,.06);
          flex-shrink:0;
        }
        .af__brandText{ min-width: 0; }
        .af__name{
          font-weight: 1200;
          letter-spacing: -0.04em;
          color: rgba(255,255,255,.92);
          line-height: 1.1;
        }
        .af__sub{
          margin-top: 5px;
          font-weight: 850;
          font-size: .92rem;
          color: rgba(226,232,240,.70);
          line-height: 1.25;
          max-width: 560px;
        }
        .af__mp{
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid rgba(0,158,227,.22);
          background: rgba(0,158,227,.10);
          color: rgba(255,255,255,.88);
          font-weight: 1000;
          white-space: nowrap;
        }

        /* CTA */
        .af__cta{
          display:flex;
          align-items:center;
          justify-content:flex-end;
          gap: 10px;
          flex-shrink:0;
          flex-wrap: wrap;
        }
        .af__btn{
          text-decoration:none;
          font-weight: 1100;
          font-size: .92rem;
          color: rgba(255,255,255,.92);
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
          transition: transform .15s ease, background .15s ease, border-color .15s ease;
          white-space: nowrap;
        }
        .af__btn:hover{
          transform: translateY(-1px);
          background: rgba(255,255,255,.09);
          border-color: rgba(255,255,255,.18);
        }
        .af__mail{
          text-decoration:none;
          font-weight: 900;
          font-size: .88rem;
          color: rgba(226,232,240,.72);
          padding: 10px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.03);
          white-space: nowrap;
        }
        .af__mail:hover{ color: rgba(255,255,255,.90); }
        .af__hint{
          font-weight: 900;
          font-size: .88rem;
          color: rgba(226,232,240,.70);
          padding: 10px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.03);
          white-space: nowrap;
        }

        /* Nav + badges */
        .af__nav{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items:center;
        }
        .af__link{
          text-decoration:none;
          font-weight: 1000;
          font-size: .9rem;
          color: rgba(226,232,240,.80);
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.03);
        }
        .af__link:hover{ color: rgba(255,255,255,.92); }

        .af__badges{
          display:flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content:flex-end;
          align-items:center;
        }
        .af__badge{
          font-size: .84rem;
          font-weight: 950;
          color: rgba(226,232,240,.72);
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.03);
          white-space: nowrap;
        }

        /* Bottom */
        .af__copy{
          font-weight: 950;
          color: rgba(226,232,240,.70);
          font-size: .9rem;
        }
        .af__meta{
          font-weight: 850;
          color: rgba(226,232,240,.62);
          font-size: .86rem;
          display:flex;
          gap: 8px;
          align-items:center;
          flex-wrap: wrap;
          justify-content:flex-end;
        }
        .af__dot{ color: rgba(226,232,240,.28); }

        /* Mobile spacing: nada apretado */
        @media (max-width: 980px){
          .af__row{
            flex-direction: column;
            align-items: stretch;
          }
          .af__cta{
            justify-content:flex-start;
          }
          .af__badges{
            justify-content:flex-start;
          }
          .af__sub{ max-width: none; }
        }

        @media (max-width: 520px){
          .af__card{ padding: 16px 14px 12px; border-radius: 18px; }
          .af__sub{
            font-size: .92rem;
            margin-top: 6px;
          }
          .af__cta{
            gap: 10px;
          }
          .af__btn, .af__mail, .af__hint{
            width: 100%;
            text-align: center;
            padding: 12px 14px; /* más aire */
          }
          .af__nav{
            gap: 10px;
          }
          .af__link{
            flex: 1;
            text-align:center;
            padding: 10px 10px;
          }
        }

        @media (max-width: 390px){
          .af__hideXs{ display:none !important; }
        }
        @media (max-width: 560px){
          .af__hideMobile{ display:none !important; }
        }
      `}</style>
    </footer>
  );
}
