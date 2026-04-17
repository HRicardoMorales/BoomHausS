// frontend/src/components/Footer.jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";

function buildWhatsAppLink({ phone, text }) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  const encoded = encodeURIComponent(text || "");
  return `https://wa.me/${digits}?text=${encoded}`;
}

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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
    <footer className="ft">
      <div className="ft__inner">

        {/* ── Brand + tagline ── */}
        <div className="ft__head">
          <div className="ft__brand">
            <span className="ft__brand-dot" aria-hidden="true" />
            <span className="ft__brand-name">{storeName}</span>
          </div>
          <p className="ft__tagline">
            Pagá con <strong>Mercado Pago</strong> — débito, crédito o dinero en cuenta
          </p>
        </div>

        {/* ── Main grid: links + contact ── */}
        <div className="ft__grid">

          {/* Policies column */}
          <div className="ft__col">
            <div className="ft__col-label">Políticas</div>
            <nav className="ft__nav" aria-label="Políticas del sitio">
              <Link className="ft__link" to="/privacy">Políticas de Privacidad</Link>
              <Link className="ft__link" to="/shipping">Políticas de Envío</Link>
              <Link className="ft__link" to="/returns">Políticas de Devolución</Link>
              <Link className="ft__link" to="/terms">Términos y Servicios</Link>
              <Link className="ft__link" to="/contact">Contacto</Link>
            </nav>
          </div>

          {/* Contact column */}
          <div className="ft__col">
            <div className="ft__col-label">Contacto</div>
            <div className="ft__contact-list">
              {waLink ? (
                <a className="ft__wa-btn" href={waLink} target="_blank" rel="noreferrer">
                  {WA_ICON}
                  Escribinos por WhatsApp
                </a>
              ) : (
                <span className="ft__link ft__link--muted">WhatsApp no configurado</span>
              )}
              {supportEmail && (
                <a className="ft__link" href={`mailto:${supportEmail}`}>{supportEmail}</a>
              )}
            </div>
          </div>

          {/* Payment column */}
          <div className="ft__col">
            <div className="ft__col-label">Medios de pago</div>
            <div className="ft__pay-badges">
              <span className="ft__pay-badge ft__pay-badge--mp">Mercado Pago</span>
            </div>
            <div className="ft__pay-methods">
              <span className="ft__pay-chip">Débito</span>
              <span className="ft__pay-chip">Crédito</span>
              <span className="ft__pay-chip">Cuenta MP</span>
            </div>
          </div>

        </div>

        {/* ── Divider ── */}
        <div className="ft__divider" />

        {/* ── Bottom bar ── */}
        <div className="ft__bottom">
          <span className="ft__copy">© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</span>
          <div className="ft__trust">
            <span className="ft__trust-badge">🔒 Compra 100% segura</span>
            <span className="ft__trust-badge">🚚 Envíos a todo el país</span>
            <span className="ft__trust-badge">📦 Seguimiento en tiempo real</span>
          </div>
        </div>

      </div>

      <style>{`
        /* ── Footer shell ── */
        .ft{
          background: #0b172a;
          margin-top: 0;
        }
        .ft__inner{
          max-width: 1000px;
          margin: 0 auto;
          padding: 44px 24px 28px;
        }

        /* ── Head ── */
        .ft__head{
          margin-bottom: 32px;
        }
        .ft__brand{
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .ft__brand-dot{
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #2F855A;
          box-shadow: 0 0 0 4px rgba(47,133,90,.20);
          flex-shrink: 0;
        }
        .ft__brand-name{
          font-weight: 800;
          font-size: 1.1rem;
          color: rgba(255,255,255,.92);
          letter-spacing: -.025em;
        }
        .ft__tagline{
          margin: 0;
          font-size: .82rem;
          color: rgba(226,232,240,.42);
          line-height: 1.5;
        }
        .ft__tagline strong{
          color: rgba(226,232,240,.65);
          font-weight: 600;
        }

        /* ── Grid ── */
        .ft__grid{
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px 24px;
          margin-bottom: 32px;
        }
        @media (max-width: 680px){
          .ft__grid{ grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 420px){
          .ft__grid{ grid-template-columns: 1fr; gap: 24px; }
        }

        /* ── Columns ── */
        .ft__col{
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ft__col-label{
          font-size: .7rem;
          font-weight: 700;
          color: rgba(255,255,255,.35);
          text-transform: uppercase;
          letter-spacing: .1em;
          margin-bottom: 2px;
        }

        /* ── Nav links ── */
        .ft__nav{
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .ft__link{
          text-decoration: none;
          font-size: .86rem;
          color: rgba(226,232,240,.68);
          line-height: 1.45;
          transition: color .15s ease;
        }
        .ft__link:hover{ color: rgba(255,255,255,.95); }
        .ft__link--muted{ color: rgba(226,232,240,.35); cursor: default; }

        /* ── Contact ── */
        .ft__contact-list{
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ft__wa-btn{
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          font-size: .84rem;
          font-weight: 700;
          color: #fff;
          background: #25d366;
          padding: 9px 14px;
          border-radius: 8px;
          transition: filter .15s ease, transform .15s ease;
          align-self: flex-start;
        }
        .ft__wa-btn:hover{
          filter: brightness(.9);
          transform: translateY(-1px);
        }

        /* ── Payments ── */
        .ft__pay-badges{
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ft__pay-badge{
          font-size: .78rem;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,.10);
        }
        .ft__pay-badge--mp{
          color: rgba(255,255,255,.82);
          background: rgba(255,255,255,.06);
          border-color: rgba(255,255,255,.12);
        }
        .ft__pay-methods{
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 2px;
        }
        .ft__pay-chip{
          font-size: .72rem;
          color: rgba(226,232,240,.40);
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,.06);
          background: rgba(255,255,255,.03);
        }

        /* ── Divider ── */
        .ft__divider{
          height: 1px;
          background: rgba(255,255,255,.07);
          margin-bottom: 20px;
        }

        /* ── Bottom bar ── */
        .ft__bottom{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }
        .ft__copy{
          font-size: .74rem;
          color: rgba(226,232,240,.32);
        }
        .ft__trust{
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .ft__trust-badge{
          font-size: .72rem;
          color: rgba(226,232,240,.32);
          white-space: nowrap;
        }

        @media (max-width: 560px){
          .ft__inner{ padding: 36px 18px 24px; }
          .ft__bottom{ flex-direction: column; align-items: flex-start; gap: 10px; }
          .ft__trust{ justify-content: flex-start; }
          .ft__trust-badge:not(:first-child){ display: none; }
        }
      `}</style>
    </footer>
  );
}
