import { BRAND_NAME, CONTACT_EMAIL } from '../data';
import { BrandLogo } from './ui';

export default function Footer() {
  return (
    <footer className="amp-footer">
      <div className="amp-container">
        <div className="amp-footer-logo"><BrandLogo /></div>
        <p className="amp-footer-tag">Limpieza que se nota, sin vueltas.</p> {/* EDITAR tagline */}
        <p className="amp-footer-contact">Para consultas generales, escribinos a {CONTACT_EMAIL}</p>
        <p className="amp-footer-legal">© {new Date().getFullYear()} {BRAND_NAME} · Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
