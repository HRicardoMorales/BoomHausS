// frontend/src/components/Footer.jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import { STORE_NAME } from "../config/brand.js";

function buildWhatsAppLink({ phone, text }) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  const encoded = encodeURIComponent(text || "");
  return `https://wa.me/${digits}?text=${encoded}`;
}

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true" className="ft__wa-icon">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Footer() {
  const storeName = STORE_NAME;
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "";
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || "";

  const waLink = useMemo(() => {
    if (!whatsappNumber) return null;
    return buildWhatsAppLink({
      phone: whatsappNumber,
      text: `Hola, quería hacer una consulta sobre ${storeName}.`,
    });
  }, [whatsappNumber, storeName]);

  return (
    <footer className="ft">
      <div className="ft__inner">

        {/* ── Brand + tagline ── */}
        <div className="ft__head">
          <div className="ft__brand">
            <img src="/logo-footer.webp" alt={storeName} width={109} height={32} loading="lazy" decoding="async" className="ft__logo" />
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
        <div className="ft__divider" aria-hidden="true" />

        {/* ── Bottom bar ── */}
        <div className="ft__bottom">
          <span className="ft__copy">© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</span>
          <div className="ft__trust">
            <span className="ft__trust-badge">Compra 100% segura</span>
            <span className="ft__trust-badge">Envíos a todo el país</span>
            <span className="ft__trust-badge">Seguimiento en tiempo real</span>
          </div>
        </div>

      </div>

    </footer>
  );
}
